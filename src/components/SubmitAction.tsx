import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select'
import { Progress } from './ui/progress'
import { 
  Upload, MapPin, Calendar, Coins, CheckCircle, 
  Camera, Zap, Leaf, Clock, Shield 
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { api } from '../services/api'
import { uploadImage } from '../services/upload'
import { blockchainService } from '../services/blockchainService'

export default function SubmitAction() {
  const { dispatch, refreshDashboard } = useApp()
  const [signer, setSigner] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [actionType, setActionType] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [co2Estimate, setCo2Estimate] = useState("")
  const [aiSuggestion, setAiSuggestion] = useState<{ type: string; confidence: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [aiResult, setAiResult] = useState<{
    verified: boolean
    creditScore: number
    message: string
    confidence: number
  } | null>(null)

  // MetaMask connect handler
  const connectWallet = async () => {
    setLoading(true)
    try {
      const result = await blockchainService.connectWallet()
      if (result) {
        setWalletAddress(result.address)
        setSigner(result.signer)
        dispatch({ type: 'UPDATE_WALLET', payload: result.address })
        dispatch({ type: 'ADD_NOTIFICATION', payload: { 
          type: 'success', 
          message: 'Wallet connected successfully!' 
        }})
      }
    } catch (error: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: error.message || 'Failed to connect wallet. Please try again.' 
      }})
    } finally {
      setLoading(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress("")
    setSigner(null)
    dispatch({ type: 'ADD_NOTIFICATION', payload: { 
      type: 'info', 
      message: 'Wallet disconnected' 
    }})
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: 'Please upload an image file.' }})
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: 'File size must be less than 10MB.' }})
        return
      }

      setIsUploading(true)
      setUploadProgress(40)
      setImageFile(file)

      // uploads to Cloudinary when configured, else returns a base64 data URL
      uploadImage(file)
        .then(async (url) => {
          setUploadProgress(100)
          setSelectedImage(url)
          dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Image uploaded successfully!' } })
          // ask the local ML classifier to suggest the action type (no-op until a model is trained)
          try {
            const r = await api.ai.classify(url)
            if (r.available && r.confidence >= 40) {
              setAiSuggestion({ type: r.type, confidence: r.confidence })
              if (!actionType) setActionType(r.type)
            }
          } catch { /* classifier optional */ }
        })
        .catch(() => dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: 'Image upload failed' } }))
        .finally(() => setIsUploading(false))
    }
  }

  const validateForm = () => {
    if (!selectedImage) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: 'Please upload an image of your environmental action.' 
      }})
      return false
    }
    
    if (!actionType) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: 'Please select an action type.' 
      }})
      return false
    }
    
    if (!description.trim()) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: 'Please provide a description of your action.' 
      }})
      return false
    }
    
    if (!location.trim()) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: 'Please provide the location where the action took place.' 
      }})
      return false
    }
    
    if (!co2Estimate || parseFloat(co2Estimate) <= 0) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: 'Please provide a valid CO₂ offset estimate.' 
      }})
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'info', 
        message: 'Running AI verification analysis...' 
      }})
      
      const payload = {
        type: actionType,
        description,
        location,
        date,
        co2Estimate: parseFloat(co2Estimate),
        imageUrl: selectedImage || undefined,
        hasGeotag: !!imageFile
      };

      const { action, verification } = await api.actions.create(payload);
      
      if (verification.verified && signer && walletAddress) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { 
          type: 'info', 
          message: 'Issuing credit on blockchain... Please sign in MetaMask.' 
        }})
        const bcResult = await blockchainService.issueCredit(
          walletAddress,
          actionType,
          action.credits,
          signer
        );
        if (bcResult.success && bcResult.txHash) {
          await api.actions.updateBlockchain(action._id || action.id, bcResult.txHash);
          dispatch({ type: 'ADD_NOTIFICATION', payload: { 
            type: 'success', 
            message: 'Blockchain issuance complete!' 
          }})
        } else {
          dispatch({ type: 'ADD_NOTIFICATION', payload: { 
            type: 'error', 
            message: bcResult.error || 'Blockchain issuance failed.' 
          }})
        }
      }

      await refreshDashboard();
      
      setAiResult({
        ...verification,
        confidence: verification.creditScore ?? 0 // real score (0 = strongly rejected)
      })
      
      if (verification.verified) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { 
          type: 'success', 
          message: `Congratulations! You earned ${verification.creditScore} EcoCredits!` 
        }})
        
        setIsSubmitted(true)
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false)
          setSelectedImage(null)
          setImageFile(null)
          setActionType("")
          setDescription("")
          setLocation("")
          setCo2Estimate("")
          setAiResult(null)
          setUploadProgress(0)
        }, 5000)
        
      } else {
        dispatch({ type: 'ADD_NOTIFICATION', payload: {
          type: 'warning',
          message: verification.message || 'Action flagged for manual review — the CO₂ estimate may be unrealistic.'
        }})
      }
      
    } catch (error: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { 
        type: 'error', 
        message: error.message || 'Submission failed. Please try again.' 
      }})
    } finally {
      setLoading(false)
    }
  }

  const actionTypes = [
    { id: 'Solar Energy', label: 'Solar Installation', icon: '☀️', description: 'Solar panels, solar water heaters' },
    { id: 'Reforestation', label: 'Tree Planting', icon: '🌳', description: 'Tree planting, forest restoration' },
    { id: 'Waste Reduction', label: 'Waste Reduction', icon: '♻️', description: 'Recycling programs, waste sorting' },
    { id: 'Energy Efficiency', label: 'Energy Efficiency', icon: '💡', description: 'LED lighting, insulation upgrades' },
    { id: 'Clean Transport', label: 'Sustainable Transport', icon: '🚲', description: 'Electric vehicles, bike infrastructure' },
    { id: 'Urban Agriculture', label: 'Urban Agriculture', icon: '🌱', description: 'Community gardens, vertical farms' },
    { id: 'Wind Energy', label: 'Wind Energy', icon: '💨', description: 'Wind turbines, wind farms' }
  ]

  // realistic CO2 (tonnes) for a typical action — mirrors the ML validator's baselines
  const TYPICAL_CO2: Record<string, number> = {
    'Reforestation': 0.5, 'Solar Energy': 4, 'Wind Energy': 8, 'Waste Reduction': 1.5,
    'Clean Transport': 1.2, 'Energy Efficiency': 2, 'Urban Agriculture': 0.8,
  }
  const co2Num = parseFloat(co2Estimate) || 0
  const typical = TYPICAL_CO2[actionType] || 2
  const unrealistic = !!actionType && co2Num > typical * 10 // only warn on clearly excessive estimates

  if (isSubmitted && aiResult) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="text-center p-12">
          <CardContent>
            <div className={`inline-flex p-4 rounded-full mb-6 ${
              aiResult.verified ? 'bg-[#6FA690]/10' : 'bg-[#ffc107]/10'
            }`}>
              {aiResult.verified ? (
                <CheckCircle className="h-12 w-12 text-[#6FA690]" />
              ) : (
                <Clock className="h-12 w-12 text-[#ffc107]" />
              )}
            </div>
            
            <h2 className="text-3xl font-bold mb-4 text-[#2C453E]">
              {aiResult.verified ? 'Action Verified!' : 'Under Review'}
            </h2>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold mb-4">Verification Results</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">AI Confidence:</span>
                  <div className="font-semibold">{aiResult.confidence}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Credits Earned:</span>
                  <div className="font-semibold text-[#3E5F55]">{aiResult.creditScore}</div>
                </div>
                <div>
                  <span className="text-gray-600">CO₂ Offset:</span>
                  <div className="font-semibold text-[#6FA690]">{co2Estimate}t</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{aiResult.message}</p>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => dispatch({ type: 'SET_PAGE', payload: 'dashboard' })}
                className="bg-[#3E5F55] hover:bg-[#3E5F55]/90"
              >
                View Dashboard
              </Button>
              <Button 
                variant="outline"
                onClick={() => dispatch({ type: 'SET_PAGE', payload: 'marketplace' })}
              >
                Browse Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-[#2C453E]">Submit Green Action</h1>
        <p className="text-lg text-gray-600">
          Upload a geotagged photo of your environmental action to earn verified EcoCredits
        </p>
        
        {/* Wallet Connection */}
        <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-pine" />
              <div>
                <h3 className="font-semibold text-pine-deep">Blockchain Verification</h3>
                <p className="text-sm text-pine">
                  {walletAddress ? 'Wallet connected - your credits will be securely stored' : 'Connect your wallet for blockchain verification'}
                </p>
              </div>
            </div>
            {!walletAddress ? (
              <Button 
                onClick={connectWallet} 
                disabled={loading}
                style={{ backgroundColor: '#3E5F55' }}
                className="hover:opacity-90 transition-opacity"
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-sm">
                  <span className="text-green-600">✓ Connected:</span>
                  <p className="font-mono text-xs">{walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}</p>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-[#3E5F55]" />
              Upload Action Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedImage ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <div className="text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Upload Your Photo</h3>
                  <p className="text-gray-600 mb-4">
                    Upload a high-quality photo showing your environmental action. 
                    Make sure the location and action are clearly visible.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported: JPG, PNG, WEBP (max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded action" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedImage(null)
                    setImageFile(null)
                    setUploadProgress(0)
                  }}
                  className="w-full"
                >
                  Upload Different Image
                </Button>
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[#6FA690]" />
              Action Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="actionType">Action Type *</Label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the type of environmental action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiSuggestion && (
                <p className="text-xs text-[#6FA690] flex items-center gap-1">
                  ✨ AI suggests <span className="font-semibold">{aiSuggestion.type}</span> ({aiSuggestion.confidence}% confident)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your environmental action in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Be specific about what you did, materials used, and impact created.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  placeholder="City, State/Country"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date of Action *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="co2Estimate">Estimated CO₂ Offset (tons) *</Label>
              <div className="relative">
                <Leaf className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="co2Estimate"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g., 2.5"
                  value={co2Estimate}
                  onChange={(e) => setCo2Estimate(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                Conservative estimate of CO₂ reduction/offset in metric tons.
              </p>
            </div>

            {co2Num > 0 && (
              unrealistic ? (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">⚠️</span>
                    <span className="font-semibold text-amber-800">This estimate looks unrealistic</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    {co2Num}t is far above the typical ~{typical}t for {actionType}. Our AI validation engine will likely flag this and route it to manual review — you won't earn credits for it.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Enter a realistic, conservative estimate.</p>
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800">Potential Reward</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Estimated: {Math.floor(co2Num * 10)} EcoCredits
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Final credits determined by AI verification
                  </p>
                </div>
              )
            )}

            <Button 
              onClick={handleSubmit}
              disabled={loading || !selectedImage || !actionType || !description}
              className="w-full bg-[#3E5F55] hover:bg-[#3E5F55]/90 py-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Submit for Verification</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
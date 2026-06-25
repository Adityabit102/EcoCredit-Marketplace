import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import GradientButton from './ui/GradientButton'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const TreeScene = lazy(() => import('./three/Scene3D').then((m) => ({ default: m.TreeScene })))
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from './ui/dialog'
import { 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts'
import { 
  TrendingUp, Leaf, Coins, Award, Calendar, ArrowUpRight, ArrowDownRight, 
  Eye, Download, Send, Wallet, ExternalLink, Loader2, Shield, ShoppingCart, CheckCircle
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { blockchainService } from '../services/blockchainService'
import { api } from '../services/api'

export default function Dashboard() {
  const { state, dispatch, refreshListings } = useApp()
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [transferAddress, setTransferAddress] = useState('')
  const [selectedCredit, setSelectedCredit] = useState<any>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Listing State
  const [isListingDialogOpen, setIsListingDialogOpen] = useState(false)
  const [selectedActionForListing, setSelectedActionForListing] = useState<any>(null)
  const [listingPrice, setListingPrice] = useState<number>(0)
  const [isListingInProgress, setIsListingInProgress] = useState(false)
  const [listingSuccess, setListingSuccess] = useState(false)

  // Gamified ledger stats from the hardened backend (level/xp/streak/badges/balance)
  const [eco, setEco] = useState<any>(null)
  useEffect(() => {
    api.users.dashboard().then((d) => setEco(d.stats)).catch(() => {})
  }, [])
  const lifetimeCredits = eco?.lifetimeCredits ?? 0
  const treeProgress = Math.min(1, Math.max(0.08, lifetimeCredits / 500))
  const xp = eco?.xp ?? 0
  const level = eco?.level ?? 1
  const xpIntoLevel = xp - Math.pow(level - 1, 2) * 100
  const xpForNext = Math.pow(level, 2) * 100 - Math.pow(level - 1, 2) * 100
  const downloadCertificate = async () => {
    try { await api.certificates.download() }
    catch { dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: 'Could not download certificate. Try again.' } }) }
  }

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalCredits = state.transactions
      .filter(t => t.type === 'earned' || t.type === 'bought')
      .reduce((sum, t) => sum + t.credits, 0) - 
      state.transactions
        .filter(t => t.type === 'sold')
        .reduce((sum, t) => sum + t.credits, 0)

    const totalCO2 = state.transactions.reduce((sum, t) => sum + t.co2Offset, 0)
    
    const totalRevenue = state.transactions
      .filter(t => t.type === 'sold')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const totalSpent = state.transactions
      .filter(t => t.type === 'bought')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    // Calculate growth (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const recentCredits = state.transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.type === 'earned' ? t.credits : 0), 0)

    const previousCredits = state.transactions
      .filter(t => new Date(t.date) >= sixtyDaysAgo && new Date(t.date) < thirtyDaysAgo)
      .reduce((sum, t) => sum + (t.type === 'earned' ? t.credits : 0), 0)

    const monthlyGrowth = previousCredits > 0 
      ? ((recentCredits - previousCredits) / previousCredits) * 100 
      : recentCredits > 0 ? 100 : 0

    return {
      totalCredits,
      totalCO2,
      totalRevenue,
      monthlyGrowth,
      netProfit: totalRevenue - totalSpent
    }
  }, [state.transactions])

  // Generate monthly data for charts
  const monthlyData = useMemo(() => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthTransactions = state.transactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate.getFullYear() === date.getFullYear() && 
               transactionDate.getMonth() === date.getMonth()
      })
      
      const credits = monthTransactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.credits, 0)
      
      const co2 = monthTransactions.reduce((sum, t) => sum + t.co2Offset, 0)
      
      const revenue = monthTransactions
        .filter(t => t.type === 'sold')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      
      months.push({ month: monthName, credits, co2, revenue })
    }
    
    return months
  }, [state.transactions])

  // Action types distribution
  const actionTypes = useMemo(() => {
    const types: { [key: string]: number } = {}
    
    state.actions.forEach(action => {
      types[action.type] = (types[action.type] || 0) + action.credits
    })
    
    const colors = {
      'Solar Energy': '#FF9800', // Orange for solar (more vibrant)
      'Reforestation': '#4CAF50', // Green for forests
      'Waste Reduction': '#2196F3', // Blue for water/waste
      'Wind Energy': '#607D8B', // Blue-grey for wind
      'Energy Efficiency': '#F44336', // Red for energy
      'Urban Agriculture': '#8BC34A', // Light green for agriculture
      'Clean Transport': '#9C27B0', // Purple for transport
      'Biogas': '#795548', // Brown for biogas
      'Water Conservation': '#00BCD4', // Cyan for water
      'Organic Farming': '#CDDC39' // Lime for organic farming
    }
    
    return Object.entries(types).map(([name, value]) => ({
      name,
      value,
      color: colors[name as keyof typeof colors] || '#6C757D'
    }))
  }, [state.actions])

  const formatIndianCurrency = (amount: number) => {
    const inrAmount = amount * 83
    if (inrAmount >= 10000000) { // 1 crore
      return `₹${(inrAmount / 10000000).toFixed(1)}Cr`
    } else if (inrAmount >= 100000) { // 1 lakh
      return `₹${(inrAmount / 100000).toFixed(1)}L`
    } else if (inrAmount >= 1000) { // 1 thousand
      return `₹${(inrAmount / 1000).toFixed(1)}K`
    } else {
      return `₹${inrAmount.toFixed(0)}`
    }
  }

  const handleViewAllTransactions = () => {
    dispatch({ type: 'SET_PAGE', payload: 'impact' })
  }

  const handleExportData = () => {
    const data = {
      stats,
      transactions: state.transactions,
      actions: state.actions,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ecocredit-dashboard-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: { 
      type: 'success', 
      message: 'Dashboard data exported successfully!' 
    }})
  }

  const handleConnectWallet = async () => {
    try {
      const result = await blockchainService.connectWallet()
      if (result) {
        setWalletAddress(result.address)
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: 'success',
            message: `Wallet connected: ${result.address.slice(0, 6)}...${result.address.slice(-4)}`
          }
        })
      }
    } catch (error: any) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: error.message || 'Failed to connect wallet'
        }
      })
    }
  }

  const handleDisconnectWallet = () => {
    setWalletAddress(null)
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'info',
        message: 'Wallet disconnected'
      }
    })
  }

  const handleTransferCredit = (credit: any) => {
    setSelectedCredit(credit)
    setTransferAddress('')
    setTxHash(null)
    setIsTransferDialogOpen(true)
  }

  const confirmTransfer = async () => {
    if (!selectedCredit || !transferAddress) return

    setIsTransferring(true)
    setTxHash(null)

    try {
      const wallet = await blockchainService.connectWallet()
      if (!wallet) {
        throw new Error('Please connect your wallet')
      }

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'info',
          message: 'Processing blockchain transaction...'
        }
      })

      // Transfer credit on blockchain
      const result = await blockchainService.transferCredit(
        selectedCredit.creditId || '1', // Use actual creditId from credit
        transferAddress,
        wallet.signer
      )

      if (result.success) {
        setTxHash(result.txHash || null)

        // Update local state
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: 'success',
            message: `Successfully transferred credit to ${transferAddress.slice(0, 6)}...${transferAddress.slice(-4)}`
          }
        })

        console.log('[Dashboard] Transfer successful:', result)
      } else {
        throw new Error(result.error || 'Transfer failed')
      }
    } catch (error: any) {
      console.error('[Dashboard] Transfer failed:', error)
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: error.message || 'Failed to transfer credit'
        }
      })
    } finally {
      setIsTransferring(false)
    }
  }

  const handleListOnMarketplace = (action: any) => {
    setSelectedActionForListing(action)
    setListingPrice(0)
    setListingSuccess(false)
    setIsListingDialogOpen(true)
  }

  const confirmListing = async () => {
    if (!selectedActionForListing || listingPrice <= 0) return

    setIsListingInProgress(true)
    try {
      await api.listings.create({
        actionId: selectedActionForListing.id || selectedActionForListing._id,
        title: `${selectedActionForListing.type} by ${state.user?.name || 'Verified User'}`,
        type: selectedActionForListing.type,
        description: selectedActionForListing.description,
        price: listingPrice,
        credits: selectedActionForListing.credits,
        co2Offset: selectedActionForListing.co2Offset ?? selectedActionForListing.co2Estimate ?? 0,
        location: selectedActionForListing.location,
        imageUrl: selectedActionForListing.image || selectedActionForListing.imageUrl
      })

      setListingSuccess(true)
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { type: 'success', message: 'Successfully listed on the marketplace!' }
      })
      
      await refreshListings()
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setIsListingDialogOpen(false)
      }, 2000)
    } catch (error: any) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { type: 'error', message: error.message || 'Failed to list action on marketplace.' }
      })
    } finally {
      setIsListingInProgress(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-[#2C453E]">Carbon Credit Dashboard</h1>
          <p className="text-lg text-gray-600">Track your environmental impact and green investments in India</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* ── 3D Impact Hero: your forest grows with lifetime credits ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative mb-8 rounded-3xl overflow-hidden glass glow-sage grid md:grid-cols-2"
      >
        <div className="relative min-h-[300px]">
          <Suspense fallback={<div className="h-full min-h-[300px]" />}>
            <TreeScene className="absolute inset-0 h-full w-full" progress={treeProgress} />
          </Suspense>
          <div className="absolute bottom-3 left-4 text-xs text-muted-foreground">
            Your forest grows as you earn credits 🌱
          </div>
        </div>

        <div className="p-8 flex flex-col justify-center gap-5">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back{state.user?.name ? `, ${state.user.name}` : ''}</p>
            <h2 className="text-3xl font-bold text-gradient">Level {level} Eco-Champion</h2>
          </div>

          {/* XP progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">XP</span>
              <span className="font-medium text-pine">{Math.max(0, xpIntoLevel)} / {xpForNext}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full animate-gradient"
                style={{ width: `${Math.min(100, (xpIntoLevel / xpForNext) * 100)}%`, backgroundImage: 'linear-gradient(110deg,#3E5F55,#6FA690,#A9CDBA)' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="text-2xl font-bold text-pine">{(eco?.totalCO2 ?? 0).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">tons CO₂</div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="text-2xl font-bold text-pine">{eco?.creditBalance ?? 0}</div>
              <div className="text-xs text-muted-foreground">credits</div>
            </div>
            <div className="rounded-xl bg-secondary/60 p-3">
              <div className="text-2xl font-bold text-pine">🔥 {eco?.streak?.current ?? 0}</div>
              <div className="text-xs text-muted-foreground">day streak</div>
            </div>
          </div>

          {/* badges */}
          {eco?.badges?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {eco.badges.map((b: string) => (
                <span key={b} className="rounded-full bg-sand/60 text-pine-deep px-3 py-1 text-xs font-medium">🏅 {b}</span>
              ))}
            </div>
          )}

          <GradientButton onClick={downloadCertificate} className="self-start">
            <Download className="h-4 w-4" /> Download Offset Certificate
          </GradientButton>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">EcoCredits Portfolio</p>
                <p className="text-3xl font-bold text-[#3E5F55]">{stats.totalCredits}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.monthlyGrowth >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stats.monthlyGrowth).toFixed(1)}% this month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#3E5F55]/10 rounded-full">
                <Coins className="h-8 w-8 text-[#3E5F55]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CO₂ Offset (tons)</p>
                <p className="text-3xl font-bold text-[#6FA690]">{stats.totalCO2.toFixed(1)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    +{(stats.totalCO2 * 0.15).toFixed(1)} this month
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#6FA690]/10 rounded-full">
                <Leaf className="h-8 w-8 text-[#6FA690]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Green Impact Revenue</p>
                <p className="text-3xl font-bold text-[#C9A98C]">
                  {formatIndianCurrency(stats.netProfit)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {stats.netProfit >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    Total: {formatIndianCurrency(stats.totalRevenue)}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#C9A98C]/10 rounded-full">
                <TrendingUp className="h-8 w-8 text-[#C9A98C]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified Green Actions</p>
                <p className="text-3xl font-bold text-[#3E5F55]">{state.actions.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    {state.actions.filter(a => a.status === 'verified').length} certified
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#3E5F55]/10 rounded-full">
                <Award className="h-8 w-8 text-[#3E5F55]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#3E5F55]" />
              Environmental Impact Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="credits" className="space-y-4">
              <TabsList>
                <TabsTrigger value="credits">EcoCredits</TabsTrigger>
                <TabsTrigger value="co2">Carbon Impact</TabsTrigger>
                <TabsTrigger value="revenue">Green Revenue</TabsTrigger>
              </TabsList>
              <TabsContent value="credits" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="credits" stroke="#3E5F55" fill="#3E5F55" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="co2" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="co2" stroke="#6FA690" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="revenue" className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`₹${(value * 83).toFixed(0)}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#C9A98C" fill="#C9A98C" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[#6FA690]" />
              Sustainability Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actionTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={actionTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {actionTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-300px text-gray-500">
                <div className="text-center">
                  <Leaf className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No green actions submitted yet</p>
                  <p className="text-sm">Start your sustainability journey by submitting your first environmental action</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Owned Credits - Blockchain */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#3E5F55]" />
              Your Carbon Credits (Blockchain)
            </CardTitle>
            {!walletAddress ? (
              <Button
                onClick={handleConnectWallet}
                style={{ backgroundColor: '#3E5F55' }}
                className="hover:opacity-90"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <div className="text-xs text-green-800 font-medium">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </div>
                </div>
                <Button
                  onClick={handleDisconnectWallet}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              {/* Show verified actions as owned credits — always visible; wallet only gates on-chain transfer */}
              {state.actions.filter(a => a.status === 'verified').length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {state.actions.filter(a => a.status === 'verified').map((action) => (
                    <div key={action.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{action.type}</h4>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 border-0">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Credits:</span>
                          <div className="font-semibold text-[#3E5F55]">{action.credits}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">CO₂ Offset:</span>
                          <div className="font-semibold text-green-600">{action.co2Offset ?? action.co2Estimate}t</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Date:</span>
                          <div className="text-sm">{action.date}</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {state.user?.role === 'seller' && (
                          <Button
                            onClick={() => handleListOnMarketplace(action)}
                            className="w-full text-xs bg-[#3E5F55] hover:bg-[#3E5F55]/90"
                            size="sm"
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            List on Marketplace
                          </Button>
                        )}
                        <Button
                          onClick={() => walletAddress ? handleTransferCredit(action) : handleConnectWallet()}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          title={walletAddress ? 'Transfer this credit on-chain' : 'Connect your wallet to transfer'}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {walletAddress ? 'Transfer Credit' : 'Connect Wallet to Transfer'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Leaf className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600 mb-2">No verified credits yet</p>
                  <p className="text-sm text-gray-500">Submit environmental actions to earn credits</p>
                </div>
              )}
              
              {/* Blockchain Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-[#3E5F55] mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">Blockchain Security</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Your credits are secured on Ethereum Sepolia testnet
                    </p>
                    <a 
                      href={blockchainService.getContractLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#3E5F55] hover:underline flex items-center gap-1"
                    >
                      View Smart Contract
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#3E5F55]" />
              Recent Green Transactions
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleViewAllTransactions}>
              <Eye className="h-4 w-4 mr-2" />
              View All Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {state.transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-8 p-4 bg-[#f5f5f5] rounded-lg">
                {/* Icon */}
                <div className={`flex-shrink-0 p-2 rounded-full ${
                  transaction.type === 'earned' ? 'bg-green-100' :
                  transaction.type === 'sold' ? 'bg-secondary' : 'bg-yellow-100'
                }`}>
                  {transaction.type === 'earned' && <Award className="h-5 w-5 text-green-600" />}
                  {transaction.type === 'sold' && <TrendingUp className="h-5 w-5 text-pine" />}
                  {transaction.type === 'bought' && <ArrowDownRight className="h-5 w-5 text-yellow-600" />}
                </div>
                
                {/* Description - Flex grow to take available space */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium capitalize text-[#2C453E]">{transaction.type}</p>
                  <p className="text-sm text-gray-600 truncate">{transaction.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{transaction.location}</p>
                </div>
                
                {/* Credits & Amount - Fixed width for alignment */}
                <div className="flex-shrink-0 text-right min-w-[140px]">
                  <p className="font-semibold text-[#2C453E]">{transaction.credits} credits</p>
                  {transaction.amount && (
                    <p className={`text-sm font-medium ${transaction.type === 'sold' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'sold' ? '+' : '-'}{formatIndianCurrency(transaction.amount)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">{transaction.date}</p>
                </div>
                
                {/* Status Badge - Fixed width */}
                <div className="flex-shrink-0 min-w-[110px] flex justify-end">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'verified' ? 'bg-secondary text-pine-deep' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
            
            {state.transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No green transactions yet</p>
                <p className="text-sm">Start earning or trading EcoCredits to see your environmental impact here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transfer Credit Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer Carbon Credit</DialogTitle>
            <DialogDescription>
              Send your verified carbon credit to another wallet address
            </DialogDescription>
          </DialogHeader>
          
          {selectedCredit && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedCredit.type}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Credits:</span>
                    <div className="font-semibold">{selectedCredit.credits}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">CO₂ Offset:</span>
                    <div className="font-semibold">{selectedCredit.co2Offset ?? selectedCredit.co2Estimate}t</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Description:</span>
                    <div className="text-sm">{selectedCredit.description}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recipient Wallet Address:
                </label>
                <Input
                  placeholder="0x..."
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="w-full font-mono text-sm"
                  disabled={isTransferring}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Ethereum wallet address of the recipient
                </p>
              </div>

              {/* Transaction Status */}
              {isTransferring && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Processing blockchain transaction...</span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Please confirm the transaction in MetaMask
                  </p>
                </div>
              )}

              {/* Transaction Success */}
              {txHash && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Transfer Successful!</span>
                  </div>
                  <a 
                    href={blockchainService.getEtherscanLink(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline flex items-center gap-1"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-800">
                  ⚠️ <strong>Warning:</strong> Once transferred, you cannot undo this action. 
                  Make sure the recipient address is correct.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsTransferDialogOpen(false)}
              disabled={isTransferring}
            >
              {txHash ? 'Close' : 'Cancel'}
            </Button>
            {!txHash && (
              <Button 
                onClick={confirmTransfer}
                disabled={isTransferring || !transferAddress || !transferAddress.startsWith('0x')}
                className="bg-[#3E5F55] hover:bg-[#3E5F55]/90"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Transfer Credit
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List on Marketplace Dialog */}
      <Dialog open={isListingDialogOpen} onOpenChange={setIsListingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>List on Marketplace</DialogTitle>
            <DialogDescription>
              Sell your verified EcoCredits on the open market.
            </DialogDescription>
          </DialogHeader>

          {selectedActionForListing && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedActionForListing.type}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Credits:</span>
                    <div className="font-semibold">{selectedActionForListing.credits}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">CO₂ Offset:</span>
                    <div className="font-semibold">{selectedActionForListing.co2Offset ?? selectedActionForListing.co2Estimate}t</div>
                  </div>
                </div>
              </div>

              {!listingSuccess ? (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Set Price per Credit (₹)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 850"
                    value={listingPrice || ''}
                    onChange={(e) => setListingPrice(parseFloat(e.target.value) || 0)}
                    disabled={isListingInProgress}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Total potential revenue: ₹{(listingPrice * selectedActionForListing.credits).toFixed(0)}
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Listing Created Successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Buyers can now purchase your credits on the marketplace.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!listingSuccess && (
              <>
                <Button variant="outline" onClick={() => setIsListingDialogOpen(false)} disabled={isListingInProgress}>
                  Cancel
                </Button>
                <Button 
                  onClick={confirmListing} 
                  disabled={!listingPrice || listingPrice <= 0 || isListingInProgress}
                  className="bg-[#3E5F55] hover:bg-[#3E5F55]/90"
                >
                  {isListingInProgress ? 'Listing...' : 'Create Listing'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
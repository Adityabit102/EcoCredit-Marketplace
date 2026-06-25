import { useState, useMemo, Fragment } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Search, Filter, Download, ExternalLink, Shield, Calendar, MapPin, Leaf, ChevronDown, ChevronUp } from "lucide-react"
import { useApp } from "../contexts/AppContext"

export default function ImpactTracking() {
  const { state } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'date' | 'credits' | 'co2Offset'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Combine actions and transactions for comprehensive tracking
  const allActivities = useMemo(() => {
    const activities = [
      // Map user's submitted actions
      ...state.actions.map((action: any) => ({
        id: action.id,
        date: action.date,
        action: action.action,
        type: action.type,
        co2Offset: action.co2Offset,
        credits: action.credits,
        status: action.status,
        location: action.location,
        blockchainHash: action.blockchainHash,
        verificationDetails: action.verificationDetails,
        description: action.description,
        image: action.image,
        source: 'action' as const
      })),
      // Map transactions that earned credits
      ...state.transactions
        .filter((tx: any) => tx.type === 'earned')
        .map((tx: any) => ({
          id: tx.id,
          date: tx.date,
          action: tx.description,
          type: 'Credit Earned',
          co2Offset: tx.co2Offset || 0,
          credits: tx.credits,
          status: tx.status,
          location: tx.location || 'N/A',
          blockchainHash: tx.blockchainHash,
          verificationDetails: tx.verificationDetails,
          description: tx.description,
          source: 'transaction' as const
        }))
    ]
    
    // Remove duplicates (same action might appear in both lists)
    const uniqueActivities = activities.filter((activity, index, arr) => 
      arr.findIndex(a => a.blockchainHash === activity.blockchainHash) === index
    )
    
    return uniqueActivities
  }, [state.actions, state.transactions])

  const filteredActivities = useMemo(() => {
    return allActivities.filter(activity => {
      const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           activity.type.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesTypeFilter = filterType === "all" || 
                               activity.type.toLowerCase().includes(filterType.toLowerCase())
      
      const matchesStatusFilter = filterStatus === "all" || 
                                 activity.status.toLowerCase() === filterStatus.toLowerCase()
      
      return matchesSearch && matchesTypeFilter && matchesStatusFilter
    }).sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (sortField === 'date') {
        const aDate = new Date(aValue as string).getTime()
        const bDate = new Date(bValue as string).getTime()
        return sortDirection === 'desc' ? bDate - aDate : aDate - bDate
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue
      }
      
      return 0
    })
  }, [allActivities, searchTerm, filterType, filterStatus, sortField, sortDirection])

  const totalStats = useMemo(() => {
    return {
      totalActions: allActivities.length,
      totalCO2: allActivities.reduce((sum, activity) => sum + activity.co2Offset, 0),
      totalCredits: allActivities.reduce((sum, activity) => sum + activity.credits, 0),
      verifiedActions: allActivities.filter(activity => activity.status === 'verified').length
    }
  }, [allActivities])

  const handleSort = (field: 'date' | 'credits' | 'co2Offset') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Action', 'Type', 'Location', 'CO2 Offset (tons)', 'Credits', 'Status', 'Blockchain Hash'],
      ...filteredActivities.map(activity => [
        new Date(activity.date).toLocaleDateString(),
        activity.action,
        activity.type,
        activity.location,
        activity.co2Offset.toString(),
        activity.credits.toString(),
        activity.status,
        activity.blockchainHash || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `eco-credit-impact-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Solar Energy": "bg-yellow-100 text-yellow-800",
      "Reforestation": "bg-green-100 text-green-800",
      "Waste Reduction": "bg-secondary text-pine-deep",
      "Energy Efficiency": "bg-purple-100 text-purple-800",
      "Urban Agriculture": "bg-emerald-100 text-emerald-800",
      "Clean Transport": "bg-cyan-100 text-cyan-800",
      "Wind Energy": "bg-slate-100 text-slate-800",
      "Credit Earned": "bg-indigo-100 text-indigo-800"
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const SortableHeader = ({ field, children }: { field: 'date' | 'credits' | 'co2Offset', children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
        )}
      </div>
    </TableHead>
  )

  const openBlockchainExplorer = (hash: string) => {
    // Simulate opening blockchain explorer
    window.open(`https://etherscan.io/tx/${hash}`, '_blank')
  }

  if (!state.isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4 text-[#2C453E]">Access Required</h2>
        <p className="text-gray-600 mb-6">
          Please log in to track your environmental impact and view your action history.
        </p>
        <Button 
          onClick={() => window.location.href = '#login'}
          className="bg-[#3E5F55] hover:bg-[#3E5F55]/90"
        >
          Log In to Continue
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-[#2C453E]">Impact Tracking</h1>
        <p className="text-lg text-gray-600">
          Comprehensive tracking of your environmental actions and their verified impact on the blockchain
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#3E5F55] mb-2">{totalStats.totalActions}</p>
              <p className="text-sm text-gray-600">Total Actions Submitted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#6FA690] mb-2">{totalStats.totalCO2.toFixed(1)}T</p>
              <p className="text-sm text-gray-600">Total CO₂ Offset</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#C9A98C] mb-2">{totalStats.totalCredits}</p>
              <p className="text-sm text-gray-600">Credits Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#3E5F55] mb-2">
                {totalStats.totalActions > 0 ? Math.round((totalStats.verifiedActions / totalStats.totalActions) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Verification Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-[#6FA690]" />
              Action History ({filteredActivities.length} {filteredActivities.length === 1 ? 'record' : 'records'})
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportData}
              disabled={filteredActivities.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters and Search */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search actions, types, or locations..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="solar">Solar Energy</SelectItem>
                <SelectItem value="reforestation">Reforestation</SelectItem>
                <SelectItem value="waste">Waste Reduction</SelectItem>
                <SelectItem value="energy">Energy Efficiency</SelectItem>
                <SelectItem value="urban">Urban Agriculture</SelectItem>
                <SelectItem value="transport">Clean Transport</SelectItem>
                <SelectItem value="wind">Wind Energy</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activities Table */}
          {filteredActivities.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="date">Date</SortableHeader>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <SortableHeader field="co2Offset">CO₂ Offset</SortableHeader>
                    <SortableHeader field="credits">Credits</SortableHeader>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockchain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <Fragment key={activity.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-[#f5f5f5] transition-colors"
                        onClick={() => setExpandedRow(expandedRow === activity.id ? null : activity.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate" title={activity.action}>
                          {activity.action}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(activity.type)}>
                            {activity.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="max-w-xs truncate" title={activity.location}>
                              {activity.location}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-[#6FA690]">
                          {activity.co2Offset.toFixed(1)}t
                        </TableCell>
                        <TableCell className="font-semibold text-[#3E5F55]">
                          {activity.credits}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {activity.blockchainHash ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e: any) => {
                                e.stopPropagation()
                                openBlockchainExplorer(activity.blockchainHash!)
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRow === activity.id && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-[#f5f5f5] p-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-[#2C453E] flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#3E5F55]" />
                                Detailed Verification & Blockchain Information
                              </h4>
                              
                              {activity.description && (
                                <div className="mb-4">
                                  <label className="text-sm font-medium text-gray-600">Full Description:</label>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded border mt-1">
                                    {activity.description}
                                  </p>
                                </div>
                              )}
                              
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  {activity.blockchainHash && (
                                    <div>
                                      <label className="text-sm font-medium text-gray-600">Blockchain Hash:</label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <p className="font-mono text-sm bg-white p-2 rounded border break-all flex-1">
                                          {activity.blockchainHash}
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openBlockchainExplorer(activity.blockchainHash!)}
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {activity.verificationDetails && (
                                    <>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">AI Verification Score:</label>
                                        <p className="text-lg font-semibold text-[#6FA690] mt-1">
                                          {activity.verificationDetails.aiScore}%
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Geolocation Status:</label>
                                        <Badge className="ml-2 bg-green-100 text-green-800">
                                          {activity.verificationDetails.geoVerified ? '✓ Verified' : '⚠ Unverified'}
                                        </Badge>
                                      </div>
                                    </>
                                  )}
                                </div>
                                
                                <div className="space-y-3">
                                  {activity.verificationDetails && (
                                    <>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">AI Analysis Report:</label>
                                        <p className="text-sm text-gray-700 bg-white p-3 rounded border mt-1">
                                          {activity.verificationDetails.imageAnalysis}
                                        </p>
                                      </div>
                                      
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Verification System:</label>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {activity.verificationDetails.verifier}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                  
                                  <div className="flex gap-2 pt-2">
                                    {activity.blockchainHash && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => openBlockchainExplorer(activity.blockchainHash!)}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View on Explorer
                                      </Button>
                                    )}
                                    {activity.source === "action" && activity.image && (
                                      <Button variant="outline" size="sm">
                                        <img 
                                          src={activity.image} 
                                          alt="Action" 
                                          className="h-4 w-4 mr-2 rounded"
                                        />
                                        View Photo
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {allActivities.length === 0 ? (
                <>
                  <p className="text-gray-500 mb-4">No environmental actions recorded yet.</p>
                  <Button 
                    onClick={() => window.location.href = '#submit'}
                    className="bg-[#3E5F55] hover:bg-[#3E5F55]/90"
                  >
                    Submit Your First Action
                  </Button>
                </>
              ) : (
                <p className="text-gray-500">No actions found matching your search criteria.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
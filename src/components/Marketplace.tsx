import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from './ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle
} from './ui/dialog'
import { 
  Search, Star, MapPin, Calendar, Leaf, Coins,
  ShoppingCart, Verified, Shield, Wallet,
  ExternalLink, Loader2, Heart
} from 'lucide-react'
import { useApp, CreditListing } from '../contexts/AppContext'
import ImpactMap from './ImpactMap'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { blockchainService } from '../services/blockchainService'
import { api } from '../services/api'

export default function Marketplace() {
  const { state, dispatch } = useApp()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterBy, setFilterBy] = useState("all")
  const [selectedListing, setSelectedListing] = useState<CreditListing | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState(1)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [favIds, setFavIds] = useState<Set<string>>(new Set())
  const [reviewTx, setReviewTx] = useState<any>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  // pagination: context loads page 1; "Load More" fetches & appends further pages
  const [extra, setExtra] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    api.listings.list({ page: 1, limit: 1 }).then((r) => setHasMore((r.total || 0) > state.listings.length)).catch(() => {})
  }, [state.listings.length])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = page + 1
      const r = await api.listings.list({ page: next, limit: 20 })
      const mapped = (r.listings || []).map((l: any) => ({ ...l, id: l._id, date: l.createdAt, image: l.imageUrl }))
      setExtra((e) => [...e, ...mapped]); setPage(next); setHasMore(next < (r.pages || 1))
    } catch { /* ignore */ } finally { setLoadingMore(false) }
  }

  const allListings = useMemo(() => {
    const map = new Map<string, any>()
    ;[...state.listings, ...extra].forEach((l) => map.set(l._id || l.id, l))
    return [...map.values()]
  }, [state.listings, extra])

  const submitReview = async () => {
    try {
      await api.reviews.create({ transactionId: reviewTx._id || reviewTx.id, rating: reviewRating, comment: reviewComment })
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Thanks for your review! ⭐' } })
      setReviewTx(null); setReviewComment(''); setReviewRating(5)
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: err.message || 'Could not submit review' } })
    }
  }

  useEffect(() => {
    if (!state.isAuthenticated) return
    api.favorites.list().then((d) => {
      setFavIds(new Set((d.favorites || []).map((f: any) => f.listing?._id || f.listing).filter(Boolean)))
    }).catch(() => {})
  }, [state.isAuthenticated])

  const toggleFavorite = async (listing: CreditListing, e: React.MouseEvent) => {
    e.stopPropagation()
    const id = (listing as any)._id || listing.id
    const next = new Set(favIds)
    try {
      if (favIds.has(id)) { await api.favorites.remove(id); next.delete(id) }
      else { await api.favorites.add({ listingId: id }); next.add(id); dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'success', message: 'Saved to watchlist ❤️' } }) }
      setFavIds(next)
    } catch (err: any) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { type: 'error', message: err.message || 'Could not update favorites' } })
    }
  }

  // Filter and sort listings
  const filteredAndSortedListings = useMemo(() => {
    let filtered = allListings.filter(listing => {
      const matchesSearch = 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.type.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterBy === "all" || 
        listing.type.toLowerCase().includes(filterBy.toLowerCase())
      
      return matchesSearch && matchesFilter
    })

    // Sort listings
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "co2-impact":
        filtered.sort((a, b) => b.co2Offset - a.co2Offset)
        break
      case "rating":
        filtered.sort((a, b) => b.seller.rating - a.seller.rating)
        break
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
    }

    return filtered
  }, [allListings, searchTerm, filterBy, sortBy])

  // Market statistics
  const marketStats = useMemo(() => {
    const totalListings = state.listings.length
    const avgPrice = state.listings.length > 0 
      ? state.listings.reduce((sum, l) => sum + l.price, 0) / state.listings.length 
      : 0
    const totalCO2Available = state.listings.reduce((sum, l) => sum + l.co2Offset, 0)
    const totalCreditsAvailable = state.listings.reduce((sum, l) => sum + l.credits, 0)

    return {
      totalListings,
      avgPrice,
      totalCO2Available,
      totalCreditsAvailable
    }
  }, [state.listings])

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "Solar Energy": "bg-yellow-100 text-yellow-800",
      "Reforestation": "bg-green-100 text-green-800",
      "Waste Reduction": "bg-secondary text-pine-deep",
      "Wind Energy": "bg-cyan-100 text-cyan-800",
      "Urban Agriculture": "bg-emerald-100 text-emerald-800",
      "Clean Transport": "bg-purple-100 text-purple-800"
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
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
      } else {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            type: 'error',
            message: 'Please install MetaMask to use blockchain features'
          }
        })
      }
    } catch (error: any) {
      console.error('[Marketplace] Wallet connection error:', error)
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: error.message || 'Failed to connect wallet'
        }
      })
    } finally {
      setIsConnecting(false)
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

  const handlePurchase = (listing: CreditListing) => {
    setSelectedListing(listing)
    setPurchaseAmount(1)
    setTxHash(null)
    setIsDialogOpen(true)
  }

  const confirmPurchase = async () => {
    if (!selectedListing || !state.user) return

    setIsPurchasing(true)
    setTxHash(null)

    try {
      const listingId = selectedListing.id || selectedListing._id;
      
      const res = await api.transactions.purchase({
        listingId,
        credits: purchaseAmount
      })

      const totalAmount = selectedListing.price * purchaseAmount

      // Update local state
      dispatch({
        type: 'PURCHASE_CREDITS',
        payload: {
          listingId,
          buyerEmail: state.user.email,
          amount: totalAmount,
          transaction: res.transaction,
          remaining: res.remaining
        }
      })

      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'success',
          message: `✅ Successfully purchased ${purchaseAmount} credits for ₹${(totalAmount * 83).toFixed(0)}!`
        }
      })

      setIsDialogOpen(false)
      if (res.transaction) setReviewTx(res.transaction) // prompt a seller review

    } catch (error: any) {
      console.error('[Marketplace] Purchase failed:', error)
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'error',
          message: error.message || 'Failed to complete purchase. Please try again.'
        }
      })
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient">India EcoCredit Marketplace</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Buy and sell verified carbon credits from authenticated environmental actions across India
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {walletAddress ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                  <a 
                    href={blockchainService.getAddressLink(walletAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Button
                  onClick={handleDisconnectWallet}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                
                className="bg-primary text-primary-foreground hover:opacity-90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
            <div className="text-xs text-gray-500">
              <a 
                href={blockchainService.getContractLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                Smart Contract
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Market Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-pine mb-2">{marketStats.totalListings}</div>
              <div className="text-sm text-gray-600">Active Listings</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-sage-deep mb-2">₹{(marketStats.avgPrice * 83).toFixed(0)}</div>
              <div className="text-sm text-gray-600">Average Price</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-pine mb-2">{marketStats.totalCO2Available.toFixed(1)}t</div>
              <div className="text-sm text-gray-600">CO₂ Available</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-pine mb-2">{marketStats.totalCreditsAvailable}</div>
              <div className="text-sm text-gray-600">Total Credits</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact map */}
      <ImpactMap listings={allListings} />

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search credits by type, location, or seller..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="solar">Solar Energy</SelectItem>
              <SelectItem value="reforestation">Reforestation</SelectItem>
              <SelectItem value="waste">Waste Reduction</SelectItem>
              <SelectItem value="wind">Wind Energy</SelectItem>
              <SelectItem value="urban">Urban Agriculture</SelectItem>
              <SelectItem value="transport">Clean Transport</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="co2-impact">CO₂ Impact</SelectItem>
              <SelectItem value="rating">Seller Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Credit Listings */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedListings.map((credit, i) => (
          <motion.div key={credit.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: Math.min(i * 0.04, 0.4) }} whileHover={{ y: -5 }}>
          <Card className="overflow-hidden glow-sage transition-shadow h-full">
            <div className="relative">
              <ImageWithFallback
                src={credit.image}
                alt={credit.title}
                className="w-full h-48 object-cover"
              />
              <button onClick={(e) => toggleFavorite(credit, e)} aria-label="Save"
                className="absolute top-2 right-2 rounded-full bg-white/85 backdrop-blur p-2 shadow-sm hover:scale-110 transition-transform">
                <Heart className={`h-4 w-4 ${favIds.has((credit as any)._id || credit.id) ? 'fill-destructive text-destructive' : 'text-pine'}`} />
              </button>
              {credit.verified && (
                <div className="absolute top-2 right-12 bg-primary text-primary-foreground p-1 rounded-full">
                  <Verified className="h-4 w-4" />
                </div>
              )}
              <div className="absolute top-2 left-2">
                <Badge className={`${getTypeColor(credit.type)} border-0`}>
                  {credit.type}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{credit.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{credit.seller.avatar}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-600">{credit.seller.name}</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">
                      {(credit as any).sellerRating?.count ? `${(credit as any).sellerRating.avg.toFixed(1)} (${(credit as any).sellerRating.count})` : 'New'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{credit.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{credit.date}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">CO₂ Offset:</span>
                    <div className="font-semibold text-green-600">{credit.co2Offset}t</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Credits:</span>
                    <div className="font-semibold text-pine">{credit.credits}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-2xl font-bold text-pine">₹{(credit.price * 83).toFixed(0)}</div>
                  <div className="text-xs text-gray-500">per credit</div>
                </div>
                <button 
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-white px-4 py-2 rounded-md cursor-pointer font-medium transition-all"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('BUTTON CLICKED!', credit)
                    handlePurchase(credit)
                  }}
                  type="button"
                  style={{ cursor: 'pointer' }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Buy Now
                </button>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedListings.length === 0 && (
        <div className="text-center py-12">
          <Leaf className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">No listings found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterBy !== "all" 
              ? "Try adjusting your search or filter criteria" 
              : "Be the first to list your carbon credits!"}
          </p>
          {searchTerm || filterBy !== "all" ? (
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
              <Button variant="outline" onClick={() => setFilterBy("all")}>
                Clear Filters
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-12">
          <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore} className="rounded-full">
            {loadingMore ? 'Loading…' : 'Load More Credits'}
          </Button>
        </div>
      )}

      {/* Purchase Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Purchase Carbon Credits</DialogTitle>
            <DialogDescription>
              {selectedListing && `Purchase credits from ${selectedListing.seller.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedListing && (
            <div className="space-y-4">
              {/* Wallet Status */}
              {walletAddress ? (
                <div className="bg-secondary/50 border border-sage rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-pine" />
                    <span className="text-pine-deep font-medium">
                      Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Blockchain Sync (Optional)</p>
                        <p className="text-xs text-yellow-600">Connect your wallet to record on-chain</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleConnectWallet}
                      disabled={isConnecting}
                      size="sm"
                      
                      className="bg-primary text-primary-foreground hover:opacity-90"
                    >
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedListing.title}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Price per credit:</span>
                    <div className="font-semibold">₹{(selectedListing.price * 83).toFixed(0)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Available:</span>
                    <div className="font-semibold">{selectedListing.credits} credits</div>
                  </div>
                  <div>
                    <span className="text-gray-600">CO₂ Impact:</span>
                    <div className="font-semibold">{selectedListing.co2Offset}t per credit</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <div className="font-semibold">{selectedListing.location}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of credits to purchase:
                </label>
                <Input
                  type="number"
                  min="1"
                  max={selectedListing.credits}
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 1)}
                  className="w-full"
                  disabled={isPurchasing}
                />
              </div>
              
              <div className="bg-secondary/50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Cost:</span>
                  <span className="text-xl font-bold text-pine">
                    ₹{(selectedListing.price * purchaseAmount * 83).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Total CO₂ Offset:</span>
                  <span>{(selectedListing.co2Offset * purchaseAmount).toFixed(1)}t</span>
                </div>
              </div>

              {/* Transaction Status */}
              {isPurchasing && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Processing blockchain transaction...</span>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Please confirm the transaction in MetaMask. This may take 30-60 seconds.
                  </p>
                </div>
              )}

              {/* Transaction Success */}
              {txHash && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800 mb-2">
                    <Verified className="h-4 w-4" />
                    <span className="text-sm font-medium">Transaction Successful!</span>
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

              {/* Blockchain Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Shield className="h-3 w-3" />
                  <span>Secured by Ethereum blockchain on Sepolia testnet</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isPurchasing}
            >
              {txHash ? 'Close' : 'Cancel'}
            </Button>
            {!txHash && (
              <Button 
                onClick={confirmPurchase}
                className="bg-primary hover:opacity-90"
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 mr-2" />
                    Purchase Credits
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review the seller after a purchase */}
      <Dialog open={!!reviewTx} onOpenChange={(o) => !o && setReviewTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate this seller</DialogTitle>
            <DialogDescription>How was your purchase experience?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setReviewRating(n)} aria-label={`${n} stars`}>
                <Star className={`h-8 w-8 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
          <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
            placeholder="Share a few words (optional)…" rows={3}
            className="w-full rounded-lg bg-input-background border border-border px-3 py-2 text-sm resize-none" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTx(null)}>Skip</Button>
            <Button onClick={submitReview} className="bg-primary text-primary-foreground">Submit review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
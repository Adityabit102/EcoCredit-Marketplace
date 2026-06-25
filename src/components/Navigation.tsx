import { useState } from "react"
import { Button } from "./ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Leaf, Menu, User, LogOut, Heart, Settings } from "lucide-react"
import NotificationBell from "./NotificationBell"
import GradientButton from "./ui/GradientButton"

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isAuthenticated: boolean;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
}

export default function Navigation({ currentPage, onNavigate, isAuthenticated, userEmail, userRole, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'submit', label: 'Submit', icon: '📤' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'calculator', label: 'Calculator', icon: '🧮' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
    ...(userRole === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '🛡️' }] : []),
  ]

  const handleMobileNavigate = (page: string) => { onNavigate(page); setIsMobileMenuOpen(false) }
  const handleMobileLogout = () => { onLogout?.(); setIsMobileMenuOpen(false) }

  const Logo = (
    <div className="flex items-center cursor-pointer group shrink-0 mr-4" onClick={() => onNavigate(isAuthenticated ? 'home' : 'about')}>
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl shadow-sm transition-transform group-hover:scale-105 shrink-0"
          style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }}>
          <Leaf className="h-5 w-5 text-cream" />
        </div>
        <span className="text-xl font-bold text-gradient tracking-tight whitespace-nowrap">EcoCredit India</span>
      </div>
    </div>
  )

  return (
    <nav className="sticky top-0 z-50 bg-cream/90 backdrop-blur-md border-b border-border/70">
      {/* thin brand accent line */}
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg,#3E5F55,#A9CDBA,#E7D7C8,#3E5F55)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {Logo}

          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-0.5 lg:gap-1">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => onNavigate(item.id)}
                    className={`px-3 py-2 text-sm font-medium rounded-full transition-all ${
                      currentPage === item.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-pine hover:bg-secondary/70'}`}>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-1">
                <button onClick={() => onNavigate('favorites')} aria-label="Favorites"
                  className={`rounded-full p-2 transition-colors ${currentPage === 'favorites' ? 'text-destructive bg-secondary/70' : 'text-pine hover:bg-secondary/70'}`}>
                  <Heart className="w-5 h-5" />
                </button>
                <NotificationBell />
                <button onClick={() => onNavigate('settings')} aria-label="Settings"
                  className={`rounded-full p-2 transition-colors ${currentPage === 'settings' ? 'text-pine bg-secondary/70' : 'text-pine hover:bg-secondary/70'}`}>
                  <Settings className="w-5 h-5" />
                </button>
                <div className="mx-1 h-6 w-px bg-border" />
                <span className="hidden lg:block max-w-[140px] truncate text-sm text-muted-foreground">{userEmail}</span>
                <Button variant="outline" size="sm" onClick={onLogout} className="ml-1 rounded-full">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => onNavigate('login')} className="rounded-full">Sign In</Button>
              <GradientButton size="md" onClick={() => onNavigate('register')}>Get Started</GradientButton>
            </div>
          )}

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1">
            {isAuthenticated && <NotificationBell />}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild><Button variant="ghost" size="sm"><Menu className="h-6 w-6" /></Button></SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-cream">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#3E5F55,#6FA690)' }}><Leaf className="h-5 w-5 text-cream" /></div>
                    EcoCredit India
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 space-y-4">
                  {isAuthenticated ? (
                    <>
                      <div className="pb-4 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary rounded-full"><User className="h-5 w-5 text-pine" /></div>
                          <div><p className="font-medium text-pine">Welcome back!</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{userEmail}</p></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[...navItems, { id: 'favorites', label: 'Favorites', icon: '❤️' }, { id: 'settings', label: 'Settings', icon: '⚙️' }].map((item) => (
                          <button key={item.id} onClick={() => handleMobileNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                              currentPage === item.id ? 'bg-secondary text-pine border-l-4 border-primary' : 'text-muted-foreground hover:bg-secondary'}`}>
                            <span className="text-lg">{item.icon}</span><span className="font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-border">
                        <Button variant="outline" className="w-full rounded-full" onClick={handleMobileLogout}>
                          <LogOut className="h-4 w-4 mr-2" /> Logout
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-center">Join India's carbon credit marketplace</p>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full rounded-full" onClick={() => handleMobileNavigate('login')}>Sign In</Button>
                        <Button className="w-full bg-primary text-primary-foreground rounded-full" onClick={() => handleMobileNavigate('register')}>Get Started</Button>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <button onClick={() => handleMobileNavigate('about')} className="w-full text-left px-4 py-2 text-muted-foreground hover:text-pine">
                          Learn About EcoCredit India
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

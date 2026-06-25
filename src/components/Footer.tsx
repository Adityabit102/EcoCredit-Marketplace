import { Leaf, Mail, Phone, MapPin } from "lucide-react"

interface FooterProps {
  onNavigate?: (page: string) => void
}

export default function Footer({ onNavigate }: FooterProps) {
  const footerLinks = {
    about: [
      { label: "About EcoCredit", page: "about" },
      { label: "How It Works", page: "about" },
      { label: "Team", page: "about" },
      { label: "Careers", page: "about" }
    ],
    support: [
      { label: "FAQ", page: "about" },
      { label: "Help Center", page: "about" },
      { label: "Contact Support", page: "about" },
      { label: "Community", page: "marketplace" }
    ],
    legal: [
      { label: "Terms of Service", page: "about" },
      { label: "Privacy Policy", page: "about" },
      { label: "Cookie Policy", page: "about" },
      { label: "Compliance", page: "about" }
    ]
  }

  const handleLinkClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-[#2C453E] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#3E5F55] rounded-lg">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-semibold">EcoCredit India</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              India's premier blockchain-powered marketplace for verified carbon credits. 
              Turn your environmental actions into digital assets.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hello@ecocreditindia.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91 11 1234-5678</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>New Delhi, India</span>
              </div>
            </div>
          </div>

          {/* About Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">About</h3>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => handleLinkClick(link.page)}
                    className="text-gray-300 hover:text-[#C9A98C] transition-colors text-sm cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => handleLinkClick(link.page)}
                    className="text-gray-300 hover:text-[#C9A98C] transition-colors text-sm cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <button 
                    onClick={() => handleLinkClick(link.page)}
                    className="text-gray-300 hover:text-[#C9A98C] transition-colors text-sm cursor-pointer text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-600 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2026 EcoCredit India. All rights reserved.
          </p>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-[#6FA690] rounded-full"></div>
              <span>Blockchain Verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-[#3E5F55] rounded-full"></div>
              <span>AI Powered</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-[#C9A98C] rounded-full"></div>
              <span>Carbon Neutral</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
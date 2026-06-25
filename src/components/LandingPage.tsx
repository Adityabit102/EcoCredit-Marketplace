import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { Upload, Shield, TrendingUp, Leaf, Camera, Coins } from "lucide-react"
import { ImageWithFallback } from "./figma/ImageWithFallback"

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const steps = [
    {
      icon: Camera,
      title: "Submit Green Actions",
      description: "Upload geotagged photos of your sustainable activities like tree planting, solar installation, or waste reduction."
    },
    {
      icon: Shield,
      title: "AI Verification",
      description: "Our advanced AI system verifies the authenticity and impact of your green actions using geolocation and image analysis."
    },
    {
      icon: Coins,
      title: "Trade EcoCredits",
      description: "Earn verified carbon credits that can be traded on our marketplace or used to offset your carbon footprint."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#3E5F55] to-[#6FA690] text-white py-24">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                Turn Your Green Actions Into <span className="text-[#C9A98C]">Digital Assets</span>
              </h1>
              <p className="text-xl mb-8 opacity-90">
                The first blockchain-powered marketplace where small businesses and individuals can 
                verify, trade, and track their environmental impact through AI-verified carbon credits.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => onNavigate('submit')}
                  className="bg-white text-[#3E5F55] hover:bg-gray-100"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => onNavigate('marketplace')}
                  className="bg-white text-[#3E5F55] hover:bg-gray-100"
                >
                  <TrendingUp className="h-5 w-5 mr-2" />
                  View Marketplace
                </Button>
              </div>
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1606409723444-4f01189fc20f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMGVuZXJneSUyMHN1c3RhaW5hYmlsaXR5JTIwZm9yZXN0fGVufDF8fHx8MTc1Nzc4OTI5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Sustainable forest and green energy"
                className="rounded-lg shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#2C453E]">How EcoCredit Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to turn your environmental actions into verified carbon credits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="inline-flex p-4 bg-[#3E5F55]/10 rounded-full mb-6">
                    <step.icon className="h-8 w-8 text-[#3E5F55]" />
                  </div>
                  <div className="text-2xl font-bold mb-2 text-[#3E5F55]">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-[#2C453E]">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#3E5F55] mb-2">12,567</div>
              <div className="text-gray-600">Credits Traded</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#6FA690] mb-2">8,234</div>
              <div className="text-gray-600">Tons CO₂ Offset</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#C9A98C] mb-2">3,891</div>
              <div className="text-gray-600">Verified Actions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#3E5F55] mb-2">1,456</div>
              <div className="text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#3E5F55] text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Leaf className="h-16 w-16 mx-auto mb-6 text-[#C9A98C]" />
          <h2 className="text-4xl font-bold mb-6">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of businesses and individuals who are already earning rewards for their environmental actions.
          </p>
          <Button 
            size="lg" 
            onClick={() => onNavigate('submit')}
            className="bg-[#6FA690] hover:bg-[#6FA690]/90 text-white"
          >
            Submit Your First Action
          </Button>
        </div>
      </section>
    </div>
  )
}
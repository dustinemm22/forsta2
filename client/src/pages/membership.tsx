import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Clock, Gift, X } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free",
    price: 0,
    tier: "free",
    icon: <Star className="w-6 h-6" />,
    features: [
      "Generate unlimited audio",
      "Preview tracks (5 seconds)",
      "Save sessions",
      "Basic frequency range",
      "Male & Female voices"
    ],
    limitations: ["No downloads available"],
    buttonText: "Current Plan",
    description: "Perfect for trying out subliminal audio generation"
  },
  {
    name: "Basic",
    price: 9.99,
    tier: "basic",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "Everything in Free",
      "15 downloads per month",
      "Priority support",
      "Extended preview (10 seconds)",
      "Download history tracking"
    ],
    limitations: [],
    buttonText: "Upgrade to Basic",
    description: "Great for regular users who want to download their creations",
    popular: true
  },
  {
    name: "Premium",
    price: 19.99,
    tier: "premium",
    icon: <Crown className="w-6 h-6" />,
    features: [
      "Everything in Basic",
      "Unlimited downloads",
      "Advanced customization",
      "Premium support",
      "Exclusive voice options",
      "Batch processing"
    ],
    limitations: [],
    buttonText: "Upgrade to Premium",
    description: "Perfect for power users and content creators"
  }
];

export default function Membership() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [trialStarting, setTrialStarting] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = (planTier: string, price: number) => {
    if (planTier === "free") return;
    setSelectedPlan(planTier);
  };

  const startTrial = async (trialTier: string) => {
    setTrialStarting(true);
    try {
      // For demo purposes, use userId 1 (in production, this would come from auth)
      const userId = 1;
      
      const response = await fetch(`/api/user/${userId}/start-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trialTier }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Trial Started!",
          description: `Your ${trialTier} trial is now active for 24 hours. Note: Downloads are not available during trial.`,
        });
        // Refresh the page to update access controls
        window.location.reload();
      } else {
        toast({
          title: "Trial Failed",
          description: result.message || "Failed to start trial",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTrialStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Plan</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Unlock the full potential of FORSTA with our flexible membership options. 
            Start free and upgrade when you're ready to download your creations.
          </p>
        </div>

        {/* Free Trial Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Try Before You Buy</h2>
            <p className="text-gray-300">
              Get a 24-hour free trial of Basic or Premium features. No downloads included.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Basic Trial */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 text-white">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <CardTitle className="text-blue-400">Basic Trial</CardTitle>
                </div>
                <p className="text-gray-300">24 hours free access</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-blue-400" />
                    <span>Extended audio generation (30 min)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-blue-400" />
                    <span>Upload audio files</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <X className="w-4 h-4 text-red-400" />
                    <span>No downloads available</span>
                  </div>
                </div>
                <Button 
                  onClick={() => startTrial('basic')}
                  disabled={trialStarting}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {trialStarting ? "Starting..." : "Start Basic Trial"}
                </Button>
              </CardContent>
            </Card>

            {/* Premium Trial */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 text-white">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gift className="w-6 h-6 text-purple-400" />
                  <CardTitle className="text-purple-400">Premium Trial</CardTitle>
                </div>
                <p className="text-gray-300">24 hours free access</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>Video creation (2 hours)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>Audio recording</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-purple-400" />
                    <span>Upload audio & video</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <X className="w-4 h-4 text-red-400" />
                    <span>No downloads available</span>
                  </div>
                </div>
                <Button 
                  onClick={() => startTrial('premium')}
                  disabled={trialStarting}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {trialStarting ? "Starting..." : "Start Premium Trial"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.tier} 
              className={`relative bg-gray-800 border-gray-700 text-white transition-all duration-300 hover:scale-105 ${
                plan.popular ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gray-700 rounded-full">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-400">
                  ${plan.price}
                  <span className="text-sm text-gray-400 font-normal">/month</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limitations */}
                {plan.limitations.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-gray-700">
                    <p className="text-sm font-semibold text-gray-400">Limitations:</p>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        </div>
                        <span className="text-gray-400 text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <div className="pt-4">
                  {plan.tier === "free" ? (
                    <Button 
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                      disabled
                    >
                      {plan.buttonText}
                    </Button>
                  ) : selectedPlan === plan.tier ? (
                    <div className="w-full">
                      <PayPalButton
                        amount={plan.price.toString()}
                        currency="USD"
                        intent="CAPTURE"
                      />
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => handleUpgrade(plan.tier, plan.price)}
                    >
                      {plan.buttonText}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="text-center text-gray-400">
          <h3 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Can I cancel anytime?</h4>
              <p className="text-sm">Yes, you can cancel your subscription at any time. Your downloads will remain available until the end of your billing period.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">What happens to my downloads if I downgrade?</h4>
              <p className="text-sm">All previously downloaded files remain yours forever. Only future download limits will be affected by your new plan.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Do downloads reset monthly?</h4>
              <p className="text-sm">Yes, your download count resets on the same day each month that you subscribed.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-300 mb-2">Can I upgrade mid-cycle?</h4>
              <p className="text-sm">Absolutely! You'll get prorated billing and immediate access to your new plan's features.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
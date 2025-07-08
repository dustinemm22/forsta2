import { Brain, Settings, HelpCircle, Crown, Star, Zap } from "lucide-react";
import AudioGenerator from "@/components/audio-generator";
import FrequencyGuide from "@/components/frequency-guide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Brain className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">FORSTA : create your own subliminals</h1>
              <p className="text-sm text-gray-400">Custom Audio Generator</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <AudioGenerator />
          </div>
          <div className="lg:col-span-1 space-y-6">
            {/* Membership Card */}
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/30">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-1">
                  <div className="p-1 bg-blue-500/20 rounded-lg">
                    <Crown className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <CardTitle className="text-base font-bold text-white">Unlock Downloads</CardTitle>
                <p className="text-gray-300 text-xs">Get your audio files</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">$9.99</div>
                  <div className="text-gray-400 text-xs">per month</div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-300">
                    <Star className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                    10 downloads/month
                  </div>
                  <div className="flex items-center text-xs text-gray-300">
                    <Star className="w-3 h-3 text-green-400 mr-2 flex-shrink-0" />
                    Extended previews
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href="/membership">
                    <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                      Upgrade Now
                    </Button>
                  </Link>
                  
                  <Link href="/membership">
                    <Button size="sm" variant="outline" className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                      View All Plans
                    </Button>
                  </Link>
                </div>
                
                <p className="text-xs text-gray-400 text-center">
                  Free plan active
                </p>
              </CardContent>
            </Card>
            
            <FrequencyGuide />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Book, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FREQUENCY_GUIDES = [
  {
    name: "Delta",
    range: "1-4 Hz",
    color: "blue",
    description: "Deep sleep, healing",
  },
  {
    name: "Theta", 
    range: "4-8 Hz",
    color: "purple",
    description: "Meditation, creativity",
  },
  {
    name: "Alpha",
    range: "8-13 Hz", 
    color: "green",
    description: "Relaxed focus, learning",
  },
  {
    name: "Beta",
    range: "14-30 Hz",
    color: "yellow",
    description: "Active thinking, alertness",
  },
  {
    name: "Gamma",
    range: "30-100 Hz",
    color: "red", 
    description: "Peak performance",
  },
  {
    name: "High Freq",
    range: "100+ Hz",
    color: "orange", 
    description: "Advanced applications",
  },
];

const TIPS = [
  "Use headphones for binaural beats",
  "Keep affirmations positive and present tense", 
  "Listen consistently for best results",
  "Start with lower frequencies for beginners",
];

const COLOR_CLASSES = {
  blue: "border-blue-500 text-blue-400",
  purple: "border-purple-500 text-purple-400",
  green: "border-green-500 text-green-400", 
  yellow: "border-yellow-500 text-yellow-400",
  red: "border-red-500 text-red-400",
  orange: "border-orange-500 text-orange-400",
};

export default function FrequencyGuide() {
  return (
    <Card className="bg-gray-800 border-gray-700 sticky top-6">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Book className="text-amber-400 w-4 h-4" />
          </div>
          <h2 className="text-lg font-semibold text-white">Frequency Guide</h2>
        </div>

        <div className="space-y-2">
          {FREQUENCY_GUIDES.map((guide) => (
            <div
              key={guide.name}
              className={`p-2 bg-gray-700 rounded border-l-3 ${COLOR_CLASSES[guide.color as keyof typeof COLOR_CLASSES]}`}
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className={`text-sm font-medium ${COLOR_CLASSES[guide.color as keyof typeof COLOR_CLASSES]?.split(' ')[1] || 'text-gray-300'}`}>
                  {guide.name}
                </h4>
                <span className="text-xs text-gray-400">{guide.range}</span>
              </div>
              <p className="text-xs text-gray-400">{guide.description}</p>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="mt-4 p-3 bg-emerald-500/10 rounded border border-emerald-500/20">
          <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center">
            <Lightbulb className="w-3 h-3 mr-1" />
            Tips
          </h4>
          <ul className="text-xs text-gray-400 space-y-1">
            {TIPS.map((tip, index) => (
              <li key={index}>• {tip}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

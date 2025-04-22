import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Advanced AI Charting Suite",
  description: "Next-gen charting platform with AI, custom strategies, and algo trading features",
}

export default function AdvancedChartsPage() {
  return (
    <div className="bg-black min-h-screen w-full flex items-center justify-center text-white">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-3xl font-bold">Advanced AI Charting Suite</h1>
        <p className="text-gray-400">Your advanced charting platform is loading...</p>
        <div className="flex justify-center">
          <div className="w-12 h-12 border-t-2 border-blue-500 border-r-2 border-opacity-50 rounded-full animate-spin"></div>
        </div>
        <p className="text-xs text-gray-600 mt-8">This tab will host the full charting suite experience.</p>
      </div>
    </div>
  )
} 
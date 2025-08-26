import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InfoIcon } from "./InfoIcon"

interface VolumeAnalysisPanelProps {
  currentPrice: number | null
  vwap: number
  volatility: number
  arbitrage: number
}

export default function VolumeAnalysisPanel({ currentPrice, vwap, volatility, arbitrage }: VolumeAnalysisPanelProps) {
  const calculateMarketEfficiency = () => {
    const volatilityPercentage = volatility * 100
    const scaledArbitrage = Math.min(arbitrage, 10) / 2 // Cap arbitrage at 10% and scale it down by half
    const efficiency = Math.max(0, 100 - volatilityPercentage - scaledArbitrage)
    return efficiency.toFixed(2)
  }

  const marketEfficiency = calculateMarketEfficiency()

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-purple-400">Market Analysis</CardTitle>
        <InfoIcon content="Provides key market metrics including current price, volume-weighted average price (VWAP), volatility, arbitrage, and market efficiency." />
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <p className="flex justify-between items-center">
            <span className="text-gray-400">Current Price:</span>
            <span className="font-semibold text-blue-400">
              {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : "N/A"}
            </span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-gray-400">VWAP:</span>
            <span className="font-semibold text-green-400">${vwap.toFixed(2)}</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-gray-400">Volatility:</span>
            <span className="font-semibold text-yellow-400">{(volatility * 100).toFixed(2)}%</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-gray-400">Arbitrage:</span>
            <span className="font-semibold text-green-400">{arbitrage.toFixed(2)}%</span>
          </p>
          <p className="flex justify-between items-center">
            <span className="text-gray-400 flex items-center">
              Market Efficiency:
              <InfoIcon content="Calculated as 100 - volatility - (scaled arbitrage). Arbitrage impact is minimized to account for potential outliers." />
            </span>
            <span className="font-semibold text-purple-400">{marketEfficiency}%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

import { InfoIcon } from "./InfoIcon"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ArbitragePanelProps {
  arbitrage: number | null
}

export default function ArbitragePanel({ arbitrage }: ArbitragePanelProps) {
  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-green-400">Arbitrage Opportunity</CardTitle>
        <InfoIcon
          content={`Calculated as (max_price - min_price) / volume_weighted_average_price across all exchanges. Represents the potential profit percentage from price differences.`}
        />
      </CardHeader>
      <CardContent>
        <p className="text-5xl font-bold text-green-400 mb-2">
          {arbitrage !== null ? `${arbitrage.toFixed(2)}%` : "N/A"}
        </p>
        <p className="text-sm text-gray-400">Potential profit from price differences across exchanges</p>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpDown, TrendingDown, TrendingUp } from "lucide-react"

interface ArbitrageDetailsProps {
  minPrice: number
  maxPrice: number
  minExchange: string
  maxExchange: string
  percentageDifference: number
}

export function ArbitrageDetailsPanel({
  minPrice,
  maxPrice,
  minExchange,
  maxExchange,
  percentageDifference,
}: ArbitrageDetailsProps) {
  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400 flex items-center">
          <ArrowUpDown className="mr-2 h-5 w-5" />
          Arbitrage Details (from Rankings)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Lowest Price</p>
            <p className="text-lg font-semibold text-green-400">${minPrice.toFixed(6)}</p>
            <p className="text-xs text-gray-500 mt-1">{minExchange}</p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Highest Price</p>
            <p className="text-lg font-semibold text-red-400">${maxPrice.toFixed(6)}</p>
            <p className="text-xs text-gray-500 mt-1">{maxExchange}</p>
          </div>
        </div>
        <div className="mt-4 bg-gray-800/50 p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Arbitrage Opportunity</p>
          <div className="flex items-center">
            <p className="text-2xl font-bold text-purple-400">{percentageDifference.toFixed(2)}%</p>
            {percentageDifference > 0 ? (
              <TrendingUp className="ml-2 h-6 w-6 text-green-400" />
            ) : (
              <TrendingDown className="ml-2 h-6 w-6 text-red-400" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

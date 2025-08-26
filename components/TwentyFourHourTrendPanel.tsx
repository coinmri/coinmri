import { ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HourlyTrend {
  hour: string
  change: number
}

interface TwentyFourHourTrendPanelProps {
  trends: HourlyTrend[]
}

export default function TwentyFourHourTrendPanel({ trends }: TwentyFourHourTrendPanelProps) {
  if (!trends || trends.length === 0) {
    return null
  }

  const formatHour = (dateString: string) => {
    const date = new Date(dateString)
    return date.getHours().toString().padStart(2, "0")
  }

  const overallTrend = trends.reduce((sum, trend) => sum + trend.change, 0)
  const getTrendRemark = (trend: number) => {
    if (trend > 1) return "Price is climbing"
    if (trend > 0) return "Price is inching up"
    if (trend < -1) return "Price is dropping"
    if (trend < 0) return "Price is slipping"
    return "Price is stable"
  }
  const trendRemark = getTrendRemark(overallTrend)
  const trendColor = overallTrend > 0 ? "text-green-500" : overallTrend < 0 ? "text-red-500" : "text-gray-500"

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400">24-Hour Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-400 mb-2">Hourly price changes (00-23)</p>
        <div className="grid grid-cols-8 gap-2">
          {trends.map((trend, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xs text-gray-400 mb-1">{formatHour(trend.hour)}</span>
              {trend.change >= 0 ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-semibold ${trend.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(trend.change).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        <div className={`mt-4 text-center font-semibold ${trendColor}`}>{trendRemark}</div>
      </CardContent>
    </Card>
  )
}

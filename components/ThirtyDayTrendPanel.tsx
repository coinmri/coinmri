import { ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailyTrend {
  day: string
  change: number
}

interface ThirtyDayTrendPanelProps {
  trends: DailyTrend[]
}

export default function ThirtyDayTrendPanel({ trends }: ThirtyDayTrendPanelProps) {
  if (!trends || trends.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const overallTrend = trends.reduce((sum, trend) => sum + trend.change, 0)
  const getTrendRemark = (trend: number) => {
    if (trend > 5) return "Price is surging"
    if (trend > 0) return "Price is on an upward trend"
    if (trend < -5) return "Price is in a downturn"
    if (trend < 0) return "Price is on a downward trend"
    return "Price is holding steady"
  }
  const trendRemark = getTrendRemark(overallTrend)
  const trendColor = overallTrend > 0 ? "text-green-500" : overallTrend < 0 ? "text-red-500" : "text-gray-500"

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400">30-Day Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between flex-wrap">
          {trends.map((trend, index) => (
            <div key={index} className="flex flex-col items-center mb-2" style={{ width: "10%" }}>
              <span className="text-xs text-gray-400 mb-1">{formatDate(trend.day)}</span>
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

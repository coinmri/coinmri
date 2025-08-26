import { ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DailyTrend {
  day: string
  change: number
}

interface TenDayTrendPanelProps {
  trends: DailyTrend[]
}

export default function TenDayTrendPanel({ trends }: TenDayTrendPanelProps) {
  if (!trends || trends.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400">10-Day Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          {trends.map((trend, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-sm text-gray-400 mb-1">{formatDate(trend.day)}</span>
              {trend.change >= 0 ? (
                <ArrowUp className="w-6 h-6 text-green-500" />
              ) : (
                <ArrowDown className="w-6 h-6 text-red-500" />
              )}
              <span className={`text-sm font-semibold ${trend.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Math.abs(trend.change).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

import { ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HourlyTrend {
  hour: string
  change: number
}

interface TenHourTrendPanelProps {
  trends: HourlyTrend[]
}

export default function TenHourTrendPanel({ trends }: TenHourTrendPanelProps) {
  if (!trends || trends.length === 0) {
    return null
  }

  const formatHour = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400">10-Hour Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between">
          {trends.map((trend, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-sm text-gray-400 mb-1">{formatHour(trend.hour)}</span>
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

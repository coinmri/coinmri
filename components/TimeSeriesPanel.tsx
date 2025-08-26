"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface TimeSeriesPanelProps {
  title: string
  data: any[]
  dataKey: string
  granularities?: string[]
}

export default function TimeSeriesPanel({ title, data, dataKey, granularities }: TimeSeriesPanelProps) {
  const [granularity, setGranularity] = useState(granularities ? granularities[0] : "1h")

  const formatYAxis = (value: number) => {
    if (dataKey === "price" || dataKey === "volume") {
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    }
    if (dataKey === "volatility" || dataKey === "trend") {
      return (value * 100).toFixed(2) + "%"
    }
    return value.toFixed(4)
  }

  const formatTooltipValue = (value: number) => {
    if (dataKey === "price" || dataKey === "volume") {
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
    }
    if (dataKey === "volatility" || dataKey === "trend") {
      return (value * 100).toFixed(2) + "%"
    }
    return value.toFixed(4)
  }

  const aggregateData = (data: any[], granularity: string) => {
    if (granularity === "1h" || !granularities) return data

    const aggregationMap: { [key: string]: number } = {
      "4h": 4,
      "12h": 12,
      "1d": 24,
      "7d": 168,
    }

    const hours = aggregationMap[granularity]
    const aggregatedData = []
    for (let i = 0; i < data.length; i += hours) {
      const slice = data.slice(i, i + hours)
      const aggregatedPoint = slice.reduce(
        (acc, point) => {
          acc.timestamp = point.timestamp
          acc[dataKey] += point[dataKey]
          return acc
        },
        { timestamp: "", [dataKey]: 0 },
      )
      aggregatedPoint[dataKey] /= slice.length
      aggregatedData.push(aggregatedPoint)
    }
    return aggregatedData
  }

  const aggregatedData = aggregateData(data, granularity)

  const getChartColor = () => {
    switch (dataKey) {
      case "price":
        return "#3B82F6"
      case "volume":
        return "#10B981"
      case "volatility":
        return "#F59E0B"
      case "trend":
        return "#8B5CF6"
      default:
        return "#60A5FA"
    }
  }

  return (
    <div className="h-full">
      <div className="flex justify-end items-center mb-4">
        {granularities && (
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="w-[100px] bg-gray-800/70 border-gray-700/50 text-gray-200">
              <SelectValue placeholder="Granularity" />
            </SelectTrigger>
            <SelectContent>
              {granularities.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={aggregatedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
            stroke="#718096"
          />
          <YAxis tickFormatter={formatYAxis} stroke="#718096" />
          <Tooltip
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value: number) => [formatTooltipValue(value), title.split(" ")[1]]}
            contentStyle={{ backgroundColor: "#1A202C", border: "none", borderRadius: "0.375rem" }}
            itemStyle={{ color: "#E2E8F0" }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={getChartColor()}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { TableHeader } from "@/components/ui/table"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OHLCData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
}

interface CorrelationData {
  coin: string
  correlation: string
  sameDirectionPercentage: string
  latestPrice: number
  latestChange: number
  totalDays?: number
  sameDirectionDays?: number
  oppositeDirectionDays?: number
  error?: string
}

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

export function PriceCorrelationPanel({ symbol }: { symbol: string }) {
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/price-correlation?coin=${symbol}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setCorrelationData(data)
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err)
      setError(`Failed to load data for ${symbol}: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [symbol])

  const retryFetch = () => {
    fetchData()
  }

  const interpretCorrelation = (correlation: number) => {
    if (correlation > 0.7) return "Strong positive"
    if (correlation > 0.3) return "Moderate positive"
    if (correlation > -0.3) return "Weak or no clear"
    if (correlation > -0.7) return "Moderate negative"
    return "Strong negative"
  }

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-blue-400">
          Price Correlation with Bitcoin (Last 90 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center text-red-500 p-4 mb-4">
            <p>{error}</p>
            <Button onClick={retryFetch} className="mt-4">
              Retry
            </Button>
          </div>
        )}
        {loading ? (
          <div className="text-center text-blue-500 mt-4">
            <Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />
            Fetching correlation data...
          </div>
        ) : correlationData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-300">Metric</TableHead>
                <TableHead className="text-blue-300">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-gray-200">Correlation (90 days)</TableCell>
                <TableCell className="text-gray-200">{correlationData.correlation}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-200">Same Direction %</TableCell>
                <TableCell className="text-gray-200">{correlationData.sameDirectionPercentage}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-200">Total Days</TableCell>
                <TableCell className="text-gray-200">{correlationData.totalDays}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-200">Same Direction Days</TableCell>
                <TableCell className="text-gray-200">{correlationData.sameDirectionDays}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-gray-200">Opposite Direction Days</TableCell>
                <TableCell className="text-gray-200">{correlationData.oppositeDirectionDays}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-gray-400">No correlation data available.</p>
        )}
        <p className="mt-4 text-sm text-gray-400">
          Note: Correlation ranges from -1 to 1, where 1 indicates perfect positive correlation, -1 indicates perfect
          negative correlation, and 0 indicates no correlation. Data shown is for the last 90 days.
        </p>
      </CardContent>
    </Card>
  )
}

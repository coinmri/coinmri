"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ArbitrageOpportunity {
  coin: string
  minPrice: number
  maxPrice: number
  minExchange: string
  maxExchange: string
  percentageDifference: number
}

interface ArbitrageData {
  createdAt: string
  name: string
  avatar: string
  id: string
  timestamp: string
  arbitrageOpportunities: ArbitrageOpportunity[]
}

export default function CoinList() {
  const [rankings, setRankings] = useState<ArbitrageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    })
  }

  const fetchRankings = async () => {
    try {
      const response = await fetch("/api/rankings")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setRankings(data)
      // Store arbitrage data in localStorage
      if (data && data.arbitrageOpportunities) {
        localStorage.setItem("arbitrageData", JSON.stringify(data.arbitrageOpportunities))
      }
    } catch (error) {
      console.error("Error fetching rankings:", error)
      setError("Failed to fetch rankings. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRankings()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (
    !rankings ||
    !rankings.arbitrageOpportunities ||
    rankings.arbitrageOpportunities.filter((item) => item.percentageDifference >= 1 && item.percentageDifference <= 100)
      .length === 0
  ) {
    return (
      <div className="text-center">
        <p className="text-gray-400">No arbitrage opportunities between 1% and 100% available at the moment.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">Last updated: {formatTimestamp(rankings.timestamp)}</p>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-blue-300 font-semibold">Coin</TableHead>
              <TableHead className="text-right text-blue-300 font-semibold">Min Price</TableHead>
              <TableHead className="text-right text-blue-300 font-semibold">Max Price</TableHead>
              <TableHead className="text-blue-300 font-semibold">Min Exchange</TableHead>
              <TableHead className="text-blue-300 font-semibold">Max Exchange</TableHead>
              <TableHead className="text-right text-blue-300 font-semibold">Arbitrage %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.arbitrageOpportunities
              .filter((item) => item.percentageDifference >= 1 && item.percentageDifference <= 100)
              .map((item, index) => (
                <TableRow key={`${item.coin}-${index}`} className="hover:bg-gray-800/50">
                  <TableCell className="font-medium text-white">
                    <Link
                      href={`/coin/${item.coin.toLowerCase()}`}
                      className="text-white hover:text-blue-300 transition-colors"
                    >
                      {item.coin}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right text-white">${item.minPrice.toFixed(6)}</TableCell>
                  <TableCell className="text-right text-white">${item.maxPrice.toFixed(6)}</TableCell>
                  <TableCell className="text-white">{item.minExchange}</TableCell>
                  <TableCell className="text-white">{item.maxExchange}</TableCell>
                  <TableCell className="text-right text-white">{item.percentageDifference.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

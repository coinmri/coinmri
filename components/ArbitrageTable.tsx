"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Loading from "@/components/Loading"

interface ArbitrageData {
  id: string
  symbol: string
  binance: number
  coinbase: number
  kraken: number
  kucoin: number
  difference: number
}

export function ArbitrageTable() {
  const [data, setData] = useState<ArbitrageData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://676a8ed1863eaa5ac0ded5f0.mockapi.io/arb/arb")
        const jsonData = await res.json()
        setData(jsonData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) return <Loading />

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-purple-400">Symbol</TableHead>
            <TableHead className="text-right text-purple-400">Binance</TableHead>
            <TableHead className="text-right text-purple-400">Coinbase</TableHead>
            <TableHead className="text-right text-purple-400">Kraken</TableHead>
            <TableHead className="text-right text-purple-400">KuCoin</TableHead>
            <TableHead className="text-right text-purple-400">Difference (%)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.symbol}</TableCell>
              <TableCell className="text-right">${row.binance?.toFixed(2) ?? "0.00"}</TableCell>
              <TableCell className="text-right">${row.coinbase?.toFixed(2) ?? "0.00"}</TableCell>
              <TableCell className="text-right">${row.kraken?.toFixed(2) ?? "0.00"}</TableCell>
              <TableCell className="text-right">${row.kucoin?.toFixed(2) ?? "0.00"}</TableCell>
              <TableCell
                className={`text-right font-bold ${Number(row.difference) > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {row.difference?.toFixed(2) ?? "0.00"}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

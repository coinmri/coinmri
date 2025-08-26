"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import TimeSeriesPanel from "@/components/TimeSeriesPanel"
import ExchangesPanel from "@/components/ExchangesPanel"
import ArbitragePanel from "@/components/ArbitragePanel"
import VolumeAnalysisPanel from "@/components/VolumeAnalysisPanel"
import { fetchCoinGeckoData, fetchExchangeData } from "@/lib/coingeckoApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import { InfoIcon } from "@/components/InfoIcon"
import { ArbitrageDetailsPanel } from "./ArbitrageDetailsPanel"
import WeeklyTrendPanel from "@/components/WeeklyTrendPanel"
import ThirtyDayTrendPanel from "@/components/ThirtyDayTrendPanel"
import TwentyFourHourTrendPanel from "@/components/TwentyFourHourTrendPanel"
import { RateLimitMessage } from "@/components/RateLimitMessage"
import { MarketAnalysisPanel } from "./MarketAnalysisPanel"

interface ArbitrageOpportunity {
  coin: string
  minPrice: number
  maxPrice: number
  minExchange: string
  maxExchange: string
  percentageDifference: number
}

export default function CoinDetailContent({ symbol }: { symbol: string }) {
  const router = useRouter()

  const [data, setData] = useState<any[]>([])
  const [usdtExchangeData, setUsdtExchangeData] = useState<any[]>([])
  const [usdExchangeData, setUsdExchangeData] = useState<any[]>([])
  const [arbitrage, setArbitrage] = useState<number | null>(null)
  const [vwap, setVWAP] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [arbitrageDetails, setArbitrageDetails] = useState<ArbitrageOpportunity | null>(null)
  const [weeklyTrends, setWeeklyTrends] = useState<{ day: string; change: number }[]>([])
  const [thirtyDayTrends, setThirtyDayTrends] = useState<{ day: string; change: number }[]>([])
  const [twentyFourHourTrends, setTwentyFourHourTrends] = useState<{ hour: string; change: number }[]>([])
  const [isRateLimited, setIsRateLimited] = useState(false)

  const granularities = ["1h", "4h", "12h", "1d", "7d"]

  const fetchArbitrageFromCEXs = useCallback(() => {
    const arbitrageData = localStorage.getItem("arbitrageData")
    if (arbitrageData) {
      const opportunities: ArbitrageOpportunity[] = JSON.parse(arbitrageData)
      const coinOpportunity = opportunities.find((op) => op.coin.toLowerCase() === symbol.toLowerCase())
      if (coinOpportunity) {
        setArbitrage(coinOpportunity.percentageDifference)
        setArbitrageDetails(coinOpportunity)
        return true
      }
    }
    return false
  }, [symbol])

  const fetchData = useCallback(
    async (coinSymbol: string) => {
      setLoading(true)
      setError(null)
      setIsRateLimited(false)
      try {
        const arbitrageFound = fetchArbitrageFromCEXs()

        const cachedData = localStorage.getItem(`${coinSymbol}-usd`)
        const cachedUsdtExchangeData = localStorage.getItem(`${coinSymbol}-usdt-exchanges`)
        const cachedUsdExchangeData = localStorage.getItem(`${coinSymbol}-usd-exchanges`)
        const cachedVWAP = localStorage.getItem(`${coinSymbol}-vwap`)
        const cachedTimestamp = localStorage.getItem(`${coinSymbol}-timestamp`)

        if (cachedData && cachedUsdtExchangeData && cachedUsdExchangeData && cachedVWAP && cachedTimestamp) {
          const parsedData = JSON.parse(cachedData)
          const parsedUsdtExchangeData = JSON.parse(cachedUsdtExchangeData)
          const parsedUsdExchangeData = JSON.parse(cachedUsdExchangeData)
          const parsedVWAP = Number.parseFloat(cachedVWAP)
          const timestamp = Number.parseInt(cachedTimestamp)

          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setData(parsedData)
            setUsdtExchangeData(parsedUsdtExchangeData)
            setUsdExchangeData(parsedUsdExchangeData)
            setVWAP(parsedVWAP)
            setLoading(false)
            return
          }
        }

        const [
          { processedData, vwap: cgVwap, thirtyDayTrends, twentyFourHourTrends },
          { usdtExchanges, usdExchanges, vwap: exVwap },
        ] = await Promise.all([fetchCoinGeckoData(coinSymbol), fetchExchangeData(coinSymbol)])

        if (!processedData || processedData.length === 0) {
          throw new Error("No data available for the specified symbol.")
        }

        setData(processedData)
        setUsdtExchangeData(usdtExchanges)
        setUsdExchangeData(usdExchanges)
        setVWAP(exVwap)
        setThirtyDayTrends(thirtyDayTrends)
        setTwentyFourHourTrends(twentyFourHourTrends)

        if (!arbitrageFound) {
          const calculatedArbitrage =
            ((Math.max(...usdtExchanges.map((e) => e.price), ...usdExchanges.map((e) => e.price)) -
              Math.min(...usdtExchanges.map((e) => e.price), ...usdExchanges.map((e) => e.price))) /
              exVwap) *
            100
          setArbitrage(calculatedArbitrage)
        }

        localStorage.setItem(`${coinSymbol}-usd`, JSON.stringify(processedData))
        localStorage.setItem(`${coinSymbol}-usdt-exchanges`, JSON.stringify(usdtExchanges))
        localStorage.setItem(`${coinSymbol}-usd-exchanges`, JSON.stringify(usdExchanges))
        localStorage.setItem(`${coinSymbol}-vwap`, exVwap.toString())
        localStorage.setItem(`${coinSymbol}-timestamp`, Date.now().toString())
      } catch (err) {
        console.error("Error fetching data:", err)
        if (err instanceof Error) {
          if (err.message.includes("429")) {
            setIsRateLimited(true)
          } else {
            setError("Error fetching data: {}")
          }
        } else {
          setError("Error fetching data: {}")
        }
      } finally {
        setLoading(false)
      }
    },
    [fetchArbitrageFromCEXs],
  )

  useEffect(() => {
    fetchData(symbol)
  }, [symbol, fetchData])

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0
  const currentVolatility = data.length > 0 ? data[data.length - 1].volatility : 0

  if (isRateLimited) {
    return (
      <>
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rankings
          </Button>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 ml-4">
            {symbol.toUpperCase()} Analytics
          </h2>
        </div>
        <RateLimitMessage />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rankings
        </Button>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 ml-4">
          {symbol.toUpperCase()} Analytics
        </h2>
      </div>
      {loading && (
        <div className="flex items-center justify-center mt-16">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      )}
      {error && (
        <div className="text-center mt-8">
          <p className="text-xl text-green-400 bg-green-950/30 p-4 rounded-lg">
            We allow only a few calls per minute with the free version. Please try again after a few minutes.
          </p>
          <Button onClick={() => fetchData(symbol)} className="mt-6">
            Try Again
          </Button>
        </div>
      )}
      {!loading && !error && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ThirtyDayTrendPanel trends={thirtyDayTrends} />
            <TwentyFourHourTrendPanel trends={twentyFourHourTrends} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-blue-400">Price Chart</CardTitle>
                <InfoIcon content="Displays hourly price data for the selected cryptocurrency. Data is fetched from CoinGecko API." />
              </CardHeader>
              <CardContent>
                <TimeSeriesPanel title="Hourly Price" data={data} dataKey="price" granularities={granularities} />
              </CardContent>
            </Card>
            <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-green-400">Volume Chart</CardTitle>
                <InfoIcon content="Displays hourly volume data for the selected cryptocurrency. Data is fetched from CoinGecko API." />
              </CardHeader>
              <CardContent>
                <TimeSeriesPanel title="Hourly Volume" data={data} dataKey="volume" granularities={granularities} />
              </CardContent>
            </Card>
            <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-yellow-400">Volatility Chart</CardTitle>
                <InfoIcon content="Displays hourly volatility data for the selected cryptocurrency. Data is fetched from CoinGecko API." />
              </CardHeader>
              <CardContent>
                <TimeSeriesPanel
                  title="Hourly Volatility"
                  data={data}
                  dataKey="volatility"
                  granularities={granularities}
                />
              </CardContent>
            </Card>
            <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold text-purple-400">24hr Price Change</CardTitle>
                <InfoIcon content="Displays the 24-hour price change for the selected cryptocurrency. Data is fetched from CoinGecko API." />
              </CardHeader>
              <CardContent>
                <TimeSeriesPanel title="24hr Price Change" data={data} dataKey="trend" />
              </CardContent>
            </Card>
            <ArbitragePanel arbitrage={arbitrage} />
            <VolumeAnalysisPanel
              currentPrice={currentPrice}
              vwap={vwap}
              volatility={currentVolatility}
              arbitrage={arbitrage || 0}
            />
          </div>

          {/* Market Analysis Panel */}
          <MarketAnalysisPanel
            currentPrice={currentPrice}
            historicalPrices={data.map((d) => d.price)}
            volume={data.length > 0 ? data[data.length - 1].volume : 0}
            marketCap={data.length > 0 ? data[data.length - 1].volume * currentPrice : 0}
            manualAnalysis={undefined} // This will be populated when manual analysis is complete
          />

          {/* Weekly Trend Panel */}
          <WeeklyTrendPanel trends={weeklyTrends} />

          {/* Exchange Data Table */}
          <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-blue-300">
                Exchange Data for {symbol.toUpperCase()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExchangesPanel usdtData={usdtExchangeData} usdData={usdExchangeData} symbol={symbol} />
            </CardContent>
          </Card>

          {arbitrageDetails && (
            <ArbitrageDetailsPanel
              minPrice={arbitrageDetails.minPrice}
              maxPrice={arbitrageDetails.maxPrice}
              minExchange={arbitrageDetails.minExchange}
              maxExchange={arbitrageDetails.maxExchange}
              percentageDifference={arbitrageDetails.percentageDifference}
            />
          )}
        </div>
      )}
    </>
  )
}

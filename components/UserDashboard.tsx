"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { getUserRequests } from "@/lib/contractService"

interface AnalysisRequest {
  symbol: string
  timestamp: number
  txHash: string
  paymentMethod: string
  completed: boolean
  resultHash: string
  payment?: {
    status: string
  }
}

interface AnalysisResult {
  symbol: string
  timestamp: number
  status: string
  data: {
    price: number
    volume: number
    marketCap: number
    priceChange24h: number
    technicalIndicators: {
      rsi: number
      macd: number
      ema: number
    }
    sentiment: {
      overall: string
      score: number
    }
    prediction: {
      direction: string
      confidence: number
    }
  }
}

export function UserDashboard({ address }: { address: string }) {
  const [requests, setRequests] = useState<AnalysisRequest[]>([])
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingResult, setIsLoadingResult] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (address) {
      loadUserData()
    }
  }, [address])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      if (address) {
        const requests = await getUserRequests(address)
        setRequests(requests)

        if (requests.length === 0) {
          // Show a message when no requests are found
          toast({
            title: "No Requests Found",
            description: "You haven't made any analysis requests yet.",
          })
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Error",
        description: "Failed to load analysis requests. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalysisResult = async (resultHash: string) => {
    setIsLoadingResult(true)
    try {
      // In a real implementation, this would fetch from a backend API
      // For now, we'll simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockResult: AnalysisResult = {
        symbol: "BTC",
        timestamp: Date.now(),
        status: "processing",
        data: {
          price: 65432.1,
          volume: 24500000000,
          marketCap: 1250000000000,
          priceChange24h: 2.35,
          technicalIndicators: {
            rsi: 58.42,
            macd: 125.36,
            ema: 64980.25,
          },
          sentiment: {
            overall: "Bullish",
            score: 0.78,
          },
          prediction: {
            direction: "Upward",
            confidence: 0.82,
          },
        },
      }

      setSelectedResult(mockResult)
    } catch (error) {
      console.error("Error fetching analysis result:", error)
      toast({
        title: "Error",
        description: "Failed to fetch analysis result. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingResult(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const renderAnalysisResult = (result: AnalysisResult) => {
    if (result.status === "processing") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2 text-blue-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Analysis in progress... This typically takes 1-2 minutes.</p>
          </div>
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <h4 className="text-blue-400 font-semibold mb-2">Request Details</h4>
            <p className="text-white">Symbol: {result.symbol.toUpperCase()}</p>
            <p className="text-white">Requested: {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <h4 className="text-blue-400 font-semibold mb-2">Market Data</h4>
            <p className="text-white">Price: ${result.data.price.toLocaleString()}</p>
            <p className="text-white">Volume: ${result.data.volume.toLocaleString()}</p>
            <p className="text-white">Market Cap: ${result.data.marketCap.toLocaleString()}</p>
            <p className={result.data.priceChange24h >= 0 ? "text-green-400" : "text-red-400"}>
              24h Change: {result.data.priceChange24h.toFixed(2)}%
            </p>
          </div>
          <div className="bg-purple-900/30 p-4 rounded-lg">
            <h4 className="text-purple-400 font-semibold mb-2">Technical Indicators</h4>
            <p className="text-white">RSI: {result.data.technicalIndicators.rsi.toFixed(2)}</p>
            <p className="text-white">MACD: {result.data.technicalIndicators.macd.toFixed(2)}</p>
            <p className="text-white">EMA: {result.data.technicalIndicators.ema.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-green-900/30 p-4 rounded-lg">
          <h4 className="text-green-400 font-semibold mb-2">Analysis & Prediction</h4>
          <p className="text-white">Sentiment: {result.data.sentiment.overall}</p>
          <p className="text-white">Sentiment Score: {result.data.sentiment.score.toFixed(2)}</p>
          <p className="text-white">Predicted Direction: {result.data.prediction.direction}</p>
          <p className="text-white">Confidence: {(result.data.prediction.confidence * 100).toFixed(2)}%</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!selectedResult || selectedResult.status !== "processing") return

    const checkStatus = async () => {
      try {
        // Simulate checking status
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const updatedResult = { ...selectedResult, status: "completed" }
        setSelectedResult(updatedResult)
      } catch (error) {
        console.error("Error checking analysis status:", error)
      }
    }

    const interval = setInterval(checkStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [selectedResult])

  const getRequests = (address: string) => {
    const requestsJSON = localStorage.getItem(`requests-${address.toLowerCase()}`)
    return requestsJSON ? JSON.parse(requestsJSON) : []
  }

  const checkAnalysisStatus = async (result: any) => {
    // Simulate API call to check analysis status
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return { ...result, status: "completed" }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-900/70 to-purple-900/70 border-blue-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Your Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-blue-800/30">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-300">Total Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{requests.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-800/30">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-300">Completed Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{requests.filter((req) => req.completed).length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

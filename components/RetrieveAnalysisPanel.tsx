"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Search, ExternalLink, History } from "lucide-react"
import { ARBITRUM_EXPLORER } from "@/lib/web3Config"
import { checkAnalysisStatus } from "@/lib/requestStorage"
import { getRequests } from "@/lib/requestStorage"
import { getRequestByTxHash, getUserRequests } from "@/lib/contractService"

interface AnalysisRequest {
  symbol: string
  timestamp: number
  txHash: string
  paymentMethod: string
  completed: boolean
  resultHash: string
  id: string
  amount: string
  userAddress: string
  payment?: {
    status: "pending" | "confirmed" | "failed"
  }
}

interface AnalysisResult {
  symbol: string
  timestamp: number
  status: "processing" | "completed" | "failed"
  data?: {
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
  error?: string
}

export function RetrieveAnalysisPanel() {
  const [txHash, setTxHash] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisRequest[]>([])
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)
  const [isLoadingResult, setIsLoadingResult] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadHistory = async () => {
      if (typeof window !== "undefined") {
        try {
          const address = localStorage.getItem("connectedAddress")
          if (address) {
            const requests = await getUserRequests(address)
            setAnalysisHistory(requests)
          }
        } catch (error) {
          console.error("Error loading analysis history:", error)
        }
      }
    }

    loadHistory()
  }, [])

  const fetchAnalysisResult = async (resultHash: string, request: AnalysisRequest) => {
    setIsLoadingResult(true)
    try {
      const result = await checkAnalysisStatus(request)
      setSelectedResult(result)
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

  const retrieveAnalysis = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (!txHash.trim()) {
        throw new Error("Please enter a valid transaction hash")
      }

      // Get request details from the contract
      const request = await getRequestByTxHash(txHash)

      if (!request.completed) {
        throw new Error("Analysis not completed yet. Please check back later.")
      }

      await fetchAnalysisResult(request.resultHash || request.txHash, request)
    } catch (error) {
      console.error("Error retrieving analysis:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retrieve analysis",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

    if (result.status === "failed") {
      return (
        <div className="bg-red-900/30 p-4 rounded-lg">
          <h4 className="text-red-400 font-semibold mb-2">Analysis Failed</h4>
          <p className="text-white">{result.error || "An unknown error occurred"}</p>
        </div>
      )
    }

    if (!result.data) {
      return (
        <div className="bg-yellow-900/30 p-4 rounded-lg">
          <h4 className="text-yellow-400 font-semibold mb-2">No Data Available</h4>
          <p className="text-white">The analysis completed but no data was returned.</p>
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
        const result = await checkAnalysisStatus(selectedResult)

        if (result.status !== "processing") {
          setSelectedResult(result)
          // Update in storage
          const address = localStorage.getItem("connectedAddress")
          if (address) {
            const requests = getRequests(address)
            const updatedRequests = requests.map((req) => (req.id === selectedResult.id ? { ...req, result } : req))
            localStorage.setItem(`requests-${address.toLowerCase()}`, JSON.stringify(updatedRequests))
          }
        }
      } catch (error) {
        console.error("Error checking analysis status:", error)
      }
    }

    const interval = setInterval(checkStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [selectedResult])

  return (
    <Card className="bg-gradient-to-r from-purple-900/70 to-blue-900/70 border-purple-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="h-6 w-6" />
          Retrieve Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <form onSubmit={retrieveAnalysis} className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter transaction hash"
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !txHash} className="bg-purple-600 hover:bg-purple-700">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Retrieve
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Analysis History
            </h3>
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-white/5">
                    <TableHead className="text-purple-300">Symbol</TableHead>
                    <TableHead className="text-purple-300">Date</TableHead>
                    <TableHead className="text-purple-300">Payment</TableHead>
                    <TableHead className="text-purple-300">Payment Status</TableHead>
                    <TableHead className="text-purple-300">Status</TableHead>
                    <TableHead className="text-purple-300">Transaction</TableHead>
                    <TableHead className="text-purple-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisHistory.map((request, index) => (
                    <TableRow key={index} className="hover:bg-white/5">
                      <TableCell className="font-medium text-white">{request.symbol.toUpperCase()}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(request.timestamp)}</TableCell>
                      <TableCell className="text-gray-300">{request.paymentMethod}</TableCell>
                      <TableCell>
                        <span
                          className={
                            request.payment?.status === "confirmed"
                              ? "text-green-400"
                              : request.payment?.status === "failed"
                                ? "text-red-400"
                                : "text-yellow-400"
                          }
                        >
                          {request.payment?.status === "confirmed"
                            ? "Confirmed"
                            : request.payment?.status === "failed"
                              ? "Failed"
                              : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={request.completed ? "text-green-400" : "text-yellow-400"}>
                          {request.completed ? "Completed" : "Processing"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`${ARBITRUM_EXPLORER}/tx/${request.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          View
                        </a>
                      </TableCell>
                      <TableCell>
                        {request.completed ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                onClick={() => fetchAnalysisResult(request.resultHash || request.txHash, request)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Result
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-gray-800">
                              <DialogHeader>
                                <DialogTitle className="text-xl text-white">
                                  Analysis Result for {request.symbol.toUpperCase()}
                                </DialogTitle>
                              </DialogHeader>
                              {isLoadingResult ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                                </div>
                              ) : (
                                selectedResult && renderAnalysisResult(selectedResult)
                              )}
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button disabled className="bg-gray-700 hover:bg-gray-700 cursor-not-allowed">
                            Pending
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {analysisHistory.length === 0 && (
                <div className="text-center py-8 text-gray-400">No analysis requests found</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

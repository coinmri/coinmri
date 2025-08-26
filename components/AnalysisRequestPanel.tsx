"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle, Coins } from "lucide-react"
import { requestAnalysis } from "@/lib/contractService"
import { saveRequest } from "@/lib/contractService"
import { InsufficientTokensDialog } from "./InsufficientTokensDialog"
import { ArbitrumNetworkBadge } from "./ArbitrumNetworkBadge"
import { getAnalysisPrice } from "@/lib/contractService"

export function AnalysisRequestPanel({ userAddress }: { userAddress: string }) {
  const [symbol, setSymbol] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false)
  const [analysisPrice, setAnalysisPrice] = useState<string>("0.003") // Updated default price
  const [isPriceFetching, setIsPriceFetching] = useState(false)
  const { toast } = useToast()

  // Fetch the current price for analysis when the component mounts
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsPriceFetching(true)
        console.log("Fetching analysis price...")
        const price = await getAnalysisPrice()
        console.log("Fetched price:", price)
        setAnalysisPrice(price)
      } catch (error) {
        console.error("Error fetching analysis price:", error)
        // Keep the default price if there's an error
      } finally {
        setIsPriceFetching(false)
      }
    }

    if (typeof window !== "undefined") {
      fetchPrice()
    }
  }, [])

  const handleRequestAnalysis = async () => {
    if (!symbol) {
      toast({
        title: "Error",
        description: "Please enter a cryptocurrency symbol",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      // Request analysis using the contract service
      const result = await requestAnalysis(symbol, "ETH", analysisPrice)

      // Save the request to local storage
      saveRequest(userAddress, {
        symbol: symbol.toUpperCase(),
        timestamp: Date.now(),
        txHash: result.txHash,
        paymentMethod: "ETH",
        amount: analysisPrice,
        completed: false,
        resultHash: "",
        userAddress,
      })

      setTxHash(result.txHash)

      toast({
        title: "Success",
        description: `Analysis request for ${symbol.toUpperCase()} has been submitted.`,
      })

      // Reset form
      setSymbol("")
    } catch (error) {
      console.error("Error requesting analysis:", error)

      // Check if this is an insufficient tokens error
      if (error instanceof Error && error.message.includes("insufficient")) {
        setShowInsufficientTokens(true)
      } else {
        setError(error instanceof Error ? error.message : "Failed to request analysis. Please try again.")

        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to request analysis. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-r from-blue-950 to-black border-blue-900/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="h-6 w-6 text-yellow-400" />
          Request Crypto Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ArbitrumNetworkBadge />

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="symbol" className="text-sm text-gray-300">
              Cryptocurrency Symbol
            </label>
            <Input
              id="symbol"
              placeholder="Enter cryptocurrency symbol (e.g., BTC, ETH)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-blue-950/50 border-blue-900/30 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="payment-amount" className="text-sm text-gray-300">
              Payment Amount
            </label>
            <div className="bg-blue-950/50 border border-blue-900/30 rounded-md p-3">
              <p className="text-white font-medium">
                5 USD pay with ETH ~ {isPriceFetching ? "Loading..." : `${analysisPrice} ETH`} on Arbitrum
              </p>
            </div>
          </div>

          <Button
            onClick={handleRequestAnalysis}
            disabled={isLoading || !symbol}
            className="w-full bg-blue-950 hover:bg-blue-900"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Request Analysis"
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {txHash && (
          <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
            <p className="text-sm text-green-400 mb-1">Analysis request submitted successfully!</p>
            <p className="text-xs text-gray-300">
              Transaction Hash:{" "}
              <span className="text-gray-300">
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </span>
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Check the "Analysis Requests" section to view your request status.
            </p>
          </div>
        )}
      </CardContent>

      <InsufficientTokensDialog
        open={showInsufficientTokens}
        onOpenChange={setShowInsufficientTokens}
        onSuccess={() => setShowInsufficientTokens(false)}
      />
    </Card>
  )
}

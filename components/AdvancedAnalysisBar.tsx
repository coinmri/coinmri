"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, ArrowRight } from "lucide-react"
import { ArbitrumNetworkBadge } from "./ArbitrumNetworkBadge"

type PaymentMethod = "ETH" | "ARB" | "USDC" | "USDT"

export function AdvancedAnalysisBar() {
  const [coinSymbol, setCoinSymbol] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("USDC")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const requestAnalysis = async () => {
    setIsLoading(true)
    try {
      // Simulating an API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Analysis Requested",
        description: `Analysis for ${coinSymbol.toUpperCase()} has been requested.`,
      })

      setCoinSymbol("")
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to request analysis. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-r from-blue-900/70 to-purple-900/70 border-blue-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Professional Crypto Analysis
        </CardTitle>
        <CardDescription className="text-gray-300">Get instant metrics + expert review within hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-950/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Fixed Price: 5 USDC</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <p className="font-semibold mb-1">Instant Analysis:</p>
              <ul className="space-y-1">
                <li>• Price Status</li>
                <li>• Volume Analysis</li>
                <li>• Market Metrics</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">Expert Review:</p>
              <ul className="space-y-1">
                <li>• Community Score</li>
                <li>• Whitepaper Analysis</li>
                <li>• Team Assessment</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Enter coin symbol (e.g., BTC)"
              value={coinSymbol}
              onChange={(e) => setCoinSymbol(e.target.value)}
              className="flex-1"
            />
            <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Pay with" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="ARB">ARB</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={requestAnalysis}
            disabled={isLoading || !coinSymbol}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              "Processing..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                Request Analysis
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <ArbitrumNetworkBadge />
          <span className="text-xs text-gray-400">Pay with any token on Arbitrum</span>
        </div>
      </CardContent>
    </Card>
  )
}

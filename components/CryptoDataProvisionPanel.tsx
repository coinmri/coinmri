"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Database, Copy, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function CryptoDataProvisionPanel() {
  const [symbol, setSymbol] = useState("")
  const [requirements, setRequirements] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [followUpLink, setFollowUpLink] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!symbol.trim() || !requirements.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both the cryptocurrency symbol and data requirements.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate request submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate a unique request ID
    const requestId = `data-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Create follow-up link
    const link = `${window.location.origin}/data-request/${requestId}`
    setFollowUpLink(link)

    // Store request in localStorage
    const existingRequests = JSON.parse(localStorage.getItem("dataRequests") || "[]")
    existingRequests.push({
      id: requestId,
      symbol: symbol.toUpperCase(),
      requirements,
      status: "pending",
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem("dataRequests", JSON.stringify(existingRequests))

    toast({
      title: "Request Submitted Successfully! 🎉",
      description: "Your data collection request has been received. Use the link below to track your request.",
    })

    setIsSubmitting(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(followUpLink)
    setCopied(true)
    toast({
      title: "Link Copied!",
      description: "Follow-up link has been copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setSymbol("")
    setRequirements("")
    setFollowUpLink("")
    setCopied(false)
  }

  return (
    <Card className="bg-gradient-to-r from-green-950/70 to-blue-950/70 border-green-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-400">
          <Database className="h-6 w-6" />
          Request Crypto Data Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!followUpLink ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">
                Cryptocurrency Symbol *
              </label>
              <Input
                id="symbol"
                type="text"
                placeholder="e.g., BTC, ETH, SOL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-gray-900/50 border-green-800/50 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-300 mb-2">
                Data Requirements *
              </label>
              <Textarea
                id="requirements"
                placeholder="Describe the specific data you need (e.g., trading data from Binance, Coinbase, and Kraken for the last 30 days, order book snapshots every 5 minutes, historical price data)"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                className="bg-gray-900/50 border-green-800/50 text-white placeholder:text-gray-500 min-h-[120px]"
                required
              />
            </div>

            <div className="bg-green-900/30 p-4 rounded-lg">
              <h4 className="text-green-400 font-semibold mb-2">Available Data Sources</h4>
              <p className="text-sm text-gray-300 mb-2">
                We collect data from all major centralized exchanges including:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-400">
                <span>• Binance</span>
                <span>• Coinbase</span>
                <span>• Kraken</span>
                <span>• Bybit</span>
                <span>• OKX</span>
                <span>• KuCoin</span>
                <span>• Gate.io</span>
                <span>• Bitfinex</span>
                <span>• Huobi</span>
                <span>• And more...</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-400">Free data collection service</p>
              <Button type="submit" disabled={isSubmitting} className="bg-green-700 hover:bg-green-600 text-white px-8">
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-900/30 p-6 rounded-lg text-center">
              <div className="text-green-400 text-5xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-green-400 mb-2">Request Submitted Successfully!</h3>
              <p className="text-gray-300 mb-4">
                Your data collection request for{" "}
                <span className="font-semibold text-white">{symbol.toUpperCase()}</span> has been received.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Follow-up Link</label>
              <div className="flex gap-2">
                <Input value={followUpLink} readOnly className="bg-gray-900/50 border-green-800/50 text-white flex-1" />
                <Button
                  onClick={copyToClipboard}
                  className="bg-green-700 hover:bg-green-600 text-white"
                  variant="outline"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Bookmark this link to check the status of your request and download the data when ready.
              </p>
            </div>

            <div className="bg-blue-900/30 p-4 rounded-lg">
              <h4 className="text-blue-400 font-semibold mb-2">What's Next?</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Your request is now in the queue</li>
                <li>• Data collection will begin shortly</li>
                <li>• Check your follow-up link for status updates</li>
                <li>• Download will be available when collection is complete</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-green-800/50 text-green-400 bg-transparent"
              >
                Submit Another Request
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

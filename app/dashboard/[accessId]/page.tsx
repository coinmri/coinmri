"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, FileText, BarChart3, TrendingUp } from "lucide-react"

// Arbitrum network configuration
const ARBITRUM_CHAIN_ID = "0xa4b1" // 42161 in hex

// Add a function to verify transaction access on Arbitrum
async function verifyTransactionAccess(
  requesterAddress: string,
  accessId: string,
): Promise<{
  isValid: boolean
  symbol?: string
  isArbitrum?: boolean
}> {
  try {
    // In a production environment, this would call a server API to verify
    // For now, we'll check localStorage and simulate verification

    // First check if this is a valid link from localStorage
    const storedLinks = JSON.parse(localStorage.getItem("dashboardLinks") || "{}")
    const linkEntry = Object.entries(storedLinks).find(([address, linkData]) => {
      const link = typeof linkData === "string" ? linkData : (linkData as any).link
      return address.toLowerCase() === requesterAddress.toLowerCase() && link.includes(accessId)
    })

    if (linkEntry) {
      const linkData = linkEntry[1]
      const symbol = typeof linkData === "string" ? undefined : (linkData as any).symbol
      return { isValid: true, symbol }
    }

    // If not found in localStorage, check for transactions
    // This would be a server API call in production
    const storedTransactions = JSON.parse(localStorage.getItem("adminTransactions") || "[]")
    const transaction = storedTransactions.find(
      (tx: any) => tx.address.toLowerCase() === requesterAddress.toLowerCase() && tx.link.includes(accessId),
    )

    if (transaction) {
      return {
        isValid: true,
        symbol: transaction.symbol,
        isArbitrum: true,
      }
    }

    return { isValid: false }
  } catch (error) {
    console.error("Error verifying transaction access:", error)
    return { isValid: false }
  }
}

export default function AccessDashboard({ params }: { params: { accessId: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isValidAccess, setIsValidAccess] = useState(false)
  const [requesterAddress, setRequesterAddress] = useState<string | null>(null)
  const [cryptoSymbol, setCryptoSymbol] = useState<string | null>(null)
  const [transactionVerified, setTransactionVerified] = useState(false)
  const [isArbitrumTransaction, setIsArbitrumTransaction] = useState(false)

  useEffect(() => {
    // Verify the access link
    const accessId = params.accessId
    const forAddress = searchParams.get("for")
    const urlSymbol = searchParams.get("symbol")

    if (!accessId || !forAddress) {
      setIsValidAccess(false)
      setIsLoading(false)
      return
    }

    async function verifyAccess() {
      // Check verification
      const verification = await verifyTransactionAccess(forAddress, accessId)

      setIsValidAccess(verification.isValid)
      setTransactionVerified(verification.isArbitrum || false)
      setIsArbitrumTransaction(verification.isArbitrum || false)
      setRequesterAddress(forAddress)

      // Set the symbol from verification or URL
      setCryptoSymbol(verification.symbol || urlSymbol)

      setIsLoading(false)
    }

    verifyAccess()
  }, [params.accessId, searchParams])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-300">Verifying access...</p>
        </div>
      </main>
    )
  }

  if (!isValidAccess) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="bg-red-900/20 border-red-800/50 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-red-400">Invalid Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  This dashboard link is invalid or has expired. Please contact the administrator for a new link.
                </p>
                <Button onClick={() => router.push("/")} className="w-full">
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </div>
          <Footer />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-blue-400">
              {cryptoSymbol ? `${cryptoSymbol.toUpperCase()} Analysis Dashboard` : "Your Analysis Dashboard"}
            </h1>
            {cryptoSymbol && (
              <div className="px-2 py-1 bg-blue-900/50 rounded-full text-blue-400 text-sm font-semibold">
                {cryptoSymbol.toUpperCase()}
              </div>
            )}
          </div>

          {requesterAddress && (
            <p className="text-gray-400">
              Wallet: {requesterAddress.slice(0, 6)}...{requesterAddress.slice(-4)}
            </p>
          )}

          {transactionVerified && (
            <div className="mt-4 p-3 bg-green-900/30 rounded-lg inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-green-400 text-sm">
                Access verified via {isArbitrumTransaction ? "Arbitrum" : "blockchain"} transaction
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-blue-900/20 border-blue-800/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-blue-400 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {cryptoSymbol ? `${cryptoSymbol.toUpperCase()} Reports` : "Analysis Reports"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                {cryptoSymbol
                  ? `View your requested ${cryptoSymbol.toUpperCase()} analysis reports`
                  : "View your requested analysis reports"}
              </p>
              <Button className="w-full">View Reports</Button>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/20 border-purple-800/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-purple-400 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Portfolio Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">Track your crypto portfolio performance</p>
              <Button className="w-full">View Portfolio</Button>
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-800/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-green-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                {cryptoSymbol
                  ? `Get the latest ${cryptoSymbol.toUpperCase()} market insights`
                  : "Get the latest market insights"}
              </p>
              <Button className="w-full">View Insights</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-blue-400">
              {cryptoSymbol ? `Recent ${cryptoSymbol.toUpperCase()} Analysis Requests` : "Recent Analysis Requests"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p className="mb-2">No analysis requests found</p>
              <Button className="mt-4">Request New Analysis</Button>
            </div>
          </CardContent>
        </Card>

        <Footer />
      </div>
    </main>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import SearchForm from "@/components/SearchForm"
import Loading from "@/components/Loading"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MetaMaskAuth } from "@/components/MetaMaskAuth"
import { AdminPanel } from "@/components/AdminPanel"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, LineChart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ExternalLink } from "@/components/ui/external-link"

interface ArbitrageOpportunity {
  coin: string
  minPrice: number
  maxPrice: number
  minExchange: string
  maxExchange: string
  percentageDifference: number
}

interface ApiResponse {
  arbitrageOpportunities: ArbitrageOpportunity[]
}

// Admin wallet address
const ADMIN_WALLET_ADDRESS = "0x837f5E0FbabD0b1c3482B6Ad10fA39275bDA252e"

export default function Home() {
  const router = useRouter()
  const [arbitrageData, setArbitrageData] = useState<ArbitrageOpportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("search")
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchArbitrageData = async () => {
      if (activeTab !== "arbitrage") return

      try {
        const response = await fetch("https://676a8ed1863eaa5ac0ded5f0.mockapi.io/arb/arb")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        const opportunities = data[0]?.arbitrageOpportunities || []
        const filteredOpportunities = opportunities.filter(
          (opp: ArbitrageOpportunity) => opp.percentageDifference < 100,
        )
        setArbitrageData(filteredOpportunities)
      } catch (error) {
        console.error("Error fetching arbitrage data:", error)
        setArbitrageData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchArbitrageData()
  }, [activeTab])

  // Check if connected wallet is admin
  useEffect(() => {
    if (connectedAddress) {
      setIsAdmin(connectedAddress.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase())
    } else {
      setIsAdmin(false)
    }
  }, [connectedAddress])

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2)
    return price.toFixed(price < 1 ? 6 : 2)
  }

  const handleConnect = (address: string) => {
    setConnectedAddress(address)
    // Only redirect to dashboard for non-admin users
    if (address.toLowerCase() !== ADMIN_WALLET_ADDRESS.toLowerCase()) {
      router.push("/dashboard")
    }
  }

  const handleDisconnect = () => {
    setConnectedAddress(null)
    setIsAdmin(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Header />
          <MetaMaskAuth onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {/* Show Admin Panel if connected wallet is admin */}
        {isAdmin && connectedAddress && <AdminPanel walletAddress={connectedAddress} />}

        <Tabs defaultValue="search" className="mb-8" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 max-w-[400px] mb-4 bg-gray-800/50">
            <TabsTrigger value="search" className="data-[state=active]:bg-purple-500">
              Free Quick Search
            </TabsTrigger>
            <TabsTrigger value="arbitrage" className="data-[state=active]:bg-purple-500">
              Arbitrage on CEXs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-8">
            <SearchForm />
          </TabsContent>

          <TabsContent value="arbitrage">
            {isLoading ? (
              <Loading />
            ) : arbitrageData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-purple-400">Coin</TableHead>
                      <TableHead className="text-right text-purple-400">Min Price ($)</TableHead>
                      <TableHead className="text-purple-400">Min Exchange</TableHead>
                      <TableHead className="text-right text-purple-400">Max Price ($)</TableHead>
                      <TableHead className="text-purple-400">Max Exchange</TableHead>
                      <TableHead className="text-right text-purple-400">Difference (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {arbitrageData
                      .sort((a, b) => b.percentageDifference - a.percentageDifference)
                      .map((row, index) => (
                        <TableRow key={`${row.coin}-${index}`}>
                          <TableCell>
                            <Link
                              href={`/coin/${row.coin.toLowerCase()}`}
                              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium"
                            >
                              {row.coin}
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">{formatPrice(row.minPrice)}</TableCell>
                          <TableCell className="capitalize">{row.minExchange}</TableCell>
                          <TableCell className="text-right">{formatPrice(row.maxPrice)}</TableCell>
                          <TableCell className="capitalize">{row.maxExchange}</TableCell>
                          <TableCell className={`text-right font-bold text-green-400`}>
                            {row.percentageDifference.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">No arbitrage opportunities found</div>
            )}
          </TabsContent>
        </Tabs>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-blue-900/20 border-blue-800/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-16 w-16 text-blue-400 mb-4" />
              <h2 className="text-2xl font-bold text-blue-400 mb-4">Connect Your Wallet</h2>
              <p className="text-gray-300 max-w-md mb-6">
                Connect with MetaMask to access your personal dashboard, request detailed analyses, and track your
                crypto insights.
              </p>
              <ul className="text-left text-gray-300 space-y-2">
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">•</span> Request detailed coin analyses
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">•</span> Track your analysis history
                </li>
                <li className="flex items-center">
                  <span className="text-blue-400 mr-2">•</span> Access premium features
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-purple-900/20 border-purple-800/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <LineChart className="h-16 w-16 text-purple-400 mb-4" />
              <h2 className="text-2xl font-bold text-purple-400 mb-4">Professional Crypto Analysis</h2>
              <p className="text-gray-300 max-w-md mb-6">
                Get instant insights and expert manual review within hours. Powered by advanced AI.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left w-full">
                <div className="space-y-3">
                  <h3 className="text-purple-400 font-semibold">Instant Analysis</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-center">
                      <span className="text-purple-400 mr-2">•</span> Price status vs historical data
                    </li>
                    <li className="flex items-center">
                      <span className="text-purple-400 mr-2">•</span> Technical indicators
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-purple-400 font-semibold">Expert Review</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li className="flex items-center">
                      <span className="text-purple-400 mr-2">•</span> Whitepaper deep dive
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-purple-800/30 w-full">
                <div className="flex flex-col items-center">
                  <p className="text-purple-400 font-semibold mb-2">Simple Fixed Price</p>
                  <p className="text-2xl font-bold text-white mb-2">~5 USD cost ETH on Arbitrum</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Footer />
      </div>
    </main>
  )
}

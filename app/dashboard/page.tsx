"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MetaMaskAuth } from "@/components/MetaMaskAuth"
import { AnalysisRequestsTable } from "@/components/AnalysisRequestsTable"
import { AnalysisRequestPanel } from "@/components/AnalysisRequestPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const [address, setAddress] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for stored address on mount
  useEffect(() => {
    const storedAddress = localStorage.getItem("connectedAddress")
    if (storedAddress) {
      setAddress(storedAddress)
    }
    setLoading(false)
  }, [])

  const handleConnect = (address: string) => {
    console.log("Connected with address:", address)
    setAddress(address)
    localStorage.setItem("connectedAddress", address)
  }

  const handleDisconnect = () => {
    console.log("Disconnected")
    setAddress(null)
    localStorage.removeItem("connectedAddress")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Crypto Analysis Dashboard
          </h1>
          <MetaMaskAuth onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : address ? (
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="mb-6 bg-gray-800/50">
              <TabsTrigger value="new">New Analysis</TabsTrigger>
              <TabsTrigger value="requests">Your Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <AnalysisRequestPanel userAddress={address} />

              {/* Show requests at the bottom of the New Analysis tab */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">Your Recent Requests</h2>
                <AnalysisRequestsTable address={address} />
              </div>
            </TabsContent>

            <TabsContent value="requests">
              <AnalysisRequestsTable address={address} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-gray-900/70 border-gray-800/50">
            <CardHeader>
              <CardTitle className="text-blue-400">Connect Your Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">
                Please connect your MetaMask wallet to access the dashboard and view your analysis requests.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

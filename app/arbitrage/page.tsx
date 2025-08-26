"use client"

import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MetaMaskAuth } from "@/components/MetaMaskAuth"
import { ArbitrageTable } from "@/components/ArbitrageTable"
import { useRouter } from "next/navigation"

export default function ArbitragePage() {
  const router = useRouter()

  const handleConnect = (address: string) => {
    router.push("/dashboard")
  }

  const handleDisconnect = () => {
    router.push("/")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Header />
          <MetaMaskAuth onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-4">Arbitrage Opportunities</h1>
          <p className="text-gray-300 mb-8">Track real-time price differences across major cryptocurrency exchanges.</p>

          <div className="bg-gray-900/70 rounded-lg border border-gray-800/50 p-4">
            <ArbitrageTable />
          </div>
        </div>

        <Footer />
      </div>
    </main>
  )
}

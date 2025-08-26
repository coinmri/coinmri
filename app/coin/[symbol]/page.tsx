import { Suspense } from "react"
import type { Metadata } from "next"
import CoinDetailContent from "@/components/CoinDetailContent"
import Loading from "@/components/Loading"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

export async function generateMetadata({ params }: { params: { symbol: string } }): Promise<Metadata> {
  return {
    title: `${params.symbol.toUpperCase()} - Crypto Analytics Dashboard`,
    description: `Detailed analytics for ${params.symbol.toUpperCase()} cryptocurrency`,
  }
}

export default function CoinDetail({ params }: { params: { symbol: string } }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <Suspense fallback={<Loading />}>
          <CoinDetailContent symbol={params.symbol} />
        </Suspense>
        <Footer />
      </div>
    </main>
  )
}

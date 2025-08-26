import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"

interface ArbitrageOpportunity {
  coin: string
  minPrice: number
  maxPrice: number
  minExchange: string
  maxExchange: string
  percentageDifference: number
}

interface ArbitrageData {
  createdAt: string
  name: string
  avatar: string
  id: string
  timestamp: string
  arbitrageOpportunities: ArbitrageOpportunity[]
}

const fetchArbitrageData = unstable_cache(
  async () => {
    try {
      const response = await fetch("https://676a8ed1863eaa5ac0ded5f0.mockapi.io/arb/arb")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ArbitrageData[] = await response.json()

      // Sort arbitrage opportunities by percentage difference (descending)
      data[0].arbitrageOpportunities.sort((a, b) => b.percentageDifference - a.percentageDifference)

      return data
    } catch (error) {
      console.error("Error fetching data:", error)
      return []
    }
  },
  ["arbitrage-data"],
  { revalidate: 60 }, // Cache for 1 minute
)

export async function GET() {
  try {
    const arbitrageData = await fetchArbitrageData()
    return NextResponse.json(arbitrageData)
  } catch (error) {
    console.error("Error in GET route:", error)
    return NextResponse.json(
      { error: "Failed to fetch arbitrage data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

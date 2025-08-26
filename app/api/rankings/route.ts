import { NextResponse } from "next/server"

const MOCK_API_URL = "https://676a8ed1863eaa5ac0ded5f0.mockapi.io/arb/arb"

export async function GET() {
  try {
    const response = await fetch(MOCK_API_URL, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0 || !data[0].arbitrageOpportunities) {
      throw new Error("Invalid data format")
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error fetching arbitrage data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch arbitrage data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

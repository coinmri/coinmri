import { NextResponse } from "next/server"

async function fetchCorrelationData(baseCoin: string, targetCoin: string) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${baseCoin}/market_chart?vs_currency=usd&days=30`,
  )
  const baseData = await response.json()

  const targetResponse = await fetch(
    `https://api.coingecko.com/api/v3/coins/${targetCoin}/market_chart?vs_currency=usd&days=30`,
  )
  const targetData = await targetResponse.json()

  const basePrices = baseData.prices.map((price: number[]) => price[1])
  const targetPrices = targetData.prices.map((price: number[]) => price[1])

  const correlation24h = calculateCorrelation(basePrices.slice(-24), targetPrices.slice(-24))
  const correlation30d = calculateCorrelation(basePrices, targetPrices)

  return { correlation24h, correlation30d }
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  const sum_x = x.reduce((a, b) => a + b, 0)
  const sum_y = y.reduce((a, b) => a + b, 0)
  const sum_xy = x.reduce((total, xi, i) => total + xi * y[i], 0)
  const sum_x2 = x.reduce((total, xi) => total + xi * xi, 0)
  const sum_y2 = y.reduce((total, yi) => total + yi * yi, 0)

  const numerator = n * sum_xy - sum_x * sum_y
  const denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y))

  return numerator / denominator
}

export async function GET() {
  try {
    const coins = ["bitcoin", "ethereum", "cardano", "solana"]
    const correlations = await Promise.all(
      coins.map(async (coin) => {
        const data = await fetchCorrelationData("bitcoin", coin)
        return {
          coin: coin.toUpperCase(),
          correlation24h: data.correlation24h,
          correlation30d: data.correlation30d,
        }
      }),
    )

    return NextResponse.json(correlations)
  } catch (error) {
    console.error("Error fetching correlation data:", error)
    return NextResponse.json({ error: "Failed to fetch correlation data" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import fetch from "node-fetch"

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3"

async function fetchPriceData(coinId: string, days = 90) {
  try {
    console.log(`Fetching price data for ${coinId}...`)
    const response = await fetch(`${COINGECKO_API_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${coinId}. Status: ${response.status}`)
    }
    const data = await response.json()
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error(`Invalid data format for ${coinId}`)
    }
    console.log(`Successfully fetched price data for ${coinId}`)
    return data.prices.map((price: number[]) => price[1])
  } catch (error) {
    console.error(`Error fetching data for ${coinId}:`, error)
    throw error
  }
}

function calculateCorrelation(series1: number[], series2: number[]) {
  const n = series1.length
  const sum1 = series1.reduce((a, b) => a + b, 0)
  const sum2 = series2.reduce((a, b) => a + b, 0)
  const sum1Sq = series1.reduce((a, b) => a + b * b, 0)
  const sum2Sq = series2.reduce((a, b) => a + b * b, 0)
  const pSum = series1.reduce((a, b, i) => a + b * series2[i], 0)
  const num = pSum - (sum1 * sum2) / n
  const den = Math.sqrt((sum1Sq - (sum1 * sum1) / n) * (sum2Sq - (sum2 * sum2) / n))
  return num / den
}

async function getCorrelationData(baseCoin: string, comparisonCoins: string[]) {
  const allCoins = [baseCoin, ...comparisonCoins]
  const priceData = await Promise.all(allCoins.map((coin) => fetchPriceData(coin)))

  const basePrices = priceData[0]
  const correlations = priceData.map((prices, index) => ({
    coin: allCoins[index],
    correlation: index === 0 ? 1 : calculateCorrelation(basePrices, prices),
    price: prices[prices.length - 1],
  }))

  return correlations
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const coin = searchParams.get("coin")

  if (!coin) {
    return NextResponse.json({ error: "Coin parameter is required" }, { status: 400 })
  }

  try {
    console.log(`Starting price correlation analysis for ${coin}...`)
    const comparisonCoins = ["bitcoin", "ethereum", "cardano", "ripple"]
    const correlationData = await getCorrelationData(coin, comparisonCoins)

    console.log("Correlation data processed successfully")
    return NextResponse.json(correlationData)
  } catch (error) {
    console.error("Error in price correlation API:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    )
  }
}

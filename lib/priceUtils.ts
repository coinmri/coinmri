// Utility functions for fetching and calculating prices

export async function getBinancePrices() {
  try {
    const [ethResponse, arbResponse] = await Promise.all([
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT"),
      fetch("https://api.binance.com/api/v3/ticker/price?symbol=ARBUSDT"),
    ])

    const ethData = await ethResponse.json()
    const arbData = await arbResponse.json()

    return {
      ETH: Number.parseFloat(ethData.price),
      ARB: Number.parseFloat(arbData.price),
      USDC: 1, // Stablecoin
      USDT: 1, // Stablecoin
    }
  } catch (error) {
    console.error("Error fetching prices:", error)
    // Return fallback prices in case of API failure
    return {
      ETH: 3000, // Fallback ETH price
      ARB: 2, // Fallback ARB price
      USDC: 1,
      USDT: 1,
    }
  }
}

export function calculateMinimumAmount(prices: Record<string, number>, paymentMethod: string, requiredUSDAmount = 5) {
  const price = prices[paymentMethod]
  if (!price) return 0

  // Add 1% buffer for price fluctuations
  return (requiredUSDAmount / price) * 1.01
}

export async function getAnalysisPrice(): Promise<string> {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
    const data = await response.json()
    return (Number(data.ethereum.usd) * 0.0025).toString()
  } catch (error) {
    console.error("Error fetching ETH price:", error)
    return "0.0075" // Fallback price
  }
}

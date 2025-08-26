import { formatISO, subDays } from "date-fns"
import type { CoinGeckoData, ExchangeData } from "./types"

function calculateVolatility(prices: number[]): number {
  const returns = prices.slice(1).map((price, index) => Math.log(price / prices[index]))
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const squaredDifferences = returns.map((ret) => Math.pow(ret - meanReturn, 2))
  const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1)
  return Math.sqrt(variance * 24) // Annualized volatility (24 hours)
}

function calculateTrend(prices: number[]): number {
  if (prices.length < 25) return 0
  const currentPrice = prices[prices.length - 1]
  const previousPrice = prices[prices.length - 25] // 24 hours ago
  return (currentPrice - previousPrice) / previousPrice
}

function calculateVWAP(prices: number[], volumes: number[]): number {
  let sumPriceVolume = 0
  let sumVolume = 0
  for (let i = 0; i < prices.length; i++) {
    sumPriceVolume += prices[i] * volumes[i]
    sumVolume += volumes[i]
  }
  return sumVolume > 0 ? sumPriceVolume / sumVolume : 0
}

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return response
      }
      if (response.status === 429) {
        console.log(`Rate limited. Retrying in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      if (i === retries - 1) throw error
      console.log(`Fetch failed. Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2 // Exponential backoff
    }
  }
  throw new Error("Max retries reached")
}

async function getIdFromSymbol(symbol: string): Promise<string> {
  const url = `https://api.coingecko.com/api/v3/search?query=${symbol}`
  const response = await fetchWithRetry(url)
  const data = await response.json()
  const coin = data.coins.find((c: any) => c.symbol.toLowerCase() === symbol.toLowerCase())
  if (!coin) {
    throw new Error(`Could not find a coin with symbol: ${symbol}`)
  }
  return coin.id
}

export async function fetchCoinGeckoData(symbol: string): Promise<{
  processedData: any[]
  vwap: number
  thirtyDayTrends: { day: string; change: number }[]
  twentyFourHourTrends: { hour: string; change: number }[]
}> {
  const coinId = await getIdFromSymbol(symbol)
  const endDate = new Date()
  const startDate = subDays(endDate, 31)

  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart/range?vs_currency=usd&from=${startDate.getTime() / 1000}&to=${endDate.getTime() / 1000}`

  try {
    const response = await fetchWithRetry(url)
    const data: CoinGeckoData = await response.json()

    if (!data.prices || data.prices.length === 0) {
      throw new Error("No data available for the specified coin and currency pair.")
    }

    const prices = data.prices.map((p) => p[1])
    const volumes = data.total_volumes.map((v) => v[1])
    const vwap = calculateVWAP(prices, volumes)

    const processedData = data.prices.map((price, index, array) => {
      const last24Hours = array.slice(Math.max(0, index - 24), index + 1).map((p) => p[1])
      return {
        timestamp: formatISO(new Date(price[0])),
        price: price[1],
        volume: data.total_volumes[index][1],
        volatility: index >= 24 ? calculateVolatility(last24Hours) : 0,
        trend: calculateTrend(last24Hours),
      }
    })

    const thirtyDayTrends = calculateThirtyDayTrends(data.prices)
    const twentyFourHourTrends = calculateTwentyFourHourTrends(data.prices)

    return { processedData, vwap, thirtyDayTrends, twentyFourHourTrends }
  } catch (error) {
    console.error("Error fetching data from CoinGecko:", error)
    if (error instanceof Error && error.message.includes("429")) {
      throw new Error("Rate limit exceeded")
    }
    throw error
  }
}

function calculateThirtyDayTrends(prices: [number, number][]): { day: string; change: number }[] {
  const dailyPrices = prices.reduce(
    (acc, [timestamp, price]) => {
      const date = new Date(timestamp).toISOString().split("T")[0]
      if (!acc[date] || timestamp > acc[date].timestamp) {
        acc[date] = { timestamp, price }
      }
      return acc
    },
    {} as Record<string, { timestamp: number; price: number }>,
  )

  const sortedDates = Object.keys(dailyPrices).sort().slice(-30)
  const trends = []

  for (let i = 1; i < sortedDates.length; i++) {
    const currentPrice = dailyPrices[sortedDates[i]].price
    const previousPrice = dailyPrices[sortedDates[i - 1]].price
    const change = ((currentPrice - previousPrice) / previousPrice) * 100
    trends.push({ day: sortedDates[i], change })
  }

  return trends
}

function calculateTwentyFourHourTrends(prices: [number, number][]): { hour: string; change: number }[] {
  const hourlyPrices = prices.slice(-24)
  const trends = []

  for (let i = 1; i < hourlyPrices.length; i++) {
    const currentPrice = hourlyPrices[i][1]
    const previousPrice = hourlyPrices[i - 1][1]
    const change = ((currentPrice - previousPrice) / previousPrice) * 100
    trends.push({ hour: new Date(hourlyPrices[i][0]).toISOString(), change })
  }

  return trends
}

function calculateWeeklyTrends(prices: [number, number][]): { day: string; change: number }[] {
  const dailyPrices = prices.reduce(
    (acc, [timestamp, price]) => {
      const date = new Date(timestamp).toISOString().split("T")[0]
      if (!acc[date] || timestamp > acc[date].timestamp) {
        acc[date] = { timestamp, price }
      }
      return acc
    },
    {} as Record<string, { timestamp: number; price: number }>,
  )

  const sortedDates = Object.keys(dailyPrices).sort().slice(-7)
  const trends = []

  for (let i = 1; i < sortedDates.length; i++) {
    const currentPrice = dailyPrices[sortedDates[i]].price
    const previousPrice = dailyPrices[sortedDates[i - 1]].price
    const change = ((currentPrice - previousPrice) / previousPrice) * 100
    trends.push({ day: sortedDates[i], change })
  }

  return trends
}

export async function fetchExchangeData(
  symbol: string,
): Promise<{ usdtExchanges: ExchangeData[]; usdExchanges: ExchangeData[]; arbitrage: number; vwap: number }> {
  const coinId = await getIdFromSymbol(symbol)
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/tickers?order=volume_desc&include_exchange_logo=false`

  try {
    const response = await fetchWithRetry(url)
    const data = await response.json()

    const usdtExchanges = data.tickers
      .filter(
        (ticker: any) =>
          (ticker.target.toLowerCase() === "usdt" && ticker.base.toLowerCase() !== "usdt") ||
          (ticker.target.toLowerCase() === "usd" && ticker.base.toLowerCase() === "usdt"),
      )
      .map((ticker: any) => ({
        exchange: ticker.market.name,
        volume: ticker.converted_volume.usd,
        price: ticker.last,
        target: ticker.target,
      }))
      .filter((exchange: ExchangeData) => exchange.price >= 0.9 && exchange.price <= 1.1)
      .sort((a: ExchangeData, b: ExchangeData) => b.volume - a.volume)
      .slice(0, 10)

    const usdExchanges = data.tickers
      .filter((ticker: any) => ticker.target.toLowerCase() === "usd" && ticker.base.toLowerCase() !== "usdt")
      .map((ticker: any) => ({
        exchange: ticker.market.name,
        volume: ticker.converted_volume.usd,
        price: ticker.last,
        target: ticker.target,
      }))
      .sort((a: ExchangeData, b: ExchangeData) => b.volume - a.volume)
      .slice(0, 10)

    console.log("USDT Exchanges:", usdtExchanges)
    console.log("USD Exchanges:", usdExchanges)

    const allExchanges = [...usdtExchanges, ...usdExchanges]
    const arbitrage = calculateArbitrage(allExchanges)

    // Calculate VWAP for all exchanges
    const vwap = calculateVWAP(
      allExchanges.map((e) => e.price),
      allExchanges.map((e) => e.volume),
    )

    return { usdtExchanges, usdExchanges, arbitrage, vwap }
  } catch (error) {
    console.error("Error fetching exchange data from CoinGecko:", error)
    throw error
  }
}

function calculateArbitrage(exchanges: ExchangeData[]): number {
  const validExchanges = exchanges.filter((e) => e.price !== null && e.price !== undefined && e.volume > 0)

  if (validExchanges.length < 2) return 0

  const totalVolume = validExchanges.reduce((sum, e) => sum + e.volume, 0)

  const vwap = validExchanges.reduce((sum, e) => sum + e.price * (e.volume / totalVolume), 0)

  const minPrice = Math.min(...validExchanges.map((e) => e.price))
  const maxPrice = Math.max(...validExchanges.map((e) => e.price))

  return (maxPrice - minPrice) / vwap
}

export async function fetchTopArbitrageCoins(limit = 200, retries = 3): Promise<any[]> {
  const url =
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_asc&per_page=250&page=1&sparkline=false"

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchWithRetry(url)
      const data = await response.json()

      const coinsWithArbitrage = await Promise.all(
        data.slice(0, limit).map(async (coin: any) => {
          try {
            const { arbitrage } = await fetchExchangeData(coin.symbol)
            return {
              ...coin,
              arbitrage,
            }
          } catch (error) {
            console.error(`Error fetching arbitrage for ${coin.symbol}:`, error)
            return {
              ...coin,
              arbitrage: 0,
            }
          }
        }),
      )

      return coinsWithArbitrage.sort((a, b) => b.arbitrage - a.arbitrage)
    } catch (error) {
      console.error(`Attempt ${i + 1} failed. Error fetching top arbitrage coins:`, error)
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
    }
  }
  throw new Error("Max retries reached for fetching top arbitrage coins")
}

// Export all necessary functions
export {
  calculateVolatility,
  calculateTrend,
  calculateVWAP,
  fetchWithRetry,
  getIdFromSymbol,
  calculateThirtyDayTrends,
  calculateTwentyFourHourTrends,
}

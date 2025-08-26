import type { ExchangeData } from "./types"

async function fetchBinancePrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`)
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Binance API error (${response.status}): ${errorBody}`)
    }
    const data = await response.json()
    if (!data.price) {
      throw new Error(`Unexpected Binance API response: ${JSON.stringify(data)}`)
    }
    return Number.parseFloat(data.price)
  } catch (error) {
    console.error(`Error fetching Binance price for ${symbol}:`, error)
    throw error
  }
}

async function fetchKrakenPrice(pair: string): Promise<number> {
  try {
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pair}USDT`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    const pairData = Object.values(data.result)[0] as any
    return Number.parseFloat(pairData.c[0])
  } catch (error) {
    console.error("Error fetching Kraken price:", error)
    throw error
  }
}

async function fetchCoinbasePrice(pair: string): Promise<number> {
  try {
    const response = await fetch(`https://api.pro.coinbase.com/products/${pair}-USDT/ticker`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return Number.parseFloat(data.price)
  } catch (error) {
    console.error("Error fetching Coinbase price:", error)
    throw error
  }
}

async function fetchHuobiPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api.huobi.pro/market/detail/merged?symbol=${symbol.toLowerCase()}usdt`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return Number.parseFloat(data.tick.close)
  } catch (error) {
    console.error("Error fetching Huobi price:", error)
    throw error
  }
}

async function fetchBitfinexPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(`https://api-pub.bitfinex.com/v2/ticker/t${symbol}UST`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return Number.parseFloat(data[6])
  } catch (error) {
    console.error("Error fetching Bitfinex price:", error)
    throw error
  }
}

export async function fetchExchangePrices(base: string, exchanges: ExchangeData[]): Promise<ExchangeData[]> {
  const pricePromises = exchanges.map(async (exchange) => {
    try {
      let price: number
      switch (exchange.exchange.toLowerCase()) {
        case "binance":
          price = await fetchBinancePrice(base)
          break
        case "kraken":
          price = await fetchKrakenPrice(base)
          break
        case "coinbase exchange":
          price = await fetchCoinbasePrice(base)
          break
        case "huobi":
          price = await fetchHuobiPrice(base)
          break
        case "bitfinex":
          price = await fetchBitfinexPrice(base)
          break
        default:
          console.warn(`Unsupported exchange: ${exchange.exchange}`)
          return { ...exchange, price: null }
      }
      return { ...exchange, price }
    } catch (error) {
      console.error(`Error fetching price for ${exchange.exchange}:`, error)
      return { ...exchange, price: null }
    }
  })

  const results = await Promise.all(pricePromises)
  console.log("Exchange prices:", results)
  return results
}

export function calculateArbitrage(exchanges: ExchangeData[]): number {
  const validPrices = exchanges.filter((e) => e.price !== null).map((e) => e.price!)
  if (validPrices.length < 2) return 0

  const minPrice = Math.min(...validPrices)
  const maxPrice = Math.max(...validPrices)

  return (maxPrice - minPrice) / minPrice
}

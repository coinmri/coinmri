export interface CoinGeckoData {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

export interface ExchangeData {
  exchange: string
  volume: number
  price: number
}

export interface ProcessedData {
  timestamp: string
  price: number
  volume: number
  volatility: number
  trend: number
}

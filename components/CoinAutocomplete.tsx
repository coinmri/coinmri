"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface Coin {
  id: string
  symbol: string
  name: string
}

export default function CoinAutocomplete() {
  const [searchQuery, setSearchQuery] = useState("")
  const [coins, setCoins] = useState<Coin[]>([])
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/list")
        const data = await response.json()
        setCoins(data)
      } catch (error) {
        console.error("Error fetching coins:", error)
      }
    }

    fetchCoins()
  }, [])

  useEffect(() => {
    const filtered = coins
      .filter(
        (coin) =>
          coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          coin.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 5)
    setFilteredCoins(filtered)
  }, [searchQuery, coins])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/coin/${searchQuery.toLowerCase()}`)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative mb-8">
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a coin (e.g., BTC)"
            className="w-full text-gray-200 placeholder-gray-400 pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <Button type="submit">Search</Button>
      </div>
      {searchQuery && filteredCoins.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 border border-gray-700 rounded-md mt-1 max-h-60 overflow-auto">
          {filteredCoins.map((coin) => (
            <li
              key={coin.id}
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setSearchQuery(coin.symbol)
                router.push(`/coin/${coin.symbol.toLowerCase()}`)
              }}
            >
              <span className="font-semibold">{coin.symbol.toUpperCase()}</span> - {coin.name}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}

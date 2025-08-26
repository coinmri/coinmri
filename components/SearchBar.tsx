"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface SearchBarProps {
  onSearch: (pair: string) => void
  defaultPair: string
}

export default function SearchBar({ onSearch, defaultPair }: SearchBarProps) {
  const [query, setQuery] = useState(defaultPair)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.toLowerCase())
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-900/70 border-gray-700/50 text-gray-200 placeholder-gray-500 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            placeholder="Enter cryptocurrency symbol (e.g., BTC)"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <Button
          type="submit"
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
        >
          Search
        </Button>
      </form>
      <p className="text-sm text-gray-400 mt-2 text-center">Enter a valid cryptocurrency symbol for analysis.</p>
    </div>
  )
}

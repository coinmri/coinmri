"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InfoIcon } from "./InfoIcon"
import { Clock, Users, FileText, Award, TrendingUp, BarChart3 } from "lucide-react"

interface MarketAnalysisProps {
  currentPrice: number
  historicalPrices: number[]
  volume: number
  marketCap: number
  manualAnalysis?: {
    communityEngagement?: "Good" | "Medium" | "Bad"
    whitepaperScore?: number
    teamExpertise?: "High" | "Medium" | "Low"
    lastUpdated?: string
  }
}

export function MarketAnalysisPanel({
  currentPrice,
  historicalPrices,
  volume,
  marketCap,
  manualAnalysis,
}: MarketAnalysisProps) {
  // Calculate price status
  const calculatePriceStatus = () => {
    const avg = historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length
    const percentFromAvg = ((currentPrice - avg) / avg) * 100

    if (percentFromAvg > 10) return { status: "Good", color: "text-green-400" }
    if (percentFromAvg < -10) return { status: "Bad", color: "text-red-400" }
    return { status: "Medium", color: "text-yellow-400" }
  }

  // Calculate volume/market cap ratio status
  const calculateVolumeStatus = () => {
    const ratio = (volume / marketCap) * 100

    if (ratio > 10) return { status: "Good", color: "text-green-400" }
    if (ratio < 2) return { status: "Bad", color: "text-red-400" }
    return { status: "Medium", color: "text-yellow-400" }
  }

  const priceStatus = calculatePriceStatus()
  const volumeStatus = calculateVolumeStatus()

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-blue-400 flex items-center gap-2">Market Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instant Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Instant Analysis
            </h3>
            <Badge variant="outline" className="bg-blue-900/50">
              Real-time
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm text-gray-400">Price Status</h4>
                <InfoIcon content="Based on historical price average and current trends" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${priceStatus.color}`}>{priceStatus.status}</span>
                <span className="text-sm text-gray-400">vs Historical Average</span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm text-gray-400">Volume/Market Cap Ratio</h4>
                <InfoIcon content="Indicates trading activity relative to market size" />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${volumeStatus.color}`}>{volumeStatus.status}</span>
                <span className="text-sm text-gray-400">{((volume / marketCap) * 100).toFixed(2)}% Ratio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Manual Analysis
            </h3>
            <Badge variant="outline" className="bg-purple-900/50">
              {manualAnalysis?.lastUpdated ? `Updated ${manualAnalysis.lastUpdated}` : "Pending"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm text-gray-400">Community Engagement</h4>
              </div>
              {manualAnalysis?.communityEngagement ? (
                <span
                  className={`text-lg font-semibold ${
                    manualAnalysis.communityEngagement === "Good"
                      ? "text-green-400"
                      : manualAnalysis.communityEngagement === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {manualAnalysis.communityEngagement}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Analysis pending</span>
              )}
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm text-gray-400">Whitepaper Score</h4>
              </div>
              {manualAnalysis?.whitepaperScore ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-semibold ${
                      manualAnalysis.whitepaperScore >= 8
                        ? "text-green-400"
                        : manualAnalysis.whitepaperScore >= 6
                          ? "text-yellow-400"
                          : "text-red-400"
                    }`}
                  >
                    {manualAnalysis.whitepaperScore}/10
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Analysis pending</span>
              )}
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-purple-400" />
                <h4 className="text-sm text-gray-400">Team Expertise</h4>
              </div>
              {manualAnalysis?.teamExpertise ? (
                <span
                  className={`text-lg font-semibold ${
                    manualAnalysis.teamExpertise === "High"
                      ? "text-green-400"
                      : manualAnalysis.teamExpertise === "Medium"
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  {manualAnalysis.teamExpertise}
                </span>
              ) : (
                <span className="text-sm text-gray-500">Analysis pending</span>
              )}
            </div>
          </div>

          {!manualAnalysis && (
            <div className="bg-purple-900/20 border border-purple-800/50 rounded-lg p-4 text-center">
              <Clock className="h-5 w-5 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-300">
                Manual analysis is being conducted by our team. This typically takes a few hours to complete.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

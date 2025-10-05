"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Download, Clock, CheckCircle, AlertCircle, Home } from "lucide-react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

interface DataRequest {
  id: string
  symbol: string
  requirements: string
  status: "pending" | "processing" | "completed" | "failed"
  createdAt: string
  completedAt?: string
  downloadUrl?: string
  progress?: number
  notes?: string
}

export default function DataRequestPage() {
  const params = useParams()
  const router = useRouter()
  const [request, setRequest] = useState<DataRequest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load request from localStorage
    const requestId = params.id as string
    const existingRequests = JSON.parse(localStorage.getItem("dataRequests") || "[]")
    const foundRequest = existingRequests.find((req: DataRequest) => req.id === requestId)

    if (foundRequest) {
      // Simulate status progression for demo purposes
      const createdTime = new Date(foundRequest.createdAt).getTime()
      const currentTime = Date.now()
      const elapsedMinutes = (currentTime - createdTime) / (1000 * 60)

      if (elapsedMinutes > 5 && foundRequest.status === "pending") {
        foundRequest.status = "processing"
        foundRequest.progress = 45
        foundRequest.notes = "Collecting data from 18 major exchanges..."
      }

      if (elapsedMinutes > 10 && foundRequest.status === "processing") {
        foundRequest.status = "completed"
        foundRequest.progress = 100
        foundRequest.completedAt = new Date().toISOString()
        foundRequest.downloadUrl = `/api/download/${foundRequest.id}`
        foundRequest.notes = "Data collection completed successfully!"

        // Update localStorage
        const updatedRequests = existingRequests.map((req: DataRequest) => (req.id === requestId ? foundRequest : req))
        localStorage.setItem("dataRequests", JSON.stringify(updatedRequests))
      }

      setRequest(foundRequest)
    }

    setLoading(false)
  }, [params.id])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-400" />
      case "processing":
        return <AlertCircle className="h-5 w-5 text-blue-400 animate-pulse" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-400" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive",
    }

    const colors: Record<string, string> = {
      pending: "bg-yellow-900/50 text-yellow-400 border-yellow-800/50",
      processing: "bg-blue-900/50 text-blue-400 border-blue-800/50",
      completed: "bg-green-900/50 text-green-400 border-green-800/50",
      failed: "bg-red-900/50 text-red-400 border-red-800/50",
    }

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading request details...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!request) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Header />
          <Card className="bg-gradient-to-r from-red-950/70 to-orange-950/70 border-red-800/50 mt-8">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-400 mb-2">Request Not Found</h2>
              <p className="text-gray-300 mb-6">The data collection request you're looking for doesn't exist.</p>
              <Button onClick={() => router.push("/")} className="bg-red-700 hover:bg-red-600">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Header />
        </div>

        <Card className="bg-gradient-to-r from-green-950/70 to-blue-950/70 border-green-800/50 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-400">
                <Database className="h-6 w-6" />
                Data Request Details
              </CardTitle>
              {getStatusBadge(request.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Cryptocurrency</h3>
                <p className="text-xl font-bold text-white">{request.symbol}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Request ID</h3>
                <p className="text-sm font-mono text-gray-300">{request.id}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Data Requirements</h3>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-gray-300">{request.requirements}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Requested At</h3>
                <p className="text-gray-300">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
              {request.completedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Completed At</h3>
                  <p className="text-gray-300">{new Date(request.completedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            {request.progress !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-400">Progress</h3>
                  <span className="text-sm text-green-400 font-semibold">{request.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${request.progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {request.notes && (
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
                <div className="flex items-start gap-3">
                  {getStatusIcon(request.status)}
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-1">Status Update</h4>
                    <p className="text-gray-300 text-sm">{request.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {request.status === "completed" && request.downloadUrl && (
              <div className="bg-green-900/30 p-6 rounded-lg border border-green-800/50 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-400 mb-2">Data Ready for Download!</h3>
                <p className="text-gray-300 mb-6">
                  Your cryptocurrency data has been successfully collected and is ready.
                </p>
                <Button className="bg-green-700 hover:bg-green-600 text-white px-8">
                  <Download className="h-4 w-4 mr-2" />
                  Download Data
                </Button>
              </div>
            )}

            {request.status === "pending" && (
              <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-800/50">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-semibold mb-1">Request Pending</h4>
                    <p className="text-gray-300 text-sm">
                      Your request is in the queue. Data collection will begin shortly. Please check back later for
                      updates.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {request.status === "processing" && (
              <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-1">Collection In Progress</h4>
                    <p className="text-gray-300 text-sm">
                      We're actively collecting your data from multiple exchanges. This process may take several
                      minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center mb-8">
          <Button onClick={() => router.push("/")} variant="outline" className="border-green-800/50 text-green-400">
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Footer />
      </div>
    </main>
  )
}

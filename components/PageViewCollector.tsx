"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function PageViewCollectorContent() {
  const [pageViews, setPageViews] = useState(0)
  const [showCounter, setShowCounter] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const storedViews = localStorage.getItem("pageViews")
    const currentViews = storedViews ? Number.parseInt(storedViews, 10) : 0
    const newViews = currentViews + 1
    localStorage.setItem("pageViews", newViews.toString())
    setPageViews(newViews)

    // Check if the 'showViews' parameter is present in the URL
    setShowCounter(searchParams.has("showViews"))
  }, [searchParams])

  if (!showCounter) {
    return null
  }

  return (
    <Card className="bg-gray-900/70 border-gray-800/50 backdrop-blur-sm fixed bottom-4 right-4">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium text-blue-400">Page Views</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-2xl font-bold text-white">{pageViews}</p>
      </CardContent>
    </Card>
  )
}

export function PageViewCollector() {
  return (
    <Suspense fallback={null}>
      <PageViewCollectorContent />
    </Suspense>
  )
}

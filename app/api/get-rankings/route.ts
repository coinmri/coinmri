import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Attempting to fetch data from MockAPI")
    const response = await fetch("https://676a8ed1863eaa5ac0ded5f0.mockapi.io/arb/arb", {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`HTTP error! status: ${response.status}. Response: ${errorText}`)
      throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`)
    }

    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API did not return JSON")
      throw new Error("API did not return JSON")
    }

    const data = await response.json()
    console.log("Received data from MockAPI:", JSON.stringify(data, null, 2))

    if (!Array.isArray(data) || data.length === 0 || !data[0].arbitrageOpportunities) {
      console.error("Invalid data format:", JSON.stringify(data, null, 2))
      throw new Error("Invalid data format")
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error fetching arbitrage data:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Failed to fetch arbitrage data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

"use server"

// Admin wallet address
const ADMIN_WALLET_ADDRESS = "0x837f5E0FbabD0b1c3482B6Ad10fA39275bDA252e"

// Arbiscan API configuration - using server-only environment variable
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "Q7F6Q2ITCZJWT98X4FFXJ1RQ9NRWGZWXWK"
const ARBISCAN_API_URL = "https://api.arbiscan.io/api"

// Server action to check for analysis requests on Arbitrum
export async function checkForAnalysisRequests(address: string) {
  if (!address) return null

  try {
    console.log(`Checking Arbitrum transactions from ${address} to ${ADMIN_WALLET_ADDRESS}`)

    // Fetch transactions from user to admin
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (data.status !== "1") {
      console.warn("Arbiscan API returned an error:", data.message)
      // Return null instead of throwing an error to prevent breaking the UI
      return null
    }

    // Filter transactions from user to admin
    const userToAdminTxs = data.result.filter(
      (tx: any) =>
        tx.from.toLowerCase() === address.toLowerCase() && tx.to.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase(),
    )

    if (userToAdminTxs.length > 0) {
      return {
        found: true,
        count: userToAdminTxs.length,
      }
    }

    return null
  } catch (error) {
    console.error("Error checking for analysis requests:", error)
    // Return null instead of throwing an error to prevent breaking the UI
    return null
  }
}

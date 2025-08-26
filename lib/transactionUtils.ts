/**
 * Decodes dashboard access data from transaction input
 * Format: Symbol is at 299th character, dashboard link is from 32nd character from end to 192nd character
 *
 * @param input The transaction input data (hex string)
 * @returns Object with symbol and link, or null if invalid
 */
export function decodeDashboardAccess(input: string): { symbol: string; link: string; address?: string } | null {
  try {
    if (!input || input === "0x") return null

    // Remove the '0x' prefix if present
    const hexData = input.startsWith("0x") ? input.slice(2) : input

    // Convert hex to bytes
    const bytes = Buffer.from(hexData, "hex")

    // Extract symbol starting from position 299 until null byte (0)
    let symbolEnd = 299
    while (symbolEnd < bytes.length && bytes[symbolEnd] !== 0) {
      symbolEnd++
    }
    const symbol = bytes.slice(299, symbolEnd).toString()

    // Extract dashboard link from 32nd character from end to 192nd character
    const linkStart = Math.max(0, bytes.length - 32)
    const linkEnd = Math.min(bytes.length, 192)
    const link = bytes.slice(linkStart, linkEnd).toString().replace(/\0/g, "") // Remove null bytes

    // Try to find an address in the data (typically an Ethereum address starts with 0x and is 42 chars)
    let address = undefined
    const dataString = bytes.toString()
    const addressMatch = dataString.match(/0x[a-fA-F0-9]{40}/g)
    if (addressMatch && addressMatch.length > 0) {
      address = addressMatch[0]
    }

    console.log(`Decoded from transaction: Symbol=${symbol}, Link=${link}, Address=${address || "none"}`)

    return {
      symbol: symbol,
      link: link,
      address,
    }
  } catch (error) {
    console.error("Error decoding dashboard access data:", error)
    return null
  }
}

/**
 * Decodes analysis request data from transaction input
 * Format: "ANALYZE_REQUEST:SYMBOL"
 *
 * @param input The transaction input data (hex string)
 * @returns Object with symbol, or null if invalid
 */
export function decodeAnalysisRequest(input: string): { symbol: string } | null {
  try {
    if (!input || input === "0x") return null

    // Remove the '0x' prefix if present
    const hexData = input.startsWith("0x") ? input.slice(2) : input

    // Convert hex to string
    const dataString = Buffer.from(hexData, "hex").toString()

    // Check for analysis request format
    if (!dataString.startsWith("ANALYZE_REQUEST:")) return null

    const parts = dataString.split(":")
    if (parts.length < 2) return null

    return {
      symbol: parts[1],
    }
  } catch (error) {
    console.error("Error decoding analysis request data:", error)
    return null
  }
}

/**
 * Creates dashboard access data for transaction input
 *
 * @param symbol The cryptocurrency symbol
 * @param link The dashboard link
 * @param address Optional user address
 * @returns Hex-encoded string for transaction input
 */
export function createDashboardAccessData(symbol: string, link: string, address?: string): string {
  const dataString = address
    ? `DASHBOARD_ACCESS:${symbol.toUpperCase()}:${link}:${address}`
    : `DASHBOARD_ACCESS:${symbol.toUpperCase()}:${link}`
  return "0x" + Buffer.from(dataString).toString("hex")
}

/**
 * Creates analysis request data for transaction input
 *
 * @param symbol The cryptocurrency symbol
 * @returns Hex-encoded string for transaction input
 */
export function createAnalysisRequestData(symbol: string): string {
  const dataString = `ANALYZE_REQUEST:${symbol.toUpperCase()}`
  return "0x" + Buffer.from(dataString).toString("hex")
}

/**
 * Decodes symbol from transaction input data
 * Symbol is at 299th character until null byte
 *
 * @param data The transaction input data (hex string)
 * @returns The cryptocurrency symbol, or null if not found
 */
export function decodeSymbolFromData(data: string): string | null {
  try {
    if (!data || data === "0x") return null

    // Remove the '0x' prefix if present
    const hexData = data.startsWith("0x") ? data.slice(2) : data

    // Convert hex to bytes
    const bytes = Buffer.from(hexData, "hex")

    // Check if we have enough data
    if (bytes.length <= 299) {
      console.log("Input data too short to contain symbol")
      return null
    }

    // Extract symbol starting from position 299 until null byte (0)
    let symbolEnd = 299
    while (symbolEnd < bytes.length && bytes[symbolEnd] !== 0) {
      symbolEnd++
    }

    const symbol = bytes.slice(299, symbolEnd).toString()
    console.log(`Decoded symbol from position 299: ${symbol}`)

    return symbol
  } catch (error) {
    console.error("Error decoding symbol from data:", error)
    return null
  }
}

// Let's add a test function to verify the decoding works correctly with your example

/**
 * Test function to verify dashboard access decoding
 */
export function testDashboardAccessDecoding() {
  // Your example
  const exampleString =
    "DASHBOARD_ACCESS:EEE:https://www.notion.so/Crypto-Analytics-Dashboard-1a9d194e76358054a2f7da5c0052a6a0"

  // Convert to hex like it would be in a transaction
  const hexData = "0x" + Buffer.from(exampleString).toString("hex")

  // Decode it
  const decoded = decodeDashboardAccess(hexData)

  console.log("Original:", exampleString)
  console.log("Hex:", hexData)
  console.log("Decoded:", decoded)

  // Verify it matches
  if (decoded) {
    console.log("Symbol matches:", decoded.symbol === "EEE")
    console.log(
      "Link matches:",
      decoded.link === "https://www.notion.so/Crypto-Analytics-Dashboard-1a9d194e76358054a2f7da5c0052a6a0",
    )
  }

  return decoded
}

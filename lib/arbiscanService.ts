const ARBISCAN_API_URL = "https://api.arbiscan.io/api"
const ARBISCAN_API_KEY = "Q7F6Q2ITCZJWT98X4FFXJ1RQ9NRWGZWXWK"

interface ArbiscanResponse {
  status: string
  message: string
  result: Array<any>
}

// Function to verify if the API key is valid
export async function verifyApiKey(apiKey: string): Promise<boolean> {
  try {
    // Make a simple API call to check if the key works
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=stats&action=tokensupply&contractaddress=0x912CE59144191C1204E64559FE8253a0e49E6548&apikey=${apiKey}`,
    )
    const data = await response.json()

    // If the status is 1, the API key is valid
    return data.status === "1"
  } catch (error) {
    console.error("Error verifying API key:", error)
    return false
  }
}

export async function getTransactionsByAddress(address: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
    )
    const data: ArbiscanResponse = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (data.status !== "1") {
      console.warn("Arbiscan API returned an error:", data.message)
      return [] // Return empty array instead of throwing
    }

    return data.result
  } catch (error) {
    console.error("Error fetching transactions from Arbiscan:", error)
    return [] // Return empty array on error
  }
}

// Function to get transactions between a wallet and a specific contract
export async function getTransactionsByAddressAndContract(
  walletAddress: string,
  contractAddress: string,
): Promise<any[]> {
  try {
    console.log(`Fetching transactions between wallet ${walletAddress} and contract ${contractAddress}`)

    // Normalize addresses
    const normalizedWalletAddress = walletAddress.toLowerCase()
    const normalizedContractAddress = contractAddress.toLowerCase()

    // First get all transactions for the wallet
    const apiUrl = `${ARBISCAN_API_URL}?module=account&action=txlist&address=${normalizedWalletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`
    console.log(`API URL: ${apiUrl}`)

    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`)
      return []
    }

    const data: ArbiscanResponse = await response.json()
    console.log("Arbiscan API full response:", data)
    console.log("Arbiscan API response status:", data.status, "message:", data.message)

    // Handle the case where Arbiscan returns a NOTOK status
    if (data.status !== "1") {
      console.warn("Arbiscan API returned an error:", data.message)
      return [] // Return empty array instead of throwing
    }

    // Log the total number of transactions found
    console.log(`Found ${data.result.length} total transactions for wallet ${walletAddress}`)

    // Filter transactions to only include those to the specified contract
    const filteredTransactions = data.result.filter((tx) => {
      const toAddress = tx.to ? tx.to.toLowerCase() : ""
      const isMatch = toAddress === normalizedContractAddress

      if (isMatch) {
        console.log(`Found matching transaction: ${tx.hash}`)
      }

      return isMatch
    })

    console.log(`Found ${filteredTransactions.length} transactions to contract ${contractAddress}`)

    // If we found transactions, log the first one for debugging
    if (filteredTransactions.length > 0) {
      console.log("First matching transaction:", {
        hash: filteredTransactions[0].hash,
        from: filteredTransactions[0].from,
        to: filteredTransactions[0].to,
        value: filteredTransactions[0].value,
        input: filteredTransactions[0].input.substring(0, 50) + "...", // Log just the beginning of input
      })
    }

    return filteredTransactions
  } catch (error) {
    console.error("Error fetching transactions from Arbiscan:", error)
    return [] // Return empty array on error
  }
}

// Function to get transactions between two addresses
export async function getTransactionsBetweenAddresses(address1: string, address2: string): Promise<any[]> {
  try {
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=account&action=txlist&address=${address1}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
    )
    const data: ArbiscanResponse = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (data.status !== "1") {
      console.warn("Arbiscan API returned an error:", data.message)
      return [] // Return empty array instead of throwing
    }

    // Filter transactions to only include those to the specified contract
    const filteredTransactions = data.result.filter((tx) => {
      const toAddress = tx.to ? tx.to.toLowerCase() : ""
      const isMatch = toAddress === address2.toLowerCase()

      return isMatch
    })

    return filteredTransactions
  } catch (error) {
    console.error("Error fetching transactions from Arbiscan:", error)
    return [] // Return empty array on error
  }
}

export async function getTransactionByHash(hash: string): Promise<any> {
  try {
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${ARBISCAN_API_KEY}`,
    )
    const data = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (!data.result) {
      console.warn("Arbiscan API returned an error or no result for hash:", hash)
      return null
    }

    return data.result
  } catch (error) {
    console.error("Error fetching transaction from Arbiscan:", error)
    return null
  }
}

export async function verifyTransactionStatus(hash: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${hash}&apikey=${ARBISCAN_API_KEY}`,
    )
    const data = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (!data.result) {
      console.warn("Arbiscan API returned an error or no result for hash:", hash)
      return false
    }

    return data.result.status === "0x1"
  } catch (error) {
    console.error("Error verifying transaction status from Arbiscan:", error)
    return false
  }
}

export async function getContractEvents(
  contractAddress: string,
  fromBlock: number,
  toBlock: number,
  topic: string,
): Promise<any[]> {
  try {
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${contractAddress}&topic0=${topic}&apikey=${ARBISCAN_API_KEY}`,
    )
    const data: ArbiscanResponse = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (data.status !== "1") {
      console.warn("Arbiscan API returned an error:", data.message)
      return [] // Return empty array instead of throwing
    }

    return data.result
  } catch (error) {
    console.error("Error fetching contract events from Arbiscan:", error)
    return [] // Return empty array on error
  }
}

// Try a different API endpoint to get transactions
export async function getTransactionsByAddressAlternative(address: string): Promise<any[]> {
  try {
    // Use the tokentx endpoint which might have different indexing
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=account&action=tokentx&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
    )
    const data: ArbiscanResponse = await response.json()

    // Handle the case where Arbiscan returns a NOTOK status
    if (data.status !== "1") {
      console.warn("Arbiscan token tx API returned an error:", data.message)
      return [] // Return empty array instead of throwing
    }

    return data.result
  } catch (error) {
    console.error("Error fetching token transactions from Arbiscan:", error)
    return [] // Return empty array on error
  }
}

import { ethers } from "ethers"
import { ANALYSIS_REQUESTS_ADDRESS, ANALYSIS_REQUESTS_ABI, NETWORK_CONFIG } from "./web3Config"
import {
  getTransactionsByAddress,
  getTransactionByHash,
  verifyTransactionStatus,
  getContractEvents,
} from "./arbiscanService"

export interface AnalysisRequest {
  symbol: string
  timestamp: number
  paymentMethod: string
  amount: string
  txHash: string
  completed?: boolean
  resultHash?: string
}

// Update the requestAnalysis function to fix the ethers.formatEther error
export async function requestAnalysis(
  symbol: string,
  paymentMethod: string,
  amount: string,
): Promise<{ txHash: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("Please install MetaMask")
    }

    // Request account access
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect to MetaMask.")
    }

    // Check if we're on the correct network
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    if (chainId !== `0x${NETWORK_CONFIG.ARBITRUM.chainId.toString(16)}`) {
      // Alert user about network mismatch
      const confirmed = window.confirm(
        "You need to be on the Arbitrum network to continue. Would you like to switch networks?",
      )

      if (!confirmed) {
        throw new Error("Network switch cancelled. Please switch to Arbitrum network manually.")
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${NETWORK_CONFIG.ARBITRUM.chainId.toString(16)}` }],
        })
      } catch (error: any) {
        if (error.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${NETWORK_CONFIG.ARBITRUM.chainId.toString(16)}`,
                chainName: NETWORK_CONFIG.ARBITRUM.chainName,
                nativeCurrency: NETWORK_CONFIG.ARBITRUM.nativeCurrency,
                rpcUrls: [NETWORK_CONFIG.ARBITRUM.rpcUrl],
                blockExplorerUrls: [NETWORK_CONFIG.ARBITRUM.blockExplorer],
              },
            ],
          })
        } else {
          throw error
        }
      }
    }

    // Format the symbol in the requested format: "Analyze_request : Symbol"
    const formattedSymbol = `Analyze_request : ${symbol.toUpperCase()}`

    // Create a dashboard link
    const dashboardLink = `https://www.notion.so/Crypto-Analytics-Dashboard-${Date.now().toString(16)}`

    console.log(`Requesting analysis with formatted symbol: ${formattedSymbol}`)
    console.log(`Dashboard link: ${dashboardLink}`)

    // Handle different ethers versions for parseEther
    let parsedEther
    if (typeof ethers.utils?.parseEther === "function") {
      // ethers v5
      parsedEther = ethers.utils.parseEther(amount)
    } else {
      // ethers v6
      parsedEther = ethers.parseEther(amount)
    }

    // Instead of using the contract ABI, we'll construct the transaction manually
    // This ensures we match the exact format that worked before
    const from = accounts[0]
    const to = ANALYSIS_REQUESTS_ADDRESS
    const value = parsedEther.toString()

    // Encode the function call data manually
    // Function selector for requestAnalysis(string,string)
    const functionSelector = "0xe87a28c5"

    // Encode the parameters
    let abiCoder
    if (typeof ethers.utils?.defaultAbiCoder?.encode === "function") {
      // ethers v5
      abiCoder = ethers.utils.defaultAbiCoder
    } else {
      // ethers v6
      abiCoder = ethers.AbiCoder.defaultAbiCoder()
    }

    const encodedParams = abiCoder
      .encode(
        ["string", "string"],
        [formattedSymbol, ""], // Empty string for the second parameter
      )
      .slice(2) // Remove the 0x prefix

    // Find the section where we construct the transaction data
    // Replace this code:

    // With this corrected version that ensures no duplicate 0x prefixes:
    const data = functionSelector.startsWith("0x")
      ? `${functionSelector}${encodedParams}`
      : `0x${functionSelector}${encodedParams}`

    console.log("Sending transaction with data:", data)

    // Get the current gas price
    const gasPrice = await window.ethereum.request({
      method: "eth_gasPrice",
    })

    // Set a reasonable gas limit for this transaction
    // 300,000 is a conservative estimate for a contract call with string parameters
    const gasLimit = "0x493e0" // 300,000 in hex

    // Check if user has enough balance
    const balance = await window.ethereum.request({
      method: "eth_getBalance",
      params: [from, "latest"],
    })

    // Calculate the maximum transaction cost (gas limit * gas price + value)
    const gasCost = BigInt(Number.parseInt(gasLimit, 16)) * BigInt(Number.parseInt(gasPrice, 16))
    const totalCost = gasCost + BigInt(value)

    // Format the total cost for display - fixed to handle both ethers v5 and v6
    let formattedTotalCost
    if (typeof ethers.utils?.formatEther === "function") {
      // ethers v5
      formattedTotalCost = ethers.utils.formatEther(totalCost.toString())
    } else {
      // ethers v6
      formattedTotalCost = ethers.formatEther(totalCost.toString())
    }

    if (BigInt(balance) < totalCost) {
      throw new Error(`Insufficient funds for transaction. You need at least ${formattedTotalCost} ETH.`)
    }

    // Send the transaction with explicit gas parameters
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [
        {
          from,
          to,
          value: `0x${BigInt(value).toString(16)}`,
          data,
          gas: gasLimit,
          gasPrice,
        },
      ],
    })

    console.log("Transaction sent:", txHash)
    return { txHash }
  } catch (error) {
    console.error("Error in requestAnalysis:", error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("user rejected")) {
        throw new Error("Transaction was rejected by user")
      } else if (error.message.includes("insufficient funds")) {
        throw new Error("Insufficient funds for transaction")
      }
    }

    throw error
  }
}

// Store request in local storage
export function saveRequest(address: string, request: any) {
  if (typeof window === "undefined") return

  const key = `requests_${address.toLowerCase()}`
  const existing = JSON.parse(localStorage.getItem(key) || "[]")

  // Check if this request already exists
  const existingIndex = existing.findIndex((req: any) => req.txHash === request.txHash)

  if (existingIndex >= 0) {
    // Update existing request
    existing[existingIndex] = { ...existing[existingIndex], ...request }
  } else {
    // Add new request
    existing.push(request)
  }

  localStorage.setItem(key, JSON.stringify(existing))
  return request
}

export async function getUserRequests(address: string): Promise<AnalysisRequest[]> {
  try {
    // First try to get from contract
    const provider = await getProvider()
    const contract = new ethers.Contract(ANALYSIS_REQUESTS_ADDRESS, ANALYSIS_REQUESTS_ABI, provider)

    try {
      const requests = await contract.getUserRequests(address)
      return requests.map((req: any) => ({
        symbol: req.requestedSymbol,
        timestamp: Number(req.timestamp) * 1000,
        paymentMethod: req.paymentSymbol,
        amount: formatEtherValue(req.amount),
        txHash: req.txHash || "",
        completed: req.completed,
        resultHash: req.resultHash,
      }))
    } catch (contractError) {
      console.warn("Failed to fetch from contract, falling back to Arbiscan:", contractError)

      // Fallback to Arbiscan
      const transactions = await getTransactionsByAddress(address)
      const analysisRequests = transactions
        .filter((tx) => tx.to.toLowerCase() === ANALYSIS_REQUESTS_ADDRESS.toLowerCase())
        .map((tx) => ({
          symbol: decodeSymbolFromData(tx.input) || "Unknown",
          timestamp: Number.parseInt(tx.timeStamp) * 1000,
          paymentMethod: tx.value === "0" ? "TOKEN" : "ETH",
          amount: formatEtherValue(tx.value),
          txHash: tx.hash,
          completed: tx.txreceipt_status === "1",
          resultHash: "",
        }))

      return analysisRequests
    }
  } catch (error) {
    console.error("Error getting user requests:", error)

    // Final fallback to local storage
    const key = `requests_${address.toLowerCase()}`
    const localRequests = JSON.parse(localStorage.getItem(key) || "[]")
    return localRequests
  }
}

export async function getRequestByTxHash(txHash: string) {
  try {
    // First try to get from contract
    const provider = await getProvider()
    const contract = new ethers.Contract(ANALYSIS_REQUESTS_ADDRESS, ANALYSIS_REQUESTS_ABI, provider)

    try {
      const request = await contract.getRequestByTxHash(txHash)
      return {
        symbol: request.requestedSymbol,
        timestamp: Number(request.timestamp) * 1000,
        paymentMethod: request.paymentSymbol,
        amount: formatEtherValue(request.amount),
        completed: request.completed,
        resultHash: request.resultHash,
      }
    } catch (contractError) {
      console.warn("Failed to fetch from contract, falling back to Arbiscan:", contractError)

      // Fallback to Arbiscan
      const tx = await getTransactionByHash(txHash)
      if (!tx) throw new Error("Transaction not found")

      return {
        symbol: decodeSymbolFromData(tx.input) || "Unknown",
        timestamp: Date.now(), // We don't have the exact timestamp from this API call
        paymentMethod: tx.value === "0x0" ? "TOKEN" : "ETH",
        amount: formatEtherValue(tx.value),
        completed: await verifyTransactionStatus(txHash),
        resultHash: "",
      }
    }
  } catch (error) {
    console.error("Error getting request by txHash:", error)
    throw error
  }
}

export async function getAnalysisResults(address: string) {
  try {
    // Helper function to get the event signature hash
    const getEventSignatureHash = (signature: string) => {
      if (typeof ethers.utils?.id === "function") {
        // ethers v5
        return ethers.utils.id(signature)
      } else {
        // ethers v6
        return ethers.id(signature)
      }
    }

    const events = await getContractEvents(
      ANALYSIS_REQUESTS_ADDRESS,
      0,
      99999999,
      getEventSignatureHash("AnalysisCompleted(bytes32,string)"),
    )

    const results = events.map((event: any) => {
      // Helper function to decode event data
      const decodeEventData = (data: string, types: string[]) => {
        if (typeof ethers.utils?.defaultAbiCoder?.decode === "function") {
          // ethers v5
          return ethers.utils.defaultAbiCoder.decode(types, data)
        } else {
          // ethers v6
          return ethers.AbiCoder.defaultAbiCoder().decode(types, data)
        }
      }

      const decoded = decodeEventData(event.data, ["bytes32", "string"])

      return {
        txHash: decoded[0],
        resultHash: decoded[1],
        timestamp: Number.parseInt(event.timeStamp) * 1000,
      }
    })

    return results
  } catch (error) {
    console.error("Error getting analysis results:", error)
    return []
  }
}

async function getProvider(requestPermission = false) {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Please install MetaMask")
  }

  try {
    const accounts = await window.ethereum.request({
      method: requestPermission ? "eth_requestAccounts" : "eth_accounts",
    })

    if (!accounts || accounts.length === 0) {
      throw new Error("Please connect your wallet first")
    }

    // Handle different ethers versions
    if (typeof ethers.providers?.Web3Provider === "function") {
      // ethers v5
      return new ethers.providers.Web3Provider(window.ethereum)
    } else {
      // ethers v6
      return new ethers.BrowserProvider(window.ethereum)
    }
  } catch (error) {
    console.error("Error creating provider:", error)
    throw error
  }
}

async function ensureArbitrumNetwork(provider) {
  const network = await provider.getNetwork()
  const chainId = Number(network.chainId)

  if (chainId !== NETWORK_CONFIG.ARBITRUM.chainId) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${NETWORK_CONFIG.ARBITRUM.chainId.toString(16)}` }],
      })
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${NETWORK_CONFIG.ARBITRUM.chainId.toString(16)}`,
              chainName: NETWORK_CONFIG.ARBITRUM.chainName,
              nativeCurrency: NETWORK_CONFIG.ARBITRUM.nativeCurrency,
              rpcUrls: [NETWORK_CONFIG.ARBITRUM.rpcUrl],
              blockExplorerUrls: [NETWORK_CONFIG.ARBITRUM.blockExplorer],
            },
          ],
        })
      } else {
        throw switchError
      }
    }
    return await getProvider()
  }
  return provider
}

// Helper function to format ether values consistently
function formatEtherValue(value: any): string {
  try {
    if (typeof ethers.utils?.formatEther === "function") {
      // ethers v5
      return ethers.utils.formatEther(value)
    } else {
      // ethers v6
      return ethers.formatEther(value)
    }
  } catch (error) {
    console.error("Error formatting ether value:", error, value)
    return "0"
  }
}

// Add a function to get the current ETH price for analysis
export async function getAnalysisPrice(): Promise<string> {
  try {
    if (typeof window === "undefined") {
      console.log("Running on server, returning default price")
      return "0.003" // Default price when running on server
    }

    if (!window.ethereum) {
      console.log("No ethereum provider found, returning default price")
      return "0.003" // Default price when no provider is available
    }

    console.log("Creating provider...")
    let provider

    // Check which version of ethers we're using
    if (typeof ethers.providers?.Web3Provider === "function") {
      // ethers v5
      console.log("Using ethers v5 Web3Provider")
      provider = new ethers.providers.Web3Provider(window.ethereum)
    } else {
      // ethers v6
      console.log("Using ethers v6 BrowserProvider")
      provider = new ethers.BrowserProvider(window.ethereum)
    }

    console.log("Creating contract instance...")
    const contract = new ethers.Contract(ANALYSIS_REQUESTS_ADDRESS, ANALYSIS_REQUESTS_ABI, provider)

    try {
      console.log("Calling contract.ethPrice()...")
      const price = await contract.ethPrice()
      console.log("Contract returned price:", price)

      // Format the price using our helper function
      const formattedPrice = formatEtherValue(price)
      console.log("Formatted price:", formattedPrice)
      return formattedPrice
    } catch (error) {
      console.warn("Error getting price from contract:", error)
      return "0.003" // Default price if contract call fails
    }
  } catch (error) {
    console.error("Error getting analysis price:", error)
    return "0.003" // Default fallback price
  }
}

// Updated function to decode the symbol from transaction input data based on the exact format
export function decodeSymbolFromData(inputData: string): string | null {
  try {
    console.log("Decoding symbol from input data:", inputData)

    if (!inputData || inputData === "0x") {
      console.log("Empty input data")
      return null
    }

    // Method 1: Try to extract symbol from position 237 (as specified by user)
    try {
      if (inputData.length >= 237 * 2) {
        // Each byte is 2 hex chars
        const hexData = inputData.slice(2) // Remove 0x prefix

        // Start from position 237 (byte position, which is 474 in hex string)
        let symbolHex = ""
        let pos = 474 // 237 * 2

        // Read until we hit a null byte or end of string
        while (pos < hexData.length) {
          const byteValue = hexData.substr(pos, 2)
          const charCode = Number.parseInt(byteValue, 16)

          if (charCode === 0) {
            break // Stop at null terminator
          }

          // Only add printable ASCII characters
          if (charCode >= 32 && charCode <= 126) {
            symbolHex += byteValue
          }

          pos += 2
        }

        // Convert hex to string
        let symbol = ""
        for (let i = 0; i < symbolHex.length; i += 2) {
          const charCode = Number.parseInt(symbolHex.substr(i, 2), 16)
          symbol += String.fromCharCode(charCode)
        }

        // Extract the actual symbol from "Analyze_request : SYMBOL" format
        const match = symbol.match(/Analyze_request\s*:\s*([A-Za-z0-9]+)/)
        if (match && match[1]) {
          console.log("Found symbol using position 237 method:", match[1])
          return match[1].toUpperCase()
        }
      }
    } catch (e) {
      console.error("Error in method 1 (position 237):", e)
    }

    // Method 2: Try to decode as a function call
    try {
      // Get the function selector for requestAnalysis(string,string)
      let functionSelector
      if (typeof ethers.utils?.id === "function") {
        // ethers v5
        functionSelector = ethers.utils.id("requestAnalysis(string,string)").slice(0, 10)
      } else {
        // ethers v6
        functionSelector = ethers.id("requestAnalysis(string,string)").slice(0, 10)
      }

      if (inputData.startsWith(functionSelector)) {
        const dataWithoutSelector = "0x" + inputData.slice(10)

        // Decode the function parameters
        let decoded
        if (typeof ethers.utils?.defaultAbiCoder?.decode === "function") {
          // ethers v5
          decoded = ethers.utils.defaultAbiCoder.decode(["string", "string"], dataWithoutSelector)
        } else {
          // ethers v6
          decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string", "string"], dataWithoutSelector)
        }

        if (decoded && decoded.length >= 1) {
          console.log("Found symbol using ABI decoding:", decoded[0])
          return decoded[0].toUpperCase()
        }
      }
    } catch (e) {
      console.error("Error in method 2 (ABI decoding):", e)
    }

    // Method 3: Look for common cryptocurrency symbols in the data
    try {
      const hexData = inputData.startsWith("0x") ? inputData.slice(2) : inputData
      let asciiData = ""

      // Convert hex to ASCII
      for (let i = 0; i < hexData.length; i += 2) {
        if (i + 1 < hexData.length) {
          const charCode = Number.parseInt(hexData.substr(i, 2), 16)
          if (charCode >= 32 && charCode <= 126) {
            // Printable ASCII range
            asciiData += String.fromCharCode(charCode)
          }
        }
      }

      // Common cryptocurrency symbols to look for
      const commonSymbols = [
        "BTC",
        "ETH",
        "USDT",
        "BNB",
        "XRP",
        "ADA",
        "SOL",
        "DOT",
        "DOGE",
        "AVAX",
        "MATIC",
        "LINK",
        "UNI",
        "YHN",
        "WS", // Added WS to the list of common symbols
      ]

      for (const symbol of commonSymbols) {
        if (asciiData.includes(symbol)) {
          console.log("Found symbol using common symbols search:", symbol)
          return symbol
        }
      }

      // Look for patterns like "symbol: XYZ" or "Symbol: XYZ" or "SYMBOL: XYZ"
      const symbolPattern = /[Ss][Yy][Mm][Bb][Oo][Ll]\s*:\s*([A-Za-z0-9]{2,6})/
      const symbolMatch = asciiData.match(symbolPattern)

      if (symbolMatch && symbolMatch[1]) {
        console.log("Found symbol using pattern matching:", symbolMatch[1])
        return symbolMatch[1].toUpperCase()
      }
    } catch (e) {
      console.error("Error in method 3 (common symbols):", e)
    }

    console.log("Could not decode symbol from input data")
    return null
  } catch (error) {
    console.error("Error decoding symbol from data:", error)
    return null
  }
}

// New function to extract metrics from transaction input data
export function extractMetricsFromData(inputData: string, symbol: string): { [key: string]: string | number } {
  try {
    const metrics: { [key: string]: string | number } = {
      Symbol: symbol,
    }

    // Add timestamp
    metrics["Timestamp"] = new Date().toISOString()

    // Try to extract other metrics from the input data
    try {
      const hexData = inputData.startsWith("0x") ? inputData.slice(2) : inputData
      let asciiData = ""

      // Convert hex to ASCII
      for (let i = 0; i < hexData.length; i += 2) {
        if (i + 1 < hexData.length) {
          const charCode = Number.parseInt(hexData.substr(i, 2), 16)
          if (charCode >= 32 && charCode <= 126) {
            // Printable ASCII range
            asciiData += String.fromCharCode(charCode)
          }
        }
      }

      // Look for patterns like "metric: value"
      const metricPattern = /([A-Za-z_]+)\s*:\s*([A-Za-z0-9.]+)/g
      let match

      while ((match = metricPattern.exec(asciiData)) !== null) {
        const metricName = match[1].trim()
        const metricValue = match[2].trim()

        if (metricName && metricValue && metricName !== "Symbol") {
          metrics[metricName] = isNaN(Number(metricValue)) ? metricValue : Number(metricValue)
        }
      }
    } catch (e) {
      console.error("Error extracting metrics:", e)
    }

    return metrics
  } catch (error) {
    console.error("Error extracting metrics from data:", error)
    return { Symbol: symbol }
  }
}

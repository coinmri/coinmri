"use client"

import { useState, useEffect } from "react"
import { getTransactionsByAddressAndContract, verifyApiKey } from "@/lib/arbiscanService"
import { extractMetricsFromData } from "@/lib/contractService"
import { ethers } from "ethers"
import { Loader2, ExternalLink, AlertTriangle, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink as ExternalLinkComponent } from "@/components/ui/external-link"
import { getUserRequests, getAnalysisResults } from "@/lib/contractService"
import { NETWORK_CONFIG } from "@/lib/web3Config"
import React from "react"

// Specific contract address provided by the user
const ANALYSIS_CONTRACT_ADDRESS = "0x7338d8748D48E198C007cbCc3Cd75934A0f34a41"
// Admin address that provides analysis results
const ADMIN_ADDRESS = "0x837f5E0FbabD0b1c3482B6Ad10fA39275bDA252e"
// Use the exact API key provided by the user
const ARBISCAN_API_KEY = "Q7F6Q2ITCZJWT98X4FFXJ1RQ9NRWGZWXWK"

interface Transaction {
  hash: string
  timeStamp: string
  from: string
  to: string
  value: string
  input: string
  isError: string
  txreceipt_status: string
  confirmations: string
  symbol?: string
  metrics?: {
    [key: string]: string | number
  }
  dashboardLink?: string
  isCompleted?: boolean
}

interface AnalysisRequestsTableProps {
  address: string
  showTitle?: boolean
  adminTransactions?: any[]
}

export function AnalysisRequestsTable({
  address,
  showTitle = true,
  adminTransactions = [],
}: AnalysisRequestsTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyStatus, setApiKeyStatus] = useState<"unknown" | "valid" | "invalid">("unknown")
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [adminTransactionsState, setAdminTransactionsState] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [tableLoading, setTableLoading] = useState(true)

  // Memoize the checkSymbolInAdminTransactionsNew function
  const memoizedCheckSymbol = React.useCallback(
    (symbol: string, adminTxs: any[]) => {
      return checkSymbolInAdminTransactionsNew(symbol, adminTxs)
    },
    [], // Empty dependency array means this function is created once
  )

  // Function to clean up symbol format - extract just the symbol part
  const formatSymbol = (symbol: string): string => {
    if (!symbol) return "Unknown"

    // Check if the symbol has the "ANALYZE_REQUEST : " prefix or similar
    const prefixPattern = /^(?:ANALYZE_REQUEST|Analyze_request|Analyze request)\s*:\s*/i
    if (prefixPattern.test(symbol)) {
      // Remove the prefix and return just the symbol part
      return symbol.replace(prefixPattern, "").trim()
    }

    return symbol
  }

  // Function to decode ABI-encoded data
  const decodeAbiData = (input: string): { symbol: string; dashboardLink: string } | null => {
    try {
      if (!input || !input.startsWith("0x")) return null

      // Try to decode using ethers
      try {
        // Define the ABI for the function
        const abi = ["function submitAnalysisRequest(address user, string symbol, string dashboardLink)"]

        // Create an interface from the ABI
        let iface
        if (typeof ethers.utils?.Interface === "function") {
          // ethers v5
          iface = new ethers.utils.Interface(abi)
        } else {
          // ethers v6
          iface = new ethers.Interface(abi)
        }

        // Decode the input data
        const decoded = iface.parseTransaction({ data: input })

        if (decoded && decoded.args) {
          // Extract symbol and dashboardLink from the decoded data
          const symbol = decoded.args[1] || ""
          const dashboardLink = decoded.args[2] || ""

          console.log(`Decoded ABI data - Symbol: ${symbol}, Link: ${dashboardLink}`)
          return { symbol, dashboardLink }
        }
      } catch (e) {
        console.log("Error decoding with ethers:", e)
      }

      // Fallback: Manual decoding for specific format
      // This is a simplified approach for the specific format we've seen
      const hexData = input.slice(2) // Remove 0x prefix

      // Convert hex to string and look for patterns
      const stringData = Buffer.from(hexData, "hex").toString()

      // Look for "Analyze_request : " pattern
      const symbolMatch = stringData.match(/(?:ANALYZE_REQUEST|Analyze_request|Analyze request)\s*:\s*([^\0]+)/i)
      const symbol = symbolMatch ? symbolMatch[1].trim() : ""

      // Look for http/https URL
      const urlMatch = stringData.match(/(https?:\/\/[^\0]+)/i)
      const dashboardLink = urlMatch ? urlMatch[1].trim() : ""

      if (symbol || dashboardLink) {
        console.log(`Manually decoded - Symbol: ${symbol}, Link: ${dashboardLink}`)
        return { symbol, dashboardLink }
      }

      return null
    } catch (e) {
      console.error("Error decoding ABI data:", e)
      return null
    }
  }

  // Verify API key on component mount
  useEffect(() => {
    async function checkApiKey() {
      try {
        const isValid = await verifyApiKey(ARBISCAN_API_KEY)
        setApiKeyStatus(isValid ? "valid" : "invalid")
        if (!isValid) {
          console.error("Arbiscan API key is invalid or has reached its rate limit")
        }
      } catch (err) {
        console.error("Error verifying API key:", err)
        setApiKeyStatus("invalid")
      }
    }

    checkApiKey()
  }, [])

  // Get the connected address from localStorage or props
  useEffect(() => {
    // First try to use the address prop
    if (address) {
      console.log("Using provided address:", address)
      setConnectedAddress(address)
      return
    }

    // If no address prop, try to get from localStorage
    const storedAddress = localStorage.getItem("connectedAddress")
    if (storedAddress) {
      console.log("Using stored address from localStorage:", storedAddress)
      setConnectedAddress(storedAddress)
      return
    }

    // If still no address, try to get from MetaMask
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            console.log("Using address from MetaMask:", accounts[0])
            setConnectedAddress(accounts[0])
          } else {
            console.log("No connected accounts found in MetaMask")
            setError("Please connect your wallet to view transactions")
          }
        })
        .catch((err: any) => {
          console.error("Error getting accounts from MetaMask:", err)
          setError("Error connecting to wallet")
        })
    } else {
      console.log("MetaMask not available")
      setError("MetaMask not detected. Please install MetaMask to view transactions.")
    }
  }, [address])

  // Function to fetch transactions directly from Arbiscan API
  const fetchTransactionsDirectly = async (walletAddress: string): Promise<any[]> => {
    console.log(`Fetching transactions directly for address ${walletAddress} to contract ${ANALYSIS_CONTRACT_ADDRESS}`)
    console.log(`Using API key: ${ARBISCAN_API_KEY}`)

    try {
      // Construct the API URL with proper parameters
      const apiUrl = `https://api.arbiscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`
      console.log(`API URL: ${apiUrl}`)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Direct API response:", data)
      console.log("Direct API response status:", data.status, "message:", data.message)

      if (data.status !== "1") {
        console.warn("Arbiscan API returned an error:", data.message)
        return []
      }

      // Filter transactions to only include those to the contract address
      const normalizedContractAddress = ANALYSIS_CONTRACT_ADDRESS.toLowerCase()
      const filteredTxs = data.result.filter((tx: any) => {
        const toAddress = tx.to ? tx.to.toLowerCase() : ""
        const isMatch = toAddress === normalizedContractAddress

        if (isMatch) {
          console.log(`Found matching transaction: ${tx.hash}`)
        }

        return isMatch
      })

      console.log(`Found ${filteredTxs.length} transactions via direct API call`)

      // Log the first transaction for debugging
      if (filteredTxs.length > 0) {
        console.log("First transaction:", {
          hash: filteredTxs[0].hash,
          from: filteredTxs[0].from,
          to: filteredTxs[0].to,
          input: filteredTxs[0].input.substring(0, 50) + "...", // Log just the beginning of input
        })
      }

      return filteredTxs
    } catch (error) {
      console.error("Error fetching transactions directly:", error)
      return []
    }
  }

  // Function to fetch transactions from the admin to the contract
  const fetchAdminTransactions = async (): Promise<any[]> => {
    console.log(`Fetching transactions from admin ${ADMIN_ADDRESS} to contract ${ANALYSIS_CONTRACT_ADDRESS}`)

    try {
      // Construct the API URL with proper parameters
      const apiUrl = `https://api.arbiscan.io/api?module=account&action=txlist&address=${ADMIN_ADDRESS}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`
      console.log(`Admin API URL: ${apiUrl}`)

      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Admin API response:", data)

      if (data.status !== "1") {
        console.warn("Arbiscan API returned an error for admin transactions:", data.message)
        return []
      }

      // Filter transactions to only include those to the contract address
      const normalizedContractAddress = ANALYSIS_CONTRACT_ADDRESS.toLowerCase()
      const filteredTxs = data.result.filter((tx: any) => {
        const toAddress = tx.to ? tx.to.toLowerCase() : ""
        const isMatch = toAddress === normalizedContractAddress

        if (isMatch) {
          console.log(`Found matching admin transaction: ${tx.hash}`)
        }

        return isMatch
      })

      console.log(`Found ${filteredTxs.length} admin transactions to contract`)
      return filteredTxs
    } catch (error) {
      console.error("Error fetching admin transactions:", error)
      return []
    }
  }

  // Function to fetch transactions from the contract and filter by sender
  const fetchTransactionsFromContract = async (walletAddress: string): Promise<any[]> => {
    console.log(
      `Fetching transactions from contract ${ANALYSIS_CONTRACT_ADDRESS} and filtering by sender ${walletAddress}`,
    )

    try {
      const response = await fetch(
        `https://api.arbiscan.io/api?module=account&action=txlist&address=${ANALYSIS_CONTRACT_ADDRESS}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Contract transactions API response:", data)

      if (data.status !== "1") {
        console.warn("Arbiscan API returned an error:", data.message)
        return []
      }

      // Filter transactions to only include those from the wallet address
      const filteredTxs = data.result.filter((tx: any) => {
        const fromAddress = tx.from ? tx.from.toLowerCase() : ""
        const userAddress = walletAddress.toLowerCase()
        const isMatch = fromAddress === userAddress

        if (isMatch) {
          console.log(`Found matching transaction from user: ${tx.hash}`)
        }

        return isMatch
      })

      console.log(`Found ${filteredTxs.length} transactions from user to contract`)
      return filteredTxs
    } catch (error) {
      console.error("Error fetching transactions from contract:", error)
      return []
    }
  }

  // Function to try fetching with a different API endpoint
  const fetchTransactionsAlternative = async (walletAddress: string): Promise<any[]> => {
    console.log(`Trying alternative API endpoint for address ${walletAddress}`)

    try {
      // Try the internal transactions endpoint
      const response = await fetch(
        `https://api.arbiscan.io/api?module=account&action=txlistinternal&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Alternative API response:", data)

      if (data.status !== "1") {
        console.warn("Alternative Arbiscan API returned an error:", data.message)
        return []
      }

      // Filter transactions to only include those to/from the contract address
      const normalizedContractAddress = ANALYSIS_CONTRACT_ADDRESS.toLowerCase()
      const filteredTxs = data.result.filter((tx: any) => {
        const toAddress = tx.to ? tx.to.toLowerCase() : ""
        const fromAddress = tx.from ? tx.from.toLowerCase() : ""
        const isMatch = toAddress === normalizedContractAddress || fromAddress === normalizedContractAddress

        if (isMatch) {
          console.log(`Found matching internal transaction: ${tx.hash}`)
        }

        return isMatch
      })

      console.log(`Found ${filteredTxs.length} internal transactions via alternative API call`)
      return filteredTxs
    } catch (error) {
      console.error("Error fetching alternative transactions:", error)
      return []
    }
  }

  // Function to check if a symbol exists in admin transactions
  const checkSymbolInAdminTransactions = (symbol: string, adminTxs: any[]): { link: string; hash: string } | null => {
    if (!symbol || symbol === "Unknown") return null

    // Clean up the symbol for comparison
    const cleanSymbol = formatSymbol(symbol).toLowerCase()
    console.log(`Checking for symbol "${cleanSymbol}" in admin transactions`)

    // Look for admin transactions that contain this symbol
    for (const adminTx of adminTxs) {
      try {
        // Decode the admin transaction data
        const decodedData = decodeAbiData(adminTx.input)

        if (decodedData) {
          const adminSymbol = formatSymbol(decodedData.symbol).toLowerCase()
          console.log(
            `Admin transaction ${adminTx.hash} has symbol: "${decodedData.symbol}" (cleaned: "${adminSymbol}")`,
          )
          console.log(`Comparing with user symbol: "${cleanSymbol}"`)

          // If the symbols match, return the dashboard link
          if (adminSymbol === cleanSymbol) {
            console.log(`MATCH FOUND! Symbols match: "${adminSymbol}" === "${cleanSymbol}"`)
            console.log(`Dashboard link: ${decodedData.dashboardLink}`)

            return {
              hash: adminTx.hash,
              link: decodedData.dashboardLink,
            }
          }
        }
      } catch (error) {
        console.error(`Error processing admin transaction ${adminTx.hash}:`, error)
      }
    }

    console.log(`No matching admin transaction found for symbol "${cleanSymbol}"`)
    return null
  }

  const fetchTransactions = async () => {
    if (!connectedAddress) {
      console.error("No connected address available")
      setError("No wallet address available. Please connect your wallet.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Log the addresses we're working with for debugging
      console.log(`Connected wallet address: ${connectedAddress}`)
      console.log(`Contract address: ${ANALYSIS_CONTRACT_ADDRESS}`)
      console.log(`Admin address: ${ADMIN_ADDRESS}`)

      // Normalize addresses for consistent comparison
      const normalizedWalletAddress = connectedAddress.toLowerCase()
      const normalizedContractAddress = ANALYSIS_CONTRACT_ADDRESS.toLowerCase()

      console.log(`Normalized wallet address: ${normalizedWalletAddress}`)
      console.log(`Normalized contract address: ${normalizedContractAddress}`)

      console.log(`Fetching transactions between wallet and contract...`)

      // Try multiple methods to find transactions
      let txs: any[] = []

      // Method 1: Direct API call to Arbiscan - most reliable method
      console.log("Method 1: Fetching directly from Arbiscan API...")
      txs = await fetchTransactionsDirectly(normalizedWalletAddress)
      console.log(`Method 1 found ${txs.length} transactions`)

      // Method 2: Use our helper function as backup
      if (txs.length === 0) {
        console.log("Method 2: Using helper function...")
        txs = await getTransactionsByAddressAndContract(normalizedWalletAddress, normalizedContractAddress)
        console.log(`Method 2 found ${txs.length} transactions`)
      }

      // Method 3: Get contract transactions and filter by from address
      if (txs.length === 0) {
        console.log("Method 3: Fetching contract transactions...")
        txs = await fetchTransactionsFromContract(normalizedWalletAddress)
        console.log(`Method 3 found ${txs.length} transactions`)
      }

      // Method 4: Try fetching all transactions for the wallet and manually filter
      if (txs.length === 0) {
        console.log("Method 4: Fetching all wallet transactions and manually filtering...")
        const allTxs = await fetch(
          `https://api.arbiscan.io/api?module=account&action=txlist&address=${normalizedWalletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
        ).then((res) => res.json())

        if (allTxs.status === "1" && Array.isArray(allTxs.result)) {
          console.log(`Found ${allTxs.result.length} total transactions for wallet`)

          // Filter transactions to the contract
          txs = allTxs.result.filter((tx) => {
            const toAddress = tx.to ? tx.to.toLowerCase() : ""
            const isMatch = toAddress === normalizedContractAddress
            if (isMatch) {
              console.log(`Found matching transaction: ${tx.hash}`)
            }
            return isMatch
          })

          console.log(`Method 4 found ${txs.length} transactions`)
        }
      }

      // Method 5: Try alternative API endpoints
      if (txs.length === 0) {
        console.log("Method 5: Trying alternative API endpoints...")
        txs = await fetchTransactionsAlternative(normalizedWalletAddress)
        console.log(`Method 5 found ${txs.length} transactions`)
      }

      if (txs.length === 0) {
        console.log("No transactions found between wallet and contract")
        setError(
          "No transactions found between your wallet and the contract. If you've made transactions, they may not be indexed yet.",
        )
      } else {
        // Fetch admin transactions to check for completed analyses
        console.log("Fetching admin transactions...")
        const adminTxs = await fetchAdminTransactions()
        // Only update state if the values are different to prevent unnecessary re-renders
        if (JSON.stringify(adminTxs) !== JSON.stringify(adminTransactionsState)) {
          setAdminTransactionsState(adminTxs)
        }
        console.log(`Found ${adminTxs.length} admin transactions`)

        // Look specifically for WS symbol in admin transactions for debugging
        console.log("Checking specifically for WS symbol in admin transactions...")
        adminTxs.forEach((tx) => {
          try {
            const decodedData = decodeAbiData(tx.input)
            if (decodedData) {
              const adminSymbol = formatSymbol(decodedData.symbol).toLowerCase()
              if (adminSymbol === "ws") {
                console.log(`Found WS in admin transaction ${tx.hash}: "${decodedData.symbol}"`)
                console.log(`Dashboard link: ${decodedData.dashboardLink}`)
              }
            }
          } catch (error) {
            console.error(`Error checking admin transaction ${tx.hash} for WS:`, error)
          }
        })

        // Process transactions to extract symbols and metrics
        const processedTxs = txs.map((tx) => {
          console.log(`Processing transaction ${tx.hash}`)
          console.log(`Input data: ${tx.input}`)

          // Decode the transaction data
          const decodedData = decodeAbiData(tx.input)
          const symbol = decodedData ? formatSymbol(decodedData.symbol) : "Unknown"
          console.log(`Decoded symbol: ${symbol}`)

          // Extract metrics from input data
          const metrics = extractMetricsFromData(tx.input, symbol)
          console.log("Extracted metrics:", metrics)

          // Check if there's a matching admin transaction for this symbol
          const matchingAdminTx = checkSymbolInAdminTransactions(symbol, adminTxs)

          return {
            ...tx,
            symbol,
            metrics,
            dashboardLink: matchingAdminTx?.link || null,
            isCompleted: !!matchingAdminTx,
          }
        })

        setTransactions(processedTxs)
        console.log(`Found ${processedTxs.length} transactions`)
      }
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch transactions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (connectedAddress) {
      fetchTransactions()
    }
  }, [connectedAddress])

  const formatDate = (timestamp: string) => {
    return new Date(Number.parseInt(timestamp) * 1000).toLocaleString()
  }

  const formatEth = (value: string) => {
    try {
      // Handle different ethers versions
      if (typeof ethers.utils?.formatEther === "function") {
        return Number.parseFloat(ethers.utils.formatEther(value)).toFixed(6) + " ETH"
      } else {
        return Number.parseFloat(ethers.formatEther(value)).toFixed(6) + " ETH"
      }
    } catch (e) {
      return "0 ETH"
    }
  }

  const getStatusText = (tx: Transaction) => {
    if (tx.isError === "1") return "Failed"
    if (tx.isCompleted) return "Completed"
    return "Pending"
  }

  const getStatusClass = (tx: Transaction) => {
    if (tx.isError === "1") return "text-red-500"
    if (tx.isCompleted) return "text-green-500"
    return "text-yellow-500"
  }

  // Function to format a timestamp
  const formatDateNew = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Function to format ETH amount
  const formatAmount = (amount: string) => {
    const num = Number.parseFloat(amount)
    return num.toFixed(6) + " ETH"
  }

  // Function to check if a symbol exists in admin transactions
  function checkSymbolInAdminTransactionsNew(symbol: string, adminTransactions: any[]) {
    if (!symbol || !adminTransactions || adminTransactions.length === 0) {
      return null
    }

    // Helper function to clean up symbols for comparison
    const formatSymbol = (s: string) => {
      // Remove common prefixes and suffixes, trim, and convert to uppercase
      return s
        .replace(/^Analyze_request\s*:\s*/, "")
        .replace(/\s+/g, "")
        .trim()
        .toUpperCase()
    }

    // Format the input symbol
    const formattedSymbol = formatSymbol(symbol)

    console.log(`Looking for symbol: "${formattedSymbol}" in admin transactions`)

    // Debug: Log all admin transactions to check for WS specifically
    console.log("DEBUG - All admin transactions:")
    adminTransactions.forEach((tx, index) => {
      const txSymbol = tx.input && typeof tx.input === "string" ? extractSymbolFromInput(tx.input) : null

      console.log(`Admin TX ${index}: ${txSymbol || "No symbol found"} (Hash: ${tx.hash})`)

      // Special check for WS
      if (formattedSymbol === "WS") {
        console.log(`WS check - TX input: ${tx.input?.substring(0, 100)}...`)
        if (tx.input && tx.input.includes("WS")) {
          console.log(`Found WS in transaction input: ${tx.hash}`)
        }
      }
    })

    // First try to find an exact match
    for (const tx of adminTransactions) {
      const txSymbol = tx.input && typeof tx.input === "string" ? extractSymbolFromInput(tx.input) : null

      if (txSymbol && formatSymbol(txSymbol) === formattedSymbol) {
        console.log(`Found exact match for ${formattedSymbol} in transaction ${tx.hash}`)
        return tx
      }
    }

    // If no exact match, try to find a partial match
    for (const tx of adminTransactions) {
      if (tx.input && typeof tx.input === "string") {
        // For WS specifically, check if it appears anywhere in the input
        if (formattedSymbol === "WS" && tx.input.includes("WS")) {
          console.log(`Found WS in transaction ${tx.hash}`)
          return tx
        }

        // For other symbols, check if the formatted symbol appears in the input
        if (tx.input.toUpperCase().includes(formattedSymbol)) {
          console.log(`Found partial match for ${formattedSymbol} in transaction ${tx.hash}`)
          return tx
        }
      }
    }

    console.log(`No match found for symbol: ${formattedSymbol}`)
    return null
  }

  // Helper function to extract symbol from transaction input
  function extractSymbolFromInput(input: string): string | null {
    try {
      // Try to find "Analyze_request : SYMBOL" pattern
      const analyzeMatch = input.match(/Analyze_request\s*:\s*([A-Za-z0-9]+)/i)
      if (analyzeMatch && analyzeMatch[1]) {
        return analyzeMatch[1]
      }

      // Try to find any standalone symbol (2-6 characters)
      const symbolMatch = input.match(/\b([A-Z]{2,6})\b/)
      if (symbolMatch && symbolMatch[1]) {
        return symbolMatch[1]
      }

      return null
    } catch (error) {
      console.error("Error extracting symbol from input:", error)
      return null
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setTableLoading(true)
        const userRequests = await getUserRequests(address)
        const analysisResults = await getAnalysisResults(address)

        // Use adminTransactionsState instead of adminTransactions prop to avoid dependency issues
        const adminTxs = adminTransactionsState.length > 0 ? adminTransactionsState : adminTransactions

        // Enhance requests with admin transaction data
        const enhancedRequests = userRequests.map((request) => {
          // Check if this request has a matching admin transaction
          const adminTx = checkSymbolInAdminTransactionsNew(request.symbol, adminTxs)

          return {
            ...request,
            hasAdminTransaction: !!adminTx,
            adminTxHash: adminTx?.hash || null,
            adminTxUrl: adminTx ? `${NETWORK_CONFIG.ARBITRUM.blockExplorer}/tx/${adminTx.hash}` : null,
          }
        })

        setRequests(enhancedRequests)
        setResults(analysisResults)
      } catch (error) {
        console.error("Error fetching requests:", error)
      } finally {
        setTableLoading(false)
      }
    }

    if (address) {
      fetchData()
    }
  }, [address]) // Remove adminTransactions from dependency array

  if (tableLoading) {
    return <div className="text-center py-4">Loading requests...</div>
  }

  if (requests.length === 0) {
    return <div className="text-center py-4">No analysis requests found.</div>
  }

  return (
    <Card className="w-full bg-gradient-to-r from-blue-950 to-black border-blue-900/50">
      <CardHeader className="flex flex-row items-center justify-between border-b border-blue-900/50">
        {showTitle ? <CardTitle className="text-white">Your Analysis Requests</CardTitle> : <div></div>}
        <div className="flex items-center gap-2">
          {connectedAddress && (
            <div className="flex items-center gap-1 text-sm text-gray-300">
              <UserCheck className="h-4 w-4" />
              <span className="hidden md:inline">Connected:</span> {connectedAddress.slice(0, 6)}...
              {connectedAddress.slice(-4)}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading || !connectedAddress}
            className="flex items-center gap-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 mb-4 p-3 bg-red-500/10 rounded-md border border-red-500/20">{error}</div>
        )}

        {!connectedAddress && !error ? (
          <div className="text-center py-8 text-gray-300">
            <p>No wallet connected</p>
            <p className="mt-2 text-sm">Please connect your wallet to view your analysis requests</p>
          </div>
        ) : transactions.length === 0 && !loading ? (
          <div className="text-center py-8 text-gray-300">
            <p>{error ? "Failed to load transactions" : "No transactions found"}</p>
            <p className="mt-2 text-sm">
              Looking for transactions from {connectedAddress} to {ANALYSIS_CONTRACT_ADDRESS}
            </p>
            <p className="mt-2 text-sm">
              <a
                href={`https://arbiscan.io/address/${connectedAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                View your address on Arbiscan
              </a>
            </p>
            <p className="mt-2 text-sm">
              <a
                href={`https://arbiscan.io/address/${ANALYSIS_CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline"
              >
                View contract on Arbiscan
              </a>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-gray-200">
              <thead>
                <tr className="border-b border-blue-800/50">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Transaction Hash</th>
                  <th className="text-left py-2 px-4">Symbol</th>
                  <th className="text-left py-2 px-4">Amount</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Result</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.hash} className="border-b border-blue-900/30 hover:bg-blue-950/50">
                      <td className="py-3 px-4">{formatDate(tx.timeStamp)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://arbiscan.io/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                          >
                            {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(tx.hash)
                            }}
                            className="text-gray-400 hover:text-gray-300"
                            title="Copy to clipboard"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {tx.symbol === "Unknown" ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span>Unknown</span>
                          </div>
                        ) : (
                          tx.symbol
                        )}
                      </td>
                      <td className="py-3 px-4">{formatEth(tx.value)}</td>
                      <td className={`py-3 px-4 ${getStatusClass(tx)}`}>{getStatusText(tx)}</td>
                      <td className="py-3 px-4 flex items-center gap-2">
                        {tx.isCompleted && tx.dashboardLink ? (
                          <ExternalLinkComponent href={tx.dashboardLink}>
                            <div className="flex items-center gap-1">
                              <span className="text-sm">View Analysis</span>
                              <ExternalLink className="h-3 w-3" />
                            </div>
                          </ExternalLinkComponent>
                        ) : (
                          <span className="text-yellow-500 text-sm">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

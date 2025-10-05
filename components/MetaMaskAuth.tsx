"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, LogOut, AlertTriangle } from "lucide-react"
import { getTransactionsBetweenAddresses } from "@/lib/arbiscanService"
import { decodeDashboardAccess } from "@/lib/transactionUtils"
import { useRouter, usePathname } from "next/navigation"

// Arbitrum network configuration
const ARBITRUM_CHAIN_ID = "0xa4b1" // 42161 in hex
const ARBITRUM_NETWORK = {
  chainId: ARBITRUM_CHAIN_ID,
  chainName: "Arbitrum One",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://arb1.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://arbiscan.io/"],
}

// Admin wallet address
const ADMIN_WALLET_ADDRESS = "0x837f5E0FbabD0b1c3482B6Ad10fA39275bDA252e"

// Arbiscan API configuration
const ARBISCAN_API_KEY = process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || "Q7F6Q2ITCZJWT98X4FFXJ1RQ9NRWGZWXWK"
const ARBISCAN_API_URL = "https://api.arbiscan.io/api"

// Function to check if the current network is Arbitrum
async function isArbitrumNetwork(): Promise<boolean> {
  if (typeof window.ethereum === "undefined") {
    return false
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" })
    return chainId === ARBITRUM_CHAIN_ID
  } catch (error) {
    console.error("Error checking network:", error)
    return false
  }
}

// Function to switch to Arbitrum network
async function switchToArbitrumNetwork(): Promise<boolean> {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed")
  }

  try {
    // Try to switch to Arbitrum
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARBITRUM_CHAIN_ID }],
    })
    return true
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add Arbitrum network
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ARBITRUM_NETWORK],
        })
        return true
      } catch (addError) {
        console.error("Error adding Arbitrum network:", addError)
        throw new Error("Failed to add Arbitrum network to MetaMask")
      }
    }
    console.error("Error switching to Arbitrum network:", switchError)
    throw new Error("Failed to switch to Arbitrum network")
  }
}

// Function to check for dashboard access transactions
async function checkForDashboardAccess(address: string) {
  if (!address) return null

  try {
    // First check local storage for cached transactions
    const storedTransactions = JSON.parse(localStorage.getItem("adminTransactions") || "[]")
    const cachedTransaction = storedTransactions.find((tx: any) => tx.address.toLowerCase() === address.toLowerCase())

    if (cachedTransaction) {
      return {
        link: cachedTransaction.link,
        symbol: cachedTransaction.symbol || "BTC", // Default to BTC if no symbol
        txHash: cachedTransaction.txHash,
      }
    }

    // If not found in cache, check Arbitrum blockchain
    console.log(`Checking Arbitrum transactions between ${ADMIN_WALLET_ADDRESS} and ${address}`)

    // In a real app, this would call the Arbiscan API
    // For now, we'll simulate by checking for transactions between admin and user
    const transactions = await getTransactionsBetweenAddresses(ADMIN_WALLET_ADDRESS, address)

    // Look for dashboard access transactions
    for (const tx of transactions) {
      if (
        tx.from.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase() &&
        tx.to.toLowerCase() === address.toLowerCase()
      ) {
        // Try to decode dashboard access data
        const decodedData = decodeDashboardAccess(tx.input)
        if (decodedData) {
          console.log("Found dashboard access transaction:", tx.hash)
          console.log("Decoded data:", decodedData)

          // Cache the transaction for future use
          const newTransaction = {
            address: address,
            symbol: decodedData.symbol,
            link: decodedData.link,
            txHash: tx.hash,
          }

          const updatedTransactions = [...storedTransactions, newTransaction]
          localStorage.setItem("adminTransactions", JSON.stringify(updatedTransactions))

          return {
            link: decodedData.link,
            symbol: decodedData.symbol,
            txHash: tx.hash,
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error checking for dashboard access:", error)
    return null
  }
}

// Fixed function to check for analysis requests on Arbitrum
async function checkForAnalysisRequests(address: string) {
  if (!address) return null

  try {
    console.log(`Checking Arbitrum transactions from ${address} to ${ADMIN_WALLET_ADDRESS}`)

    // Fetch transactions from user to admin
    const response = await fetch(
      `${ARBISCAN_API_URL}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`,
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

interface MetaMaskAuthProps {
  onConnect: (address: string) => void
  onDisconnect: () => void
}

export function MetaMaskAuth({ onConnect, onDisconnect }: MetaMaskAuthProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isCheckingTransactions, setIsCheckingTransactions] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const [isArbitrum, setIsArbitrum] = useState(false)
  const [networkSwitching, setNetworkSwitching] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  // Check for existing connection and network on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts && accounts.length > 0) {
            const address = accounts[0]
            setConnectedAddress(address)
            localStorage.setItem("connectedAddress", address)

            // Check if on Arbitrum network
            const onArbitrum = await isArbitrumNetwork()
            setIsArbitrum(onArbitrum)

            // Check if this is the admin address
            const isAdmin = address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

            if (!isAdmin) {
              // For non-admin users, check for dashboard access
              setIsCheckingTransactions(true)
              const access = await checkForDashboardAccess(address)
              setIsCheckingTransactions(false)

              if (access) {
                toast({
                  title: "Dashboard Access Found",
                  description: `You have access to a ${access.symbol} dashboard. Check the transaction history for details.`,
                })
              }
            }

            onConnect(address)
          } else {
            // No active connection, clear any stale data
            cleanupConnection()
          }
        } catch (error) {
          console.error("Error checking connection:", error)
          cleanupConnection()
        }
      }
    }

    checkConnection()
  }, [onConnect]) // Added onConnect to dependencies

  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("Accounts changed:", accounts)
      if (accounts.length === 0) {
        handleDisconnect()
      } else {
        const newAddress = accounts[0]
        setConnectedAddress(newAddress)
        localStorage.setItem("connectedAddress", newAddress)

        // Check for dashboard access for the new account
        setIsCheckingTransactions(true)
        checkForDashboardAccess(newAddress).then((access) => {
          setIsCheckingTransactions(false)
          if (access) {
            toast({
              title: "Dashboard Access Found",
              description: `You have access to a ${access.symbol} dashboard. Check the transaction history for details.`,
            })
          }
        })

        onConnect(newAddress)
      }
    }

    const handleChainChanged = async () => {
      const onArbitrum = await isArbitrumNetwork()
      setIsArbitrum(onArbitrum)
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [onConnect, onDisconnect])

  // Clean up connection state without redirecting
  const cleanupConnection = () => {
    console.log("Cleaning up connection state")
    setConnectedAddress(null)
    localStorage.removeItem("connectedAddress")
    onDisconnect()
  }

  // Update the handleConnect function to check for Arbitrum network
  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask")
      }

      // First request permissions
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      })

      // Then get accounts
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (!accounts || accounts.length === 0) {
        throw new Error("Please connect to MetaMask")
      }

      const address = accounts[0]
      console.log("Connected address:", address)
      setConnectedAddress(address)
      localStorage.setItem("connectedAddress", address)

      // Check if on Arbitrum network
      const onArbitrum = await isArbitrumNetwork()
      setIsArbitrum(onArbitrum)

      // Check if this is the admin address
      const isAdmin = address.toLowerCase() === ADMIN_WALLET_ADDRESS.toLowerCase()

      if (!isAdmin) {
        // For non-admin users, check for dashboard access
        setIsCheckingTransactions(true)
        const access = await checkForDashboardAccess(address)
        setIsCheckingTransactions(false)

        if (access) {
          toast({
            title: "Dashboard Access Found",
            description: `You have access to a ${access.symbol} dashboard. Check the transaction history for details.`,
          })
        }

        // For non-admin users, check for analysis requests
        try {
          const requests = await checkForAnalysisRequests(address)
          if (requests && requests.found) {
            toast({
              title: "Analysis Requests Found",
              description: `You have ${requests.count} analysis requests. Check the transaction history for details.`,
            })
          }
        } catch (requestError) {
          console.error("Error checking analysis requests:", requestError)
          // Don't show an error toast for this, as it's not critical
        }
      }

      onConnect(address)

      toast({
        title: "Connected",
        description: "Successfully connected to MetaMask",
      })
    } catch (error: any) {
      console.error("Connection error:", error)

      // Don't call handleDisconnect for user rejections
      if (error.code === 4001 || error.message?.includes("User rejected")) {
        toast({
          title: "Connection Cancelled",
          description: "You cancelled the connection request",
          variant: "default",
        })
      } else {
        // For other errors, show error toast but don't disconnect if already on home page
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect to MetaMask",
          variant: "destructive",
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const switchNetwork = async () => {
    setNetworkSwitching(true)
    try {
      await switchToArbitrumNetwork()
      setIsArbitrum(true)
      toast({
        title: "Network Switched",
        description: "Successfully connected to Arbitrum network",
      })
    } catch (error: any) {
      console.error("Error switching network:", error)

      // Don't show error toast for user rejections
      if (error.code !== 4001 && !error.message?.includes("User rejected")) {
        toast({
          title: "Network Switch Failed",
          description: error instanceof Error ? error.message : "Failed to switch to Arbitrum network",
          variant: "destructive",
        })
      }
    } finally {
      setNetworkSwitching(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      // Clear permissions
      if (window.ethereum) {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
      }
    } catch (error) {
      console.error("Error revoking permissions:", error)
    }

    setConnectedAddress(null)
    localStorage.removeItem("connectedAddress")
    onDisconnect()

    // Only redirect to home page if not already there
    if (pathname !== "/") {
      router.push("/")
    }

    toast({
      title: "Disconnected",
      description: "Successfully disconnected from MetaMask",
    })
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Get stored address
  useEffect(() => {
    const storedAddress = localStorage.getItem("connectedAddress")
    if (storedAddress && !connectedAddress) {
      setConnectedAddress(storedAddress)

      // Check for dashboard access for the stored address
      checkForDashboardAccess(storedAddress).then((access) => {
        if (access) {
          toast({
            title: "Dashboard Access Found",
            description: `You have access to a ${access.symbol} dashboard. Check the transaction history for details.`,
          })
        }
      })
    }
  }, [connectedAddress])

  return (
    <div className="flex items-center gap-4">
      {connectedAddress ? (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-sm text-gray-300">Connected: {formatAddress(connectedAddress)}</span>

            {/* Network indicator */}
            {isArbitrum ? (
              <div className="flex items-center gap-1 text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full text-xs">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                Arbitrum
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 text-yellow-400 bg-yellow-900/30 px-2 py-0.5 rounded-full text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Not on Arbitrum
                </div>
                <Button
                  size="sm"
                  onClick={switchNetwork}
                  disabled={networkSwitching}
                  className="ml-1 bg-yellow-700 hover:bg-yellow-600 text-xs h-6 px-2"
                >
                  {networkSwitching ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    "Switch"
                  )}
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting || isCheckingTransactions}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isConnecting || isCheckingTransactions ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isConnecting ? "Connecting..." : "Checking Transactions..."}
            </>
          ) : (
            "Connect MetaMask"
          )}
        </Button>
      )}
    </div>
  )
}

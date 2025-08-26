"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Clipboard, ExternalLink, Key, Send, Check, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ethers } from "ethers"

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

// Add a function to send a transaction with dashboard link and symbol on Arbitrum
async function sendDashboardAccess(recipientAddress: string, dashboardLink: string, symbol: string) {
  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed")
  }

  // Check if we're on Arbitrum network
  const onArbitrum = await isArbitrumNetwork()
  if (!onArbitrum) {
    // Switch to Arbitrum network
    await switchToArbitrumNetwork()
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()

  // Encode the dashboard link and symbol as hex data
  // Format: "DASHBOARD_ACCESS:" + symbol + ":" + link (in hex)
  const dataString = `DASHBOARD_ACCESS:${symbol.toUpperCase()}:${dashboardLink}`
  const dataHex = "0x" + Buffer.from(dataString).toString("hex")

  // Send a minimal amount of ETH with the data
  const tx = await signer.sendTransaction({
    to: recipientAddress,
    value: ethers.parseEther("0.0001"), // Minimal amount
    data: dataHex,
  })

  return tx
}

// Update the AdminPanel component to include transaction functionality
interface AdminPanelProps {
  walletAddress: string
}

export function AdminPanel({ walletAddress }: AdminPanelProps) {
  const [requestAddress, setRequestAddress] = useState("")
  const [cryptoSymbol, setCryptoSymbol] = useState("")
  const [dashboardLink, setDashboardLink] = useState("")
  const [customDashboardLink, setCustomDashboardLink] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [transactionHash, setTransactionHash] = useState("")
  const [transactions, setTransactions] = useState<
    {
      address: string
      symbol: string
      link: string
      txHash: string
    }[]
  >([])
  const [isArbitrum, setIsArbitrum] = useState(false)
  const [networkSwitching, setNetworkSwitching] = useState(false)
  const { toast } = useToast()

  // Check if connected to Arbitrum
  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const onArbitrum = await isArbitrumNetwork()
        setIsArbitrum(onArbitrum)
      } catch (error) {
        console.error("Error checking network:", error)
      }
    }

    checkNetwork()

    // Listen for chain changes
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        checkNetwork()
      })
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("chainChanged", checkNetwork)
      }
    }
  }, [])

  // Load previous transactions from localStorage
  useEffect(() => {
    const storedTransactions = localStorage.getItem("adminTransactions")
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions))
    }
  }, [])

  const generateDashboardLink = () => {
    if (!requestAddress) {
      toast({
        title: "Error",
        description: "Please enter a requester address",
        variant: "destructive",
      })
      return
    }

    if (!cryptoSymbol) {
      toast({
        title: "Error",
        description: "Please enter a cryptocurrency symbol",
        variant: "destructive",
      })
      return
    }

    // Use custom link if provided, otherwise generate a unique link
    let link
    if (customDashboardLink) {
      // If the link doesn't start with http or / then assume it's a relative path
      if (!customDashboardLink.startsWith("http") && !customDashboardLink.startsWith("/")) {
        link = `/${customDashboardLink}`
      } else {
        link = customDashboardLink
      }
    } else {
      // Generate a unique link with the requester's address and symbol
      const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2)
      link = `/dashboard?access=${uniqueId}&for=${requestAddress}&symbol=${cryptoSymbol.toLowerCase()}`
    }

    setDashboardLink(link)

    // Store the link in localStorage for persistence
    const storedLinks = JSON.parse(localStorage.getItem("dashboardLinks") || "{}")
    storedLinks[requestAddress] = {
      link,
      symbol: cryptoSymbol.toUpperCase(),
    }
    localStorage.setItem("dashboardLinks", JSON.stringify(storedLinks))

    toast({
      title: "Success",
      description: "Dashboard link generated successfully",
    })
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
    } catch (error) {
      console.error("Error switching network:", error)
      toast({
        title: "Network Switch Failed",
        description: error instanceof Error ? error.message : "Failed to switch to Arbitrum network",
        variant: "destructive",
      })
    } finally {
      setNetworkSwitching(false)
    }
  }

  const sendTransaction = async () => {
    if (!requestAddress || !dashboardLink || !cryptoSymbol) {
      toast({
        title: "Error",
        description: "Please generate a dashboard link first",
        variant: "destructive",
      })
      return
    }

    // Check if we're on Arbitrum
    if (!isArbitrum) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Arbitrum network before sending transaction",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const tx = await sendDashboardAccess(requestAddress, dashboardLink, cryptoSymbol)

      // Store transaction details with the exact format needed for decoding
      const newTransaction = {
        address: requestAddress,
        symbol: cryptoSymbol.toUpperCase(),
        link: dashboardLink,
        txHash: tx.hash,
      }

      const updatedTransactions = [...transactions, newTransaction]
      setTransactions(updatedTransactions)
      localStorage.setItem("adminTransactions", JSON.stringify(updatedTransactions))

      setTransactionHash(tx.hash)

      toast({
        title: "Transaction Sent",
        description: `Dashboard access for ${cryptoSymbol.toUpperCase()} has been sent to the requester on Arbitrum`,
      })
    } catch (error) {
      console.error("Error sending transaction:", error)
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
      setCustomDashboardLink("")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Text copied to clipboard",
    })
  }

  return (
    <Card className="bg-gradient-to-r from-green-900/70 to-blue-900/70 border-green-800/50 mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <Key className="h-6 w-6" />
          Admin Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-950/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Your Admin Address</h3>
          <div className="flex items-center gap-2">
            <code className="bg-gray-800 p-2 rounded text-green-400 flex-1 overflow-x-auto">{walletAddress}</code>
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(walletAddress)} className="shrink-0">
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>

          {/* Network Status */}
          <div className="mt-4 flex items-center gap-2">
            {isArbitrum ? (
              <div className="flex items-center gap-2 text-green-400 bg-green-900/30 px-3 py-1.5 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                Connected to Arbitrum
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-400 bg-yellow-900/30 px-3 py-1.5 rounded-full text-sm">
                <AlertTriangle className="h-4 w-4" />
                Not connected to Arbitrum
                <Button
                  size="sm"
                  onClick={switchNetwork}
                  disabled={networkSwitching}
                  className="ml-2 bg-yellow-700 hover:bg-yellow-600 text-xs h-7"
                >
                  {networkSwitching ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Switching...
                    </>
                  ) : (
                    "Switch Network"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400">Generate Dashboard Link</h3>

          {/* Requester Address Input */}
          <div className="space-y-2">
            <label htmlFor="requester-address" className="text-sm text-gray-300">
              Requester's Wallet Address
            </label>
            <Input
              id="requester-address"
              placeholder="Enter requester's wallet address"
              value={requestAddress}
              onChange={(e) => setRequestAddress(e.target.value)}
              className="bg-gray-800/50 border-gray-700/50"
            />
          </div>

          {/* Crypto Symbol Input */}
          <div className="space-y-2">
            <label htmlFor="crypto-symbol" className="text-sm text-gray-300">
              Cryptocurrency Symbol
            </label>
            <Input
              id="crypto-symbol"
              placeholder="Enter cryptocurrency symbol (e.g., BTC, ETH)"
              value={cryptoSymbol}
              onChange={(e) => setCryptoSymbol(e.target.value)}
              className="bg-gray-800/50 border-gray-700/50"
            />
          </div>

          {/* Custom Dashboard Link Input - new section */}
          <div className="space-y-2">
            <label htmlFor="custom-dashboard-link" className="text-sm text-gray-300">
              Custom Dashboard Link (Optional)
            </label>
            <Input
              id="custom-dashboard-link"
              placeholder="Paste or enter dashboard link"
              value={customDashboardLink}
              onChange={(e) => setCustomDashboardLink(e.target.value)}
              className="bg-gray-800/50 border-gray-700/50"
            />
            <p className="text-xs text-gray-400">Enter a custom dashboard link or leave blank to generate one</p>
          </div>

          <Button onClick={generateDashboardLink} className="w-full">
            Generate Dashboard Link
          </Button>

          {dashboardLink && (
            <div className="bg-gray-800/50 p-4 rounded-lg mt-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2 py-1 bg-blue-900/50 rounded text-blue-400 text-sm font-semibold">
                  {cryptoSymbol.toUpperCase()}
                </div>
                <div className="text-sm text-gray-300">
                  Dashboard for: {requestAddress.slice(0, 6)}...{requestAddress.slice(-4)}
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-2">Dashboard link for requester:</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-800 p-2 rounded text-green-400 flex-1 overflow-x-auto">{dashboardLink}</code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(dashboardLink)} className="shrink-0">
                  <Clipboard className="h-4 w-4" />
                </Button>
                <Link href={dashboardLink} target="_blank">
                  <Button size="sm" variant="outline" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="mt-4">
                <Button
                  onClick={sendTransaction}
                  disabled={isSending || !isArbitrum}
                  className={`w-full ${isArbitrum ? "bg-green-600 hover:bg-green-700" : "bg-gray-600"}`}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Transaction on Arbitrum...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send {cryptoSymbol.toUpperCase()} Dashboard Access on Arbitrum
                    </>
                  )}
                </Button>

                {!isArbitrum && (
                  <p className="text-yellow-400 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Please connect to Arbitrum network to send transactions
                  </p>
                )}
              </div>

              {transactionHash && (
                <div className="mt-4 p-3 bg-green-900/30 rounded-lg">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Transaction sent successfully on Arbitrum!
                  </p>
                  <a
                    href={`https://arbiscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                  >
                    View on Arbiscan
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {transactions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400">Recent Transactions on Arbitrum</h3>
            <div className="bg-gray-800/50 p-4 rounded-lg max-h-60 overflow-y-auto">
              {transactions.map((tx, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-gray-700 last:border-0 last:mb-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="px-1.5 py-0.5 bg-blue-900/50 rounded text-blue-400 text-xs font-semibold">
                      {tx.symbol || "N/A"}
                    </div>
                    <p className="text-sm text-gray-300">
                      To:{" "}
                      <span className="text-blue-400">
                        {tx.address.slice(0, 6)}...{tx.address.slice(-4)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <a
                      href={`https://arbiscan.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-400 hover:underline"
                    >
                      {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                    </a>
                    <Link href={tx.link}>
                      <Button size="sm" variant="outline" className="h-6 px-2 py-0 text-xs">
                        View Dashboard
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-blue-400">Transaction Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button className="bg-green-600 hover:bg-green-700">View All Transactions</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Manage Analysis Requests</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

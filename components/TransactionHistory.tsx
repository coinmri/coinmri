"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowUpDown, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getTransactionsByAddress } from "@/lib/arbiscanService"
import { decodeDashboardAccess, decodeSymbolFromData } from "@/lib/transactionUtils"
import Link from "next/link"

// The receiver address
const RECEIVER_ADDRESS = "0x837f5E0FbabD0b1c3482B6Ad10fA39275bDA252e"
const ARBITRUM_EXPLORER = "https://arbiscan.io"

interface Transaction {
  hash: string
  timeStamp: string
  from: string
  to: string
  value: string
  input: string
  methodName: string
  symbol?: string
  status: string
  gasUsed: string
  gasPrice: string
  dashboardLink?: string
  dashboardSymbol?: string
}

type SortField = "timeStamp" | "value"
type SortDirection = "asc" | "desc"

export function TransactionHistory({ userAddress }: { userAddress: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("timeStamp")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const { toast } = useToast()

  const detectMethodName = useCallback((input: string, value: string): { methodName: string; symbol?: string } => {
    try {
      if (!input || input === "0x") {
        return { methodName: "ETH Transfer" }
      }

      // Get the function signature (first 4 bytes after 0x)
      const signature = input.slice(0, 10).toLowerCase()

      // Try to match known function signatures
      if (input.includes("DASHBOARD_ACCESS:")) {
        return { methodName: "Dashboard Access" }
      } else if (input.includes("ANALYZE:")) {
        return { methodName: "Request Analysis" }
      }

      return { methodName: "Contract Interaction" }
    } catch (error) {
      console.warn("Error detecting method name:", error)
      return { methodName: "Unknown" }
    }
  }, [])

  const processTransactions = useCallback(
    (txs: any[]) => {
      // Show all transactions to the receiver address
      return txs
        .filter((tx) => tx.to.toLowerCase() === RECEIVER_ADDRESS.toLowerCase())
        .map((tx) => {
          const { methodName } = detectMethodName(tx.input, tx.value)

          // Try to decode dashboard access data
          let dashboardLink: string | undefined
          let dashboardSymbol: string | undefined

          if (tx.input && tx.input !== "0x") {
            // Check if this is a dashboard access transaction
            const decodedAccess = decodeDashboardAccess(tx.input)
            if (decodedAccess) {
              dashboardLink = decodedAccess.link
              dashboardSymbol = decodedAccess.symbol
            }
          }

          return {
            hash: tx.hash,
            timeStamp: tx.timeStamp,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            input: tx.input,
            methodName,
            symbol: decodeSymbolFromData(tx.input) || dashboardSymbol,
            status: "request sent", // Changed from "pending" to "request sent"
            gasUsed: tx.gasUsed || "0",
            gasPrice: tx.gasPrice || "0",
            dashboardLink,
            dashboardSymbol,
          }
        })
    },
    [detectMethodName],
  )

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Fetching transactions for address:", userAddress)

      if (!userAddress) {
        throw new Error("No wallet address provided")
      }

      // Get all transactions to the receiver address
      const txs = await getTransactionsByAddress(userAddress)
      console.log("Raw transactions:", txs)

      // Get all transactions from the receiver address
      const receiverTxs = await getTransactionsByAddress(RECEIVER_ADDRESS)
      console.log("Receiver transactions:", receiverTxs)

      // Create a map of response transactions indexed by request hash
      const responseMap = receiverTxs.reduce((map: { [key: string]: any }, tx: any) => {
        if (tx.from.toLowerCase() === RECEIVER_ADDRESS.toLowerCase()) {
          try {
            // Try to extract the original request hash from the input data
            const requestHash = tx.input.slice(0, 66) // First 32 bytes (including '0x')
            if (requestHash && requestHash !== "0x") {
              map[requestHash.toLowerCase()] = tx
            }
          } catch (error) {
            console.warn("Error processing response transaction:", error)
          }
        }
        return map
      }, {})

      // Process transactions and match with responses
      const processedTxs = txs
        .filter((tx) => tx.to.toLowerCase() === RECEIVER_ADDRESS.toLowerCase())
        .map((tx) => {
          const { methodName } = detectMethodName(tx.input, tx.value)
          const response = responseMap[tx.hash.toLowerCase()]

          // Try to decode dashboard access data
          let dashboardLink: string | undefined
          let dashboardSymbol: string | undefined

          if (tx.input && tx.input !== "0x") {
            // Check if this is a dashboard access transaction
            const decodedAccess = decodeDashboardAccess(tx.input)
            if (decodedAccess) {
              dashboardLink = decodedAccess.link
              dashboardSymbol = decodedAccess.symbol
            }
          }

          // Also check admin transactions for dashboard access sent to this user
          const storedTransactions = JSON.parse(localStorage.getItem("adminTransactions") || "[]")
          const adminTx = storedTransactions.find(
            (adminTx: any) => adminTx.address.toLowerCase() === userAddress.toLowerCase(),
          )

          if (adminTx) {
            dashboardLink = adminTx.link
            dashboardSymbol = adminTx.symbol
          }

          return {
            hash: tx.hash,
            timeStamp: tx.timeStamp,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            input: tx.input,
            methodName,
            symbol: decodeSymbolFromData(tx.input) || dashboardSymbol,
            status: response ? "completed" : "request sent",
            gasUsed: tx.gasUsed || "0",
            gasPrice: tx.gasPrice || "0",
            resultLink: response ? response.input.slice(66) : undefined, // Get result link from response input
            dashboardLink,
            dashboardSymbol,
          }
        })

      console.log("Processed transactions:", processedTxs)
      setTransactions(processedTxs)

      if (processedTxs.length === 0) {
        toast({
          title: "No Transactions Found",
          description: "No transactions found to the receiver address.",
        })
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch transaction history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [userAddress, toast, detectMethodName])

  useEffect(() => {
    if (userAddress) {
      fetchTransactions()
    }
  }, [userAddress, fetchTransactions])

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (timestamp: string) => {
    return new Date(Number.parseInt(timestamp) * 1000).toLocaleString()
  }

  const formatEther = (value: string) => {
    try {
      return Number.parseFloat(ethers.formatEther(value)).toFixed(6)
    } catch (error) {
      console.warn("Error formatting ether value:", error)
      return "0.000000"
    }
  }

  const calculateGasFee = (gasUsed: string, gasPrice: string) => {
    try {
      const gasFee = BigInt(gasUsed) * BigInt(gasPrice)
      return formatEther(gasFee.toString())
    } catch (error) {
      console.warn("Error calculating gas fee:", error)
      return "0.000000"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400"
      case "request sent":
        return "text-yellow-400"
      case "failed":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const filterTransactions = (txs: Transaction[]) => {
    return txs
      .filter((tx) => {
        if (!searchTerm) return true

        const decodedSymbol = tx.symbol || decodeSymbolFromData(tx.input)

        return (
          tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.methodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (decodedSymbol && decodedSymbol.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      })
      .sort((a, b) => {
        if (sortField === "timeStamp") {
          const aTime = Number(a.timeStamp)
          const bTime = Number(b.timeStamp)
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime
        } else {
          try {
            const aValue = BigInt(a.value || "0")
            const bValue = BigInt(b.value || "0")
            return sortDirection === "asc"
              ? aValue < bValue
                ? -1
                : aValue > bValue
                  ? 1
                  : 0
              : bValue < aValue
                ? -1
                : bValue > aValue
                  ? 1
                  : 0
          } catch (error) {
            console.warn("Error comparing transaction values:", error)
            return 0
          }
        }
      })
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredTransactions = filterTransactions(transactions)

  return (
    <Card className="bg-blue-900/20 border-blue-800/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">
          Transaction History
          <p className="text-sm font-normal text-gray-400 mt-1">
            Showing transactions between your wallet and {formatAddress(RECEIVER_ADDRESS)}
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search by hash, method, or symbol"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-blue-950/50 border-blue-800/50 placeholder:text-gray-400 text-white"
            />
            <Button
              onClick={() => fetchTransactions()}
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          <div className="rounded-lg overflow-x-auto">
            <div className="min-w-[1000px]">
              {" "}
              {/* Minimum width to prevent squishing */}
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-blue-900/20">
                    <TableHead className="text-blue-300 font-semibold">Method</TableHead>
                    <TableHead className="text-blue-300 font-semibold">Symbol</TableHead>
                    <TableHead className="text-blue-300 font-semibold">From</TableHead>
                    <TableHead className="text-blue-300 font-semibold">To</TableHead>
                    <TableHead
                      className="text-blue-300 font-semibold cursor-pointer"
                      onClick={() => toggleSort("value")}
                    >
                      <div className="flex items-center">
                        Value (ETH)
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-blue-300 font-semibold cursor-pointer"
                      onClick={() => toggleSort("timeStamp")}
                    >
                      <div className="flex items-center">
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="text-blue-300 font-semibold">Gas Fee (ETH)</TableHead>
                    <TableHead className="text-blue-300 font-semibold">Status</TableHead>
                    <TableHead className="text-blue-300 font-semibold">Transaction</TableHead>
                    <TableHead className="text-blue-300 font-semibold">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.hash} className="hover:bg-blue-900/20 transition-colors">
                      <TableCell className="font-medium text-white">{tx.methodName}</TableCell>
                      <TableCell className="text-gray-300">
                        {tx.symbol || (tx.input ? decodeSymbolFromData(tx.input) || "-" : "-")}
                      </TableCell>
                      <TableCell className="text-gray-300">{formatAddress(tx.from)}</TableCell>
                      <TableCell className="text-gray-300">{formatAddress(tx.to)}</TableCell>
                      <TableCell className="text-gray-300">{formatEther(tx.value)}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(tx.timeStamp)}</TableCell>
                      <TableCell className="text-gray-300">{calculateGasFee(tx.gasUsed, tx.gasPrice)}</TableCell>
                      <TableCell>
                        <span className={getStatusColor(tx.status)}>{tx.status}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={`${ARBITRUM_EXPLORER}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Tx
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tx.resultLink ? (
                          <a
                            href={tx.resultLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-400 hover:text-green-300"
                          >
                            View Result
                          </a>
                        ) : tx.dashboardLink ? (
                          <Link
                            href={tx.dashboardLink}
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {tx.dashboardSymbol ? `${tx.dashboardSymbol} Dashboard` : "Dashboard"}
                          </Link>
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 px-4 text-gray-400">
              <p className="mb-2">No transactions found</p>
              <p className="text-sm">between your wallet and {formatAddress(RECEIVER_ADDRESS)}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

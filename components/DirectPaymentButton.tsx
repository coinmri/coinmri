"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ethers } from "ethers"
import { ADMIN_WALLET_ADDRESS } from "@/lib/web3Config"

interface DirectPaymentButtonProps {
  symbol: string
  onSuccess: (txHash: string) => void
}

export function DirectPaymentButton({ symbol, onSuccess }: DirectPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDirectPayment = async () => {
    if (!symbol) {
      alert("Please enter a cryptocurrency symbol")
      return
    }

    setIsLoading(true)

    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("Please install MetaMask")
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please connect to MetaMask.")
      }

      // Use a small amount of ETH (0.003 ETH)
      const ethAmount = "0.003"
      const amountInWei = ethers.utils.parseEther(ethAmount)
      const amountHex = `0x${amountInWei.toString(16)}`

      // Format the symbol in the requested format: "Analyze_request : Symbol"
      const formattedSymbol = `Analyze_request : ${symbol.toUpperCase()}`

      // Convert symbol to hex data
      const dataHex = `0x${Buffer.from(formattedSymbol).toString("hex")}`

      // Create a simple transaction
      const transactionParameters = {
        to: ADMIN_WALLET_ADDRESS,
        from: accounts[0],
        value: amountHex, // Small amount of ETH
        data: dataHex,
      }

      console.log("Direct payment transaction parameters:", transactionParameters)

      // Send the transaction using MetaMask's API directly
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      })

      console.log("Direct payment transaction sent:", txHash)
      onSuccess(txHash)
    } catch (error) {
      console.error("Error in direct payment:", error)
      alert(error instanceof Error ? error.message : "Failed to process payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDirectPayment}
      disabled={isLoading || !symbol}
      variant="outline"
      className="w-full bg-transparent border-blue-600 text-blue-400 hover:bg-blue-900/20"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        "Quick Pay with ETH"
      )}
    </Button>
  )
}

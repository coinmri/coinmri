"use client"

import { useState, useCallback } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Coins } from "lucide-react"
import {
  COINMRI_CONTRACT_ADDRESS,
  COINMRI_ABI,
  USDC_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  ERC20_ABI,
  TOKENS_PER_ETH,
  TOKENS_PER_USDC,
  TOKENS_PER_USDT,
  MIN_PURCHASE,
  ARBITRUM_CHAIN_ID,
  ARBITRUM_RPC,
  ARB_CONTRACT_ADDRESS,
  TOKENS_PER_ARB,
} from "@/lib/web3Config"
import { ArbitrumNetworkBadge } from "./ArbitrumNetworkBadge"

type PaymentMethod = "ETH" | "ARB" | "USDC" | "USDT"

interface BuyTokensCardProps {
  onSuccess?: () => void
  className?: string
}

export function BuyTokensCard({ onSuccess, className }: BuyTokensCardProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ETH")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const switchToArbitrum = async () => {
    if (!window.ethereum) return false

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}` }],
      })
      return true
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}`,
                chainName: "Arbitrum One",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [ARBITRUM_RPC],
                blockExplorerUrls: ["https://arbiscan.io"],
              },
            ],
          })
          return true
        } catch (addError) {
          console.error("Error adding Arbitrum network:", addError)
          return false
        }
      }
      console.error("Error switching to Arbitrum:", error)
      return false
    }
  }

  const calculateTokens = useCallback((amount: string, method: PaymentMethod) => {
    try {
      const value = Number.parseFloat(amount)
      switch (method) {
        case "ETH":
          return (value * TOKENS_PER_ETH).toFixed(2)
        case "ARB":
          return (value * TOKENS_PER_ARB).toFixed(2)
        case "USDC":
          return (value * TOKENS_PER_USDC).toFixed(2)
        case "USDT":
          return (value * TOKENS_PER_USDT).toFixed(2)
        default:
          return "0"
      }
    } catch {
      return "0"
    }
  }, [])

  const getMinPurchase = (method: PaymentMethod) => {
    return MIN_PURCHASE[method]
  }

  const handleBuyTokens = async () => {
    setIsLoading(true)
    try {
      if (!amount || Number.parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid amount")
      }

      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed")
      }

      // Switch to Arbitrum network
      const switched = await switchToArbitrum()
      if (!switched) {
        throw new Error("Please switch to Arbitrum network")
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const coinmriContract = new ethers.Contract(COINMRI_CONTRACT_ADDRESS, COINMRI_ABI, signer)

      let tx
      if (paymentMethod === "ETH") {
        tx = await coinmriContract.buyTokens({
          value: ethers.parseEther(amount),
        })
      } else {
        const tokenAddress = {
          ARB: ARB_CONTRACT_ADDRESS,
          USDC: USDC_CONTRACT_ADDRESS,
          USDT: USDT_CONTRACT_ADDRESS,
        }[paymentMethod]

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

        // Get token decimals
        const decimals = await tokenContract.decimals()
        const tokenAmount = ethers.utils.parseUnits(amount, decimals)

        // Approve tokens
        const approveTx = await tokenContract.approve(COINMRI_CONTRACT_ADDRESS, tokenAmount)
        await approveTx.wait()

        // Buy tokens
        tx = await coinmriContract[`buyTokensWith${paymentMethod}`](tokenAmount)
      }

      toast({
        title: "Transaction Submitted",
        description: "Please wait for the transaction to be confirmed...",
      })

      await tx.wait()

      toast({
        title: "Success",
        description: `Successfully purchased ${calculateTokens(amount, paymentMethod)} COINMRI tokens!`,
      })

      setAmount("")
      onSuccess?.()
    } catch (error) {
      console.error("Error buying tokens:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to buy tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-900/70 to-purple-900/70 border-blue-800/50 ${className}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
          <Coins className="h-6 w-6 text-yellow-400" />
          Buy COINMRI Tokens
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ArbitrumNetworkBadge />

          <div className="bg-blue-950/50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Token Information</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• 1 ETH = {TOKENS_PER_ETH} COINMRI</li>
              <li>• 1 ARB = {TOKENS_PER_ARB} COINMRI</li>
              <li>• 1 USDC = {TOKENS_PER_USDC} COINMRI</li>
              <li>• 1 USDT = {TOKENS_PER_USDT} COINMRI</li>
              <li>• 1 COINMRI = 1 Analysis Request</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="ARB">ARB</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Amount</label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: ${getMinPurchase(paymentMethod)}`}
                  min={getMinPurchase(paymentMethod)}
                  step="0.01"
                  className="pl-8"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {paymentMethod}
                </span>
              </div>
              {amount && (
                <p className="text-sm text-blue-400">
                  You will receive: {calculateTokens(amount, paymentMethod)} COINMRI
                </p>
              )}
            </div>

            <Button
              onClick={handleBuyTokens}
              disabled={isLoading || !amount || Number.parseFloat(amount) < getMinPurchase(paymentMethod)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Buy Tokens
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-gray-400 text-center">
            Transactions are processed on Arbitrum network for lower fees
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

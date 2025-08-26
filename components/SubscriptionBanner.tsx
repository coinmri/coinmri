"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { COINMRI_CONTRACT_ADDRESS, COINMRI_ABI, SUBSCRIPTION_PRICE_ETH } from "@/lib/web3Config"

export function SubscriptionBanner() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [tokenBalance, setTokenBalance] = useState("0")
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(null)
  const { toast } = useToast()

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(COINMRI_CONTRACT_ADDRESS, COINMRI_ABI, signer)

      const [isActive, expiry, balance] = await Promise.all([
        contract.checkSubscription(await signer.getAddress()),
        contract.getSubscriptionExpiry(await signer.getAddress()),
        contract.balanceOf(await signer.getAddress()),
      ])

      setIsSubscribed(isActive)
      setSubscriptionExpiry(new Date(Number(expiry) * 1000))
      setTokenBalance(ethers.formatEther(balance))
    } catch (error) {
      console.error("Error checking subscription:", error)
    }
  }, [])

  const buyTokens = async () => {
    try {
      setIsLoading(true)
      if (typeof window.ethereum === "undefined") {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to purchase tokens.",
          variant: "destructive",
        })
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(COINMRI_CONTRACT_ADDRESS, COINMRI_ABI, signer)

      const tx = await contract.buyTokens({
        value: ethers.parseEther(SUBSCRIPTION_PRICE_ETH.toString()),
      })
      await tx.wait()

      toast({
        title: "Success",
        description: "Tokens purchased successfully!",
      })

      await checkSubscriptionStatus()
    } catch (error) {
      console.error("Error buying tokens:", error)
      toast({
        title: "Error",
        description: "Failed to purchase tokens. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const subscribe = async () => {
    try {
      setIsLoading(true)
      if (typeof window.ethereum === "undefined") {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to subscribe.",
          variant: "destructive",
        })
        return
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(COINMRI_CONTRACT_ADDRESS, COINMRI_ABI, signer)

      const tx = await contract.subscribe()
      await tx.wait()

      toast({
        title: "Success",
        description: "Subscription activated successfully!",
      })

      await checkSubscriptionStatus()
    } catch (error) {
      console.error("Error subscribing:", error)
      toast({
        title: "Error",
        description: "Failed to activate subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSubscriptionStatus()
  }, [checkSubscriptionStatus])

  return (
    <Card className="bg-gradient-to-r from-blue-900/70 to-purple-900/70 border-blue-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">
          {isSubscribed ? "Premium Access Active" : "Upgrade to Premium"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-200">COINMRI Balance:</p>
              <p className="text-xl font-bold text-blue-400">{tokenBalance} COINMRI</p>
            </div>
            {subscriptionExpiry && isSubscribed && (
              <div>
                <p className="text-gray-200">Subscription Expires:</p>
                <p className="text-xl font-bold text-green-400">{subscriptionExpiry.toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {!isSubscribed && (
            <div className="space-y-4">
              <div className="bg-blue-800/30 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Premium Features:</h3>
                <ul className="list-disc list-inside text-gray-200 space-y-2">
                  <li>Unlimited API calls</li>
                  <li>Real-time price alerts</li>
                  <li>Advanced technical indicators</li>
                  <li>Portfolio tracking</li>
                  <li>Custom watchlists</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button onClick={buyTokens} disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Buy COINMRI Tokens
                </Button>
                <Button
                  onClick={subscribe}
                  disabled={isLoading || Number(tokenBalance) < 100}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Activate Premium
                </Button>
              </div>

              <p className="text-sm text-gray-300 text-center">
                Premium access requires 100 COINMRI tokens for a 30-day subscription
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

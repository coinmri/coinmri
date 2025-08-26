import { ethers } from "ethers"
import {
  ERC20_ABI,
  TOKEN_ADDRESSES,
  ANALYSIS_REQUESTS_ADDRESS,
  ANALYSIS_REQUESTS_ABI,
  NETWORK_CONFIG,
} from "./web3Config"

type PaymentMethod = "ETH" | "ARB" | "USDC" | "USDT"

type PaymentResult = {
  success: boolean
  txHash?: string
  error?: string
}

async function ensureNetwork() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Please install MetaMask")
  }

  const provider = new ethers.BrowserProvider(window.ethereum)

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" })
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)

    if (chainId !== NETWORK_CONFIG.ARBITRUM.chainId) {
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
      return new ethers.BrowserProvider(window.ethereum)
    }
  } catch (error) {
    console.error("Error ensuring network:", error)
    throw error
  }

  return provider
}

export async function makePayment(
  amount: string,
  paymentMethod: PaymentMethod,
  requestedSymbol: string,
): Promise<PaymentResult> {
  try {
    console.log(`Starting payment process for ${requestedSymbol} using ${paymentMethod}`)

    const provider = await ensureNetwork()
    const signer = await provider.getSigner()
    const address = await signer.getAddress()

    // Create contract instances
    const analysisContract = new ethers.Contract(ANALYSIS_REQUESTS_ADDRESS, ANALYSIS_REQUESTS_ABI, signer)

    if (paymentMethod === "ETH") {
      // For ETH payments
      const ethAmount = ethers.parseEther(amount)
      console.log(`Sending ${ethAmount.toString()} wei via ETH payment`)

      const tx = await analysisContract.requestAnalysisWithETH(requestedSymbol, {
        value: ethAmount,
      })

      console.log("Waiting for ETH transaction confirmation...")
      await tx.wait()
      console.log(`ETH transaction confirmed: ${tx.hash}`)

      return { success: true, txHash: tx.hash }
    } else {
      // For token payments (USDC, USDT, ARB)
      const tokenAddress = TOKEN_ADDRESSES[paymentMethod]
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

      // Get token decimals
      const decimals = await tokenContract.decimals()
      console.log(`Token decimals for ${paymentMethod}: ${decimals}`)

      // Calculate amount based on token type
      const tokenAmount = ethers.utils.parseUnits(
        paymentMethod === "USDC" || paymentMethod === "USDT" ? "5" : amount,
        decimals,
      )
      console.log(`Token amount in wei: ${tokenAmount.toString()}`)

      // Check balance
      const balance = await tokenContract.balanceOf(address)
      console.log(`Current ${paymentMethod} balance: ${balance.toString()}`)

      if (balance < tokenAmount) {
        throw new Error(`Insufficient ${paymentMethod} balance`)
      }

      // Approve spending
      console.log(`Approving ${paymentMethod} spending...`)
      const approveTx = await tokenContract.approve(ANALYSIS_REQUESTS_ADDRESS, tokenAmount)
      console.log(`Approval transaction sent: ${approveTx.hash}`)
      await approveTx.wait()
      console.log("Approval confirmed")

      // Make the token payment
      console.log(`Initiating ${paymentMethod} payment...`)
      const tx = await analysisContract.requestAnalysisWithToken(requestedSymbol, paymentMethod)
      console.log(`Payment transaction sent: ${tx.hash}`)
      await tx.wait()
      console.log("Payment confirmed")

      return { success: true, txHash: tx.hash }
    }
  } catch (error) {
    console.error("Payment error:", error)
    let errorMessage = "Payment failed"

    if (error instanceof Error) {
      // More specific error handling
      if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user"
      } else if (error.message.includes("insufficient")) {
        errorMessage = `Insufficient ${paymentMethod} balance`
      } else if (error.message.includes("execution reverted")) {
        errorMessage = "Transaction failed. Please check your balance and try again."
      } else {
        errorMessage = error.message
      }
    }

    return { success: false, error: errorMessage }
  }
}

export async function verifyPayment(txHash: string): Promise<boolean> {
  try {
    const provider = await ensureNetwork()
    const receipt = await provider.getTransactionReceipt(txHash)
    return receipt !== null && receipt.status === 1
  } catch (error) {
    console.error("Error verifying payment:", error)
    return false
  }
}

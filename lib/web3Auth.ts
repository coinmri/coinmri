import { ethers } from "ethers"
import { ARBITRUM_CHAIN_ID, ARBITRUM_RPC } from "./web3Config"

export async function connectWallet(): Promise<string> {
  // Check if MetaMask is installed
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Please install MetaMask to use this feature")
  }

  try {
    // Request account access directly
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    })

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found. Please connect to MetaMask.")
    }

    // After connecting, try to switch to Arbitrum
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${ARBITRUM_CHAIN_ID.toString(16)}` }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
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
              blockExplorerUrls: ["https://arbiscan.io/"],
            },
          ],
        })
      } else {
        throw switchError
      }
    }

    return accounts[0]
  } catch (error) {
    console.error("Error connecting to MetaMask:", error)
    throw error
  }
}

export async function signMessage(message: string): Promise<{ signature: string; address: string }> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("Please install MetaMask")
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    const signature = await signer.signMessage(message)
    const address = await signer.getAddress()
    return { signature, address }
  } catch (error) {
    console.error("Error signing message:", error)
    throw error
  }
}

export async function verifySignature(message: string, signature: string, address: string): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === address.toLowerCase()
  } catch (error) {
    console.error("Error verifying signature:", error)
    return false
  }
}

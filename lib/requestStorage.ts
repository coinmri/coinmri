export interface AnalysisResult {
  symbol: string
  timestamp: number
  data?: {
    price: number
    volume: number
    marketCap: number
    priceChange24h: number
    technicalIndicators: {
      rsi: number
      macd: number
      ema: number
    }
    sentiment: {
      overall: string
      score: number
    }
    prediction: {
      direction: string
      confidence: number
    }
  }
  status: "processing" | "completed" | "failed"
  error?: string
}

export interface PaymentConfirmation {
  txHash: string
  amount: string
  paymentMethod: string
  timestamp: number
  status: "confirmed" | "pending" | "failed"
}

export interface AnalysisRequest {
  id: string
  symbol: string
  timestamp: number
  txHash: string
  paymentMethod: string
  completed: boolean
  resultHash: string
  amount: string
  userAddress: string
  result?: AnalysisResult
  payment: PaymentConfirmation
}

export function saveRequest(request: Omit<AnalysisRequest, "id">) {
  if (typeof window === "undefined") return

  const userAddress = request.userAddress.toLowerCase()
  const requestId = `${userAddress}-${Date.now()}`

  // Get existing requests
  const existingRequests = getRequests(userAddress)

  // Add new request with initial result status and payment confirmation
  const newRequest = {
    ...request,
    id: requestId,
    result: {
      symbol: request.symbol,
      timestamp: Date.now(),
      status: "processing" as const,
    },
    payment: {
      txHash: request.txHash,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      timestamp: Date.now(),
      status: "pending" as const,
    },
  }

  // Save updated requests
  const updatedRequests = [...existingRequests, newRequest]
  localStorage.setItem(`requests-${userAddress}`, JSON.stringify(updatedRequests))

  return newRequest
}

export function getRequests(userAddress: string): AnalysisRequest[] {
  if (typeof window === "undefined") return []

  try {
    const requests = localStorage.getItem(`requests-${userAddress.toLowerCase()}`)
    return requests ? JSON.parse(requests) : []
  } catch (error) {
    console.error("Error loading requests:", error)
    return []
  }
}

export function updateRequest(userAddress: string, requestId: string, updates: Partial<AnalysisRequest>) {
  if (typeof window === "undefined") return

  const requests = getRequests(userAddress)
  const updatedRequests = requests.map((request) => (request.id === requestId ? { ...request, ...updates } : request))

  localStorage.setItem(`requests-${userAddress.toLowerCase()}`, JSON.stringify(updatedRequests))
}

export function updatePaymentStatus(userAddress: string, txHash: string, status: "confirmed" | "failed") {
  const requests = getRequests(userAddress)
  const updatedRequests = requests.map((request) => {
    if (request.txHash === txHash) {
      return {
        ...request,
        payment: {
          ...request.payment,
          status: status,
        },
      }
    }
    return request
  })

  localStorage.setItem(`requests-${userAddress.toLowerCase()}`, JSON.stringify(updatedRequests))
}

// Mock function to simulate analysis completion
export async function checkAnalysisStatus(request: AnalysisRequest): Promise<AnalysisResult> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // For demo purposes, complete analysis after 1 minute
  const isComplete = Date.now() - request.timestamp > 60000

  if (isComplete) {
    return {
      symbol: request.symbol,
      timestamp: Date.now(),
      status: "completed",
      data: {
        price: 50000 + Math.random() * 1000,
        volume: 1000000000 + Math.random() * 100000000,
        marketCap: 1000000000000,
        priceChange24h: -2 + Math.random() * 4,
        technicalIndicators: {
          rsi: 30 + Math.random() * 40,
          macd: -10 + Math.random() * 20,
          ema: 49000 + Math.random() * 2000,
        },
        sentiment: {
          overall: Math.random() > 0.5 ? "Bullish" : "Bearish",
          score: Math.random(),
        },
        prediction: {
          direction: Math.random() > 0.5 ? "Upward" : "Downward",
          confidence: 0.5 + Math.random() * 0.5,
        },
      },
    }
  }

  return {
    symbol: request.symbol,
    timestamp: Date.now(),
    status: "processing",
  }
}

// Add function to check payment status
export async function checkPaymentStatus(txHash: string): Promise<"confirmed" | "pending" | "failed"> {
  try {
    // In a real implementation, you would check the blockchain for transaction confirmation
    // For demo purposes, we'll simulate a delay and return confirmed
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return "confirmed"
  } catch (error) {
    console.error("Error checking payment status:", error)
    return "failed"
  }
}

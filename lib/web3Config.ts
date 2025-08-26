export const COINMRI_CONTRACT_ADDRESS = "0xYourCoinMRIContractAddress"
export const COINMRI_ABI = [
  // Your CoinMRI ABI here
]
export const SUBSCRIPTION_PRICE_ETH = "0.1"
export const USDC_CONTRACT_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" // Arbitrum USDC
export const USDT_CONTRACT_ADDRESS = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" // Arbitrum USDT
export const ERC20_ABI = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  // Write functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
]
export const TOKENS_PER_ETH = 1000
export const TOKENS_PER_USDC = 1
export const TOKENS_PER_USDT = 1
export const MIN_PURCHASE = {
  ETH: 0.01,
  ARB: 5,
  USDC: 5,
  USDT: 5,
}
export const ARBITRUM_CHAIN_ID = 42161
export const ARBITRUM_RPC = "https://arb1.arbitrum.io/rpc"
export const ARB_CONTRACT_ADDRESS = "0x912CE59144191C1204E64559FE8253a0e49E6548" // Arbitrum ARB token
export const TOKENS_PER_ARB = 50
export const ARBITRUM_EXPLORER = "https://arbiscan.io"
export const REQUIRED_USD_AMOUNT = 5
export const ANALYSIS_REQUESTS_ADDRESS = "0x7338d8748D48E198C007cbCc3Cd75934A0f34a41" // Updated contract address
export const ANALYSIS_REQUESTS_ABI = [
  // Function to request analysis with ETH (original)
  {
    inputs: [
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "message", type: "string" },
    ],
    name: "requestAnalysis",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Alternative function signature based on transaction data
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "string", name: "symbol", type: "string" },
      { internalType: "string", name: "dashboardLink", type: "string" },
    ],
    name: "submitAnalysisRequest",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Function to get analysis price in ETH
  {
    inputs: [],
    name: "ethPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]
export const TOKEN_ADDRESSES = {
  ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548", // Arbitrum ARB token
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum USDC
  USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // Arbitrum USDT
}
export const NETWORK_CONFIG = {
  ARBITRUM: {
    chainId: 42161,
    chainName: "Arbitrum One",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
  },
}
export const ARBISCAN_API_KEY = "Q7F6Q2ITCZJWT98X4FFXJ1RQ9NRWGZWXWK"
export const ARBISCAN_API_URL = "https://api.arbiscan.io/api"
export const ADMIN_WALLET_ADDRESS = "0x837f5E0FbabD0b1c3482B6Ad10fA39275bDA252e"

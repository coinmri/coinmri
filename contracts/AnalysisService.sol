// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AnalysisService is Ownable, ReentrancyGuard {
  // Payment amounts in respective tokens
  uint256 public ethPrice = 0.01 ether;  // 0.01 ETH
  uint256 public arbPrice = 5 * 10**18;  // 5 ARB
  uint256 public usdcPrice = 10 * 10**6; // 10 USDC (6 decimals)
  uint256 public usdtPrice = 10 * 10**6; // 10 USDT (6 decimals)
  
  // Token contract addresses
  address public immutable USDC;
  address public immutable USDT;
  address public immutable ARB;
  
  // Analysis request structure
  struct AnalysisRequest {
      string symbol;
      uint256 timestamp;
      string resultHash;
      bool completed;
      string paymentMethod;
  }
  
  // Mapping from user address to their requests
  mapping(address => AnalysisRequest[]) public userRequests;
  
  // Mapping from request ID to owner address
  mapping(bytes32 => address) public requestOwners;
  
  // Events
  event AnalysisRequested(bytes32 indexed requestId, address indexed user, string symbol, string paymentMethod);
  event AnalysisCompleted(bytes32 indexed requestId, string resultHash);
  event PriceUpdated(string token, uint256 newPrice);

  constructor(
      address _usdc,
      address _usdt,
      address _arb
  ) Ownable(msg.sender) {
      USDC = _usdc;
      USDT = _usdt;
      ARB = _arb;
  }

  // Request analysis with ETH
  function requestAnalysisWithETH(string memory symbol) public payable nonReentrant returns (bytes32) {
      require(msg.value >= ethPrice, "Insufficient ETH sent");
      
      bytes32 requestId = keccak256(abi.encodePacked(msg.sender, symbol, block.timestamp));
      
      AnalysisRequest memory newRequest = AnalysisRequest({
          symbol: symbol,
          timestamp: block.timestamp,
          resultHash: "",
          completed: false,
          paymentMethod: "ETH"
      });
      
      userRequests[msg.sender].push(newRequest);
      requestOwners[requestId] = msg.sender;
      
      emit AnalysisRequested(requestId, msg.sender, symbol, "ETH");
      return requestId;
  }

  // Request analysis with ARB
  function requestAnalysisWithARB(string memory symbol) public nonReentrant returns (bytes32) {
      IERC20 token = IERC20(ARB);
      require(token.transferFrom(msg.sender, address(this), arbPrice), "ARB transfer failed");
      
      bytes32 requestId = keccak256(abi.encodePacked(msg.sender, symbol, block.timestamp));
      
      AnalysisRequest memory newRequest = AnalysisRequest({
          symbol: symbol,
          timestamp: block.timestamp,
          resultHash: "",
          completed: false,
          paymentMethod: "ARB"
      });
      
      userRequests[msg.sender].push(newRequest);
      requestOwners[requestId] = msg.sender;
      
      emit AnalysisRequested(requestId, msg.sender, symbol, "ARB");
      return requestId;
  }

  // Request analysis with USDC
  function requestAnalysisWithUSDC(string memory symbol) public nonReentrant returns (bytes32) {
      IERC20 token = IERC20(USDC);
      require(token.transferFrom(msg.sender, address(this), usdcPrice), "USDC transfer failed");
      
      bytes32 requestId = keccak256(abi.encodePacked(msg.sender, symbol, block.timestamp));
      
      AnalysisRequest memory newRequest = AnalysisRequest({
          symbol: symbol,
          timestamp: block.timestamp,
          resultHash: "",
          completed: false,
          paymentMethod: "USDC"
      });
      
      userRequests[msg.sender].push(newRequest);
      requestOwners[requestId] = msg.sender;
      
      emit AnalysisRequested(requestId, msg.sender, symbol, "USDC");
      return requestId;
  }

  // Request analysis with USDT
  function requestAnalysisWithUSDT(string memory symbol) public nonReentrant returns (bytes32) {
      IERC20 token = IERC20(USDT);
      require(token.transferFrom(msg.sender, address(this), usdtPrice), "USDT transfer failed");
      
      bytes32 requestId = keccak256(abi.encodePacked(msg.sender, symbol, block.timestamp));
      
      AnalysisRequest memory newRequest = AnalysisRequest({
          symbol: symbol,
          timestamp: block.timestamp,
          resultHash: "",
          completed: false,
          paymentMethod: "USDT"
      });
      
      userRequests[msg.sender].push(newRequest);
      requestOwners[requestId] = msg.sender;
      
      emit AnalysisRequested(requestId, msg.sender, symbol, "USDT");
      return requestId;
  }

  // Set analysis result (only owner)
  function setAnalysisResult(bytes32 requestId, string memory resultHash) public onlyOwner {
      address user = requestOwners[requestId];
      require(user != address(0), "Invalid request ID");
      
      AnalysisRequest[] storage requests = userRequests[user];
      for (uint i = 0; i < requests.length; i++) {
          if (keccak256(abi.encodePacked(user, requests[i].symbol, requests[i].timestamp)) == requestId) {
              requests[i].resultHash = resultHash;
              requests[i].completed = true;
              break;
          }
      }
      
      emit AnalysisCompleted(requestId, resultHash);
  }

  // Get user's analysis requests
  function getUserRequests(address user) public view returns (AnalysisRequest[] memory) {
      return userRequests[user];
  }

  // Update prices (only owner)
  function updateEthPrice(uint256 _newPrice) public onlyOwner {
      ethPrice = _newPrice;
      emit PriceUpdated("ETH", _newPrice);
  }
  
  function updateArbPrice(uint256 _newPrice) public onlyOwner {
      arbPrice = _newPrice;
      emit PriceUpdated("ARB", _newPrice);
  }
  
  function updateUsdcPrice(uint256 _newPrice) public onlyOwner {
      usdcPrice = _newPrice;
      emit PriceUpdated("USDC", _newPrice);
  }
  
  function updateUsdtPrice(uint256 _newPrice) public onlyOwner {
      usdtPrice = _newPrice;
      emit PriceUpdated("USDT", _newPrice);
  }

  // Withdraw funds (only owner)
  function withdrawETH() public onlyOwner {
      payable(owner()).transfer(address(this).balance);
  }

  function withdrawToken(address token) public onlyOwner {
      IERC20 tokenContract = IERC20(token);
      uint256 balance = tokenContract.balanceOf(address(this));
      require(balance > 0, "No tokens to withdraw");
      require(tokenContract.transfer(owner(), balance), "Token transfer failed");
  }
}

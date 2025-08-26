// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CoinMRIToken is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant TOKENS_PER_ETH = 1000;
    uint256 public constant TOKENS_PER_ARB = 50; // 1 ARB = 50 COINMRI (adjustable based on ARB price)
    uint256 public constant TOKENS_PER_USDC = 1;
    uint256 public constant TOKENS_PER_USDT = 1;
    uint256 public constant ANALYSIS_COST = 1 * 10**18;
    
    IERC20 public immutable USDC;
    IERC20 public immutable USDT;
    IERC20 public immutable ARB;
    
    mapping(address => AnalysisRequest[]) public userRequests;
    mapping(bytes32 => address) public requestOwners;
    
    struct AnalysisRequest {
        string symbol;
        uint256 timestamp;
        string resultHash;
        bool completed;
    }
    
    event TokensPurchased(address indexed buyer, uint256 amount, string paymentMethod);
    event AnalysisRequested(bytes32 indexed requestId, address indexed user, string symbol);
    event AnalysisCompleted(bytes32 indexed requestId, string resultHash);

    constructor(
        address _usdc,
        address _usdt,
        address _arb
    ) ERC20("CoinMRI Token", "COINMRI") Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        USDT = IERC20(_usdt);
        ARB = IERC20(_arb);
        _mint(msg.sender, 1000000 * 10**18); // Mint 1 million tokens
    }

    function buyTokens() public payable nonReentrant {
        require(msg.value > 0, "Must send ETH to buy tokens");
        uint256 tokenAmount = msg.value * TOKENS_PER_ETH;
        _transfer(owner(), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, "ETH");
    }

    function buyTokensWithARB(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        uint256 tokenAmount = amount * TOKENS_PER_ARB;
        require(ARB.transferFrom(msg.sender, owner(), amount), "ARB transfer failed");
        _transfer(owner(), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, "ARB");
    }

    function buyTokensWithUSDC(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        uint256 tokenAmount = amount * TOKENS_PER_USDC;
        require(USDC.transferFrom(msg.sender, owner(), amount), "USDC transfer failed");
        _transfer(owner(), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, "USDC");
    }

    function buyTokensWithUSDT(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        uint256 tokenAmount = amount * TOKENS_PER_USDT;
        require(USDT.transferFrom(msg.sender, owner(), amount), "USDT transfer failed");
        _transfer(owner(), msg.sender, tokenAmount);
        emit TokensPurchased(msg.sender, tokenAmount, "USDT");
    }

    function requestAnalysis(string memory symbol) public nonReentrant returns (bytes32) {
        require(balanceOf(msg.sender) >= ANALYSIS_COST, "Insufficient COINMRI tokens");
        
        _transfer(msg.sender, owner(), ANALYSIS_COST);
        
        bytes32 requestId = keccak256(abi.encodePacked(msg.sender, symbol, block.timestamp));
        
        AnalysisRequest memory newRequest = AnalysisRequest({
            symbol: symbol,
            timestamp: block.timestamp,
            resultHash: "",
            completed: false
        });
        
        userRequests[msg.sender].push(newRequest);
        requestOwners[requestId] = msg.sender;
        
        emit AnalysisRequested(requestId, msg.sender, symbol);
        return requestId;
    }

    function setAnalysisResult(bytes32 requestId, string memory resultHash) public onlyOwner {
        address user = requestOwners[requestId];
        require(user != address(0), "Invalid request ID");
        
        AnalysisRequest[] storage requests = userRequests[user];
        for (uint i = 0; i < requests.length; i++) {
            if (keccak256(abi.encodePacked(requests[i].symbol, requests[i].timestamp)) == 
                keccak256(abi.encodePacked(requestId))) {
                requests[i].resultHash = resultHash;
                requests[i].completed = true;
                break;
            }
        }
        
        emit AnalysisCompleted(requestId, resultHash);
    }

    function getUserRequests(address user) public view returns (AnalysisRequest[] memory) {
        return userRequests[user];
    }

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

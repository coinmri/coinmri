// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AnalysisRequests is ReentrancyGuard, Ownable {
    // Payment receiver address
    address public paymentReceiver;
    
    // Payment amounts in respective tokens
    uint256 public ethPrice = 0.0025 ether;  // ~5 USD in ETH
    uint256 public arbPrice = 2.5 ether;     // 2.5 ARB (18 decimals)
    uint256 public usdcPrice = 5 * 10**6;    // 5 USDC (6 decimals)
    uint256 public usdtPrice = 5 * 10**6;    // 5 USDT (6 decimals)

    // Token addresses on Arbitrum
    address public immutable USDC;
    address public immutable USDT;
    address public immutable ARB;

    // Request structure
    struct Request {
        string requestedSymbol;    // The symbol being analyzed
        string paymentSymbol;      // The token used for payment (ETH, ARB, USDC, USDT)
        uint256 amount;           // Amount paid
        uint256 timestamp;        // When the request was made
        bool completed;           // Whether the analysis is complete
        string resultHash;        // IPFS hash or other reference to the analysis result
    }

    // Mappings
    mapping(address => Request[]) public userRequests;
    mapping(bytes32 => Request) public requestsByTxHash;
    mapping(bytes32 => address) public requestOwners;

    // Events
    event AnalysisRequested(
        address indexed user,
        string requestedSymbol,
        string paymentSymbol,
        uint256 amount,
        uint256 timestamp,
        bytes32 indexed txHash
    );

    event AnalysisCompleted(
        bytes32 indexed txHash,
        string resultHash
    );

    constructor(
        address _usdc,
        address _usdt,
        address _arb,
        address _paymentReceiver
    ) Ownable(msg.sender) {
        USDC = _usdc;
        USDT = _usdt;
        ARB = _arb;
        paymentReceiver = _paymentReceiver;
    }

    // Request analysis with ETH
    function requestAnalysisWithETH(string memory requestedSymbol) public payable nonReentrant {
        require(msg.value >= ethPrice, "Insufficient ETH sent");
        
        // Forward payment to receiver
        (bool success, ) = paymentReceiver.call{value: msg.value}("");
        require(success, "ETH transfer failed");
        
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            requestedSymbol,
            block.timestamp
        ));
        
        // Create and store request
        Request memory newRequest = Request({
            requestedSymbol: requestedSymbol,
            paymentSymbol: "ETH",
            amount: msg.value,
            timestamp: block.timestamp,
            completed: false,
            resultHash: ""
        });
        
        userRequests[msg.sender].push(newRequest);
        requestsByTxHash[txHash] = newRequest;
        requestOwners[txHash] = msg.sender;
        
        emit AnalysisRequested(
            msg.sender,
            requestedSymbol,
            "ETH",
            msg.value,
            block.timestamp,
            txHash
        );
    }

    // Request analysis with tokens (ARB, USDC, USDT)
    function requestAnalysisWithToken(
        string memory requestedSymbol,
        string memory paymentSymbol
    ) public nonReentrant {
        IERC20 token;
        uint256 amount;
        
        // Determine token and amount based on payment symbol
        if (keccak256(abi.encodePacked(paymentSymbol)) == keccak256(abi.encodePacked("ARB"))) {
            token = IERC20(ARB);
            amount = arbPrice;
        } else if (keccak256(abi.encodePacked(paymentSymbol)) == keccak256(abi.encodePacked("USDC"))) {
            token = IERC20(USDC);
            amount = usdcPrice;
        } else if (keccak256(abi.encodePacked(paymentSymbol)) == keccak256(abi.encodePacked("USDT"))) {
            token = IERC20(USDT);
            amount = usdtPrice;
        } else {
            revert("Unsupported token");
        }
        
        // Transfer tokens from user to payment receiver
        require(token.transferFrom(msg.sender, paymentReceiver, amount), "Token transfer failed");
        
        bytes32 txHash = keccak256(abi.encodePacked(
            msg.sender,
            requestedSymbol,
            block.timestamp
        ));
        
        // Create and store request
        Request memory newRequest = Request({
            requestedSymbol: requestedSymbol,
            paymentSymbol: paymentSymbol,
            amount: amount,
            timestamp: block.timestamp,
            completed: false,
            resultHash: ""
        });
        
        userRequests[msg.sender].push(newRequest);
        requestsByTxHash[txHash] = newRequest;
        requestOwners[txHash] = msg.sender;
        
        emit AnalysisRequested(
            msg.sender,
            requestedSymbol,
            paymentSymbol,
            amount,
            block.timestamp,
            txHash
        );
    }

    // Set analysis result (only owner)
    function setAnalysisResult(bytes32 txHash, string memory resultHash) public onlyOwner {
        require(requestsByTxHash[txHash].timestamp != 0, "Request not found");
        
        requestsByTxHash[txHash].completed = true;
        requestsByTxHash[txHash].resultHash = resultHash;
        
        emit AnalysisCompleted(txHash, resultHash);
    }

    // Get all requests for a user
    function getUserRequests(address user) public view returns (Request[] memory) {
        return userRequests[user];
    }

    // Get request by transaction hash
    function getRequestByTxHash(bytes32 txHash) public view returns (Request memory) {
        return requestsByTxHash[txHash];
    }

    // Update prices (only owner)
    function updatePrices(
        uint256 _ethPrice,
        uint256 _arbPrice,
        uint256 _usdcPrice,
        uint256 _usdtPrice
    ) public onlyOwner {
        ethPrice = _ethPrice;
        arbPrice = _arbPrice;
        usdcPrice = _usdcPrice;
        usdtPrice = _usdtPrice;
    }

    // Update payment receiver (only owner)
    function updatePaymentReceiver(address _paymentReceiver) public onlyOwner {
        paymentReceiver = _paymentReceiver;
    }

    // Receive function to accept ETH
    receive() external payable {}
}

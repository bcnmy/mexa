// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "./ReentrancyGuard.sol";
import "../libs/Pausable.sol";
import "../libs/Ownable.sol";
import "../ExecutorManager.sol";
import "../interfaces/IERC20.sol";

contract LiquidityPoolManager is ReentrancyGuard, Ownable, BaseRelayRecipient, Pausable {
    using SafeMath for uint256;

    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    uint256 public biconomyCommission;
    mapping ( address => bool ) public supportedTokenMap;    // tokenAddress => active_status
    mapping ( address => uint256 ) public tokenCapMap;    // tokenAddress => cap
    mapping ( address => uint256) public tokenBalanceMap;
    mapping ( address => mapping ( address => uint256) ) public liquidityProviderMap; // tokenAddress => LPaddress => amount
    mapping ( address => mapping ( address => uint256) ) public rewardMap;
    mapping ( bytes32 => bool ) public sendFundsMap;
    ExecutorManager executorManager;

    event AssetSent(address indexed asset, uint256 amount, address target);
    event Received(address from, uint256 amount);
    event Deposit(address tokenAddress, address receiver, uint256 amount);

    // MODIFIERS
    modifier onlyExecutorOrOwner() {
        require(executorManager.getExecutorStatus(_msgSender()) || _msgSender() == owner(),
            "You are not allowed to perform this operation"
        );
        _;
    }

    modifier tokenChecks(address tokenAddress){
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(supportedTokenMap[tokenAddress], "Token not supported");

        _;
    }

    constructor(address _executorManagerAddress,  address owner, uint256 _commissionRate) public Ownable(owner) Pausable(owner) {
        require(_executorManagerAddress != address(0), "ExecutorManager Contract Address cannot be 0");
        executorManager = ExecutorManager(_executorManagerAddress);
        supportedTokenMap[NATIVE] = true;
        trustedForwarder = address(this);
        biconomyCommission = _commissionRate;
    }

    function changeCommissionRate(uint256 newCommissionRate) public onlyOwner whenNotPaused {
        require(newCommissionRate != 0, "Commission Rate cannot be 0");
        biconomyCommission = newCommissionRate;
    }

    function versionRecipient() external override virtual view returns (string memory){
        return "1";
    }

    function getExecutorManager() public view returns (address){
        return address(executorManager);
    }

    function changeTrustedForwarder( address forwarderAddress ) public onlyOwner {
        require(forwarderAddress != address(0), "Forwarder Address cannot be 0");
        trustedForwarder = forwarderAddress;
    }

    function addSupportedToken( address tokenAddress, uint256 capLimit ) public tokenChecks(tokenAddress) onlyOwner {
        supportedTokenMap[tokenAddress] = true;
        tokenCapMap[tokenAddress] = capLimit;
    }

    function removeSupportedToken( address tokenAddress ) public tokenChecks(tokenAddress) onlyOwner {
        require(tokenAddress != NATIVE, "Native currency can't be removed");
        supportedTokenMap[tokenAddress] = false;
    }

    function updateTokenCap( address tokenAddress, uint256 capLimit ) public tokenChecks(tokenAddress) onlyOwner {
        tokenCapMap[tokenAddress] = capLimit;
    }
    function addEthLiquidity() public payable whenNotPaused {
        require(msg.value > 0, "amount should be greater then 0");
        liquidityProviderMap[NATIVE][_msgSender()] = liquidityProviderMap[NATIVE][_msgSender()].add(msg.value);
        tokenBalanceMap[NATIVE] = tokenBalanceMap[NATIVE].add(msg.value);
    }

    function removeEthLiquidity(uint256 amount) public whenNotPaused {
        require(liquidityProviderMap[NATIVE][_msgSender()] >= amount, "Not enough balance");
        liquidityProviderMap[NATIVE][_msgSender()] = liquidityProviderMap[NATIVE][_msgSender()].sub(amount);
        tokenBalanceMap[NATIVE] = tokenBalanceMap[NATIVE].sub(amount);
        require(_msgSender().send(amount), "Native Transfer Failed");
    }

    function addTokenLiquidity( address tokenAddress, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(amount > 0, "amount should be greater then 0");

        IERC20 erc20 = IERC20(tokenAddress);

        require(erc20.transferFrom(_msgSender(),address(this),amount),"Token Transfer Failed");

        liquidityProviderMap[tokenAddress][_msgSender()] = liquidityProviderMap[tokenAddress][_msgSender()].add(amount);
        tokenBalanceMap[tokenAddress] = tokenBalanceMap[tokenAddress].add(amount);
    }

    function removeTokenLiquidity( address tokenAddress, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(amount > 0, "amount should be greater then 0");
        require(liquidityProviderMap[tokenAddress][_msgSender()] >= amount, "Not enough balance");

        IERC20 erc20 = IERC20(tokenAddress);
        require(erc20.transfer(_msgSender(),amount),"Token Transfer Failed");

        liquidityProviderMap[tokenAddress][_msgSender()] = liquidityProviderMap[tokenAddress][_msgSender()].sub(amount);
        tokenBalanceMap[tokenAddress] = tokenBalanceMap[tokenAddress].sub(amount);
    }

    function deposit( address tokenAddress, address receiver, uint256 amount ) public tokenChecks(tokenAddress) onlyExecutorOrOwner whenNotPaused {
        require(tokenCapMap[tokenAddress] == 0 || tokenCapMap[tokenAddress] >= amount,"Deposit amount exceeds allowed Cap limit");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(amount > 0, "amount should be greater then 0");

        IERC20 erc20 = IERC20(tokenAddress);

        require(erc20.transferFrom(_msgSender(),address(this),amount),"Deposit Failed");

        emit Deposit(tokenAddress, receiver, amount);
    }

    function sendFundsToUser( address tokenAddress, uint256 amount, address payable receiver, string memory depositHash, uint256 gasFees ) public nonReentrant onlyExecutorOrOwner tokenChecks(tokenAddress) whenNotPaused {
        require(tokenCapMap[tokenAddress] == 0 || tokenCapMap[tokenAddress] >= amount, "Withdraw amount exceeds allowed Cap limit");
        require(receiver != address(0), "Bad receiver address");

        bytes32 hashSendTransaction = keccak256(
            abi.encode(
                tokenAddress,
                amount,
                receiver,
                keccak256(bytes(depositHash))
            )
        );

        require(!sendFundsMap[hashSendTransaction],"Already Processed");

        uint256 bcnmyCommission = amount.mul(biconomyCommission).div(100);
        uint256 amountToTransfer = amount.sub(bcnmyCommission.add(gasFees));

        if (tokenAddress == NATIVE) {
            require(address(this).balance > amountToTransfer, "Not Enough Balance");
            require(receiver.send(amountToTransfer), "Native Transfer Failed");
        } else {
            IERC20 erc20 = IERC20(tokenAddress);
            require(erc20.balanceOf(address(this)) > amountToTransfer, "Not Enough Balance");
            require(erc20.transfer(receiver,amountToTransfer),"Token Transfer Failed");
        }

        sendFundsMap[hashSendTransaction] = true;
        emit AssetSent(tokenAddress, amountToTransfer, receiver);
    }
}
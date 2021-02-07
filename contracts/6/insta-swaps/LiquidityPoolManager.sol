// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ReentrancyGuard.sol";
import "../libs/Pausable.sol";
import "../libs/Ownable.sol";
import "../ExecutorManager.sol";

contract LiquidityPoolManager is ReentrancyGuard, Ownable, BaseRelayRecipient, Pausable {
    using SafeMath for uint256;

    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    uint256 public baseGas;
    
    ExecutorManager executorManager;
    uint256 public adminFee;
    mapping (address => uint256) public tokenTransferOverhead;

    mapping ( address => bool ) public supportedToken;    // tokenAddress => active_status
    mapping ( address => uint256 ) public tokenCap;    // tokenAddress => cap
    mapping ( address => uint256) public tokenLiquidity;
    mapping ( address => mapping ( address => uint256) ) public liquidityProvider; // tokenAddress => LPaddress => amount
    mapping ( bytes32 => bool ) public processedHash;

    event AssetSent(address indexed asset, uint256 indexed amount, address indexed target);
    event Received(address indexed from, uint256 indexed amount);
    event Deposit(address indexed from, address indexed tokenAddress, address indexed receiver, string trackingId, uint256 amount);
    event LiquidityAdded(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 amount);
    event LiquidityRemoved(address indexed tokenAddress, uint256 indexed amount, address indexed sender);
    event GasUsed(uint256 indexed, uint256 indexed);
    event fundsWithdraw(address indexed tokenAddress, address indexed owner,  uint256 indexed amount);
    
    // MODIFIERS
    modifier onlyExecutorOrOwner() {
        require(executorManager.getExecutorStatus(_msgSender()) || _msgSender() == owner(),
            "You are not allowed to perform this operation"
        );
        _;
    }

    modifier tokenChecks(address tokenAddress){
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(supportedToken[tokenAddress], "Token not supported");

        _;
    }

    constructor(address _executorManagerAddress, address owner, address _trustedForwarder, uint256 _adminFee) public Ownable(owner) Pausable(owner) {
        require(_executorManagerAddress != address(0), "ExecutorManager Contract Address cannot be 0");
        executorManager = ExecutorManager(_executorManagerAddress); 
        supportedToken[NATIVE] = true;
        trustedForwarder = _trustedForwarder;
        adminFee = _adminFee;
        baseGas = 21000;
    }

    function getAdminFee() public view returns (uint256 ) {
        return adminFee;
    }

    function changeAdminFee(uint256 newAdminFee) public onlyOwner whenNotPaused {
        require(newAdminFee != 0, "Admin Fee cannot be 0");
        adminFee = newAdminFee;
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

    function setTokenTransferOverhead( address tokenAddress, uint256 gasOverhead ) public onlyOwner {
        tokenTransferOverhead[tokenAddress] = gasOverhead;
    }

    function addSupportedToken( address tokenAddress, uint256 capLimit ) public onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be 0");        
        supportedToken[tokenAddress] = true;
        tokenCap[tokenAddress] = capLimit;
    }

    function removeSupportedToken( address tokenAddress ) public tokenChecks(tokenAddress) onlyOwner {
        require(tokenAddress != NATIVE, "Native currency can't be removed");
        supportedToken[tokenAddress] = false;
    }

    function updateTokenCap( address tokenAddress, uint256 capLimit ) public tokenChecks(tokenAddress) onlyOwner {
        tokenCap[tokenAddress] = capLimit;
    }

    function addEthLiquidity() public payable whenNotPaused {
        require(msg.value > 0, "amount should be greater then 0");
        liquidityProvider[NATIVE][_msgSender()] = liquidityProvider[NATIVE][_msgSender()].add(msg.value);
        tokenLiquidity[NATIVE] = tokenLiquidity[NATIVE].add(msg.value);
    }

    function removeEthLiquidity(uint256 amount) public whenNotPaused {
        require(liquidityProvider[NATIVE][_msgSender()] >= amount, "Not enough balance");
        liquidityProvider[NATIVE][_msgSender()] = liquidityProvider[NATIVE][_msgSender()].sub(amount);
        tokenLiquidity[NATIVE] = tokenLiquidity[NATIVE].sub(amount);
        
        require(_msgSender().send(amount), "Native Transfer Failed");
        emit LiquidityRemoved( NATIVE, amount, msg.sender);
    }

    function addTokenLiquidity( address tokenAddress, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(amount > 0, "amount should be greater then 0");

        liquidityProvider[tokenAddress][_msgSender()] = liquidityProvider[tokenAddress][_msgSender()].add(amount);
        tokenLiquidity[tokenAddress] = tokenLiquidity[tokenAddress].add(amount);
        
        SafeERC20.safeTransferFrom(IERC20(tokenAddress), _msgSender(), address(this), amount);
        emit LiquidityAdded(_msgSender(), tokenAddress, address(this), amount);
    }

    function removeTokenLiquidity( address tokenAddress, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(amount > 0, "amount should be greater then 0");
        require(liquidityProvider[tokenAddress][_msgSender()] >= amount, "Not enough balance");

        liquidityProvider[tokenAddress][_msgSender()] = liquidityProvider[tokenAddress][_msgSender()].sub(amount);
        tokenLiquidity[tokenAddress] = tokenLiquidity[tokenAddress].sub(amount);

        SafeERC20.safeTransfer(IERC20(tokenAddress), _msgSender(), amount);
    }

    function depositErc20( address tokenAddress, address receiver, uint256 amount, string trackingId ) public tokenChecks(tokenAddress) whenNotPaused {
        require(tokenCap[tokenAddress] == 0 || tokenCap[tokenAddress] >= amount,"Deposit amount exceeds allowed Cap limit");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(amount > 0, "amount should be greater then 0");

        SafeERC20.safeTransferFrom(IERC20(tokenAddress), _msgSender(), address(this),amount);
        emit Deposit(_msgSender(), tokenAddress, receiver, trackingId, amount);
    }

    function depositEth( address receiver, string trackingId ) public whenNotPaused payable {
        require(tokenCap[NATIVE] == 0 || tokenCap[NATIVE] >= msg.value, "Deposit amount exceeds allowed Cap limit");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(msg.value > 0, "amount should be greater then 0");

        emit Deposit(msg.sender, tokenAddress, receiver, trackingId, msg.value);
    }

    function sendFundsToUser( address tokenAddress, uint256 amount, address payable receiver, bytes memory depositHash, uint256 tokenGasPrice ) public nonReentrant onlyExecutorOrOwner tokenChecks(tokenAddress) whenNotPaused {
        uint256 initialGas = gasleft();
        require(tokenCap[tokenAddress] == 0 || tokenCap[tokenAddress] >= amount, "Withdraw amount exceeds allowed Cap limit");        
        require(receiver != address(0), "Bad receiver address");

        bytes32 hashSendTransaction = keccak256(
            abi.encode(
                tokenAddress,
                amount,
                receiver,
                keccak256(depositHash)
            )
        );

        require(!processedHash[hashSendTransaction],"Already Processed");
        processedHash[hashSendTransaction] = true;

        uint256 calculateAdminFee = amount.mul(adminFee).div(10000);
        uint256 totalGasUsed = (initialGas.sub(gasleft())).add(tokenTransferOverhead[tokenAddress]).add(baseGas);

        uint256 gasStart = gasleft();
        uint256 gasFeeInToken = totalGasUsed.mul(tokenGasPrice);
        uint256 amountToTransfer = amount.sub(calculateAdminFee.add(gasFeeInToken));

        if (tokenAddress == NATIVE) {
            require(address(this).balance > amountToTransfer, "Not Enough Balance");
            require(receiver.send(amountToTransfer), "Native Transfer Failed");
        } else {
            require(IERC20(tokenAddress).balanceOf(address(this)) > amountToTransfer, "Not Enough Balance");
            SafeERC20.safeTransfer(IERC20(tokenAddress), receiver, amountToTransfer);
        }

        uint256 gasEnd = gasleft();
        emit GasUsed(gasStart, gasEnd);
        emit AssetSent(tokenAddress, amountToTransfer, receiver);
    }

    function withdrawErc20(address tokenAddress) public onlyOwner whenNotPaused {
        uint256 profitEarned = (IERC20(tokenAddress).balanceOf(address(this))).sub(tokenLiquidity[tokenAddress]);
        require(profitEarned > 0, "Profit earned is 0");
        SafeERC20.safeTransfer(IERC20(tokenAddress), _msgSender(), profitEarned);

        emit fundsWithdraw(tokenAddress, _msgSender(),  profitEarned);
    }

    function withdrawEth(uint256 amount) public onlyOwner whenNotPaused {
        uint256 profitEarned = (address(this).balance).sub(tokenLiquidity[NATIVE]);
        require(profitEarned > 0, "Profit earned is 0");
        require((msg.sender).send(profitEarned), "Native Transfer Failed");
        
        emit fundsWithdraw(address(this), msg.sender, profitEarned);
    }

    receive() external payable { }
}
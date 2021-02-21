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
    uint256 public baseGas;
    
    ExecutorManager executorManager;
    uint256 public adminFee;
    mapping (address => uint256) public tokenTransferOverhead;

    mapping ( address => bool ) public supportedToken;    // tokenAddress => active_status
    mapping ( address => uint256 ) public tokenMinCap;    // tokenAddress => minWithdrawalCap
    mapping ( address => uint256 ) public tokenMaxCap;    // tokenAddress => maxWithdrawalCap
    mapping ( address => uint256) public tokenLiquidity;
    mapping ( address => mapping ( address => uint256) ) public liquidityProvider; // tokenAddress => LPaddress => amount
    mapping ( bytes32 => bool ) public processedHash;

    event AssetSent(address indexed asset, uint256 indexed amount, address indexed target);
    event Received(address indexed from, uint256 indexed amount);
    event Deposit(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 toChainId, uint256 amount);
    event LiquidityAdded(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 amount);
    event LiquidityRemoved(address indexed tokenAddress, uint256 indexed amount, address indexed sender);
    event GasUsed(uint256 indexed, uint256 indexed);
    event fundsWithdraw(address indexed tokenAddress, address indexed owner,  uint256 indexed amount);
    
    // MODIFIERS
    modifier onlyExecutor() {
        require(executorManager.getExecutorStatus(_msgSender()),
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

    function setTrustedForwarder( address forwarderAddress ) public onlyOwner {
        require(forwarderAddress != address(0), "Forwarder Address cannot be 0");
        trustedForwarder = forwarderAddress;
    }

    function setTokenTransferOverhead( address tokenAddress, uint256 gasOverhead ) public onlyOwner {
        tokenTransferOverhead[tokenAddress] = gasOverhead;
    }

    function addSupportedToken( address tokenAddress, uint256 minCapLimit, uint256 maxCapLimit ) public onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be 0");  
        require(maxCapLimit > minCapLimit, "maxCapLimit cannot be smaller than minCapLimit");        
        supportedToken[tokenAddress] = true;
        tokenMinCap[tokenAddress] = minCapLimit;
        tokenMaxCap[tokenAddress] = maxCapLimit;
    }

    function removeSupportedToken( address tokenAddress ) public tokenChecks(tokenAddress) onlyOwner {
        // require(tokenAddress != NATIVE, "Native currency can't be removed");
        supportedToken[tokenAddress] = false;
    }

    function updateTokenCap( address tokenAddress, uint256 minCapLimit, uint256 maxCapLimit ) public tokenChecks(tokenAddress) onlyOwner {
        require(maxCapLimit > minCapLimit, "maxCapLimit cannot be smaller than minCapLimit");                
        tokenMinCap[tokenAddress] = minCapLimit;        
        tokenMaxCap[tokenAddress] = maxCapLimit;
    }

    function addNativeLiquidity() public payable whenNotPaused {
        require(msg.value > 0, "amount should be greater then 0");
        liquidityProvider[NATIVE][_msgSender()] = liquidityProvider[NATIVE][_msgSender()].add(msg.value);
        tokenLiquidity[NATIVE] = tokenLiquidity[NATIVE].add(msg.value);
    }

    function removeNativeLiquidity(uint256 amount) public whenNotPaused {
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

    function depositErc20( address tokenAddress, address receiver, uint256 amount, uint256 toChainId ) public tokenChecks(tokenAddress) whenNotPaused {
        require(tokenMinCap[tokenAddress] <= amount && tokenMaxCap[tokenAddress] >= amount, "Deposit amount should be within allowed Cap limits");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(amount > 0, "amount should be greater then 0");

        SafeERC20.safeTransferFrom(IERC20(tokenAddress), _msgSender(), address(this),amount);
        emit Deposit(_msgSender(), tokenAddress, receiver, toChainId, amount);
    }

    function depositNative( address receiver, uint256 toChainId ) public whenNotPaused payable {
        require(tokenMinCap[NATIVE] <= msg.value && tokenMaxCap[NATIVE] >= msg.value, "Deposit amount should be within allowed Cap limit");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(msg.value > 0, "amount should be greater then 0");

        emit Deposit(msg.sender, NATIVE, receiver, toChainId, msg.value);
    }

    function sendFundsToUser( address tokenAddress, uint256 amount, address payable receiver, bytes memory depositHash, uint256 tokenGasPrice ) public nonReentrant onlyExecutor tokenChecks(tokenAddress) whenNotPaused {
        uint256 initialGas = gasleft();
        require(tokenMinCap[tokenAddress] <= amount && tokenMaxCap[tokenAddress] >= amount, "Withdraw amount should be within allowed Cap limits");
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

    function checkHashStatus(address tokenAddress, uint256 amount, address payable receiver, bytes memory depositHash) public view returns(bool){
        bytes32 hashSendTransaction = keccak256(
            abi.encode(
                tokenAddress,
                amount,
                receiver,
                keccak256(depositHash)
            )
        );

        return processedHash[hashSendTransaction];
    }

    function withdrawErc20(address tokenAddress) public onlyOwner whenNotPaused {
        uint256 profitEarned = (IERC20(tokenAddress).balanceOf(address(this))).sub(tokenLiquidity[tokenAddress]);
        require(profitEarned > 0, "Profit earned is 0");
        SafeERC20.safeTransfer(IERC20(tokenAddress), _msgSender(), profitEarned);

        emit fundsWithdraw(tokenAddress, _msgSender(),  profitEarned);
    }

    function withdrawNative() public onlyOwner whenNotPaused {
        uint256 profitEarned = (address(this).balance).sub(tokenLiquidity[NATIVE]);
        require(profitEarned > 0, "Profit earned is 0");
        require((msg.sender).send(profitEarned), "Native Transfer Failed");
        
        emit fundsWithdraw(address(this), msg.sender, profitEarned);
    }

    receive() external payable { }
}
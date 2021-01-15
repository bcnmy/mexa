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
    mapping ( address => uint256) public tokenBalance;
    mapping ( address => mapping ( address => uint256) ) public liquidityProvider; // tokenAddress => LPaddress => amount
    mapping ( bytes32 => bool ) public processedHash;

    event AssetSent(address indexed asset, uint256 indexed amount, address indexed target);
    event Received(address indexed from, uint256 indexed amount);
    event Deposit(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 amount);
    event LiquidityAdded(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 amount);
    event LiquidityRemoved(address indexed tokenAddress, uint256 indexed amount, address indexed sender);

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
        tokenBalance[NATIVE] = tokenBalance[NATIVE].add(msg.value);
    }

    function removeEthLiquidity(uint256 amount) public whenNotPaused {
        require(liquidityProvider[NATIVE][_msgSender()] >= amount, "Not enough balance");
        liquidityProvider[NATIVE][_msgSender()] = liquidityProvider[NATIVE][_msgSender()].sub(amount);
        tokenBalance[NATIVE] = tokenBalance[NATIVE].sub(amount);
        require(_msgSender().send(amount), "Native Transfer Failed");
        emit LiquidityRemoved( NATIVE, amount, msg.sender);
    }

    function addTokenLiquidity( address tokenAddress, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(amount > 0, "amount should be greater then 0");

        IERC20 erc20 = IERC20(tokenAddress);
        
        liquidityProvider[tokenAddress][_msgSender()] = liquidityProvider[tokenAddress][_msgSender()].add(amount);
        tokenBalance[tokenAddress] = tokenBalance[tokenAddress].add(amount);
        
        SafeERC20.safeTransferFrom(IERC20(tokenAddress), _msgSender(), address(this), amount);
        emit LiquidityAdded(_msgSender(), tokenAddress, address(this), amount);
    }

    function removeTokenLiquidity( address tokenAddress, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(amount > 0, "amount should be greater then 0");
        require(liquidityProvider[tokenAddress][_msgSender()] >= amount, "Not enough balance");

        IERC20 erc20 = IERC20(tokenAddress);

        liquidityProvider[tokenAddress][_msgSender()] = liquidityProvider[tokenAddress][_msgSender()].sub(amount);
        tokenBalance[tokenAddress] = tokenBalance[tokenAddress].sub(amount);

        require(erc20.transfer(_msgSender(),amount),"Token Transfer Failed");
    }

    function deposit( address tokenAddress, address receiver, uint256 amount ) public tokenChecks(tokenAddress) whenNotPaused {
        require(tokenCap[tokenAddress] == 0 || tokenCap[tokenAddress] >= amount,"Deposit amount exceeds allowed Cap limit");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(amount > 0, "amount should be greater then 0");

        IERC20 erc20 = IERC20(tokenAddress);

        SafeERC20.safeTransferFrom(IERC20(tokenAddress), _msgSender(),address(this),amount);

        emit Deposit(_msgSender(), tokenAddress, receiver, amount);
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
        uint256 gasUsed = initialGas - gasleft();

        uint256 gasFeeInToken = gasUsed.add(tokenTransferOverhead[tokenAddress]).add(baseGas).mul(tokenGasPrice);

        uint256 amountToTransfer = amount.sub(calculateAdminFee.add(gasFeeInToken));

        if (tokenAddress == NATIVE) {
            require(address(this).balance > amountToTransfer, "Not Enough Balance");
            require(receiver.send(amountToTransfer), "Native Transfer Failed");
        } else {
            IERC20 erc20 = IERC20(tokenAddress);
            require(erc20.balanceOf(address(this)) > amountToTransfer, "Not Enough Balance");
            require(erc20.transfer(receiver,amountToTransfer),"Token Transfer Failed");
        }

        emit AssetSent(tokenAddress, amountToTransfer, receiver);
    }
}
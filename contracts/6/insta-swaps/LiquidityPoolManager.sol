// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../libs/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./ReentrancyGuard.sol";
import "../libs/Pausable.sol";
import "../libs/Ownable.sol";
import "../ExecutorManager.sol";
import "../interfaces/IERC20Permit.sol";

contract LiquidityPoolManager is ReentrancyGuard, Ownable, BaseRelayRecipient, Pausable {
    using SafeMath for uint256;

    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    uint256 public baseGas;
    
    ExecutorManager private executorManager;
    uint256 public adminFee;

    struct TokenInfo {
        uint256 transferOverhead;
        bool supportedToken;
        uint256 minCap;
        uint256 maxCap;
        uint256 liquidity;
        mapping(address => uint256) liquidityProvider;
    }

     struct PermitRequest {
        uint256 nonce;
        uint256 expiry;
        bool allowed; 
        uint8 v;
        bytes32 r; 
        bytes32 s; 
    }

    mapping ( address => TokenInfo ) public tokensInfo;
    mapping ( bytes32 => bool ) public processedHash;

    event AssetSent(address indexed asset, uint256 indexed amount, uint256 indexed transferredAmount, address target, bytes depositHash);
    event Received(address indexed from, uint256 indexed amount);
    event Deposit(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 toChainId, uint256 amount);
    event LiquidityAdded(address indexed from, address indexed tokenAddress, address indexed receiver, uint256 amount);
    event LiquidityRemoved(address indexed tokenAddress, uint256 indexed amount, address indexed sender);
    event fundsWithdraw(address indexed tokenAddress, address indexed owner,  uint256 indexed amount);
    event AdminFeeChanged(uint256 indexed newAdminFee);
    event TrustedForwarderChanged(address indexed forwarderAddress);
    event EthReceived(address, uint);

    // MODIFIERS
    modifier onlyExecutor() {
        require(executorManager.getExecutorStatus(_msgSender()),
            "You are not allowed to perform this operation"
        );
        _;
    }

    modifier tokenChecks(address tokenAddress){
        require(tokenAddress != address(0), "Token address cannot be 0");
        require(tokensInfo[tokenAddress].supportedToken, "Token not supported");

        _;
    }

    constructor(address _executorManagerAddress, address owner, address pauser, address _trustedForwarder, uint256 _adminFee) public Ownable(owner) Pausable(pauser) {
        require(_executorManagerAddress != address(0), "ExecutorManager Contract Address cannot be 0");
        require(_trustedForwarder != address(0), "TrustedForwarder Contract Address cannot be 0");
        require(_adminFee != 0, "AdminFee cannot be 0");
        executorManager = ExecutorManager(_executorManagerAddress);
        trustedForwarder = _trustedForwarder;
        adminFee = _adminFee;
        baseGas = 21000;
    }

    function renounceOwnership() public override onlyOwner {
        revert ("can't renounceOwnership here"); // not possible within this smart contract
    }

    function renouncePauser() public override onlyPauser {
        revert ("can't renouncePauser here"); // not possible within this smart contract
    }

    function getAdminFee() public view returns (uint256 ) {
        return adminFee;
    }

    function changeAdminFee(uint256 newAdminFee) external onlyOwner whenNotPaused {
        require(newAdminFee != 0, "Admin Fee cannot be 0");
        adminFee = newAdminFee;
        emit AdminFeeChanged(newAdminFee);
    }

    function versionRecipient() external override virtual view returns (string memory){
        return "1";
    }

    function setBaseGas(uint128 gas) external onlyOwner{
        baseGas = gas;
    }

    function getExecutorManager() public view returns (address){
        return address(executorManager);
    }

    function setExecutorManager(address _executorManagerAddress) external onlyOwner {
        require(_executorManagerAddress != address(0), "Executor Manager Address cannot be 0");
        executorManager = ExecutorManager(_executorManagerAddress);
    }

    function setTrustedForwarder( address forwarderAddress ) external onlyOwner {
        require(forwarderAddress != address(0), "Forwarder Address cannot be 0");
        trustedForwarder = forwarderAddress;
        emit TrustedForwarderChanged(forwarderAddress);
    }

    function setTokenTransferOverhead( address tokenAddress, uint256 gasOverhead ) external tokenChecks(tokenAddress) onlyOwner {
        tokensInfo[tokenAddress].transferOverhead = gasOverhead;
    }

    function addSupportedToken( address tokenAddress, uint256 minCapLimit, uint256 maxCapLimit ) external onlyOwner {
        require(tokenAddress != address(0), "Token address cannot be 0");  
        require(maxCapLimit > minCapLimit, "maxCapLimit cannot be smaller than minCapLimit");        
        tokensInfo[tokenAddress].supportedToken = true;
        tokensInfo[tokenAddress].minCap = minCapLimit;
        tokensInfo[tokenAddress].maxCap = maxCapLimit;
    }

    function removeSupportedToken( address tokenAddress ) external tokenChecks(tokenAddress) onlyOwner {
        tokensInfo[tokenAddress].supportedToken = false;
    }

    function updateTokenCap( address tokenAddress, uint256 minCapLimit, uint256 maxCapLimit ) external tokenChecks(tokenAddress) onlyOwner {
        require(maxCapLimit > minCapLimit, "maxCapLimit cannot be smaller than minCapLimit");                
        tokensInfo[tokenAddress].minCap = minCapLimit;        
        tokensInfo[tokenAddress].maxCap = maxCapLimit;
    }

    function addNativeLiquidity() external payable whenNotPaused {
        require(msg.value != 0, "Amount cannot be 0");
        address payable sender = _msgSender();
        tokensInfo[NATIVE].liquidityProvider[sender] = tokensInfo[NATIVE].liquidityProvider[sender].add(msg.value);
        tokensInfo[NATIVE].liquidity = tokensInfo[NATIVE].liquidity.add(msg.value);

        emit LiquidityAdded(sender, NATIVE, address(this), msg.value);
    }

    function removeNativeLiquidity(uint256 amount) external whenNotPaused nonReentrant {
        require(amount != 0 , "Amount cannot be 0");
        address payable sender = _msgSender();
        require(tokensInfo[NATIVE].liquidityProvider[sender] >= amount, "Not enough balance");
        tokensInfo[NATIVE].liquidityProvider[sender] = tokensInfo[NATIVE].liquidityProvider[sender].sub(amount);
        tokensInfo[NATIVE].liquidity = tokensInfo[NATIVE].liquidity.sub(amount);
        
        (bool success, ) = sender.call{ value: amount }("");
        require(success, "Native Transfer Failed");

        emit LiquidityRemoved( NATIVE, amount, sender);
    }

    function addTokenLiquidity( address tokenAddress, uint256 amount ) external tokenChecks(tokenAddress) whenNotPaused {
        require(amount != 0, "Amount cannot be 0");
        address payable sender = _msgSender();
        tokensInfo[tokenAddress].liquidityProvider[sender] = tokensInfo[tokenAddress].liquidityProvider[sender].add(amount);
        tokensInfo[tokenAddress].liquidity = tokensInfo[tokenAddress].liquidity.add(amount);
        
        SafeERC20.safeTransferFrom(IERC20(tokenAddress), sender, address(this), amount);
        emit LiquidityAdded(sender, tokenAddress, address(this), amount);
    }

    function removeTokenLiquidity( address tokenAddress, uint256 amount ) external tokenChecks(tokenAddress) whenNotPaused {
        require(amount != 0, "Amount cannot be 0");
        address payable sender = _msgSender();
        require(tokensInfo[tokenAddress].liquidityProvider[sender] >= amount, "Not enough balance");

        tokensInfo[tokenAddress].liquidityProvider[sender] = tokensInfo[tokenAddress].liquidityProvider[sender].sub(amount);
        tokensInfo[tokenAddress].liquidity = tokensInfo[tokenAddress].liquidity.sub(amount);

        SafeERC20.safeTransfer(IERC20(tokenAddress), sender, amount);
        emit LiquidityRemoved( tokenAddress, amount, sender);

    }

    function getLiquidity(address liquidityProviderAddress, address tokenAddress) public view returns (uint256 ) {
        return tokensInfo[tokenAddress].liquidityProvider[liquidityProviderAddress];
    }

    function depositErc20( address tokenAddress, address receiver, uint256 amount, uint256 toChainId ) public tokenChecks(tokenAddress) whenNotPaused {
        require(tokensInfo[tokenAddress].minCap <= amount && tokensInfo[tokenAddress].maxCap >= amount, "Deposit amount should be within allowed Cap limits");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(amount != 0, "Amount cannot be 0");

        address payable sender = _msgSender();

        SafeERC20.safeTransferFrom(IERC20(tokenAddress), sender, address(this),amount);
        emit Deposit(sender, tokenAddress, receiver, toChainId, amount);
    }

    /** 
     * DAI permit and Deposit.
     */
    function permitAndDepositErc20(
        address tokenAddress,
        address receiver,
        uint256 amount,
        uint256 toChainId,
        PermitRequest calldata permitOptions
        )
        external 
        returns (bool success, bytes memory ret){
            IERC20Permit(tokenAddress).permit(_msgSender(), address(this), permitOptions.nonce, permitOptions.expiry, permitOptions.allowed, permitOptions.v, permitOptions.r, permitOptions.s);
            depositErc20(tokenAddress, receiver, amount, toChainId);
    }

    /** 
     * EIP2612 and Deposit.
     */
    function permitEIP2612AndDepositErc20(
        address tokenAddress,
        address receiver,
        uint256 amount,
        uint256 toChainId,
        PermitRequest calldata permitOptions
        )
        external 
        returns (bool success, bytes memory ret){
            IERC20Permit(tokenAddress).permit(_msgSender(), address(this), amount, permitOptions.expiry, permitOptions.v, permitOptions.r, permitOptions.s);
            depositErc20(tokenAddress, receiver, amount, toChainId);            
    }

    function depositNative( address receiver, uint256 toChainId ) external whenNotPaused payable {
        require(tokensInfo[NATIVE].minCap <= msg.value && tokensInfo[NATIVE].maxCap >= msg.value, "Deposit amount should be within allowed Cap limit");
        require(receiver != address(0), "Receiver address cannot be 0");
        require(msg.value != 0, "Amount cannot be 0");

        emit Deposit(_msgSender(), NATIVE, receiver, toChainId, msg.value);
    }

    function sendFundsToUser( address tokenAddress, uint256 amount, address payable receiver, bytes memory depositHash, uint256 tokenGasPrice ) external nonReentrant onlyExecutor tokenChecks(tokenAddress) whenNotPaused {
        uint256 initialGas = gasleft();
        require(tokensInfo[tokenAddress].minCap <= amount && tokensInfo[tokenAddress].maxCap >= amount, "Withdraw amount should be within allowed Cap limits");
        require(receiver != address(0), "Bad receiver address");
        
        (bytes32 hashSendTransaction, bool status) = checkHashStatus(tokenAddress, amount, receiver, depositHash);

        require(!status, "Already Processed");
        processedHash[hashSendTransaction] = true;

        uint256 calculateAdminFee = amount.mul(adminFee).div(10000);

        uint256 totalGasUsed = (initialGas.sub(gasleft())).add(tokensInfo[tokenAddress].transferOverhead).add(baseGas);

        uint256 gasFeeInToken = totalGasUsed.mul(tokenGasPrice);
        uint256 amountToTransfer = amount.sub(calculateAdminFee.add(gasFeeInToken));
        
        if (tokenAddress == NATIVE) {
            require(address(this).balance >= amountToTransfer, "Not Enough Balance");
            (bool success, ) = receiver.call{ value: amountToTransfer }("");
            require(success, "Native Transfer Failed");
        } else {
            require(IERC20(tokenAddress).balanceOf(address(this)) >= amountToTransfer, "Not Enough Balance");
            SafeERC20.safeTransfer(IERC20(tokenAddress), receiver, amountToTransfer);
        }

        emit AssetSent(tokenAddress, amount, amountToTransfer, receiver, depositHash);
    }

    function checkHashStatus(address tokenAddress, uint256 amount, address payable receiver, bytes memory depositHash) public view returns(bytes32 hashSendTransaction, bool status){
        hashSendTransaction = keccak256(
            abi.encode(
                tokenAddress,
                amount,
                receiver,
                keccak256(depositHash)
            )
        );

        status = processedHash[hashSendTransaction];
    }

    function withdrawErc20(address tokenAddress) external onlyOwner whenNotPaused {
        uint256 profitEarned = (IERC20(tokenAddress).balanceOf(address(this))).sub(tokensInfo[tokenAddress].liquidity);
        require(profitEarned != 0, "Profit earned is 0");
        address payable sender = _msgSender();

        SafeERC20.safeTransfer(IERC20(tokenAddress), sender, profitEarned);

        emit fundsWithdraw(tokenAddress, sender,  profitEarned);
    }

    function withdrawNative() external onlyOwner whenNotPaused {
        uint256 profitEarned = (address(this).balance).sub(tokensInfo[NATIVE].liquidity);
        require(profitEarned != 0, "Profit earned is 0");
        address payable sender = _msgSender();
        (bool success, ) = sender.call{ value: profitEarned }("");
        require(success, "Native Transfer Failed");
        
        emit fundsWithdraw(address(this), sender, profitEarned);
    }

    receive() external payable {
        emit EthReceived(_msgSender(), msg.value);
    }
}
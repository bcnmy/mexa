pragma solidity 0.8.4;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @dev Context variant with ERC2771 support.
 */
abstract contract ERC2771ContextUpgradeable is Initializable {
    /*
     * Forwarder singleton we accept calls from
     */
    address public _trustedForwarder;

    function __ERC2771Context_init(address trustedForwarder) internal initializer {
        __ERC2771Context_init_unchained(trustedForwarder);
    }

    function __ERC2771Context_init_unchained(address trustedForwarder) internal initializer {
        _trustedForwarder = trustedForwarder;
    }
    
    function isTrustedForwarder(address forwarder) public view virtual returns (bool) {
        return forwarder == _trustedForwarder;
    }

    function _msgSender() internal view virtual returns (address sender) {
        if (isTrustedForwarder(msg.sender)) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            return msg.sender;
        }
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        if (isTrustedForwarder(msg.sender)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
    uint256[49] private __gap;
}

/* 
 * @title DappGasTank
 * @author livingrock (Biconomy)
 * @title Dapp Deposit Gas Tank Contract
 * @notice Handles customers deposits  
 */
contract DappGasTank is Initializable, OwnableUpgradeable, ERC2771ContextUpgradeable, ReentrancyGuardUpgradeable {

    address payable public masterAccount;
    uint256 public minDeposit;
    uint8 internal _initializedVersion;
    address private NATIVE;
    //Maintain balances for each funding key
    mapping(uint256 => uint256) public dappBalances;

    //Maintains fundingKey and depositedAmount information for each Depositor
    //review mapping and how it is populated with each deposits
    mapping(address => mapping(uint256 => uint256) ) public depositorBalances;

    //Allowed tokens as deposit currency in Dapp Gas Tank
    mapping(address => bool) public allowedTokens;
    //Pricefeeds info should you require to calculate Token/ETH
    mapping(address => address) public tokenPriceFeed;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    /**
     * @dev Initializes the contract
     */
    function initialize(address trustedForwarder, address payable _masterAccount, uint256 _minDeposit) public initializer {
       require(trustedForwarder != address(0), "DappGasTank:: Invalid address for trusted forwarder");
       __ERC2771Context_init(trustedForwarder);
       __Ownable_init();
       __ReentrancyGuard_init();
       __DappGasTank_init_unchained(_masterAccount,_minDeposit);
       _initializedVersion = 0;
       NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    }

    function __DappGasTank_init_unchained(address payable _masterAccount, uint256 _minDeposit) internal initializer {
        require(_masterAccount != address(0), "DappGasTank:: Master account should not be zero address");
        require(_minDeposit > 0, "DappGasTank:: Minimum deposit amount should be greater than zero");
        masterAccount = _masterAccount;
        minDeposit = _minDeposit;
    }

    event Deposit(address indexed sender, uint256 indexed amount, uint256 indexed fundingKey); // fundingKey 
    
    event Withdraw(address indexed actor, uint256 indexed amount, address indexed receiver); // for when owner withdraws funds

    event MasterAccountChanged(address indexed account, address indexed actor);

    event MinimumDepositChanged(uint256 indexed minDeposit, address indexed actor);

    event DepositTokenAdded(address indexed token, address indexed actor);

    /**
     * @dev Emitted when trusted forwarder is updated to 
     * another (`trustedForwarder`).
     *
     * Note that `trustedForwarder` may be zero. `actor` is msg.sender for this action.
     */
    event TrustedForwarderChanged(address indexed truestedForwarder, address indexed actor);


    /**
     * returns the message sender
     */
    function _msgSender()
        internal
        view
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }

    /**
     * returns the message data
     */
    function _msgData()
        internal
        view
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes memory)
    {
        return ERC2771ContextUpgradeable._msgData();
    }


    /**
     * Admin function to set minimum deposit amount
     * emits and event 
     */
    function setMinDeposit(uint256 _newMinDeposit) external onlyOwner{
        require(_newMinDeposit > 0, "DappGasTank:: Minimum deposit amount should be greater than zero");
        minDeposit = _newMinDeposit;
        emit MinimumDepositChanged(_newMinDeposit,msg.sender);
    }

    /**
     * admin function to set trusted forwarder
     * @param _forwarder new trusted forwarder address
     *
     */
    function setTrustedForwarder(address payable _forwarder) external onlyOwner {
        require(_forwarder != address(0), "BICO:: Invalid address for new trusted forwarder");
        _trustedForwarder = _forwarder;
        emit TrustedForwarderChanged(_forwarder, msg.sender);
    }

    /**
     * Admin function to set master account which collects gas tank deposits
     */
    function setMasterAccount(address payable _newAccount) external onlyOwner{
        require(_newAccount != address(0), "DappGasTank:: Master account should not be zero address");
        masterAccount = _newAccount;
        emit MasterAccountChanged(_newAccount, msg.sender);
    }

    /**
     * Admin function to set token allowed for depositing in gas tank 
     */
    function setTokenAllowed(address token, bool allowed) external onlyOwner{
        require(token != address(0), "Token address cannot be 0");  
        allowedTokens[token] = allowed;
        emit DepositTokenAdded(token,msg.sender);
    }
     
    /**
     * @param _fundingKey Associate funds with this funding key. 
     * Supply a deposit for a specified funding key. (This will be a unique unix epoch time)
     * Caution: The funding key must be an your identifier generated from biconomy dashboard 
     * Funds deposited will be forwarded to master account to fund the relayers
     * emits an event for off-chain accounting
     * @notice In the future this method may be upgraded to allow ERC20 token deposits 
     * @notice Generic depositFor could be added that allows deposit of ERC20 tokens and swaps them for native currency. 
     */
    function depositFor(uint256 _fundingKey) public payable nonReentrant { 
        require(msg.sender == tx.origin || msg.sender == _trustedForwarder, "sender must be EOA or trusted forwarder");
        require(msg.value > 0, "No value provided to depositFor.");
        require(msg.value >= minDeposit, "Must be grater than minimum deposit for this network");
        masterAccount.transfer(msg.value);
        dappBalances[_fundingKey] = dappBalances[_fundingKey] + msg.value; 
        //review
        depositorBalances[msg.sender][_fundingKey] = depositorBalances[msg.sender][_fundingKey] + msg.value;
        emit Deposit(msg.sender, msg.value, _fundingKey);
    }
  
    /** 
     * @dev If someone deposits funds directly to contract address
     * Here we wouldn't know the funding key!
     */ 
    receive() external payable {
        require(msg.value > 0, "No value provided to fallback.");
        require(tx.origin == msg.sender, "Only EOA can deposit directly.");
        //review
        //funding key stored is 0 
        depositorBalances[msg.sender][0] = depositorBalances[msg.sender][0] + msg.value;
        //All these types of deposits come under funding key 0
        emit Deposit(msg.sender, msg.value, 0);
    }

    /**
     * Admin function for sending/migrating any stuck funds. 
     */
    function withdraw(uint256 _amount) public onlyOwner nonReentrant {
        masterAccount.transfer(_amount);
        emit Withdraw(msg.sender, _amount, masterAccount);
    }
}
pragma solidity ^0.8.0;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/* 
 * @title DappGasTank
 * @author livingrock (Biconomy)
 * @title Dapp Deposit Gas Tank Contract
 * @notice Handles customers deposits  
 */
contract DappGasTank is Initializable, OwnableUpgradeable {

    address payable public masterAccount;
    uint256 public minDeposit = 1e18;
    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    //Maintain balances for each funding key
    mapping(uint256 => uint256) public dappBalances;

    //Maintains fundingKey and depositedAmount information for each Depositor
    //review mapping and how it is populated with each deposits
    mapping(address => mapping(uint256 => uint256) ) public depositors;

    //Allowed tokens as deposit currency in Dapp Gas Tank
    mapping(address => bool) public allowedTokens;
    //Pricefeeds info should you require to calculate Token/ETH
    mapping(address => address) public tokenPriceFeed;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    /**
     * @dev Initializes the contract
     */
    function initialize() public initializer {
       __DappGasTank_init_unchained();
       __Ownable_init();
    }

    function __DappGasTank_init() internal initializer {
       __DappGasTank_init_unchained();
       __Ownable_init();
    }

    function __DappGasTank_init_unchained() internal initializer {
    }


    event Deposit(address indexed sender, uint256 indexed amount, uint256 indexed fundingKey); // fundingKey 
    
    event Withdraw(address indexed actor, uint256 indexed amount, address indexed receiver); // for when owner withdraws funds

    event MasterAccountChanged(address indexed account, address indexed actor);

    event MinimumDepositChanged(uint256 indexed minDeposit, address indexed actor);

    event DepositTokenAdded(address indexed token, address indexed actor);

    /**
     * Admin function to set minimum deposit amount
     * emits and event 
     */
    function setMinDeposit(uint256 _newMinDeposit) external onlyOwner{
        minDeposit = _newMinDeposit;
        emit MinimumDepositChanged(_newMinDeposit,msg.sender);
    }

    /**
     * Admin function to set master account which collects gas tank deposits
     */
    function setMasterAccount(address payable _newAccount) external onlyOwner{
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
    function depositFor(uint256 _fundingKey) public payable { 
        require(msg.sender == tx.origin, "sender must be EOA");
        require(msg.value > 0, "No value provided to depositFor.");
        require(msg.value >= minDeposit, "Must be grater than minimum deposit for this network");
        masterAccount.transfer(msg.value);
        dappBalances[_fundingKey] = dappBalances[_fundingKey] + msg.value; 
        //review
        depositors[msg.sender][_fundingKey] = depositors[msg.sender][_fundingKey] + msg.value;
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
        depositors[msg.sender][0] = depositors[msg.sender][0] + msg.value;
        //All these types of deposits come under funding key 0
        emit Deposit(msg.sender, msg.value, 0);
    }

    /**
     * Admin function for sending/migrating any stuck funds. 
     */
    function withdraw(uint256 _amount) public onlyOwner {
        masterAccount.transfer(_amount);
        emit Withdraw(msg.sender, _amount, masterAccount);
    }
}
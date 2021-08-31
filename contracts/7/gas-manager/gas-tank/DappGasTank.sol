pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./DappGasTankStorage.sol";
import "../libs/Ownable.sol";

/* 
 * @title DappGasTank
 * @author livingrock (Biconomy)
 * @title Dapp Deposit Gas Tank Contract
 * @notice Handles customers deposits  
 */
contract DappGasTank is Ownable, DappGasTankStorage {

    //Every depositor has a unique identifier. Helps with off-chain tracking. 
    //mapping(address => uint256) public depositors;
    //uint256 public uniqueDepositors; 

    bool internal initialized;
    
    constructor(
        address _owner
    ) public Ownable(_owner){
        require(_owner != address(0), "Owner Address cannot be 0");
    }

    /**
     * @dev sets other constructor arguments
     *
     *
     *
     */
    function initialize(
    ) public {_fudingKey
        require(!initialized, "Dapp Gas Tank: contract is already initialized");
        initialized = true;
        //assignments
    }

    event Deposit(address indexed sender, uint256 amount, uint256 indexed fundingKey); // fundingKey 
    
    event Withdraw(address indexed actor, uint256 amount, address indexed receiver); // for when owner withdraws funds

    event MasterAccountChanged(address indexed account, address indexed actor);

    function setMinDeposit(uint256 _newMinDeposit) external onlyOwner{
        minDeposit = _newMinDeposit;
    }

    function setMasterAccount(address payable _newAccount) external onlyOwner{
        masterAccount = _newAccount;
        emit MasterAccountChanged(_newAccount, msg.sender);
    }

    function setTokenAllowed(address token, bool allowed) external onlyOwner{
        require(token != address(0), "Token address cannot be 0");  
        allowedTokens[token] = allowed;
    }

    //Q: Should we allow Dapps to withdraw their funds?
    //A: Not now
    //event WithdrawnByDApp

    //Q :Should owner be able to pull the funds OR we directly transfer to main account with each transaction?
    //A :Direct transfer

    //TODO: smart contract conditions on deposit value? must be > outstanding and minimum amount 
    
    /**
     * @param _fundingKey Associate funds with this funding key. 
     * Supply a deposit for a specified funding key. (This will be a unique unix epoch time)
     * Caution: The funding key must be an your identifier generated from biconomy dashboard 
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

    //Generic depositFor could be added that allows deposit of ERC20 tokens and swaps them for native currency. 

    /*
     * It is only intended for external users who want to deposit via a wallet.
     * Here we wouldn't know the funding key!
     */ 
    receive() external payable {
        require(msg.value > 0, "No value provided to fallback.");
        require(tx.origin == msg.sender, "Only EOA can deposit directly.");
        //review
        depositors[msg.sender][0] = depositors[msg.sender][0] + msg.value;
        emit Deposit(msg.sender, msg.value, 0);
    }

    /**
     * Internal function for sending/migrating funds. 
     */
    function withdraw(uint256 _amount) public onlyOwner {
        masterAccount.transfer(_amount);
        emit Withdraw(msg.sender, _amount, masterAccount);
    }
}
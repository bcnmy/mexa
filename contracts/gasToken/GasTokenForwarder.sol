pragma solidity ^0.5.13;
import "./IGST2.sol";
import "../RelayerManager.sol";
import "../libs/SafeMath.sol";
import "../libs/Ownable.sol";

contract GasTokenForwarder is Ownable {
    using SafeMath for uint256;
    
    IGST2 private _gasToken;
    RelayerManager private _relayerManager;

    event Efficiency(uint256 indexed efficiency, uint256 indexed tokens);

    // MODIFIERS
    modifier onlyRelayer() {
        require(
            _relayerManager.getRelayerStatus(msg.sender),
            "You are not allowed to perform this operation"
        );
        _;
    }
    
    constructor(address owner, address gasToken2, address relayerManager) public Ownable(owner){
        require(gasToken2 != address(0), "gasToken2 cannot be 0");
        require( relayerManager != address(0), "Manager address cannot be 0");

        _gasToken = IGST2(gasToken2);
        _relayerManager = RelayerManager(relayerManager);
    }
    
    function addRelayerManager(address relayerManagerAddress) public onlyOwner {
        require(
            relayerManagerAddress != address(0),
            "Manager address can not be 0"
        );
        _relayerManager = RelayerManager(relayerManagerAddress);
    }

    /**
        @param destination contract address
        @param data call data to be forwarded
        @param mintPrice: price at which gasToken was minted
        Method forward the incoming transaction and then execute the gastoken functionality
     */
    function forward(address payable destination, bytes memory data,uint256 mintPrice,uint256 gasLimit) public onlyRelayer { 
        uint initialGas = gasleft();

        require(executeCall(destination, data, gasLimit),"ExecuteCall() failed");
        refundGas(initialGas,mintPrice);
    }

    /**
        @param to: destination contract address
        @param data call data to be forwarded:
        Method execute the internal transaction send by user
     */

    function executeCall(address to, bytes memory data, uint256 gasLimit) private returns (bool success) {
        require(
            gasleft() > ((gasLimit + (gasLimit / 63)) + 1000),
            "Not enough gas"
        );
        assembly {
            let txGas := gas
            if iszero(eq(gasLimit, 0)) {
                txGas := gasLimit
            }
            success := call(
                txGas,
                to,
                0,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
        }
    }
    
    /**
        @param initialGas: Gas sent by transaction at entry in forwad method
        @param mintPrice: price at which gasToken was minted
        Calculate the total token needs to be burn and the efficiency.
        if efficiency is >100 then only tokens will be burned to refund the gas
     */
    function refundGas(uint256 initialGas, uint256 mintPrice) private {
        uint256 mintBase = 32254;
        uint256 mintToken = 36543;
        uint256 freeBase = 14154;
        uint256 freeToken = 6870;
        uint256 reimburse = 24000;

        uint256 tokens = initialGas.sub(
            gasleft()).add(freeBase).div(reimburse.mul(2).sub(freeToken)
        );

        uint256 mintCost = mintBase.add(tokens.mul(mintToken));
        uint256 freeCost = freeBase.add(tokens.mul(freeToken));
        uint256 maxreimburse = tokens.mul(reimburse);

        uint256 efficiency = maxreimburse.mul(tx.gasprice).mul(100).div(
            mintCost.mul(mintPrice).add(freeCost.mul(tx.gasprice))
        );

        emit Efficiency(efficiency, tokens);
        if (efficiency > 100) {
            freeGasTokens(tokens);
        }
    }
    
    /**
        @param tokens: number of tokens to be free
        Method calls the GST2 freeUpTo() method
     */
    function freeGasTokens(uint256 tokens) private {
        uint256 tokensToFree = tokens;
        uint256 safeNumTokens = 0;
        uint256 gas = gasleft();

        if (gas >= 27710) {
            safeNumTokens = gas.sub(27710).div(1148 + 5722 + 150);
        }

        if (tokensToFree > safeNumTokens) {
            tokensToFree = safeNumTokens;
        }

        uint256 gasTokenBal = _gasToken.balanceOf(address(this));

        if (tokensToFree > 0 && gasTokenBal >= tokensToFree) {
            _gasToken.freeUpTo(tokensToFree);
        }

    }

    function mintGasToken( uint256 mint ) public onlyOwner {
        _gasToken.mint(mint);
    }

    function balanceOfGasToken(address who) external view returns (uint256){
        return _gasToken.balanceOf(who);
    }

    function freeGasToken(uint256 value) private returns (bool success){
        return _gasToken.free(value);
    }

    function freeGasTokenFrom(address from, uint256 value) private returns (bool success){
        return _gasToken.freeFrom(from, value);
    }

    function freeGasTokenFromUpTo(address from, uint256 value) private returns (uint256 freed){
        return _gasToken.freeFromUpTo(from , value);
    }

    function approveGasToken(address spender, uint256 value) public onlyOwner returns (bool success){
        return _gasToken.approve(spender, value);
    }

    function transferGasTokenFrom(address from, address to, uint256 value) public onlyOwner returns (bool success){
        return _gasToken.transferFrom(from, to, value);
    }

    function transferGasToken(address to, uint256 value) public onlyOwner returns (bool success){
        return _gasToken.transfer(to, value);
    }
}
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

/* deadline can be removed : GSN reference https://github.com/opengsn/gsn/blob/master/contracts/forwarder/IForwarder.sol (Saves 250 more gas)*/
/**
* This contract defines a struct which both ERC20FeeProxy and BiconomyForwarder inherit. ERC20ForwardRequest specifies all the fields present in the GSN V2 ForwardRequest struct, 
* but adds the following :
* address token
* uint256 tokenGasPrice
* uint256 txGas
* uint256 batchNonce (can be removed)
* uint256 deadline 
* Fields are placed in type order, to minimise storage used when executing transactions.
*/
contract ERC20ForwardRequestTypes{

    struct ERC20ForwardRequest {
        address from; 
        address to; 
        address token; 
        uint256 txGas;
        uint256 tokenGasPrice;
        uint256 batchId; 
        uint256 batchNonce; 
        uint256 deadline; 
        bytes data;
    }

     struct PermitRequest {
        address holder; 
        address spender;  
        uint256 value;
        uint256 nonce;
        uint256 expiry;
        bool allowed; 
        uint8 v;
        bytes32 r; 
        bytes32 s; 
    }

    //temp
    /*struct PermitEIP2612Request {
        address owner; 
        address spender;  
        uint256 value;
        uint256 deadline;
        uint8 v;
        bytes32 r; 
        bytes32 s; 
    }*/
    
}

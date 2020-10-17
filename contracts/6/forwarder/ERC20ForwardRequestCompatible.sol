pragma solidity ^0.6.8;
pragma experimental ABIEncoderV2;

contract ERC20ForwardRequestCompatible{

    struct ERC20ForwardRequest {
        address from; //index
        address to; //index
        address token; //index
        uint256 txGas;
        uint256 tokenGasPrice;
        uint256 batchId; //maybe
        uint256 batchNonce; //maybe
        bytes data;
    }
    
}
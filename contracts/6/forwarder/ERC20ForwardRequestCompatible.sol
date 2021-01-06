pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

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
    
}

// token gas price is : ( gas price * 10^ token decimals ) / (token prince in USD / ETH price in USD)
// deadline can be removed : GSN reference https://github.com/opengsn/gsn/blob/master/contracts/forwarder/IForwarder.sol
// 1D nonces could be used
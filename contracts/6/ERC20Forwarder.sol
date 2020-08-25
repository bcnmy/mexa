/**pragma solidity ^0.6.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Forwarder is Ownable{

    struct TransferData{
        address from;
        address to;
        address token;
        uint256 amount;
        uint256 fee;
    }

    function forwardBasicSign(TransferData calldata transferD, Signature calldata signature) external{
        // verify signature
        forward(transferD);
    }

    function forwardEIP712(TransferData calldata transferD, Signature calldata signature) external{
        // verify signature
        forward(transferD);
    }

    // contract wallets can call this
    function forward(TransferData calldata transferD) public{
        IERC20 token = IERC20(transferD.token);
        token.transferFrom(from,to,amount);
        token.transferFrom(from,owner(),fee);
    }

}**/
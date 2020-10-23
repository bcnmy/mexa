pragma solidity ^0.5.12;
pragma experimental ABIEncoderV2;

import "../BasicMetaTransaction.sol";

contract MockBasicMetaTxChild is BasicMetaTransaction {

    uint256 called;

    event Call(bytes4 sig);

    function call() external {
        called++;
        emit Call(msg.sig);
    }

}
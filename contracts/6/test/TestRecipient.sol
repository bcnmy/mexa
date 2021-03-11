// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../libs/BaseRelayRecipient.sol";


contract TestRecipient is BaseRelayRecipient{

    mapping (address=>uint) public callsMade;

    constructor(address forwarder) public{
        trustedForwarder = forwarder;
    }

    function  doCall(address sender) external{
        require(_msgSender() == sender);
        callsMade[sender]++;
    }

    function nada() external {

    }

     function nadaRevert() external {
        require(1 == 2,"custom force revert");
    }

    function versionRecipient() external virtual override view returns (string memory){return "1";}

}
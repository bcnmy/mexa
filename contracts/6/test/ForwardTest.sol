// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "../libs/BaseRelayRecipient.sol";


contract ForwardTest is BaseRelayRecipient{

    mapping (address=>uint) public callsMade;
    string quote = "happy holi";

    constructor(address forwarder) public{
        trustedForwarder = forwarder;
    }

    function  doCall(address sender) external{
        require(_msgSender() == sender);
        callsMade[sender]++;
    }

    function setQuote(string memory newQuote) external{
        quote = newQuote;
    }

    function nada() external {
    
    }

     function nadaRevert() external {
        require(1 == 2,"custom force revert");
    }

    function versionRecipient() external virtual override view returns (string memory){return "1";}

}
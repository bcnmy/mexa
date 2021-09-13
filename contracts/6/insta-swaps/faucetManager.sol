// Sources flattened with hardhat v2.0.4 https://hardhat.org

// File @openzeppelin/contracts/math/SafeMath.sol@v3.3.0
// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "../libs/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IERC20Extented.sol";

contract FaucetManager is BaseRelayRecipient {
    using SafeMath for uint256;
    
    uint256 private constant amount = 1000;

    constructor(address _trustedForwarder) public {
        require(_trustedForwarder != address(0), "TrustedForwarder Contract Address cannot be 0");
        trustedForwarder = _trustedForwarder;
    }

    function setTrustedForwarder( address forwarderAddress ) public {
        require(forwarderAddress != address(0), "Forwarder Address cannot be 0");
        trustedForwarder = forwarderAddress;
    }
    
    function getTokens( address tokenAddress ) public {
        uint256 decimal = IERC20Extented(tokenAddress).decimals();
        
        SafeERC20.safeTransfer(IERC20(tokenAddress), _msgSender(), amount.mul(10**decimal));
    }
    
    function getDecimal(address tokenAddress) public view returns (uint256) {
        return IERC20Extented(tokenAddress).decimals();
    }

    function versionRecipient() external override virtual view returns (string memory){
        return "1";
    }
}
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


abstract contract IERC20Extented is IERC20 {
    function decimals() public virtual view returns (uint8);
}
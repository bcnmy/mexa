// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IbToken is IERC20Upgradeable {
  function mint(address _account, uint256 _amount) external;

  function burn(uint256 _amount) external;

  function burnFrom(address _account, uint256 _amount) external;
}

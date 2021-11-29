// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./IbToken.sol";

contract bToken is
  Initializable,
  ERC20Upgradeable,
  ERC20PausableUpgradeable,
  ERC20BurnableUpgradeable,
  ERC2771ContextUpgradeable,
  OwnableUpgradeable,
  IbToken
{
  using SafeERC20Upgradeable for IERC20Upgradeable;

  IERC20Upgradeable public baseToken;
  address depositPoolAddress;
  address liquidityPoolAddress;

  uint8 private decimals_;

  function initialize(
    string memory _name,
    string memory _symbol,
    uint8 _decimals,
    IERC20Upgradeable _baseToken,
    address _trustedForwarder,
    address _depositPoolAddress,
    address _liquidityPoolAddress
  ) public initializer {
    __ERC20_init(_name, _symbol);
    __ERC20Pausable_init();
    __ERC20Burnable_init();
    __ERC2771Context_init(_trustedForwarder);
    __Ownable_init();
    decimals_ = _decimals;
    baseToken = _baseToken;
    depositPoolAddress = _depositPoolAddress;
    liquidityPoolAddress = _liquidityPoolAddress;
  }

  modifier onlyHyphenPools() {
    require(
      _msgSender() == depositPoolAddress ||
        _msgSender() == liquidityPoolAddress,
      "ERR_UNAUTHORIZED"
    );
    _;
  }

  function updateLiquidityPoolAddress(address _liquidityPoolAddress)
    external
    onlyOwner
  {
    liquidityPoolAddress = _liquidityPoolAddress;
  }

  function updateDepositPoolAddress(address _depositPoolAddress)
    external
    onlyOwner
  {
    depositPoolAddress = _depositPoolAddress;
  }

  function decimals() public view override returns (uint8) {
    return decimals_;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) {
    ERC20PausableUpgradeable._beforeTokenTransfer(from, to, amount);
  }

  function _msgSender()
    internal
    view
    override(ContextUpgradeable, ERC2771ContextUpgradeable)
    returns (address)
  {
    return ERC2771ContextUpgradeable._msgSender();
  }

  function _msgData()
    internal
    view
    override(ContextUpgradeable, ERC2771ContextUpgradeable)
    returns (bytes calldata)
  {
    return ERC2771ContextUpgradeable._msgData();
  }

  function mint(address _account, uint256 _amount)
    public
    override
    onlyHyphenPools
  {
    require(
      baseToken.allowance(_msgSender(), address(this)) >= _amount,
      "ERR_INSUFFICIENT_ALLOWANCE"
    );

    baseToken.safeTransferFrom(_msgSender(), address(this), _amount);
    _mint(_account, _amount);
  }

  function burn(uint256 _amount)
    public
    override(ERC20BurnableUpgradeable, IbToken)
    onlyHyphenPools
  {
    ERC20BurnableUpgradeable.burn(_amount);
    baseToken.safeTransfer(_msgSender(), _amount);
  }

  function burnFrom(address _account, uint256 _amount)
    public
    override(ERC20BurnableUpgradeable, IbToken)
    onlyHyphenPools
  {
    ERC20BurnableUpgradeable.burnFrom(_account, _amount);
    baseToken.safeTransfer(_msgSender(), _amount);
  }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./IbToken.sol";

contract DepositPool is
  Initializable,
  ERC2771ContextUpgradeable,
  OwnableUpgradeable
{
  uint256 constant MAX_INT =
    0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

  using SafeERC20Upgradeable for IERC20Upgradeable;

  event StakeAdded(address executor, IERC20Upgradeable token, uint256 amount);
  event StakeRemoved(address executor, IERC20Upgradeable token, uint256 amount);
  event StakeSlashed(address executor, IERC20Upgradeable token, uint256 amount);
  event SlashedStakeExtracted(
    IERC20Upgradeable token,
    uint256 amount,
    address recipient,
    bool bTokensBurnt
  );

  struct Executor {
    string baseUrl;
    mapping(IERC20Upgradeable => uint256) stakedAmount;
  }

  mapping(address => Executor) private executorByAddress;
  mapping(IERC20Upgradeable => IbToken) public baseAddressToBTokenAddress;
  mapping(IERC20Upgradeable => uint256) public slashedFundsBalance;

  function initialize(address _trustedForwarder) public initializer {
    __ERC2771Context_init(_trustedForwarder);
    __Ownable_init();
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

  // Query Functions

  function getExecutorBaseUrl(address _executor)
    external
    view
    returns (string memory)
  {
    return executorByAddress[_executor].baseUrl;
  }

  function getExecutorStake(address _executor, IERC20Upgradeable _baseToken)
    external
    view
    returns (uint256)
  {
    return executorByAddress[_executor].stakedAmount[_baseToken];
  }

  // Admin Functions

  function updateBToken(IERC20Upgradeable _baseToken, IbToken _bToken)
    external
    onlyOwner
  {
    baseAddressToBTokenAddress[_baseToken] = _bToken;
  }

  function slashStake(
    address _executorAddress,
    IERC20Upgradeable _baseToken,
    uint256 _amount
  ) external onlyOwner {
    require(
      executorByAddress[_executorAddress].stakedAmount[_baseToken] >= _amount,
      "ERR_INSUFFICIENT_STAKE"
    );

    executorByAddress[_executorAddress].stakedAmount[_baseToken] -= _amount;
    slashedFundsBalance[_baseToken] += _amount;

    emit StakeSlashed(_executorAddress, _baseToken, _amount);
  }

  function extractSlashedFunds(
    IERC20Upgradeable _baseToken,
    uint256 _amount,
    address _recipient,
    bool _convertToBaseToken
  ) external onlyOwner {
    require(
      slashedFundsBalance[_baseToken] >= _amount,
      "ERR_INSUFFICIENT_BALANCE"
    );

    slashedFundsBalance[_baseToken] -= _amount;

    IbToken bToken = baseAddressToBTokenAddress[_baseToken];
    if (_convertToBaseToken) {
      bToken.burn(_amount);
      _baseToken.safeTransfer(_recipient, _amount);
    } else {
      bToken.transfer(_recipient, _amount);
    }

    emit SlashedStakeExtracted(
      _baseToken,
      _amount,
      _recipient,
      _convertToBaseToken
    );
  }

  // Executor Functions

  function addStake(IERC20Upgradeable _baseToken, uint256 _amount) external {
    require(
      _baseToken.allowance(_msgSender(), address(this)) >= _amount,
      "ERR_INSUFFICIENT_ALLOWANCE"
    );
    require(
      address(baseAddressToBTokenAddress[_baseToken]) != address(0),
      "ERR_TOKEN_NOT_SUPPORTED"
    );

    IbToken bToken = baseAddressToBTokenAddress[_baseToken];
    if (_baseToken.allowance(address(this), address(bToken)) < MAX_INT) {
      _baseToken.safeApprove(address(bToken), MAX_INT);
    }
    _baseToken.safeTransferFrom(_msgSender(), address(this), _amount);
    bToken.mint(_msgSender(), _amount);

    executorByAddress[_msgSender()].stakedAmount[_baseToken] += _amount;

    emit StakeAdded(_msgSender(), _baseToken, _amount);
  }

  function removeStake(IERC20Upgradeable _baseToken, uint256 _amount) external {
    IbToken bToken = baseAddressToBTokenAddress[_baseToken];
    require(
      address(baseAddressToBTokenAddress[_baseToken]) != address(0),
      "ERR_TOKEN_NOT_SUPPORTED"
    );
    require(
      executorByAddress[_msgSender()].stakedAmount[_baseToken] >= _amount,
      "ERR_INSUFFICIENT_STAKE"
    );
    require(
      bToken.allowance(_msgSender(), address(this)) >= _amount,
      "ERR_INSUFFICIENT_ALLOWANCE"
    );

    executorByAddress[_msgSender()].stakedAmount[_baseToken] -= _amount;

    bToken.burnFrom(_msgSender(), _amount);
    _baseToken.safeTransfer(_msgSender(), _amount);

    emit StakeRemoved(_msgSender(), _baseToken, _amount);
  }

  function updateExecutorBaseUrl(string memory _baseUrl) external {
    executorByAddress[_msgSender()].baseUrl = _baseUrl;
  }
}

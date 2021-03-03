// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;
pragma experimental ABIEncoderV2;

import "../libs/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract OracleAggregator is Ownable{

    using SafeMath for uint256;

    struct TokenInfo {
     uint8 decimals;
     bool dataSigned;
     address callAddress;
     bytes callData;
    }
 
    mapping(address => TokenInfo) internal tokensInfo;

    constructor(
        address _owner
    ) public Ownable(_owner){
        require(_owner != address(0), "Owner Address cannot be 0");
    }

    function setTokenOracle(address token, address callAddress, uint8 decimals, bytes calldata callData, bool signed) external onlyOwner{
        tokensInfo[token].callAddress = callAddress;
        tokensInfo[token].decimals = decimals;
        tokensInfo[token].callData = callData;
        tokensInfo[token].dataSigned = signed;
    }

    function getTokenOracleDecimals(address token) external view returns(uint8 _tokenOracleDecimals){
        _tokenOracleDecimals = tokensInfo[token].decimals;
    }

    function getTokenPrice(address token) external view returns (uint tokenPriceUnadjusted){
        tokenPriceUnadjusted =  _getTokenPrice(token);
    }

    function _getTokenPrice(address token) internal view returns (uint tokenPriceUnadjusted){
        (bool success, bytes memory ret) = tokensInfo[token].callAddress.staticcall(tokensInfo[token].callData);
        if (tokensInfo[token].dataSigned){
            tokenPriceUnadjusted = uint(abi.decode(ret,(int)));
        }
        else{
            tokenPriceUnadjusted = abi.decode(ret,(uint));
        }
    }


}
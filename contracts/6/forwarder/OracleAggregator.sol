pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract OracleAggregator is Ownable{

    using SafeMath for uint256;

    mapping(address => uint8) tokenOracleDecimals;
    mapping(address => address) tokenOracleCallAddress;
    mapping(address => bytes) tokenOracleCallData;
    mapping(address => bool) tokenOracleDataSigned;

    function setTokenOracle(address token, address callAddress, uint8 decimals, bytes memory callData, bool signed) external onlyOwner{
        tokenOracleCallAddress[token] = callAddress;
        tokenOracleDecimals[token] = decimals;
        tokenOracleCallData[token] = callData;
        tokenOracleDataSigned[token] = signed;
    }

    function getTokenOracleDecimals(address token) external returns(uint8 _tokenOracleDecimals){
        _tokenOracleDecimals = tokenOracleDecimals[token];
    }

    function getTokenGasPrice(address token, uint ethGasPrice) external returns (uint tokenGasPriceUnadjusted){
        uint tokenPriceUnadjusted =  _getTokenPrice(token);
        tokenGasPriceUnadjusted = tokenPriceUnadjusted.mul(ethGasPrice);
    }

    function getTokenPrice(address token) external returns (uint tokenPriceUnadjusted){
        tokenPriceUnadjusted =  _getTokenPrice(token);
    }

    function _getTokenPrice(address token) internal returns (uint tokenPriceUnadjusted){
        (bool success, bytes memory ret) = tokenOracleCallAddress[token].staticcall(tokenOracleCallData[token]);
        if (tokenOracleDataSigned[token]){
            tokenPriceUnadjusted = uint(abi.decode(ret,(int)));
        }
        else{
            tokenPriceUnadjusted = abi.decode(ret,(uint));
        }
    }


}
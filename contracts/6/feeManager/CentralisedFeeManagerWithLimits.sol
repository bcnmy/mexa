pragma solidity ^0.6.8;

import "../interfaces/IFeeManager.sol";
import "../libs/Ownable.sol";


/**
 * @title Centralised Fee Manager
 *
 * @notice A fee manager contract designed for dApps organisations to coordinate meta transactions pricing centrally
 *
 * @dev implements a default fee multiplier
 * @dev owners can set token specific fee multipliers
 * @dev owners can set fee multipliers specific to a given user of a token
 * @dev owners can remove fee multiplier settings, and instead have a given query return it's parent value
 * @dev hierarchy of fee multipliers : default --> token --> tokenUser 
 * 
 * @dev owners can allow tokens
 *
 */
contract CentralisedFeeManagerWithLimits is IFeeManager{
    
    uint16 bp;

    uint16 MINBP;

    mapping(address => uint16) tokenBP;

    mapping(address => mapping(address => uint16)) tokenUserBP;

    mapping(address => bool) allowedTokens;

    mapping(address => address) tokenPriceFeed;

    constructor(address _owner, uint16 _bp, uint16 _MINBP) public Ownable(_owner){
        require(_owner != address(0), "Owner Address cannot be 0");
        bp = _bp;
        MINBP = _MINBP;
    }

    /**
     * @dev uses if statements to query the hierarchy (default --> token --> tokenUser) from bottom to top 
     * @dev goes up one level if current level's value = 0 and it is not exempt
     *
     * @param user : the address of the user that is requesting a meta transaction
     * @param token : the token that the user will be paying the fee in 
     *
     * @return basisPoints : the fee multiplier expressed in basis points (1.0000 = 10000 basis points)
     */
    function getFeeMultiplier(address user, address token) external override view returns (uint16 basisPoints){
        basisPoints = tokenUserBP[token][user];
        if (basisPoints == 0){
                basisPoints = tokenBP[token];
                if (basisPoints == 0){
                        basisPoints = bp;
                }
            }
    }

    function setDefaultFeeMultiplier(uint16 _bp) external onlyOwner{
        require(_bp > MINBP);
        bp = _bp;
    }

    function setDefaultTokenFeeMultiplier(address token, uint16 _bp) external onlyOwner{
        require(_bp > MINBP);
        tokenBP[token] = _bp;
    }

    function removeDefaultTokenFeeMultiplier(address token) external onlyOwner{
        tokenBP[token] = 0;
    }

    function setUserTokenFeeMultiplier(address token, address user, uint16 _bp) external onlyOwner{
        require(_bp > MINBP);
        tokenUserBP[token][user] = _bp;
    }

    function removeUserTokenFeeMultiplier(address token, address user) external onlyOwner{
        tokenUserBP[token][user] = 0;
    }

    function getTokenAllowed(address token) external override view returns (bool allowed){
        allowed = allowedTokens[token];
    }

    function setTokenAllowed(address token, bool allowed) external onlyOwner{
        allowedTokens[token] = allowed;
    }

    function getPriceFeedAddress(address token) external view returns (address priceFeed){
        priceFeed = tokenPriceFeed[token];
    }

    function setPriceFeedAddress(address token, address priceFeed) external onlyOwner {
        tokenPriceFeed[token] = priceFeed;
    }

}
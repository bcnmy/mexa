// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "../interfaces/AggregatorV3Interface.sol";

//@review againsnt chainlink reference PriceConverter https://docs.chain.link/docs/get-the-latest-price/ 
//@review decimals for individual feeds
contract DAIPriceFeed {

    AggregatorV3Interface internal priceFeed1;
    AggregatorV3Interface internal priceFeed2;


    constructor() {
        priceFeed1 = AggregatorV3Interface(0xAB594600376Ec9fD91F8e885dADF0CE036862dE0);     
        priceFeed2 = AggregatorV3Interface(0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D);  
    }

    function getThePrice() public view returns (int) {   
         
      /**
       * Returns the latest price of MATIC-USD
      */
    
      (             
       uint80 roundID1,              
       int price1,            
       uint startedAt1,             
       uint timeStamp1,
       uint80 answeredInRound1        
       ) = priceFeed1.latestRoundData();  
     
     /**
      * Returns the latest price of DAI-USD
     */
    
      (             
       uint80 roundID2,              
       int price2,            
       uint startedAt2,             
       uint timeStamp2,
       uint80 answeredInRound2        
       ) = priceFeed2.latestRoundData();  
     
    
    int daiMatic = price2*(10**18)/price1;
    return daiMatic;
    }
     
}
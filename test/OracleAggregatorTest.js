const { expect } = require("chai");

describe("Oracle Aggregrator", function(){

    let daiEthPriceFeedAddress = "0x773616E4d11A78F511299002da57A0a94577F1f4";
    let daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    let decimals = 18;
    let oracleAggregator;
    let priceFeed;

    before(async function(){
        let OracleAggregator = await ethers.getContractFactory("OracleAggregator");
        oracleAggregator = await OracleAggregator.deploy();
        await oracleAggregator.deployed();
        priceFeed = await ethers.getContractAt("AggregatorInterface",daiEthPriceFeedAddress);
        let priceFeedTx = await priceFeed.populateTransaction.latestAnswer();
        await oracleAggregator.setTokenOracle(daiAddress,daiEthPriceFeedAddress,18,priceFeedTx.data,true);
    });

    it("Returns correct oracle decimals", async function(){
        expect (await oracleAggregator.getTokenOracleDecimals(daiAddress)).to.equal(18);
    });

    it("Returns correct token price", async function(){
        let priceFeedPrice = await priceFeed.latestAnswer();
        let oracleAggregatorPrice = await oracleAggregator.getTokenPrice(daiAddress);
        expect(oracleAggregatorPrice).to.equal(priceFeedPrice);
    });

    it("Returns correct token gas price", async function(){
        let priceFeedPrice = await priceFeed.latestAnswer();
        let tokenGasPrice = priceFeedPrice.mul(ethers.utils.parseUnits('200','gwei'));
        expect(await oracleAggregator.getTokenGasPrice(daiAddress,ethers.utils.parseUnits('200','gwei'))).to.equal(tokenGasPrice);
    });




})
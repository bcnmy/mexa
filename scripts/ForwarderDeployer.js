

async function main() {
    let daiEthPriceFeedAddress = "0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541";
    let daiAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
    let daiDecimals = 18;

    let usdtEthPriceFeedAddress ="0x0bF499444525a23E7Bb61997539725cA2e928138";
    let usdtAddress = "0x8486E3592CC23F27Ea430aDAD031Cf8ABD978756";
    let usdtDecimals = 6;

    let usdcEthPriceFeedAddress = "0x64EaC61A2DFda2c3Fa04eED49AA33D021AeC8838";
    let usdcAddress = "0xA5d2a43d94B6a26054506D18ea44E4749f727721";
    let usdcDecimals = 18;

    const accounts = await hre.ethers.getSigners();
    
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy();
    await forwarder.deployed();
    console.log("Biconomy Forwarder deployed at : ",forwarder.address);
    await forwarder.registerDomainSeparator("TRUSTED FORWARDER","1");

    const MockFeeManager = await hre.ethers.getContractFactory("MockFeeManager");
    const mockFeeManager = await MockFeeManager.deploy(10000);
    await mockFeeManager.deployed();
    console.log("Fee Manager deployed at ",mockFeeManager.address);

    const ERC20FeeProxy = await hre.ethers.getContractFactory("ERC20FeeProxy");
    const erc20FeeProxy = await ERC20FeeProxy.deploy(await accounts[0].getAddress(), mockFeeManager.address, forwarder.address);
    await erc20FeeProxy.deployed();
    console.log("Fee Proxy deployed at ",erc20FeeProxy.address);

    //let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    //oracleAggregator = await OracleAggregator.deploy();
    //await oracleAggregator.deployed();
    //console.log("Oracle Aggregator deployed at ",oracleAggregator.address);

    //priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface",daiEthPriceFeedAddress);
    //let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
    //await oracleAggregator.setTokenOracle(daiAddress,daiEthPriceFeedAddress,18,priceFeedTxDai.data,true);
    
    //console.log('dai support added');
    //console.log('dai address' + daiAddress);

    //priceFeedUsdt = await hre.ethers.getContractAt("AggregatorInterface",usdtEthPriceFeedAddress);
    //let priceFeedTxUsdt = await priceFeedUsdt.populateTransaction.latestAnswer();
    //await oracleAggregator.setTokenOracle(usdtAddress,usdtEthPriceFeedAddress,6,priceFeedTxUsdt.data,true);
    //console.log('usdt support added');
    //console.log('usdt address' + usdtAddress);

    //priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface",usdcEthPriceFeedAddress);
    //let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    //await oracleAggregator.setTokenOracle(usdcAddress,usdcEthPriceFeedAddress,18,priceFeedTxUsdc.data,true);
    //console.log('usdc support added');
    //console.log('usdc address' + usdcAddress);

    await erc20FeeProxy.setOracleAggregator("0x6d04923945026711e42ebEA03C616e4E6BbF406e");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
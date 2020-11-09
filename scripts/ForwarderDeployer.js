

async function main() {
    let daiEthPriceFeedAddress = "0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541";
    let daiAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa";
    let decimals = 18;

    const accounts = await hre.ethers.getSigners();
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy();

    await forwarder.deployed();
    console.log("Biconomy Forwarder deployed at : ",forwarder.address);
    await forwarder.registerDomainSeparator("TEST","1");

    const MockFeeManager = await hre.ethers.getContractFactory("MockFeeManager");
    const mockFeeManager = await MockFeeManager.deploy(15000);
    await mockFeeManager.deployed();
    console.log("Fee Manager deployed at ",mockFeeManager.address);

    const ERC20FeeProxy = await hre.ethers.getContractFactory("ERC20FeeProxy");
    const erc20FeeProxy = await ERC20FeeProxy.deploy(100000, await accounts[0].getAddress(), mockFeeManager.address, forwarder.address);
    await erc20FeeProxy.deployed();
    console.log("Fee Proxy deployed at ",erc20FeeProxy.address);

    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy();
    await oracleAggregator.deployed();
    console.log("Oracle Aggregator deployed at ",oracleAggregator.address);

    priceFeed = await hre.ethers.getContractAt("AggregatorInterface",daiEthPriceFeedAddress);
    let priceFeedTx = await priceFeed.populateTransaction.latestAnswer();
    await oracleAggregator.setTokenOracle(daiAddress,daiEthPriceFeedAddress,18,priceFeedTx.data,true);

    await erc20FeeProxy.setOracleAggregator(oracleAggregator.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
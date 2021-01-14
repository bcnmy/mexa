
//todo
//seperate biconomy forwarder and erc20 forwarder deployments
//make modular 
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

    let owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";

    const accounts = await hre.ethers.getSigners();
    
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy(owner);
    await forwarder.deployed();
    console.log("Biconomy Forwarder deployed at : ",forwarder.address);
    await forwarder.registerDomainSeparator("Biconomy Forwarder","1");

    const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(owner,11000);
    await centralisedFeeManager.deployed();
    console.log("Fee Manager deployed at ",centralisedFeeManager.address);


    //allow tokens
    let tx,receipt;
    tx = await centralisedFeeManager.setTokenAllowed(daiAddress,true);
    receipt = await tx.wait(confirmations = 2);

    tx = await centralisedFeeManager.setTokenAllowed(usdcAddress,true);
    receipt = await tx.wait(confirmations = 2);

    tx = await centralisedFeeManager.setTokenAllowed(usdtAddress,true);
    receipt = await tx.wait(confirmations = 2);


    //deploy logic contract
    const ERC20Forwarder = await hre.ethers.getContractFactory("ERC20Forwarder");
    const erc20Forwarder = await ERC20Forwarder.deploy(owner);
    await erc20Forwarder.deployed();

    tx = await erc20Forwarder.initialize(await accounts[0].getAddress(), centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);
    console.log("ERC20 forwarder (logic contract) deployed at ",erc20Forwarder.address);

    //deploy proxy contract
    //todo reminder to change ercFeeProxy to erc20ForwarderProxy / erc20Forwarder(direct)
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address,owner);
    await erc20ForwarderProxy.deployed();

    console.log("ERC20 forwarder proxy deployed at ",erc20ForwarderProxy.address);


    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy(owner);
    await oracleAggregator.deployed();
    console.log("Oracle Aggregator deployed at ",oracleAggregator.address);

    priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface",daiEthPriceFeedAddress);
    let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(daiAddress,daiEthPriceFeedAddress,daiDecimals,priceFeedTxDai.data,true);
    receipt = await tx.wait(confirmations = 2);
    
    console.log('dai support added');
    console.log('dai address' + daiAddress);

    priceFeedUsdt = await hre.ethers.getContractAt("AggregatorInterface",usdtEthPriceFeedAddress);
    let priceFeedTxUsdt = await priceFeedUsdt.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdtAddress,usdtEthPriceFeedAddress,usdtDecimals,priceFeedTxUsdt.data,true);
    receipt = await tx.wait(confirmations = 2);

    console.log('usdt support added');
    console.log('usdt address' + usdtAddress);

    priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface",usdcEthPriceFeedAddress);
    let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdcAddress,usdcEthPriceFeedAddress,usdcDecimals,priceFeedTxUsdc.data,true);
    receipt = await tx.wait(confirmations = 2);

    console.log('usdc support added');
    console.log('usdc address' + usdcAddress);

    tx = await erc20Forwarder.setOracleAggregator(oracleAggregator.address);
    receipt = await tx.wait(confirmations = 2);

    //set transfer handler gas
    tx = await erc20Forwarder.setTransferHandlerGas(daiAddress,37605); //values to be tuned further
    receipt = await tx.wait(confirmations = 2);

    tx = await erc20Forwarder.setTransferHandlerGas(usdtAddress,41672);
    receipt = await tx.wait(confirmations = 2);

    tx = await erc20Forwarder.setTransferHandlerGas(usdcAddress,42944);
    receipt = await tx.wait(confirmations = 2);


    //set safe transfer required
    await erc20Forwarder.setSafeTransferRequired(usdtAddress,true);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

//todo
//seperate biconomy forwarder and erc20 forwarder deployments
//make modular 
async function main() {
    let daiEthPriceFeedAddress = "0x773616E4d11A78F511299002da57A0a94577F1f4";
    let daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
    let daiDecimals = 18;

    let usdtEthPriceFeedAddress ="0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46";
    let usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    let usdtDecimals = 6;

    let usdcEthPriceFeedAddress = "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4";
    let usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    let usdcDecimals = 18;

    //TBD
    let owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";

    const accounts = await hre.ethers.getSigners();
    
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy(owner);
    await forwarder.deployed();
    console.log("Biconomy Forwarder deployed at : ",forwarder.address);
    await forwarder.registerDomainSeparator("Biconomy Forwarder","1");

    const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(owner,11000); //TBD
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

    console.log("ERC20 forwarder (logic contract) deployed at ",erc20Forwarder.address);

    //deploy proxy contract
    //todo reminder to change ercFeeProxy to erc20ForwarderProxy / erc20Forwarder(direct)
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address,"0x4Dd4078Fb19B08048B6843Ba5A27e726B72230E7",owner);
    await erc20ForwarderProxy.deployed();

    console.log("ERC20 forwarder proxy deployed at ",erc20ForwarderProxy.address);

    let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder",erc20ForwarderProxy.address);

    tx = await forwarderProxy.initialize(owner, centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);


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

    tx = await forwarderProxy.setOracleAggregator(oracleAggregator.address);
    receipt = await tx.wait(confirmations = 2);

     //set transfer handler gas
     tx = await forwarderProxy.setTransferHandlerGas(daiAddress,41591); //values to be tuned further
     receipt = await tx.wait(confirmations = 2);
 
     tx = await forwarderProxy.setTransferHandlerGas(usdtAddress,44379);
     receipt = await tx.wait(confirmations = 2);
 
     tx = await forwarderProxy.setTransferHandlerGas(usdcAddress,46930);
     receipt = await tx.wait(confirmations = 2);


    //set safe transfer required
    await forwarderProxy.setSafeTransferRequired(usdtAddress,true);


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
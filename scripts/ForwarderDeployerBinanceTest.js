
//todo
//seperate biconomy forwarder and erc20 forwarder deployments
//make modular 
async function main() {
    let daiEthPriceFeedAddress = "0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D";
    let daiAddress = "0xc7ad46e0b8a400bb3c915120d284aafba8fc4735"; // uniswap rinkeby DAI
    let daiDecimals = 18;

    //unsupported
    /*let usdtEthPriceFeedAddress ="NA";
    let usdtAddress = "0xFc46d3F2D7C005940e86A08725CFe4Df2b88448a";
    let usdtDecimals = 6;*/

    let usdcEthPriceFeedAddress = "0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf";
    let usdcAddress = "0xEc834Af061EFbdEB9ea15Ca78A586710585d9F36"; //deploy custom and make faucet available 
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

    //no USDT support

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


    tx = await erc20Forwarder.setTransferHandlerGas(usdcAddress,42944);
    receipt = await tx.wait(confirmations = 2);


}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
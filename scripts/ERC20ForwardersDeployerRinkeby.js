async function main() {
  try {

    let daiEthPriceFeedAddress = "0x74825DbC8BF76CC4e9494d0ecB210f676Efa001D";
    let daiAddress = "0xc7ad46e0b8a400bb3c915120d284aafba8fc4735"; // uniswap rinkeby DAI
    let daiDecimals = 18;
    const DaiTransferHandlerGas = 41591;
    const USDCTransferHandlerGas = 46930;
  
    let usdcEthPriceFeedAddress = "0xdCA36F27cbC4E38aE16C4E9f99D39b42337F6dcf";
    let usdcAddress = "0x580D4Db44263b648a941ffD5fD2700501BC5AA21"; //make faucet available 
    let usdcDecimals = 18;
  
    let owner = "0xEbdC114433f8119c1367e23A90CBbC7E2D11efBf";
  
    const accounts = await hre.ethers.getSigners();
  
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy(owner);
    await forwarder.deployed();
  
    console.log("✅ Biconomy Forwarder deployed at : ", forwarder.address);
    await forwarder.registerDomainSeparator("Biconomy Forwarder", "1");
  
    const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(owner, 10000);
    await centralisedFeeManager.deployed();
    console.log("✅ Fee Manager deployed at : ", centralisedFeeManager.address);
  
  
    // Allow tokens
    let tx, receipt;
    tx = await centralisedFeeManager.setTokenAllowed(daiAddress, true);
    receipt = await tx.wait(confirmations = 2);
  
    tx = await centralisedFeeManager.setTokenAllowed(usdcAddress, true);
    receipt = await tx.wait(confirmations = 2);
  
  
    // Deploy logic contract
    const ERC20Forwarder = await hre.ethers.getContractFactory("ERC20Forwarder");
    const erc20Forwarder = await ERC20Forwarder.deploy(owner);
    await erc20Forwarder.deployed();
  
    console.log("✅ ERC20 Forwarder (logic contract) deployed at : ", erc20Forwarder.address);
  
    // Deploy proxy contract
    // TODO reminder to change ercFeeProxy to erc20ForwarderProxy / erc20Forwarder(direct)
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, "0x256144a60f34288F7b03D345F8Cb256C502e0f2C", owner);
    await erc20ForwarderProxy.deployed();
  
    console.log("✅ ERC20 Forwarder proxy deployed at : ", erc20ForwarderProxy.address);
  
    let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", erc20ForwarderProxy.address);
  
    tx = await forwarderProxy.initialize(owner, centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);
  
  
    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy(owner);
    await oracleAggregator.deployed();
    console.log("✅ Oracle Aggregator deployed at : ", oracleAggregator.address);
  
    priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface", daiEthPriceFeedAddress);
    let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(daiAddress, daiEthPriceFeedAddress, daiDecimals, priceFeedTxDai.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ DAI support added');
    console.log('✅ DAI address : ' + daiAddress);
   
    // USDT not supported
    priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcEthPriceFeedAddress);
    let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdcAddress, usdcEthPriceFeedAddress, usdcDecimals, priceFeedTxUsdc.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDC support added');
    console.log('✅ USDC address : ' + usdcAddress);
  
    tx = await forwarderProxy.setOracleAggregator(oracleAggregator.address);
    receipt = await tx.wait(confirmations = 2);
  
    console.log(`✅ Oracle aggregator added`);
  
    //set transfer handler gas
    tx = await forwarderProxy.setTransferHandlerGas(daiAddress, DaiTransferHandlerGas); //values to be tuned further
    receipt = await tx.wait(confirmations = 2);
  
    console.log(`✅ DAI transfer handler gas ${DaiTransferHandlerGas} added`)
    tx = await forwarderProxy.setTransferHandlerGas(usdcAddress, USDCTransferHandlerGas);
    receipt = await tx.wait(confirmations = 2);
  
    console.log(`✅ USDC transfer handler gas ${USDCTransferHandlerGas} added`)
  
    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    
  } catch(error) {
    console.log("❌ DEPLOYMENT FAILED ❌")
    console.log(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
/**
 * Check the owner and ERC20ForwarderProxyAdmin values before running the script.
 */
async function main() {
  try {

    //const daiUSDPriceFeedAddress = "0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D"; //DAI USD
    const daiMaticPriceFeedAddress = "0x2f9E45efC8d1748DFc4eb6Fbfa2F284c2CE08C60"; //DAI MATIC
    const daiAddress = "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063"; 
    const daiDecimals = 18; //Review

    //on Mumbai this will change
    const DaiTransferHandlerGas = 46314;
    const USDCTransferHandlerGas = 56321;
    const USDTransferHandlerGas = 56734;
    const SANDTransferHandlerGas = 47444;
    
    //const usdcUSDPriceFeedAddress = "0xfE4A8cc5b5B2366C1B58Bea3858e81843581b2F7"; //USDC USD
    const usdcMaticPriceFeedAddress = "0xbe4cd782679AD4876456b82934De7Fc1dADd251C"; //USDC MATIC
    const usdcAddress = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174"; 
    const usdcDecimals = 18; //Review

    //const usdtUSDPriceFeedAddress = "0x92C09849638959196E976289418e5973CC96d645"; // USDT USD
    const usdtMaticPriceFeedAddress = "0x6D583b6e87d874dA00C3B0DAbDB02AF05B202D49"; // USDT MATIC
    const usdtAddress = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
    const usdtDecimals = 6; //Review

    //const sandUSDPriceFeedAddress = "0x3D49406EDd4D52Fb7FFd25485f32E073b529C924"; // SAND USD
    const sandMaticPriceFeedAddress = "0x1ee3d325502f8E453dd7382208e4c6b7C2D1b151" //SAND MATIC
    const sandAddress = "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683"; 
    const sandDecimals = 18; //Review
    
    const owner = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    //prod config admin addresses
    const newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";
    const ERC20ForwarderProxyAdmin = "0xccb9bA42d45ee6a7E3176B2f865Fb53266B6384D";
    const feeReceiver = "0xabcd3f544CF8c7AcF59AB0dA6e89e170d610bA91";

    let tx, receipt;
    let totalGasUsed = 0;

    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy();
    await forwarder.deployed();
    receipt = await forwarder.deployTransaction.wait(confirmations = 2);
  
    console.log("✅ Biconomy Forwarder deployed at : ", forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
    

    tx = await forwarder.registerDomainSeparator("Powered by Biconomy", "1");
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    const CentralisedFeeManager = await hre.ethers.getContractFactory("FeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(10000);
    await centralisedFeeManager.deployed();
    receipt = await centralisedFeeManager.deployTransaction.wait(confirmations = 2);
    console.log("✅ Fee Manager deployed at : ", centralisedFeeManager.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

  
    // Allow tokens
    tx = await centralisedFeeManager.setTokenAllowed(daiAddress, true);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

  
    tx = await centralisedFeeManager.setTokenAllowed(usdcAddress, true);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await centralisedFeeManager.setTokenAllowed(usdtAddress, true);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await centralisedFeeManager.setTokenAllowed(sandAddress, true);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    /*tx = await centralisedFeeManager.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Fee Manager ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();*/

    // Deploy logic contract
    const ERC20Forwarder = await hre.ethers.getContractFactory("ERC20ForwarderImplementation");
    const erc20Forwarder = await ERC20Forwarder.deploy();
    await erc20Forwarder.deployed();
    receipt = await erc20Forwarder.deployTransaction.wait(confirmations = 2);
    console.log("✅ ERC20 Forwarder (logic contract) deployed at : ", erc20Forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Deploy proxy contract
    // TODO reminder to change ercFeeProxy to erc20ForwarderProxy / erc20Forwarder(direct)
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, ERC20ForwarderProxyAdmin);
    await erc20ForwarderProxy.deployed();
    receipt = await erc20ForwarderProxy.deployTransaction.wait(confirmations = 2);
  
    console.log("✅ ERC20 Forwarder proxy deployed at : ", erc20ForwarderProxy.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let forwarderProxy = await hre.ethers.getContractAt("contracts/forward-v2/forwarder/ERC20ForwarderImplementation.sol:ERC20ForwarderImplementation", erc20ForwarderProxy.address);
  
    tx = await forwarderProxy.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
  
    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy();
    await oracleAggregator.deployed();
    receipt = await oracleAggregator.deployTransaction.wait(confirmations = 2);
    console.log("✅ Oracle Aggregator deployed at : ", oracleAggregator.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface", daiMaticPriceFeedAddress);
    let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(daiAddress, daiMaticPriceFeedAddress, daiDecimals, priceFeedTxDai.data, true);
    receipt = await tx.wait(confirmations = 2);

    console.log('✅ DAI support added');
    console.log(`✅ DAI address : ${daiAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
   
    let priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcMaticPriceFeedAddress);
    let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdcAddress, usdcMaticPriceFeedAddress, usdcDecimals, priceFeedTxUsdc.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDC support added');
    console.log(`✅ USDC address : ${usdcAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let priceFeedUsdt = await hre.ethers.getContractAt("AggregatorInterface", usdtMaticPriceFeedAddress);
    let priceFeedTxUsdt = await priceFeedUsdt.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdtAddress, usdtMaticPriceFeedAddress, usdtDecimals, priceFeedTxUsdt.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDT support added');
    console.log(`✅ USDT address : ${usdtAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let priceFeedSand = await hre.ethers.getContractAt("AggregatorInterface", sandMaticPriceFeedAddress);
    let priceFeedTxSand = await priceFeedSand.populateTransaction.getThePrice();
    tx = await oracleAggregator.setTokenOracle(sandAddress, sandMaticPriceFeedAddress, sandDecimals, priceFeedTxSand.data, true);
    receipt = await tx.wait(confirmations = 1);
  
    console.log('✅ SAND support added');
    console.log(`✅ SAND address : ${sandAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

  
    tx = await forwarderProxy.setOracleAggregator(oracleAggregator.address);
    receipt = await tx.wait(confirmations = 1);  
    console.log(`✅ Oracle aggregator added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    //set transfer handler gas
    tx = await forwarderProxy.setTransferHandlerGas(daiAddress, DaiTransferHandlerGas); //values to be tuned further
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ DAI transfer handler gas ${DaiTransferHandlerGas} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarderProxy.setTransferHandlerGas(usdcAddress, USDCTransferHandlerGas);
    receipt = await tx.wait(confirmations = 2);  
    console.log(`✅ USDC transfer handler gas ${USDCTransferHandlerGas} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarderProxy.setTransferHandlerGas(usdtAddress, USDTransferHandlerGas);
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ USDT transfer handler gas ${USDTransferHandlerGas} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarderProxy.setSafeTransferRequired(usdtAddress,true);
    receipt = await tx.wait(confirmations = 2);
    console.log(`✅ USDT is marked for safe transfer`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //set transfer handler gas
    tx = await forwarderProxy.setTransferHandlerGas(sandAddress, SANDTransferHandlerGas); //values to be tuned further
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ SAND transfer handler gas ${SANDTransferHandlerGas} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    /*tx = await forwarderProxy.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Forwarder Proxy ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await erc20Forwarder.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Forwarder ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await oracleAggregator.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Oracle Aggregator ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarder.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Biconomy Forwarder ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();*/

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
    
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
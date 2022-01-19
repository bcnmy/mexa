const {estimateGasPrice} = require("./gas-price/get-gas-price");
/**
 * Check the owner and ERC20ForwarderProxyAdmin values before running the script.
 */
async function main() {
  try {

    //const sandMaticPriceFeedAddress = "0xe968F783700112d99085111DeB5409Cbc921E4e5";
    const sandAddress = "0xE03489D4E90b22c59c5e23d45DFd59Fc0dB8a025"; 
    // Implementation : https://polygonscan.com/address/0xf46a0e9c1213a9b1fa03f7248846dd38f662360d#code
    const sandDecimals = 18;

    const sandTransferHandlerGas = 42425; 
     
    const owner = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const ERC20ForwarderProxyAdmin = "0x621f18127133b591eAdeEA14F2fe95c7695BcE61";
    const feeReceiver = "0x61943A66606e6442441fF1483080e7fB10558C91";
    const oracleAggregatorAddress = "0xFd0534cD5708d914584cBFFdDA569387523CE59a";

    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    //var options = { gasPrice: gasPrices.fastGasPriceInWei, gasLimit: 10000000};
  
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarderSandBox");
    //todo
    //fetch gas price and change in in the options
    //pass options for all transactions
    const forwarder = await Forwarder.deploy(owner);
    await forwarder.deployed();
    receipt = await forwarder.deployTransaction.wait(confirmations = 2);
    console.log("✅ Biconomy Forwarder deployed at : ", forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
     
    tx = await forwarder.registerDomainSeparator("Biconomy Forwarder for The Sandbox :: used to ley you pay gas fee in SAND", "1");
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(owner, 10000);
    await centralisedFeeManager.deployed();
    receipt = await centralisedFeeManager.deployTransaction.wait(confirmations = 2);
    console.log("✅ Fee Manager deployed at : ", centralisedFeeManager.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Allow tokens
    tx = await centralisedFeeManager.setTokenAllowed(sandAddress, true);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Deploy logic contract
    const ERC20ForwarderSandBox = await hre.ethers.getContractFactory("ERC20ForwarderSandBox");
    const erc20Forwarder = await ERC20ForwarderSandBox.deploy(owner);
    await erc20Forwarder.deployed();
    receipt = await erc20Forwarder.deployTransaction.wait(confirmations = 2);
    console.log("✅ ERC20 Forwarder (logic contract) deployed at : ", erc20Forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Deploy proxy contract
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, ERC20ForwarderProxyAdmin, owner);
    await erc20ForwarderProxy.deployed();
    receipt = await erc20ForwarderProxy.deployTransaction.wait(confirmations = 2);
    console.log("✅ ERC20 Forwarder proxy deployed at : ", erc20ForwarderProxy.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20ForwarderSandBox.sol:ERC20ForwarderSandBox", erc20ForwarderProxy.address);
  
    tx = await forwarderProxy.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
  
    /*let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy(owner);
    await oracleAggregator.deployed();
    receipt = await oracleAggregator.deployTransaction.wait(confirmations = 1);
    console.log("✅ Oracle Aggregator deployed at : ", oracleAggregator.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let priceFeedSand = await hre.ethers.getContractAt("AggregatorInterface", sandMaticPriceFeedAddress);
    let priceFeedTxSand = await priceFeedSand.populateTransaction.getThePrice();
    tx = await oracleAggregator.setTokenOracle(sandAddress, sandMaticPriceFeedAddress, sandDecimals, priceFeedTxSand.data, true);
    receipt = await tx.wait(confirmations = 1);*/
  
    console.log('✅ SAND support added');
    console.log(`✅ SAND address : ${sandAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
   
    tx = await forwarderProxy.setOracleAggregator(oracleAggregatorAddress);
    receipt = await tx.wait(confirmations = 2);  
    console.log(`✅ Oracle aggregator added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    //set transfer handler gas
    tx = await forwarderProxy.setTransferHandlerGas(sandAddress, sandTransferHandlerGas); //values to be tuned further
    receipt = await tx.wait(confirmations = 2);
    console.log(`✅ SAND transfer handler gas ${sandTransferHandlerGas} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
    let ethSpent = totalGasUsed * gasPrices.fastGasPriceInWei;
    console.log(`Total Matic(in wei) spent in deployment is : ${ethSpent}`);
    
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
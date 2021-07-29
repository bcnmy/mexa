const {estimateGasPrice} = require("./gas-price/get-gas-price");
/**
 * Check the owner and ERC20ForwarderProxyAdmin values before running the script.
 */
async function main() {
  try {

    const sandMaticPriceFeedAddress = "0x2449E69DE2e4ec1271D3c7Cc76aD207cb5A4A260";
    const sandAddress = "0xC6d54D2f624bc83815b49d9c2203b1330B841cA0"; 
    // Implementation : https://polygonscan.com/address/0xf46a0e9c1213a9b1fa03f7248846dd38f662360d#code
    const sandDecimals = 18;

    const sandTransferHandlerGas = 42425; 
     
    const owner = "0x9AAFe3E7E4Fe0E15281831f7D2f33eFfE18Fc7d5";
    const ERC20ForwarderProxyAdmin = "0xAD8b61F17c6a53d159baFC67082aC8d0a86e712F";
    const feeReceiver = "0x12349D54Aa10cc5b158D8B5575e11e88cb5Dee09";

    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    var options = { gasPrice: gasPrices.fastGasPriceInWei, gasLimit: 10000000};
  
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    //todo
    //fetch gas price and change in in the options
    //pass options for all transactions
    const forwarder = await Forwarder.deploy(owner,options);
    await forwarder.deployed();
    receipt = await forwarder.deployTransaction.wait(confirmations = 1);
    console.log("✅ Biconomy Forwarder deployed at : ", forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
     
    tx = await forwarder.registerDomainSeparator("Biconomy Forwarder", "1", options);
    receipt = await tx.wait(confirmations = 1);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(owner, 10000, options);
    await centralisedFeeManager.deployed();
    receipt = await centralisedFeeManager.deployTransaction.wait(confirmations = 1);
    console.log("✅ Fee Manager deployed at : ", centralisedFeeManager.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Allow tokens
    tx = await centralisedFeeManager.setTokenAllowed(sandAddress, true, options);
    receipt = await tx.wait(confirmations = 1);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Deploy logic contract
    const ERC20Forwarder = await hre.ethers.getContractFactory("ERC20Forwarder");
    const erc20Forwarder = await ERC20Forwarder.deploy(owner, options);
    await erc20Forwarder.deployed();
    receipt = await erc20Forwarder.deployTransaction.wait(confirmations = 1);
    console.log("✅ ERC20 Forwarder (logic contract) deployed at : ", erc20Forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Deploy proxy contract
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, ERC20ForwarderProxyAdmin, owner, options);
    await erc20ForwarderProxy.deployed();
    receipt = await erc20ForwarderProxy.deployTransaction.wait(confirmations = 1);
    console.log("✅ ERC20 Forwarder proxy deployed at : ", erc20ForwarderProxy.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", erc20ForwarderProxy.address);
  
    tx = await forwarderProxy.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address, options);
    receipt = await tx.wait(confirmations = 1);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
  
    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy(owner, options);
    await oracleAggregator.deployed();
    receipt = await oracleAggregator.deployTransaction.wait(confirmations = 1);
    console.log("✅ Oracle Aggregator deployed at : ", oracleAggregator.address);
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
   
    tx = await forwarderProxy.setOracleAggregator(oracleAggregator.address, options);
    receipt = await tx.wait(confirmations = 1);  
    console.log(`✅ Oracle aggregator added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    //set transfer handler gas
    tx = await forwarderProxy.setTransferHandlerGas(sandAddress, sandTransferHandlerGas, options); //values to be tuned further
    receipt = await tx.wait(confirmations = 1);
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
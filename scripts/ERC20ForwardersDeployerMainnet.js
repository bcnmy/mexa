const {estimateGasPrice} = require("./gas-price/get-gas-price");
/**
 * Check the owner and ERC20ForwarderProxyAdmin values before running the script.
 */
async function main() {
  try {

    const daiEthPriceFeedAddress = "0x773616E4d11A78F511299002da57A0a94577F1f4";
    const daiAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"; 
    const daiDecimals = 18;

    const DaiTransferHandlerGas = 39631;
    const USDCTransferHandlerGas = 44970;
    const USDTransferHandlerGas = 42425;
    
    const usdcEthPriceFeedAddress = "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4";
    const usdcAddress = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";  
    const usdcDecimals = 18;

    const usdtEthPriceFeedAddress = "0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46";
    const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; 
    const usdtDecimals = 6;
    
    //deploy contracts with the final owner address
    const owner = "0xEbdC114433f8119c1367e23A90CBbC7E2D11efBf";
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
    receipt = await forwarder.deployTransaction.wait(confirmations = 2);
    console.log("✅ Biconomy Forwarder deployed at : ", forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
     
    tx = await forwarder.registerDomainSeparator("Biconomy Forwarder", "1");
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    const CentralisedFeeManager = await hre.ethers.getContractFactory("CentralisedFeeManager");
    const centralisedFeeManager = await CentralisedFeeManager.deploy(owner, 10000, options);
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
  
  
    // Deploy logic contract
    const ERC20Forwarder = await hre.ethers.getContractFactory("ERC20Forwarder");
    const erc20Forwarder = await ERC20Forwarder.deploy(owner, options);
    await erc20Forwarder.deployed();
    receipt = await erc20Forwarder.deployTransaction.wait(confirmations = 2);
    console.log("✅ ERC20 Forwarder (logic contract) deployed at : ", erc20Forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    // Deploy proxy contract
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, ERC20ForwarderProxyAdmin, owner, options);
    await erc20ForwarderProxy.deployed();
    receipt = await erc20ForwarderProxy.deployTransaction.wait(confirmations = 2);
    console.log("✅ ERC20 Forwarder proxy deployed at : ", erc20ForwarderProxy.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", erc20ForwarderProxy.address);
  
    tx = await forwarderProxy.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
  
    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy(owner, options);
    await oracleAggregator.deployed();
    receipt = await oracleAggregator.deployTransaction.wait(confirmations = 2);
    console.log("✅ Oracle Aggregator deployed at : ", oracleAggregator.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
  
    let priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface", daiEthPriceFeedAddress);
    let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(daiAddress, daiEthPriceFeedAddress, daiDecimals, priceFeedTxDai.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ DAI support added');
    console.log(`✅ DAI address : ${daiAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
   
    let priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcEthPriceFeedAddress);
    let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdcAddress, usdcEthPriceFeedAddress, usdcDecimals, priceFeedTxUsdc.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDC support added');
    console.log(`✅ USDC address : ${usdcAddress}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let priceFeedUsdt = await hre.ethers.getContractAt("AggregatorInterface", usdtEthPriceFeedAddress);
    let priceFeedTxUsdt = await priceFeedUsdt.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdtAddress, usdtEthPriceFeedAddress, usdtDecimals, priceFeedTxUsdt.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDT support added');
    console.log(`✅ USDT address : ${usdcAddress}`);
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

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
    let ethSpent = totalGasUsed * gasPrices.fastGasPriceInWei;
    console.log(`Total Ether(in wei) spent in deployment is : ${ethSpent}`);
    
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
/**
 * Check the owner and ERC20ForwarderProxyAdmin values before running the script.
 */
async function main() {
  try {

    const daiEthPriceFeedAddress = "0x22B58f1EbEDfCA50feF632bD73368b2FdA96D541";
    const daiAddress = "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa"; // uniswap kovan DAI
    const daiDecimals = 18;
    const DaiTransferHandlerGas = 39631;
    const USDCTransferHandlerGas = 44970;
    const USDTransferHandlerGas = 42425;
    
    const usdcEthPriceFeedAddress = "0x64EaC61A2DFda2c3Fa04eED49AA33D021AeC8838";
    const usdcAddress = "0xA5d2a43d94B6a26054506D18ea44E4749f727721"; //make faucet available 
    const usdcDecimals = 18;

    const usdtEthPriceFeedAddress = "0x0bF499444525a23E7Bb61997539725cA2e928138";
    const usdtAddress = "0x7816604Da30cFb779Cd0F113E748238033710bAa"; //make faucet available 
    const usdtDecimals = 6;
    
    const owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";
    const ERC20ForwarderProxyAdmin = "0x4Dd4078Fb19B08048B6843Ba5A27e726B72230E7";
  
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

    tx = await centralisedFeeManager.setTokenAllowed(usdtAddress, true);
    receipt = await tx.wait(confirmations = 2);
  
  
    // Deploy logic contract
    const ERC20Forwarder = await hre.ethers.getContractFactory("ERC20Forwarder");
    const erc20Forwarder = await ERC20Forwarder.deploy(owner);
    await erc20Forwarder.deployed();
  
    console.log("✅ ERC20 Forwarder (logic contract) deployed at : ", erc20Forwarder.address);
  
    // Deploy proxy contract
    // TODO reminder to change ercFeeProxy to erc20ForwarderProxy / erc20Forwarder(direct)
    const ERC20ForwarderProxy = await hre.ethers.getContractFactory("ERC20ForwarderProxy");
    const erc20ForwarderProxy = await ERC20ForwarderProxy.deploy(erc20Forwarder.address, ERC20ForwarderProxyAdmin, owner);
    await erc20ForwarderProxy.deployed();
  
    console.log("✅ ERC20 Forwarder proxy deployed at : ", erc20ForwarderProxy.address);
  
    let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", erc20ForwarderProxy.address);
  
    tx = await forwarderProxy.initialize(owner, centralisedFeeManager.address, forwarder.address);
    receipt = await tx.wait(confirmations = 2);
  
  
    let OracleAggregator = await hre.ethers.getContractFactory("OracleAggregator");
    oracleAggregator = await OracleAggregator.deploy(owner);
    await oracleAggregator.deployed();
    console.log("✅ Oracle Aggregator deployed at : ", oracleAggregator.address);
  
    let priceFeedDai = await hre.ethers.getContractAt("AggregatorInterface", daiEthPriceFeedAddress);
    let priceFeedTxDai = await priceFeedDai.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(daiAddress, daiEthPriceFeedAddress, daiDecimals, priceFeedTxDai.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ DAI support added');
    console.log(`✅ DAI address : ${daiAddress}`);
   
    let priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcEthPriceFeedAddress);
    let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdcAddress, usdcEthPriceFeedAddress, usdcDecimals, priceFeedTxUsdc.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDC support added');
    console.log(`✅ USDC address : ${usdcAddress}`);

    let priceFeedUsdt = await hre.ethers.getContractAt("AggregatorInterface", usdtEthPriceFeedAddress);
    let priceFeedTxUsdt = await priceFeedUsdt.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdtAddress, usdtEthPriceFeedAddress, usdtDecimals, priceFeedTxUsdt.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDT support added');
    console.log(`✅ USDT address : ${usdcAddress}`);
  
    tx = await forwarderProxy.setOracleAggregator(oracleAggregator.address);
    receipt = await tx.wait(priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcEthPriceFeedAddress);
    let priceFeedTxUsdc = await priceFeedUsdc.populateTransaction.latestAnswer();
    tx = await oracleAggregator.setTokenOracle(usdcAddress, usdcEthPriceFeedAddress, usdcDecimals, priceFeedTxUsdc.data, true);
    receipt = await tx.wait(confirmations = 2);
  
    console.log('✅ USDC support added');
    console.log(`✅ USDC address : ${usdcAddress}`);confirmations = 2);
  
    console.log(`✅ Oracle aggregator added`);
  
    //set transfer handler gas
    tx = await forwarderProxy.setTransferHandlerGas(daiAddress, DaiTransferHandlerGas); //values to be tuned further
    receipt = await tx.wait(confirmations = 2);
  
    console.log(`✅ DAI transfer handler gas ${DaiTransferHandlerGas} added`)

    tx = await forwarderProxy.setTransferHandlerGas(usdcAddress, USDCTransferHandlerGas);
    receipt = await tx.wait(confirmations = 2);
  
    console.log(`✅ USDC transfer handler gas ${USDCTransferHandlerGas} added`)

    tx = await forwarderProxy.setTransferHandlerGas(usdtAddress, USDTransferHandlerGas);
    receipt = await tx.wait(confirmations = 2);
  
    console.log(`✅ USDT transfer handler gas ${USDTransferHandlerGas} added`)
  
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
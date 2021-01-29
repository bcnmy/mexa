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
    const usdcAddress = "0x6043fD7126e4229d6FcaC388c9E1C8d333CCb8fA"; //make faucet available 
    const usdcDecimals = 18;

    const usdtEthPriceFeedAddress = "0x0bF499444525a23E7Bb61997539725cA2e928138";
    const usdtAddress = "0x8e1084f3599ba90991C3b2f9e25D920738C1496D"; //with faucet
    const usdtDecimals = 6;
    
    const owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";
    const newOwner = "0xEbdC114433f8119c1367e23A90CBbC7E2D11efBf";
    const ERC20ForwarderProxyAdmin = "0xAD8b61F17c6a53d159baFC67082aC8d0a86e712F";
    const feeReceiver = "0x12349D54Aa10cc5b158D8B5575e11e88cb5Dee09";
  
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
  
    tx = await centralisedFeeManager.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Fee Manager ownership transferred to ${newOwner}`);

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
  
    tx = await forwarderProxy.initialize(feeReceiver, centralisedFeeManager.address, forwarder.address);
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
    console.log(`✅ USDT address : ${usdtAddress}`);
  
    tx = await forwarderProxy.setOracleAggregator(oracleAggregator.address);
    receipt = await tx.wait(priceFeedUsdc = await hre.ethers.getContractAt("AggregatorInterface", usdcEthPriceFeedAddress));  
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
  
    tx = await forwarderProxy.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Forwarder Proxy ownership transferred to ${newOwner}`);

    tx = await erc20Forwarder.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Forwarder ownership transferred to ${newOwner}`);

    tx = await oracleAggregator.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Oracle Aggregator ownership transferred to ${newOwner}`);

    tx = await forwarder.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Biconomy Forwarder ownership transferred to ${newOwner}`);

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
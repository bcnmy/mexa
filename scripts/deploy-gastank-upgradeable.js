const { estimateGasPrice } = require("./gas-price/get-gas-price");
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function deployGasTank(config) {
  try {

    // Fetch the list of accounts from the Hardhat Runtime Environment
    const accounts = await ethers.getSigners();
    // Assuming the deployer is the first account
    const deployer = accounts[0].address;
    console.log(`Deployer address: ${deployer}`); // Print the deployer address
    
    const newOwner = config.newOwner;
    const proxyAdmin = config.proxyAdmin;
    const relayerMasterAccount = config.relayerMasterAccount;
    const trustedForwarder = config.trustedForwarder;
    const minDeposit = ethers.utils.parseEther(config.minDeposit.toString());

    let tx, receipt;
    let totalGasUsed = 0;

    const { logicContractAddress, proxyContractAddress } = config.deployedAddresses || {};

    let gasTank, dappGasTankProxy;
    var options = { maxFeePerGas: 1.5e9, maxPriorityFeePerGas: 1.5e9, type: 2};

    // Check if Logic Contract is already deployed
    if (!logicContractAddress || !await isContractDeployed(logicContractAddress)) {
      console.log("Deploying Dapp Gas Tank Logic Contract...");
      const DappGasTank = await hre.ethers.getContractFactory("DappGasTank");
      gasTank = await DappGasTank.deploy(options);
      await gasTank.deployed();
      console.log("✅ Dapp Gas Tank Logic Contract deployed at:", gasTank.address);
      receipt = await gasTank.deployTransaction.wait(confirmations = 2);
      totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
    } else {
      gasTank = await hre.ethers.getContractAt("DappGasTank", logicContractAddress);
      console.log(`Using existing Dapp Gas Tank Logic Contract at: ${logicContractAddress}`);
    }

    // Similarly, check if Proxy Contract is already deployed
    if (!proxyContractAddress || !await isContractDeployed(proxyContractAddress)) {
      console.log("Deploying Dapp Gas Tank Proxy Contract...");
      const DappGasTankProxy = await hre.ethers.getContractFactory("DappGasTankProxy");
      dappGasTankProxy = await DappGasTankProxy.deploy(gasTank.address, proxyAdmin, options);
      await dappGasTankProxy.deployed();
      console.log("✅ Dapp Gas Tank Proxy Contract deployed at:", dappGasTankProxy.address);
      receipt = await dappGasTankProxy.deployTransaction.wait(confirmations = 2);
      totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
      console.log("✅ Dapp Gas Tank proxy deployed at : ", dappGasTankProxy.address);
      console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);  
    } else {
      dappGasTankProxy = await hre.ethers.getContractAt("DappGasTankProxy", proxyContractAddress);
      console.log(`Using existing Dapp Gas Tank Proxy Contract at: ${proxyContractAddress}`);
    }
    
    let gasTankProxy = await hre.ethers.getContractAt("contracts/7/gas-manager/gas-tank/DappGasTank.sol:DappGasTank", dappGasTankProxy.address);
  
    tx = await gasTankProxy.initialize(trustedForwarder, options);
    receipt = await tx.wait(confirmations = 2);
    console.log("✅ Dapp Gas Tank proxy Initialized");
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //Setters on Dapp Gas Tank via Proxy
    tx = await gasTankProxy.setMasterAccount(relayerMasterAccount, options); 
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ Main account ${relayerMasterAccount} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //Setters on Dapp Gas Tank via Proxy
    tx = await gasTankProxy.setMinDeposit(minDeposit.toString(), options); 
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ Min deposit set to ${minDeposit.toString()}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    // Transfer Ownership
    tx = await gasTankProxy.transferOwnership(newOwner, options);
    receipt = await tx.wait(confirmations = 2);
    console.log(`✅ Ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();
    
    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
  } catch (error) {
    console.log("❌ DEPLOYMENT FAILED ❌")
    console.log(error);
  }

}

async function isContractDeployed(address) {
  const code = await ethers.provider.getCode(address);
  return code !== '0x';
}

module.exports = {
  deployGasTank
};


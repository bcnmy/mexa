const { estimateGasPrice } = require("./gas-price/get-gas-price");
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  try {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');
    const owner = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";
    const proxyAdmin = "0xccb9bA42d45ee6a7E3176B2f865Fb53266B6384D";
    const relayerMasterAccount = "0x92c0BA99B59dBA211b70De410AB3513BD25de408";
    const trustedForwarder = "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b";
    const minDeposit = ethers.utils.parseEther("1.0");


    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    var options = { gasPrice: gasPrices.fastGasPriceInWei, gasLimit: 10000000 };

    //Deploy logic contract
    const DappGasTank = await hre.ethers.getContractFactory("DappGasTank");
    const gasTank = await DappGasTank.deploy();
    await gasTank.deployed();
    console.log("✅ Dapp Gas Tank Token Logic Contract deployed at:", gasTank.address);
    receipt = await gasTank.deployTransaction.wait(confirmations = 2);

    //Deploy proxy contract
    const DappGasTankProxy = await hre.ethers.getContractFactory("DappGasTankProxy");
    const dappGasTankProxy = await DappGasTankProxy.deploy(gasTank.address, proxyAdmin);
    await dappGasTankProxy.deployed();
    receipt = await dappGasTankProxy.deployTransaction.wait(confirmations = 2);
  
    console.log("✅ Dapp Gas Tank proxy deployed at : ", dappGasTankProxy.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let gasTankProxy = await hre.ethers.getContractAt("contracts/7/gas-manager/gas-tank/DappGasTank.sol:DappGasTank", dappGasTankProxy.address);
  
    tx = await gasTankProxy.initialize(trustedForwarder);
    receipt = await tx.wait(confirmations = 2);
    console.log("✅ Dapp Gas Tank proxy Initialized");
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //Setters on Dapp Gas Tank via Proxy
    tx = await gasTankProxy.setMasterAccount(relayerMasterAccount); 
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ Main account ${relayerMasterAccount} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //Setters on Dapp Gas Tank via Proxy
    tx = await gasTankProxy.setMinDeposit(minDeposit.toString()); 
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ Min deposit set to ${minDeposit.toString()}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
  } catch (error) {
    console.log("❌ DEPLOYMENT FAILED ❌")
    console.log(error);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

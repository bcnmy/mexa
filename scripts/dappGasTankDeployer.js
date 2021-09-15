const {estimateGasPrice} = require("./gas-price/get-gas-price");

async function main() {
    try {

    const owner = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
    const newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";
    const proxyAdmin = "0xccb9bA42d45ee6a7E3176B2f865Fb53266B6384D";
    const relayerMasterAccount = "0x92c0BA99B59dBA211b70De410AB3513BD25de408";

    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    var options = { gasPrice: gasPrices.fastGasPriceInWei, gasLimit: 10000000};

    //Deploy logic contract
    const DappGasTank = await hre.ethers.getContractFactory("DappGasTank");
    const gasTank = await DappGasTank.deploy(owner, options);
    await gasTank.deployed();
    receipt = await gasTank.deployTransaction.wait(confirmations = 2);

    console.log("✅ Dapp Gas Tank (logic contract) deployed at : ", gasTank.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //Deploy proxy contract
    const DappGasTankProxy = await hre.ethers.getContractFactory("DappGasTankProxy");
    const dappGasTankProxy = await DappGasTankProxy.deploy(gasTank.address, proxyAdmin, owner, options);
    await dappGasTankProxy.deployed();
    receipt = await dappGasTankProxy.deployTransaction.wait(confirmations = 2);
  
    console.log("✅ Dapp Gas Tank proxy deployed at : ", dappGasTankProxy.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    let gasTankProxy = await hre.ethers.getContractAt("contracts/7/gas-manager/gas-tank/DappGasTank.sol:DappGasTank", dappGasTankProxy.address);
  
    tx = await gasTankProxy.initialize();
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    //Setters on Dapp Gas Tank via Proxy
    tx = await gasTankProxy.setMasterAccount(relayerMasterAccount, options); 
    receipt = await tx.wait(confirmations = 2); 
    console.log(`✅ Main account ${relayerMasterAccount} added`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

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

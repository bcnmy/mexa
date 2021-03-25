const {estimateGasPriceMatic} = require("./gas-price/get-gas-price");
/**
 * Check the owner value before running the script.
 */
async function main() {
  try {
  
    let owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";
    //prod config admin addresses
    let newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";

    const accounts = await hre.ethers.getSigners();
    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPriceMatic();
    if(gasPrices && gasPrices.fastGasPriceInWei)
    {  
    var options = { gasPrice: gasPrices.fastGasPriceInWei};
    
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy(owner,options);
    await forwarder.deployed();
    receipt = await forwarder.deployTransaction.wait(confirmations = 2);

    console.log("✅ Biconomy Forwarder deployed at : ",forwarder.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarder.registerDomainSeparator("Biconomy Forwarder","1", options);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarder.transferOwnership(newOwner, options);
    receipt = await tx.wait(confirmations = 2);
    console.log(`✅ Biconomy Forwarder ownership transferred to ${newOwner}`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
    }
    else
    {
      console.log("❌ DEPLOYMENT FAILED ❌ Unable to fetch gas prices from Matic Gas Station") 
    }
  }
  catch(error) {
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
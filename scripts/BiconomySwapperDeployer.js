const {estimateGasPrice} = require("./gas-price/get-gas-price");
/**
 * Check the owner value before running the script.
 */
async function main() {
  try {
  
    let owner = "0x9AAFe3E7E4Fe0E15281831f7D2f33eFfE18Fc7d5";
    //prod config admin addresses
    let newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";

    //kovan
    let trustedForwarderAddress = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E";

    const accounts = await hre.ethers.getSigners();
    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    var options = { gasPrice: gasPrices.fastGasPriceInWei};
    
    const BiconomySwapper = await hre.ethers.getContractFactory("BiconomySwapper");
    const biconomySwapper = await BiconomySwapper.deploy(trustedForwarderAddress,owner,options);
    await biconomySwapper.deployed();
    receipt = await biconomySwapper.deployTransaction.wait(confirmations = 2);

    console.log("✅ Biconomy Swapper deployed at : ",biconomySwapper.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`Total gas used in deployment is : ${totalGasUsed}`);
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
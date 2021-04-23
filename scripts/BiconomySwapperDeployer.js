const {estimateGasPrice} = require("./gas-price/get-gas-price");

async function main() {

    try{

    let tx, receipt;
    let totalGasUsed = 0;

    const owner = "0x9AAFe3E7E4Fe0E15281831f7D2f33eFfE18Fc7d5";
    //prod config admin addresses
    const newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";
    //also remember to change UniswapV2Router02 address in contract, for the network you're deploying
    const trustedForwarder = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E"; //kovan

    //var gasPrices = await estimateGasPrice();
    var options = { gasPrice: 20000000000};

    const BiconomySwapper = await hre.ethers.getContractFactory("BiconomySwapper");
    const biconomySwapper = await BiconomySwapper.deploy(owner,trustedForwarder, options); 
    await biconomySwapper.deployed();
    console.log("Biconomy Swapper Address " + biconomySwapper.address);

    receipt = await biconomySwapper.deployTransaction.wait(confirmations = 1);
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
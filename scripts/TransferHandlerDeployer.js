const {estimateGasPrice} = require("./gas-price/get-gas-price");
/**
 * Check the owner value before running the script.
 */
async function main() {
  try {
  
    let owner = "0x9AAFe3E7E4Fe0E15281831f7D2f33eFfE18Fc7d5";
    //prod config admin addresses
    let newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";

    let feeReceiver = "0xabcd3f544CF8c7AcF59AB0dA6e89e170d610bA91";

    const usdcEthPriceFeedAddress = "0x64EaC61A2DFda2c3Fa04eED49AA33D021AeC8838";
    const usdcAddress = "0x6043fD7126e4229d6FcaC388c9E1C8d333CCb8fA"; //make faucet available 
    const usdcDecimals = 18;
    const usdcTransferHandlerGas = 50000;

    const accounts = await hre.ethers.getSigners();
    let tx, receipt;
    let totalGasUsed = 0;

    var gasPrices = await estimateGasPrice();
    var options = { gasPrice: gasPrices.fastGasPriceInWei};
    
    const TransferHandler = await hre.ethers.getContractFactory("TransferHandlerCustom");
    const transferHandler = await TransferHandler.deploy(owner,options);
    await transferHandler.deployed();
    receipt = await transferHandler.deployTransaction.wait(confirmations = 2);

    console.log("✅ Transfer Handler (custom approach) deployed at : ",transferHandler.address);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await transferHandler.setFeeReceiver(feeReceiver,options);
    receipt = await tx.wait(confirmations = 2);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    console.log(`✅Fee receiver set to ${feeReceiver}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await transferHandler.setDefaultFeeMultiplier(10000,options);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Fee multiplier is set`);
    console.log(`Gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await transferHandler.setTransferHandlerGas(usdcAddress,usdcTransferHandlerGas,options);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Transfer handler gas is set`);
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
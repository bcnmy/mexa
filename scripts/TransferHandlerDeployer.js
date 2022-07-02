/**
 * Check the owner value before running the script.
 */
 async function main() {
    try {
    
      let owner = "0x2b241cBe6B455e08Ade78a7ccC42DE2403d7b566";
      //prod config admin addresses
      let newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";
      let forwarder = "0xF82986F574803dfFd9609BE8b9c7B92f63a1410E";
  
      const accounts = await hre.ethers.getSigners();
      let tx, receipt;
      let totalGasUsed = 0;
      
      const TransferHandler = await hre.ethers.getContractFactory("ERC20TransferHandler");
      const transferHandler = await TransferHandler.deploy(forwarder);
      await transferHandler.deployed();
      receipt = await transferHandler.deployTransaction.wait(confirmations = 2);
  
      console.log("✅ ERC20 Transfer Handler deployed at : ",transferHandler.address);
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

//todo
//seperate biconomy forwarder and erc20 forwarder deployments
//make modular 
async function main() {
  try {
  
    let owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";
    //prod config admin addresses
    let newOwner = "0xbb3982c15D92a8733e82Db8EBF881D979cFe9017";

    const accounts = await hre.ethers.getSigners();
    let tx, receipt;
    let totalGasUsed = 0;
    var options = { gasPrice: 17000000000, gasLimit: 10000000};
    
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy(owner,options);
    await forwarder.deployed();
    receipt = await forwarder.deployTransaction.wait(confirmations = 2);

    console.log("✅ Biconomy Forwarder deployed at : ",forwarder.address);
    console.log(`gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarder.registerDomainSeparator("Biconomy Forwarder","1");
    receipt = await tx.wait(confirmations = 2);
    console.log(`gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    tx = await forwarder.transferOwnership(newOwner);
    receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Biconomy Forwarder ownership transferred to ${newOwner}`);
    console.log(`gas used : ${receipt.gasUsed.toNumber()}`);
    totalGasUsed = totalGasUsed + receipt.gasUsed.toNumber();

    console.log("👏 🏁🏁 DEPLOYMENT FINISHED");
    console.log(`total gas used in deployment is : ${totalGasUsed}`);
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
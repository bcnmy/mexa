
//todo
//seperate biconomy forwarder and erc20 forwarder deployments
//make modular 
async function main() {
  
    let owner = "0x221CadcAC35E18eCc89d1C3d8aF88613b9d7518b";
    let newOwner = "0xEbdC114433f8119c1367e23A90CBbC7E2D11efBf";

    const accounts = await hre.ethers.getSigners();
    
    const Forwarder = await hre.ethers.getContractFactory("BiconomyForwarder");
    const forwarder = await Forwarder.deploy(owner);
    await forwarder.deployed();
    console.log("Biconomy Forwarder deployed at : ",forwarder.address);
    await forwarder.registerDomainSeparator("Biconomy Forwarder","1");

    let tx = await forwarder.transferOwnership(newOwner);
    let receipt = await tx.wait(confirmations = 1);
    console.log(`✅ Biconomy Forwarder ownership transferred to ${newOwner}`);

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
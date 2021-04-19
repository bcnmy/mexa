async function main() {
    const ERC20TransferHandler = await hre.ethers.getContractFactory("ERC20TransferHandler");
    const erc20TransferHandler = await ERC20TransferHandler.deploy("0xF82986F574803dfFd9609BE8b9c7B92f63a1410E"); //kovan address
    await erc20TransferHandler.deployed();
    console.log("ERC20 Transfer Handler Address " + erc20TransferHandler.address);
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
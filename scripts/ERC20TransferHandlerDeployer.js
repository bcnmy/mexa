async function main() {
    const ERC20TransferHandler = await hre.ethers.getContractFactory("ERC20TransferHandler");
    const erc20TransferHandler = await ERC20TransferHandler.deploy("0xBFA21CD2F21a8E581E77942B2831B378d2378E69");
    await erc20TransferHandler.deployed();
    console.log("ERC20 Transfer Handler Address " + erc20TransferHandler.address);
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
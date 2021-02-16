async function main() {
    //0x78122426ee7a6D35f15c4095b4Aa72A2A6418202
    const bf = await ethers.getContractAt("ERC20FeeProxy","0x78122426ee7a6D35f15c4095b4Aa72A2A6418202");
    await bf.setTransferHandlerGas(60000);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
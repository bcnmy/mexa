/**
 * Script to set the transfer handler gas separately. Check the erc20ForwarderProxyAddress before
 * running the script.
 */
async function main() {
    try {
  
      const daiAddress = "0xc7ad46e0b8a400bb3c915120d284aafba8fc4735"; // uniswap rinkeby DAI
      const DaiTransferHandlerGas = 45091;
      const USDCTransferHandlerGas = 48430;
      
      const usdcAddress = "0x580D4Db44263b648a941ffD5fD2700501BC5AA21"; //make faucet available 
      
      const owner = "0xEbdC114433f8119c1367e23A90CBbC7E2D11efBf";
      const erc20ForwarderProxyAddress = "0xa9562895FBAa3D3EB4ddAF8b708e6DaD06D27cFA";

      let forwarderProxy = await hre.ethers.getContractAt("contracts/6/forwarder/ERC20Forwarder.sol:ERC20Forwarder", erc20ForwarderProxyAddress);
    
      //set transfer handler gas
      tx = await forwarderProxy.setTransferHandlerGas(daiAddress, DaiTransferHandlerGas); //values to be tuned further
      receipt = await tx.wait(confirmations = 1);
    
      console.log(`✅ DAI transfer handler gas ${DaiTransferHandlerGas} added`)
      
      tx = await forwarderProxy.setTransferHandlerGas(usdcAddress, USDCTransferHandlerGas);
      receipt = await tx.wait(confirmations = 1);
    
      console.log(`✅ USDC transfer handler gas ${USDCTransferHandlerGas} added`)
    
      console.log("👏 🏁🏁 TRANSFER HANDLER GAS SET SUCCESSFULLY");
      
    } catch(error) {
      console.log("❌ SCRIPT FAILED ❌")
      console.log(error);
    }
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
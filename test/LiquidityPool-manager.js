// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Liquidity Pool Manager", function(){
//     let executorManager;
//     let accounts;
//     let owner;
//     let notOwner;
//     let liquidityPoolMngr, tokenAddress;
//     let inactiveTokenAddress;
//     let NATIVE;
//     let USDT;
//     let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
//     let uniswapRouter;
//     let totalsupply;
//     let ZERO_ADDRESS;

//     before(async function(){
//         ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
//         NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
//         accounts = await ethers.getSigners();
//         owner = await accounts[0].getAddress();
//         notOwner = await accounts[1].getAddress();
//         inactiveTokenAddress = await accounts[3].getAddress();
        
//         uniswapRouter = await ethers.getContractAt("IUniswapV2Router02","0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");

//         let ExecutorManager = await ethers.getContractFactory("ExecutorManager");
//         executorManager = await ExecutorManager.deploy(owner);
//         await executorManager.deployed();

//         let LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
//         liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorManager.address, owner, executorManager.address, 300);
//         await liquidityPoolMngr.deployed();

//         USDT = await ethers.getContractAt("contracts/5/token/erc20/IERC20.sol:IERC20","0xdac17f958d2ee523a2206206994597c13d831ec7");
//         totalsupply = await USDT.totalSupply();
        
//         await uniswapRouter.swapExactETHForTokens(0, [WETHAddress, USDT.address], await accounts[0].getAddress(), "1000000000000000000000000",{value:ethers.utils.parseEther("1000").toString()});
//         tokenAddress = USDT.address;
//     });

//     describe("Test Liqidity Pool manager methods", function(){

//         it("Should changeAdminFee array successfully", async()=>{
//             await liquidityPoolMngr.changeAdminFee(100, {from: owner});
//             let adminFee = await liquidityPoolMngr.getAdminFee();
//             expect(adminFee).to.equal(100);
//         });

//         it("Should fail to changeAdminFee: only owner can change the Admin Fee", async()=>{
//             await expect(liquidityPoolMngr.changeAdminFee(100, {from: notOwner})).to.be.reverted;
//         });

//         it("Should get ExecutorManager Address successfully", async()=>{
//             let executorManagerAddr = await liquidityPoolMngr.getExecutorManager();
//             expect(executorManagerAddr).to.equal(executorManager.address);
//         });

//         it("Should addSupportedToken successfully", async()=>{
//             let tokenCap = "1000000000";
//             await liquidityPoolMngr.addSupportedToken(tokenAddress, tokenCap, {from: owner});
//             let checkTokenStatus = await liquidityPoolMngr.supportedToken(tokenAddress);
//             let checkTokenCap = await liquidityPoolMngr.tokenCap(tokenAddress);

//             expect(checkTokenStatus).to.equal(true);
//             expect(checkTokenCap).to.equal(tokenCap);
//         });

//         it("Should fail to addSupportedToken: only owner can add", async()=>{
//             let tokenCap = "1000000000";
//             await expect(liquidityPoolMngr.addSupportedToken(tokenAddress, tokenCap, {from: notOwner})).to.be.reverted;            
//         });

//         it("Should removeSupportedToken successfully", async()=>{
//             await liquidityPoolMngr.removeSupportedToken(tokenAddress, {from: owner});
//             let checkTokenStatus = await liquidityPoolMngr.supportedToken(tokenAddress);
//             expect(checkTokenStatus).to.equal(false);
//         });

//         it("Should fail to addSupportedToken: only owner can add", async()=>{
//             await expect(liquidityPoolMngr.removeSupportedToken(tokenAddress, {from: notOwner})).to.be.reverted;            
//         });

//         it("Should updateTokenCap successfully", async()=>{
//             let tokenCap = "1000000000";
//             await liquidityPoolMngr.addSupportedToken(tokenAddress, tokenCap, {from: owner});

//             let newTokenCap = "2000000000";
//             await liquidityPoolMngr.updateTokenCap(tokenAddress, newTokenCap, {from: owner});
//             let checkTokenCap = await liquidityPoolMngr.tokenCap(tokenAddress);

//             expect(checkTokenCap).to.equal(newTokenCap);
//         });

//         it("Should fail to updateTokenCap: TokenAddress not supported", async()=>{
//             let newTokenCap = "2000000000";
//             await expect(liquidityPoolMngr.updateTokenCap(inactiveTokenAddress, newTokenCap, {from: owner})).to.be.revertedWith("Token not supported");
//         });

//         it("Should fail to updateTokenCap: only owner can update", async()=>{
//             let newTokenCap = "2000000000";
//             await expect(liquidityPoolMngr.updateTokenCap(tokenAddress, newTokenCap, {from: notOwner})).to.be.reverted;
//         });

//         it("Should addEthLiquidity successfully", async()=>{
//             let valueEth = ethers.utils.parseEther("20000");
//             await liquidityPoolMngr.addEthLiquidity({from: owner, value: valueEth});
//             let ethLiquidity = await liquidityPoolMngr.tokenLiquidity(NATIVE);
//             expect(valueEth).to.equal(ethLiquidity);
//         });

//         it("Should fail to addEthLiquidity: amount should be greater then 0", async()=>{
//             let valueEth = ethers.utils.parseEther("0");
//             await expect(liquidityPoolMngr.addEthLiquidity({from: owner, value: valueEth})).to.be.revertedWith("amount should be greater then 0");
//         });

//         it("Should removeEthLiquidity successfully", async()=>{
//             let ethLiquidityBefore = await liquidityPoolMngr.tokenLiquidity(NATIVE);
//             await liquidityPoolMngr.removeEthLiquidity(ethLiquidityBefore, {from: owner});
//             let ethLiquidityAfter = await liquidityPoolMngr.tokenLiquidity(NATIVE);
//             expect(ethLiquidityAfter).to.equal(0);
//         });

//         it("Should fail to removeEthLiquidity: amount should be greater then 0", async()=>{
//             let valueEth = ethers.utils.parseEther("50000");
//             await expect(liquidityPoolMngr.removeEthLiquidity(valueEth, {from: owner})).to.be.revertedWith("Not enough balance");
//         });

//         it("Should addTokenLiquidity successfully", async()=>{
//             let tokenValue = "400000000";
            
//             let tx = await USDT.approve(liquidityPoolMngr.address, totalsupply, {from: owner});
//             await tx.wait();
//             await USDT.allowance(owner, liquidityPoolMngr.address);
//             await liquidityPoolMngr.addTokenLiquidity(tokenAddress, tokenValue, {from: owner});
//             let tokenLiquidity = await liquidityPoolMngr.tokenLiquidity(tokenAddress);
//             expect(tokenLiquidity.toString()).to.equal(tokenValue);
//         });

//         it("Should fail to addTokenLiquidity: Token address cannot be 0", async()=>{
//             await expect(liquidityPoolMngr.addTokenLiquidity(ZERO_ADDRESS, "100000000", {from: owner})).to.be.revertedWith("Token address cannot be 0");
//         });

//         it("Should fail to addTokenLiquidity: Token not supported", async()=>{
//             await expect(liquidityPoolMngr.addTokenLiquidity(inactiveTokenAddress, "100000000", {from: owner})).to.be.revertedWith("Token not supported");
//         });

//         it("Should fail to addTokenLiquidity: amount should be greater then 0", async()=>{
//             await expect(liquidityPoolMngr.addTokenLiquidity(tokenAddress, "0", {from: owner})).to.be.revertedWith("amount should be greater then 0");
//         });

//         it("Should removeTokenLiquidity successfully", async()=>{
//             let tokenValue = "100000000";
            
//             let tokenLiquidityBefore = await liquidityPoolMngr.tokenLiquidity(tokenAddress);

//             await liquidityPoolMngr.removeTokenLiquidity(tokenAddress, tokenValue, {from: owner});
//             let tokenLiquidityAfter = await liquidityPoolMngr.tokenLiquidity(tokenAddress);

//             expect(tokenLiquidityAfter).to.equal(parseInt(tokenLiquidityBefore)-parseInt(tokenValue));
//         });
        
//         it("Should fail to removeTokenLiquidity: Token address cannot be 0", async()=>{
//             await expect(liquidityPoolMngr.removeTokenLiquidity(ZERO_ADDRESS, "100000000", {from: owner})).to.be.revertedWith("Token address cannot be 0");
//         });

//         it("Should fail to removeTokenLiquidity: Token not supported", async()=>{
//             await expect(liquidityPoolMngr.removeTokenLiquidity(inactiveTokenAddress, "100000000", {from: owner})).to.be.revertedWith("Token not supported");
//         });

//         it("Should fail to removeTokenLiquidity: amount should be greater then 0", async()=>{
//             await expect(liquidityPoolMngr.removeTokenLiquidity(tokenAddress, "0", {from: owner})).to.be.revertedWith("amount should be greater then 0");
//         });

//         it("Should fail to removeTokenLiquidity: Not enough balance", async()=>{
//             await expect(liquidityPoolMngr.removeTokenLiquidity(tokenAddress, "100000000000", {from: owner})).to.be.revertedWith("Not enough balance");
//         });

//         it("Should deposit successfully", async()=>{
//             let tokenValue = "100000000";
//             await USDT.allowance(owner, liquidityPoolMngr.address);
//             let tokenLiquidityBefore = (await USDT.balanceOf(liquidityPoolMngr.address)).toString();
//             await liquidityPoolMngr.deposit(tokenAddress, notOwner, tokenValue, {from: owner});
//             let tokenLiquidityAfter = (await USDT.balanceOf(liquidityPoolMngr.address)).toString();
//             expect(parseInt(tokenLiquidityAfter)).to.equal(parseInt(tokenLiquidityBefore)+parseInt(tokenValue));
//         });

//         it("Should fail to deposit: Token address cannot be 0", async()=>{
//             await expect(liquidityPoolMngr.deposit(ZERO_ADDRESS, notOwner, "100000000", {from: owner})).to.be.revertedWith("Token address cannot be 0");
//         });

//         it("Should fail to deposit: Token not supported", async()=>{
//             await expect(liquidityPoolMngr.deposit(inactiveTokenAddress, notOwner, "100000000", {from: owner})).to.be.revertedWith("Token not supported");
//         });

//         it("Should fail to deposit: Deposit amount exceeds allowed Cap limit", async()=>{
//             await expect(liquidityPoolMngr.deposit(tokenAddress, notOwner, "200000000000", {from: owner})).to.be.revertedWith("Deposit amount exceeds allowed Cap limit");
//         });

//         it("Should fail to deposit: Receiver address cannot be 0", async()=>{
//             await expect(liquidityPoolMngr.deposit(tokenAddress, ZERO_ADDRESS, "1000000", {from: owner})).to.be.revertedWith("Receiver address cannot be 0");
//         });

//         it("Should fail to deposit: amount should be greater then 0", async()=>{
//             await expect(liquidityPoolMngr.deposit(tokenAddress, notOwner, "0", {from: owner})).to.be.revertedWith("amount should be greater then 0");
//         });

//         it("Should setTokenTransferOverhead successfully", async()=>{
//             let gasOverhead = "21110";
//             await liquidityPoolMngr.setTokenTransferOverhead(tokenAddress, 21110, {from: owner});
//             let checkTokenGasOverhead = await liquidityPoolMngr.tokenTransferOverhead(tokenAddress);
//             expect(checkTokenGasOverhead).to.equal(gasOverhead);
//         });

//         it("Should fail to setTokenTransferOverhead: TokenAddress not supported", async()=>{
//             await expect(liquidityPoolMngr.setTokenTransferOverhead(inactiveTokenAddress, 21110, {from: owner})).to.be.revertedWith("Token not supported");
//         });

//         it("Should fail to setTokenTransferOverhead: only owner can update", async()=>{
//             await expect(liquidityPoolMngr.setTokenTransferOverhead(tokenAddress, 21110, {from: notOwner})).to.be.reverted;
//         });

//     });
// });
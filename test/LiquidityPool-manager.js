const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Liquidity Pool Manager", function(){
    let executorManager;
    let accounts;
    let owner;
    let notOwner;
    let liquidityPoolMngr, tokenAddress;

    before(async function(){
        accounts = await ethers.getSigners();
        owner = await accounts[0].getAddress();
        notOwner = await accounts[1].getAddress();
        tokenAddress = await accounts[2].getAddress();

        let ExecutorManager = await ethers.getContractFactory("ExecutorManager");
        executorManager = await ExecutorManager.deploy(owner);
        await executorManager.deployed();

        let LiquidityPoolMngr = await ethers.getContractFactory("LiquidityPoolManager");
        liquidityPoolMngr = await LiquidityPoolMngr.deploy(executorManager.address, owner, executorManager.address, 300);
        await liquidityPoolMngr.deployed();

    });

    describe("Test Liqidity Pool manager methods", function(){

        it("Should changeAdminFee array successfully", async()=>{
            await liquidityPoolMngr.changeAdminFee(100, {from: owner});
            let adminFee = await liquidityPoolMngr.getAdminFee();
            expect(adminFee).to.equal(100);
        });

        it("Should fail to changeAdminFee: only owner can change the Admin Fee", async()=>{
            await expect(liquidityPoolMngr.changeAdminFee(100, {from: notOwner})).to.be.reverted;
        });

        it("Should get ExecutorManager Address successfully", async()=>{
            let executorManagerAddr = await liquidityPoolMngr.getExecutorManager();
            expect(executorManagerAddr).to.equal(executorManager.address);
        });

        it("Should addSupportedToken successfully", async()=>{
            let tokenCap = ethers.BigNumber.from("100000000000000000000");
            await liquidityPoolMngr.addSupportedToken(tokenAddress, tokenCap, {from: owner});
            let checkTokenStatus = await liquidityPoolMngr.supportedToken(tokenAddress);
            let checkTokenCap = await liquidityPoolMngr.tokenCap(tokenAddress);

            console.log(checkTokenCap.toString(), checkTokenCap)
            expect(checkTokenStatus).to.equal(true);
        });

    });
});
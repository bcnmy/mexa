// const { expect } = require("chai");
// const { ethers } = require("hardhat");

// describe("Executor Manager", function(){
//     let executorManager;
//     let accounts;
//     let owner;
//     let executor1;
//     let notOwner;

//     before(async function(){
//         accounts = await ethers.getSigners();
//         owner = await accounts[0].getAddress();
//         executor1 = await accounts[1].getAddress();
//         notOwner = await accounts[2].getAddress();

//         let ExecutorManager = await ethers.getContractFactory("ExecutorManager");
//         executorManager = await ExecutorManager.deploy(owner);
//         await executorManager.deployed();

//     });

//     describe("Test Executor manager methods", function(){

//         it("Should addExecutors array successfully", async()=>{
//             await executorManager.addExecutors([ executor1 ], {from: owner});
//             let executors = await executorManager.getAllExecutors();
//             expect(executors[0]).to.equal(executor1);
//         });

//         it("Should fail to addExecutors - only owner can perform ", async()=>{
//             await expect(executorManager.addExecutors([ executor1 ],{from: notOwner})).to.be.reverted;
//         });

//         it("Should removeExecutors array successfully", async()=>{
//             await executorManager.removeExecutors([ executor1 ], {from: owner});
//             let executorStatus = await executorManager.getExecutorStatus(executor1);
//             expect(executorStatus).to.equal(false);
//         });

//         it("Should fail to removeExecutors - only owner can perform ", async()=>{
//             await expect(executorManager.removeExecutors([ executor1 ],{from: notOwner})).to.be.reverted;
//         });
        
//         it("Should addExecutor successfully", async()=>{
//             await executorManager.addExecutor( executor1 , {from: owner});
//             let executorStatus = await executorManager.getExecutorStatus(executor1);
//             expect(executorStatus).to.equal(true);
//         });
        
//         it("Should fail to addExecutor - only owner can perform ", async()=>{
//             await expect(executorManager.addExecutor( executor1 ,{from: notOwner})).to.be.reverted;
//         });

//         it("Should removeExecutor successfully", async()=>{
//             await executorManager.removeExecutor( executor1 , {from: owner});
//             let executorStatus = await executorManager.getExecutorStatus(executor1);
//             expect(executorStatus).to.equal(false);
//         });
        
//         it("Should fail to removeExecutor - only owner can perform ", async()=>{
//             await expect(executorManager.removeExecutor( executor1 ,{from: notOwner})).to.be.reverted;
//         });
//     });
// });
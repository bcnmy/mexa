const {
    expect
} = require("chai");
const {
    ethers
} = require("hardhat");

describe("Liquidity Pool Manager", function () {
    let executorManager;
    let accounts;
    let owner, receiver;
    let notOwner;
    let newExecutorManager, newTrustedForwarder;
    let liquidityPoolMngr, tokenAddress;
    let inactiveTokenAddress;
    let NATIVE;
    let USDT;
    let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    let uniswapRouter;
    let totalsupply;
    let ZERO_ADDRESS;

    before(async function () {
        ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
        NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        accounts = await ethers.getSigners();
        owner = await accounts[0].getAddress();
        notOwner = await accounts[1].getAddress();
        inactiveTokenAddress = await accounts[2].getAddress();
        newExecutorManager = await accounts[3].getAddress();
        newTrustedForwarder = await accounts[4].getAddress();
        receiver = await accounts[5].getAddress();
        executor = await accounts[6].getAddress();

        uniswapRouter = await ethers.getContractAt(
            "IUniswapV2Router02",
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
        );


        let ExecutorManager = await ethers.getContractFactory("ExecutorManager");
        executorManager = await ExecutorManager.deploy(owner);
        await executorManager.deployed();

        let LiquidityPoolMngr = await ethers.getContractFactory(
            "LiquidityPoolManager"
        );
        liquidityPoolMngr = await LiquidityPoolMngr.deploy(
            executorManager.address,
            owner,
            executorManager.address,
            300
        );
        await liquidityPoolMngr.deployed();

        USDT = await ethers.getContractAt(
            "contracts/5/token/erc20/IERC20.sol:IERC20",
            "0xdac17f958d2ee523a2206206994597c13d831ec7"
        );
        totalsupply = await USDT.totalSupply();

        await uniswapRouter.swapExactETHForTokens(
            0,
            [WETHAddress, USDT.address],
            await accounts[0].getAddress(),
            "1000000000000000000000000", {
                value: ethers.utils.parseEther("1000").toString()
            }
        );
        tokenAddress = USDT.address;
    });

    describe("Test Liqidity Pool manager methods", function () {

        it("Should changeAdminFee array successfully", async () => {
            await liquidityPoolMngr.changeAdminFee(100, {
                from: owner
            });
            let adminFee = await liquidityPoolMngr.getAdminFee();
            expect(adminFee).to.equal(100);
        });
        it("Should get ExecutorManager Address successfully", async () => {
            let executorManagerAddr = await liquidityPoolMngr.getExecutorManager();
            expect(executorManagerAddr).to.equal(executorManager.address);
        });

        it("Should add new trustedForwarder Address successfully", async () => {
            await liquidityPoolMngr.setTrustedForwarder(newTrustedForwarder, {from: owner});
            let trustedForwarderAddr = await liquidityPoolMngr.trustedForwarder();
            expect(trustedForwarderAddr).to.equal(newTrustedForwarder);
        });

        it("Should addSupportedToken successfully", async () => {
            let minTokenCap = "100000000";
            let maxTokenCap = "10000000000";
            await liquidityPoolMngr.addSupportedToken(
                tokenAddress,
                minTokenCap,
                maxTokenCap, {
                    from: owner,
                }
            );
            let checkTokenStatus = await liquidityPoolMngr.tokensInfo(
                tokenAddress
            );
            expect(checkTokenStatus.supportedToken).to.equal(true);
            expect(checkTokenStatus.minCap).to.equal(minTokenCap);
            expect(checkTokenStatus.maxCap).to.equal(maxTokenCap);
        });

        it("Should updateTokenCap successfully", async () => {
            let minTokenCap = "100000000";
            let maxTokenCap = "10000000000";
            await liquidityPoolMngr.addSupportedToken(
                tokenAddress,
                minTokenCap,
                maxTokenCap, {
                    from: owner,
                }
            );

            let newMinTokenCap = "100000";
            let newMaxTokenCap = "100000000";
            await liquidityPoolMngr.updateTokenCap(
                tokenAddress,
                newMinTokenCap,
                newMaxTokenCap, {
                    from: owner,
                }
            );

            let checkTokenStatus = await liquidityPoolMngr.tokensInfo(
                tokenAddress
            );

            expect(checkTokenStatus.supportedToken).to.equal(true);
            expect(checkTokenStatus.minCap).to.equal(newMinTokenCap);
            expect(checkTokenStatus.maxCap).to.equal(newMaxTokenCap);
        });

        it("Should addNativeLiquidity successfully", async () => {
            let valueEth = ethers.utils.parseEther("20");
            await liquidityPoolMngr.addNativeLiquidity({
                from: owner,
                value: valueEth,
            });

            let tokensInfo = await liquidityPoolMngr.tokensInfo(NATIVE);
            expect(valueEth).to.equal(tokensInfo.liquidity);
        });

        it("Should addTokenLiquidity successfully", async () => {
            let tokenValue = "1000000";

            let tx = await USDT.approve(liquidityPoolMngr.address, totalsupply, {
                from: owner,
            });
            await tx.wait();
            await USDT.allowance(owner, liquidityPoolMngr.address);
            await liquidityPoolMngr.addTokenLiquidity(tokenAddress, tokenValue, {
                from: owner,
            });
            let tokensInfo = await liquidityPoolMngr.tokensInfo(tokenAddress);
            expect(tokensInfo.liquidity.toString()).to.equal(tokenValue);
        });
        
        it("Should deposit ERC20 successfully", async () => {
            //Add Supported Token
            let minTokenCap = "1000000";
            let maxTokenCap = "10000000000";
            await liquidityPoolMngr.addSupportedToken(
                tokenAddress,
                minTokenCap,
                maxTokenCap, {
                    from: owner,
                }
            );

            //Deposit Token
            const tokenValue = "1000000";
            await USDT.allowance(owner, liquidityPoolMngr.address);
            let tokenLiquidityBefore = (
                await USDT.balanceOf(liquidityPoolMngr.address)
            ).toString();
            await liquidityPoolMngr.depositErc20(
                tokenAddress,
                notOwner,
                tokenValue,
                1, {
                    from: owner,
                }
            );
            let tokenLiquidityAfter = (
                await USDT.balanceOf(liquidityPoolMngr.address)
            ).toString();
            expect(parseInt(tokenLiquidityAfter)).to.equal(
                parseInt(tokenLiquidityBefore) + parseInt(tokenValue)
            );
        });
        
        it("Should depositNative successfully", async () => {
            //Add Support for Native
            let minTokenCap = "1000000";
            let maxTokenCap = "10000000000";

            await liquidityPoolMngr.addSupportedToken(
                NATIVE,
                minTokenCap,
                maxTokenCap, {
                    from: owner,
                }
            );
            const tokenValue = "2000000";
            const tokenLiquidityBefore = await ethers.provider.getBalance(
                liquidityPoolMngr.address
            );

            //Deposit Native
            await liquidityPoolMngr.depositNative(notOwner, 1, {
                from: owner,
                value: tokenValue,
            });
            const tokenLiquidityAfter = await ethers.provider.getBalance(
                liquidityPoolMngr.address
            );

            expect(parseInt(tokenLiquidityAfter)).to.equal(
                parseInt(tokenLiquidityBefore) + parseInt(tokenValue)
            );
        });

        it("Should setTokenTransferOverhead successfully", async () => {
            let gasOverhead = "21110";
            await liquidityPoolMngr.setTokenTransferOverhead(tokenAddress, 21110, {
                from: owner,
            });
            let checkTokenGasOverhead = await liquidityPoolMngr.tokensInfo(
                tokenAddress
            );
            expect(checkTokenGasOverhead.transferOverhead).to.equal(gasOverhead);
        });

         // (node:219241) UnhandledPromiseRejectionWarning: Error: VM Exception while processing transaction: revert SafeMath: subtraction overflow
        it("Should send ERC20 funds to user successfully", async () => {
            const amount = 1000000;
            const dummyDepositHash = "0xf408509b00caba5d37325ab33a92f6185c9b5f007a965dfbeff7b81ab1ec871a";
            const usdtBalanceBefore = await USDT.balanceOf(liquidityPoolMngr.address);
            await executorManager.addExecutor(owner , {from: owner});

            await liquidityPoolMngr.sendFundsToUser(
                USDT.address,
                amount.toString(),
                receiver,
                dummyDepositHash,
                0,
                { from: owner }
            );

            let estimatedValueTransferred = amount - (amount * (100/10000));
            const usdtBalanceAfter = await USDT.balanceOf(liquidityPoolMngr.address);
            expect(usdtBalanceBefore - estimatedValueTransferred).to.equal(usdtBalanceAfter);
        });

        it("Should fail to send ERC20 funds to user: Already Processed", async () => {
            const amount = 1000000;
            const dummyDepositHash = "0xf408509b00caba5d37325ab33a92f6185c9b5f007a965dfbeff7b81ab1ec871a";
            await executorManager.addExecutor(owner , {from: owner});

            await expect( liquidityPoolMngr.sendFundsToUser(
                USDT.address,
                amount.toString(),
                receiver,
                dummyDepositHash,
                0,
                { from: owner }
            )).to.be.reverted;
        });

        it("Should fail to send ERC20 funds to user: not Authorised", async () => {
            const dummyDepositHash = "0xf408509b00caba5d37325ab33a92f6185c9b5f007a965dfbeff7b81ab1ec871a";
            await executorManager.addExecutors([ owner ], {from: owner});
            await expect(liquidityPoolMngr.sendFundsToUser(
                USDT.address,
                "1000000",
                receiver,
                dummyDepositHash,
                0,
                { from: notOwner }
            )).to.be.reverted;
        });

        it("Should fail to send ERC20 funds to user: receiver cannot be Zero", async () => {
            const dummyDepositHash = "0xf408509b00caba5d37325ab33a92f6185c9b5f007a965dfbeff7b81ab1ec871a";
            await executorManager.addExecutors([ owner ], {from: owner});
            await expect(liquidityPoolMngr.sendFundsToUser(
                USDT.address,
                "1000000",
                ZERO_ADDRESS,
                dummyDepositHash,
                0,
                { from: owner }
            )).to.be.reverted;
        });

        it("Should withdrawErc20 successfully", async () => {
            await liquidityPoolMngr.depositErc20(
                USDT.address,
                notOwner,
                "10000000",
                1, 
                { from: owner }
            );
            const getTokenInfo = await liquidityPoolMngr.tokensInfo(USDT.address);

            await liquidityPoolMngr.withdrawErc20(
                USDT.address,
                { from: owner }
            );

            const usdtBalanceAfter = await USDT.balanceOf(liquidityPoolMngr.address);
            expect(getTokenInfo.liquidity).to.equal(usdtBalanceAfter);
        });

        it("Should fail to withdrawErc20 : not Authorized", async () => {  
            await expect( liquidityPoolMngr.withdrawErc20(
                USDT.address,
                { from: notOwner }
            )).to.be.reverted;
        });


        it("Should withdrawNative successfully", async () => {
            await liquidityPoolMngr.depositNative(
                notOwner,
                1, 
                { from: owner, value: "10000000" }
            );
            const getTokenInfo = await liquidityPoolMngr.tokensInfo(NATIVE);

            await liquidityPoolMngr.withdrawNative(
                { from: owner }
            );

            const nativeBalanceAfter = await ethers.provider.getBalance(liquidityPoolMngr.address);
            expect(getTokenInfo.liquidity).to.equal(nativeBalanceAfter);
        });

        it("Should fail to withdrawErc20 : not Authorized", async () => {  
            await expect( liquidityPoolMngr.withdrawNative(
                USDT.address,
                { from: notOwner }
            )).to.be.reverted;
        });


        it("Should add new ExecutorManager Address successfully", async () => {
            await liquidityPoolMngr.setExecutorManager(newExecutorManager, {from: owner});
            let newExecutorManagerAddr = await liquidityPoolMngr.getExecutorManager();
            expect(newExecutorManager).to.equal(newExecutorManagerAddr);
        });
        it("Should fail to changeAdminFee: only owner can change the Admin Fee", async () => {
            await expect(liquidityPoolMngr.changeAdminFee(100, {
                    from: notOwner
                })).to
                .be.reverted;
        });

        it("Should fail to set new ExecutorManager : only owner can set", async () => {
            await expect(liquidityPoolMngr.setExecutorManager(newExecutorManager, {from: notOwner})).be.reverted;
        });

        it("Should fail to add new trustedForwarder: not Owner", async () => {
            await expect(liquidityPoolMngr.setTrustedForwarder(newTrustedForwarder, {from: notOwner})).be.reverted;
        });

        it("Should fail to addSupportedToken: only owner can add", async () => {
            let minTokenCap = "100000000";
            let maxTokenCap = "10000000000";
            await expect(
                liquidityPoolMngr.addSupportedToken(
                    tokenAddress,
                    minTokenCap,
                    maxTokenCap, {
                        from: notOwner,
                    }
                )
            ).to.be.reverted;
        });

        it("Should fail to addSupportedToken: min cap should be less than max cap", async () => {
            let minTokenCap = "10000000000";
            let maxTokenCap = "100000000";
            await expect(
                liquidityPoolMngr.addSupportedToken(
                    tokenAddress,
                    minTokenCap,
                    maxTokenCap, {
                        from: notOwner,
                    }
                )
            ).to.be.reverted;
        });

        it("Should fail to addSupportedToken: token address can't be 0'", async () => {
            let minTokenCap = "10000000000";
            let maxTokenCap = "100000000";
            await expect(
                liquidityPoolMngr.addSupportedToken(
                    ZERO_ADDRESS,
                    minTokenCap,
                    maxTokenCap, {
                        from: notOwner,
                    }
                )
            ).to.be.reverted;
        });

        it("Should fail to removeSupportedToken: Only owner can remove supported tokens", async () => {
            await expect(
                liquidityPoolMngr.removeSupportedToken(tokenAddress, {
                    from: notOwner,
                })
            ).to.be.reverted;
        });

        it("Should fail to updateTokenCap: TokenAddress not supported", async () => {
            let minTokenCap = "100000000";
            let maxTokenCap = "10000000000";
            await expect(
                liquidityPoolMngr.updateTokenCap(
                    inactiveTokenAddress,
                    minTokenCap,
                    maxTokenCap, {
                        from: owner,
                    }
                )
            ).to.be.reverted;
        });
        
        it("Should fail to updateTokenCap: TokenAddress can't be 0", async () => {
            let minTokenCap = "100000000";
            let maxTokenCap = "10000000000";
            await expect(
                liquidityPoolMngr.updateTokenCap(
                    ZERO_ADDRESS,
                    minTokenCap,
                    maxTokenCap, {
                        from: owner,
                    }
                )
            ).to.be.reverted;
        });
        
        it("Should fail to updateTokenCap: only owner can update", async () => {
            let minTokenCap = "100000000";
            let maxTokenCap = "10000000000";
            await expect(
                liquidityPoolMngr.updateTokenCap(
                    tokenAddress,
                    minTokenCap,
                    maxTokenCap, {
                        from: notOwner,
                    }
                )
            ).to.be.reverted;
        });

        it("Should fail to addNativeLiquidity: amount should be greater then 0", async () => {
            let valueEth = ethers.utils.parseEther("0");
            await expect(
                liquidityPoolMngr.addNativeLiquidity({
                    from: owner,
                    value: valueEth
                })
            ).to.be.reverted;
        });
        
        it("Should fail to removeNativeLiquidity: Not enough balance", async () => {
            let valueEth = ethers.utils.parseEther("50000");
            await expect(
                liquidityPoolMngr.removeNativeLiquidity(valueEth, {
                    from: owner
                })
            ).to.be.reverted;
        });
        
        it("Should fail to removeEthLiquidity: Amount cannot be 0", async () => {
          await expect(
            liquidityPoolMngr.removeNativeLiquidity(0, { from: owner })
          ).to.be.reverted;
        });
        
        it("Should fail to addTokenLiquidity: Token address cannot be 0", async () => {
            await expect(
                liquidityPoolMngr.addTokenLiquidity(ZERO_ADDRESS, "10000", {
                    from: owner,
                })
            ).to.be.revertedWith("Token address cannot be 0");
        });
        
        it("Should fail to addTokenLiquidity: Token not supported", async () => {
            await expect(
                liquidityPoolMngr.addTokenLiquidity(inactiveTokenAddress, "10000", {
                    from: owner,
                })
            ).to.be.revertedWith("Token not supported");
        });
        
        it("Should fail to addTokenLiquidity: amount should be greater then 0", async () => {
            await expect(
                liquidityPoolMngr.addTokenLiquidity(tokenAddress, "0", {
                    from: owner
                })
            ).to.be.revertedWith("amount should be greater then 0");
        });

        

        it("Should fail to removeTokenLiquidity: Token address cannot be 0", async () => {
            await expect(
                liquidityPoolMngr.removeTokenLiquidity(ZERO_ADDRESS, "100000000", {
                    from: owner,
                })
            ).to.be.revertedWith("Token address cannot be 0");
        });

        it("Should fail to removeTokenLiquidity: Token not supported", async () => {
            await expect(
                liquidityPoolMngr.removeTokenLiquidity(
                    inactiveTokenAddress,
                    "1000000", {
                        from: owner
                    }
                )
            ).to.be.revertedWith("Token not supported");
        });
        
        it("Should fail to removeTokenLiquidity: amount should be greater then 0", async () => {
            await expect(
                liquidityPoolMngr.removeTokenLiquidity(tokenAddress, "0", {
                    from: owner,
                })
            ).to.be.revertedWith("amount should be greater then 0");
        });

        it("Should fail to removeTokenLiquidity: Not enough balance", async () => {
            await expect(
                liquidityPoolMngr.removeTokenLiquidity(tokenAddress, "100000000000", {
                    from: owner,
                })
            ).to.be.revertedWith("Not enough balance");
        });
        
        
        it("Should fail to depositErc20: Token address cannot be 0", async () => {
            await expect(
                liquidityPoolMngr.depositErc20(ZERO_ADDRESS, notOwner, "100000000", 1, {
                    from: owner,
                })
            ).to.be.reverted;
        });
        
        it("Should fail to depositErc20: Token not supported", async () => {
            await expect(
                liquidityPoolMngr.depositErc20(
                    inactiveTokenAddress,
                    notOwner,
                    "100000000", {
                        from: owner,
                    }
                )
            ).to.be.reverted;
        });
        

        it("Should fail to depositErc20: Deposit amount below allowed min Cap limit", async () => {
            await expect(
                liquidityPoolMngr.depositErc20(
                    tokenAddress,
                    notOwner,
                    "200000000000",
                    1, {
                        from: owner,
                    }
                )
            ).to.be.reverted;
        });
        
        it("Should fail to depositErc20: Deposit amount exceeds allowed max Cap limit", async () => {
            await expect(
                liquidityPoolMngr.depositErc20(tokenAddress, notOwner, "20", 1, {
                    from: owner,
                })
            ).to.be.reverted;
        });
        
        it("Should fail to depositErc20: Receiver address cannot be 0", async () => {
            await expect(
                liquidityPoolMngr.depositErc20(tokenAddress, ZERO_ADDRESS, "1000000", {
                    from: owner,
                })
            ).to.be.reverted;
        });
        
        it("Should fail to depositErc20: amount should be greater then 0", async () => {
            await expect(
                liquidityPoolMngr.depositErc20(tokenAddress, notOwner, "0", {
                    from: owner,
                })
            ).to.be.reverted;
        });
        
        it("Should fail to setTokenTransferOverhead: TokenAddress not supported", async () => {
          await expect(
            liquidityPoolMngr.setTokenTransferOverhead(
              inactiveTokenAddress,
              21110,
              { from: owner }
            )
          ).to.be.revertedWith("Token not supported");
        });

        it("Should fail to setTokenTransferOverhead: only owner can update", async () => {
            await expect(
                liquidityPoolMngr.setTokenTransferOverhead(tokenAddress, 21110, {
                    from: notOwner,
                })
            ).to.be.reverted;
        });

        it("Should removeNativeLiquidity successfully", async () => {
            let tokensInfoBefore = await liquidityPoolMngr.tokensInfo(NATIVE);
            await liquidityPoolMngr.removeNativeLiquidity(tokensInfoBefore.liquidity, {
                from: owner,
            });
            let tokensInfoAfter = await liquidityPoolMngr.tokensInfo(NATIVE);
            expect(tokensInfoAfter.liquidity).to.equal(0);
        });
        
        it("Should removeTokenLiquidity successfully", async () => {
            let tokenValue = "10000";

            let tokensInfoBefore = await liquidityPoolMngr.tokensInfo(tokenAddress);

            await liquidityPoolMngr.removeTokenLiquidity(tokenAddress, tokenValue, {
                from: owner,
            });
            let tokensInfoAfter = await liquidityPoolMngr.tokensInfo(
                tokenAddress
            );

            expect(tokensInfoAfter.liquidity).to.equal(
                parseInt(tokensInfoBefore.liquidity) - parseInt(tokenValue)
            );
        });

        it("Should removeSupportedToken successfully", async () => {
            await liquidityPoolMngr.removeSupportedToken(tokenAddress, {
                from: owner,
            });

            let checkTokenStatus = await liquidityPoolMngr.tokensInfo(
                tokenAddress
            );
            expect(checkTokenStatus.supportedToken).to.equal(false);
        });
    });
});
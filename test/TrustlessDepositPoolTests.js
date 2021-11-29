const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("TrustlessDepositPoolTests", function () {
  let alice, bob, charlie, dan;
  let USDT, bUSDT, depositPool;
  let WETHAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

  before(async function () {
    [alice, bob, charlie, dan, ...s] = await ethers.getSigners();

    USDT = await ethers.getContractAt(
      "contracts/5/token/erc20/IERC20.sol:IERC20",
      "0xdac17f958d2ee523a2206206994597c13d831ec7"
    );

    console.log("Deploying Deposit Pool...");
    const depositPoolFactory = await ethers.getContractFactory("DepositPool");
    depositPool = await upgrades.deployProxy(depositPoolFactory, [dan.address]);
    await depositPool.deployed();
    console.log(`DepositPool deployed at: ${depositPool.address}`);

    console.log("Deploying bUSDT...");
    const bUSDTFactory = await ethers.getContractFactory("bToken");
    bUSDT = await upgrades.deployProxy(bUSDTFactory, [
      "bUSDT",
      "bUSDT",
      18,
      USDT.address,
      dan.address,
      depositPool.address,
      depositPool.address,
    ]);
    await bUSDT.deployed();
    console.log(`bUSDT deployed at: ${bUSDT.address}`);

    console.log("Swapping ETH for USDT...");

    const uniswapRouter = await ethers.getContractAt(
      "IUniswapV2Router02",
      "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    );
    await uniswapRouter
      .connect(bob)
      .swapExactETHForTokens(
        0,
        [WETHAddress, USDT.address],
        await bob.getAddress(),
        "1000000000000000000000000",
        {
          value: ethers.utils.parseEther("1000").toString(),
        }
      );
  });

  it("Should Deploy Deposit Pool Correctly", async function () {
    expect(await depositPool.owner()).to.equal(alice.address);
  });

  it("Should register token correctly", async function () {
    await depositPool.connect(alice).updateBToken(USDT.address, bUSDT.address);
    expect(await depositPool.baseAddressToBTokenAddress(USDT.address)).to.equal(
      bUSDT.address
    );
  });

  it("Should update executor metadata correctly", async function () {
    await depositPool.connect(bob).updateExecutorBaseUrl("bob.eth.limo");
    expect(await depositPool.getExecutorBaseUrl(bob.address)).to.equal(
      "bob.eth.limo"
    );
  });

  it("Should add executor stake correctly", async function () {
    const balance = await USDT.balanceOf(bob.address);

    console.log("Procesing USDT Approval...");
    await USDT.connect(bob).approve(depositPool.address, 0);
    await USDT.connect(bob).approve(depositPool.address, balance);

    console.log("Staking USDT...");
    await expect(async () => {
      await depositPool.connect(bob).addStake(USDT.address, balance);
    }).changeTokenBalances(USDT, [bUSDT, bob], [balance, -balance]);

    expect(await bUSDT.balanceOf(bob.address)).to.equal(balance);
    expect(
      await depositPool.getExecutorStake(bob.address, USDT.address)
    ).to.equal(balance);
  });

  it("Should remove stake correctly", async function () {
    const balance = await bUSDT.balanceOf(bob.address);
    console.log("Procesing bUSDT Approval...");
    await bUSDT.connect(bob).approve(depositPool.address, 0);
    await bUSDT.connect(bob).approve(depositPool.address, balance);

    console.log("Unstaking USDT...");
    await expect(async () => {
      await depositPool.connect(bob).removeStake(USDT.address, balance);
    }).changeTokenBalances(USDT, [bUSDT, bob], [-balance, +balance]);

    expect(await bUSDT.balanceOf(bob.address)).to.equal(0);
    expect(
      await depositPool.getExecutorStake(bob.address, USDT.address)
    ).to.equal(0);
  });

  it("Should slash stake correctly", async function () {
    const balance = await USDT.balanceOf(bob.address);

    console.log("Procesing USDT Approval...");
    await USDT.connect(bob).approve(depositPool.address, 0);
    await USDT.connect(bob).approve(depositPool.address, balance);

    console.log("Staking USDT...");
    await depositPool.connect(bob).addStake(USDT.address, balance);

    console.log("Slashing stake...");
    await depositPool.connect(alice).slashStake(bob.address);
  });
});

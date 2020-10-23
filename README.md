# Mexa
Mexa is Biconomy's implementation of meta transactions.
This repository contains smart contracts related to Gas Token implementation that is used in meta transactions via Biconomy to save gas.

<a target="_blank" href="https://github.com/bcnmy/mexa/blob/master-gasToken/contracts/RelayerManager.sol"><code>RelayerManager.sol</code></a> is used to maintain the relayers addresses that are allowed to call the forward function in <a target="_blank" href="https://github.com/bcnmy/mexa/blob/master-gasToken/contracts/gasToken/GasTokenImplementation.sol"><code>GasTokenImplementation.sol</code></a> where gas tokens are burned and transaction if forwarded to its destination.

We have used the proxy aproach for making <a target="_blank" href="https://github.com/bcnmy/mexa/blob/master-gasToken/contracts/gasToken/GasTokenForwarder.sol"><code>GasTokenForwarder</code></a> contract upgradable.

Gas tokens are minted in GasTokenForwarder.sol and its implementation is in GasTokenImplementation.sol.

<h3>Pre-Requisite</h3>

In Order to deploy the contracts to networks other than local blockchain, you need to add file with name <code>.secret</code> to the root folder and add the 12 word mnemonic phrase corresponding to your account which will be used to deploy the contracts to selected network.

<h3>To compile contracts</h3>
  <code>truffle compile</code>

<h3>To deploy contracts to network</h3>
  <code>truffle migrate --network &lt;network-name&gt; </code>


<h3>Commands to run test cases</h3><br/>
  1.<code>npm install </code><br/>
  2. Run ganache-cli in another console <code> ganache-cli</code><br/>
  3.<code>npm run test </code>

<h3>Commands to run test cases</h3><br/>
1.<code>npm install </code><br/>
2. Run ganache-cli in another console <code> ganache-cli</code><br/>
3.<code>npm run coverage </code>

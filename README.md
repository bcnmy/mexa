# Mexa
Mexa is Biconomy's implementation of meta transactions.
This repository contains smart contracts for mexa and allow dapp users to perform blockchain operations without holding any ether or other crypto currency.

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

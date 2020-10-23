# Mexa
Mexa is Biconomy's implementation of meta transactions.
This repository contains smart contracts related to Gas Token implementation that is used in meta transactions via Biconomy to save gas.

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

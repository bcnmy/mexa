pragma solidity ^0.5.13;
import "./libs/Ownable.sol";
import "./libs/SafeMath.sol";
import "./token/erc20/IERC20.sol";
import "./token/erc721/IERC721.sol";

contract IdentityProxy is Ownable {
    using SafeMath for uint256;

    mapping(uint256 => uint256) public batchNonce;

    event Forwarded (address indexed destination, uint amount, bytes data);
    event Received (address indexed sender, uint amount);
    event Withdraw (address indexed receiver, uint amount);
    event TransferERC20(address indexed tokenAddress, address indexed receiver, uint256 amount);
    event TransferERC721(address indexed tokenAddress, address indexed receiver, uint256 tokenId);
    event ManagerChanged(address oldManager, address newManager);

    modifier onlyOwnerOrManager() {
        require(msg.sender == manager || msg.sender == owner(),"Not the Owner or Manager");
        _;
    }

    address private creator;
    address private manager;

    constructor(address owner) Ownable(owner) public {
        creator = msg.sender;
        manager = msg.sender;
    }

    function getCreator() public view returns(address) {
        return creator;
    }

    function getManager() public view returns(address) {
        return manager;
    }

    function changeManager(address newManager) public onlyOwner {
        require(newManager != address(0), "New Manager address can not be zero");
        address oldManager = manager;
        manager = newManager;
        emit ManagerChanged(oldManager, newManager);
    }

    function () external payable  { emit Received(msg.sender, msg.value); }

    function getNonce(uint256 batchId) public view returns(uint256){
        return batchNonce[batchId];
    }

    function forward(address payable destination, uint256 amount, bytes memory data,
        uint256 gasLimit, uint256 batchId) public payable onlyOwnerOrManager {
        require(executeCall(destination, amount, data, gasLimit), "ExecuteCall() failed");
        batchNonce[batchId] = batchNonce[batchId].add(1);
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(address to, uint256 amount, bytes memory data, uint256 gasLimit)
    internal returns (bool success) {
        assembly {
            let txGas := gas
            if not(eq(gasLimit, 0)) { txGas := gasLimit}
            success := call(txGas, to, amount, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function withdraw(address payable receiver, uint256 amount, uint256 batchId) public onlyOwnerOrManager {
        require(address(this).balance >= amount, "You dont have enough balance to withdraw");
        receiver.transfer(amount);
        batchNonce[batchId] = batchNonce[batchId].add(1);
        emit Withdraw(receiver, amount);
    }
}
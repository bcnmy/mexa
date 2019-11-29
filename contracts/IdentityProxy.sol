pragma solidity ^0.5.0;
import "./libs/Ownable.sol";
import "./libs/SafeMath.sol";
import "./token/erc20/IERC20.sol";
import "./token/erc721/IERC721.sol";

contract IdentityProxy is Ownable {
    using SafeMath for uint256;

    uint256 public nonce;
    event Forwarded (address indexed destination, uint amount, bytes data);
    event Received (address indexed sender, uint amount);
    event Withdraw (address indexed receiver, uint amount);
    event TransferERC20(address indexed tokenAddress, address indexed receiver, uint256 amount);
    event TransferERC721(address indexed tokenAddress, address indexed receiver, uint256 tokenId);

    address private creator;

    constructor(address owner) Ownable(owner) public {
        creator = msg.sender;
    }

    modifier onlyOwnerOrManager() {
        require(msg.sender == creator || msg.sender == owner(),"Not the Owner or Manager");
        _;
    }

    function () external payable  { emit Received(msg.sender, msg.value); }

    function getNonce() public view returns(uint256){
        return nonce;
    }

    function forward(address destination, uint amount, bytes memory data) public onlyOwnerOrManager {
        require(executeCall(destination,amount,data), "ExecuteCall() failed");
        nonce = nonce.add(1);
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(address to, uint256 value, bytes memory data) internal returns (bool success) {
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function withdraw(address payable receiver, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "You dont have enough balance to withdraw");
        receiver.transfer(amount);
        nonce = nonce.add(1);
        emit Withdraw(receiver, amount);
    }


    function transferERC20(address erc20ContractAddress, address destination, uint256 amount) public onlyOwner {
        require(amount > 0, "Please enter a valid value");
        IERC20 erc20Token = IERC20(erc20ContractAddress);
        erc20Token.transfer(destination,amount);
        nonce = nonce.add(1);
        emit TransferERC20(erc20ContractAddress, destination, amount);
    }

    function transferERC721(address erc721ContractAddress, address destination, uint256 tokenId) public onlyOwner {
        IERC721 erc721Token = IERC721(erc721ContractAddress);
        erc721Token.transferFrom(address(this), destination, tokenId);
        nonce = nonce.add(1);
        emit TransferERC721(erc721ContractAddress, destination, tokenId);
    }
}
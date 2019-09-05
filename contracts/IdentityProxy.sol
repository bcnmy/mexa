pragma solidity ^0.5.0;
import "./libs/Ownable.sol";
import "./token/erc20/IERC20.sol";
import "./token/erc721/IERC721.sol";

contract IdentityProxy is Ownable {
    event Forwarded (address indexed destination, uint amount, bytes data);
    event Received (address indexed sender, uint amount);
    event Withdraw (address indexed receiver, uint amount);

    function () payable external { emit Received(msg.sender, msg.value); }

    function forward(address destination, uint amount, bytes memory data) public onlyOwner {
        require(executeCall(destination, amount, data));
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(address to, uint256 value, bytes memory data) internal returns (bool success) {
        assembly {
            success := call(gas, to, value, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function withdraw(address payable receiver, uint256 amount) public onlyOwner returns(bool) {
        require(address(this).balance >= amount, "You dont have enough ether to withdraw");
        receiver.transfer(amount);
        emit Withdraw(receiver, amount);
        return true;
    }


    function transferERC20(address erc20ContractAddress,uint256 amount, address destination) public onlyOwner {
        require(amount >= 1, "Please enter a valid value");
        IERC20 erc20Token = IERC20(erc20ContractAddress);
        erc20Token.transfer(destination,amount);
    }

    function transferERC721(address erc721ContractAddress, address destination, uint256 tokenId) public onlyOwner {
        
        IERC721 erc721Token = IERC721(erc721ContractAddress);
        erc721Token.transferFrom(address(this), destination, tokenId);
    }
}
pragma solidity ^0.5.0;
import "./libs/SafeMath.sol";
import "./token/erc20/IERC20.sol";
import "./token/erc721/IERC721.sol";
import "./EternalStorage.sol";

contract ImplementationLogic is EternalStorage {
    using SafeMath for uint256;

    function forward(
        address payable destination,
        uint256 amount,
        bytes memory data
    ) public payable {
        require(executeCall(destination, amount, data), "ExecuteCall() failed");
        nonce = nonce.add(1);
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(address to, uint256 amount, bytes memory data)
        public
        returns (bool success)
    {
        assembly {
            success := call(gas, to, amount, add(data, 0x20), mload(data), 0, 0)
        }
    }

    function withdraw(address payable receiver, uint256 amount) public {
        require(
            address(this).balance >= amount,
            "You dont have enough balance to withdraw"
        );
        receiver.transfer(amount);
        nonce = nonce.add(1);
        emit Withdraw(receiver, amount);
    }

    function transferERC20(
        address erc20ContractAddress,
        address destination,
        uint256 amount
    ) public {
        require(amount > 0, "Please enter a valid value");
        IERC20 erc20Token = IERC20(erc20ContractAddress);
        erc20Token.transfer(destination, amount);
        nonce = nonce.add(1);
        emit TransferERC20(erc20ContractAddress, destination, amount);
    }

    function transferERC721(
        address erc721ContractAddress,
        address destination,
        uint256 tokenId
    ) public {
        IERC721 erc721Token = IERC721(erc721ContractAddress);
        erc721Token.transferFrom(address(this), destination, tokenId);
        nonce = nonce.add(1);
        emit TransferERC721(erc721ContractAddress, destination, tokenId);
    }
}

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
        addBalance(msg.sender, 916);
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

    // // *** Getter Methods ***
    // function getUint(bytes32 _key) internal view returns (uint256) {
    //     return uIntStorage[_key];
    // }
    // // *** Setter Methods ***
    // function setUint(bytes32 _key, uint256 _value) internal {
    //     uIntStorage[_key] = _value;
    // }
    // // *** Delete Methods ***
    // function deleteUint(bytes32 _key) internal {
    //     delete uIntStorage[_key];
    // }
    // function getBalance(address balanceHolder) public view returns (uint256) {
    //     return getUint(keccak256(abi.encodePacked("balances", balanceHolder)));
    // }

    // function setBalance(address balanceHolder, uint256 amount) internal {
    //     setUint(keccak256(abi.encodePacked("balances", balanceHolder)), amount);
    // }

    // function addBalance(address balanceHolder, uint256 amount) public {
    //     setBalance(balanceHolder, getBalance(balanceHolder) + amount);
    //     nonce = nonce.add(1);
    // }

}
pragma solidity ^0.5.13;
import "./libs/SafeMath.sol";
import "./token/erc20/IERC20.sol";
import "./token/erc721/IERC721.sol";
import "./EternalStorage.sol";
import "./libs/Ownable.sol";

contract ImplementationLogic is EternalStorage, Ownable {
    using SafeMath for uint256;

    modifier onlyOwnerOrManager() {
        require(
            msg.sender == manager || msg.sender == owner(),
            "Not the Owner or Manager"
        );
        _;
    }

    function forward(
        address payable destination,
        uint256 amount,
        bytes memory data,
        uint256 gasLimit,
        uint256 batchId
    ) public payable onlyOwnerOrManager {
        require(
            executeCall(destination, amount, data, gasLimit),
            "ExecuteCall() failed"
        );
        batchNonce[batchId] = batchNonce[batchId].add(1);
        emit Forwarded(destination, amount, data);
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    function executeCall(
        address to,
        uint256 amount,
        bytes memory data,
        uint256 gasLimit
    ) internal returns (bool success) {
        assembly {
            let txGas := gas
            if not(eq(gasLimit, 0)) {
                txGas := gasLimit
            }
            success := call(
                txGas,
                to,
                amount,
                add(data, 0x20),
                mload(data),
                0,
                0
            )
        }
    }
    function withdraw(address payable receiver, uint256 amount, uint256 batchId)
        public
        onlyOwnerOrManager
    {
        require(
            address(this).balance >= amount,
            "You dont have enough balance to withdraw"
        );
        receiver.transfer(amount);
        batchNonce[batchId] = batchNonce[batchId].add(1);
        emit Withdraw(receiver, amount);
    }
}

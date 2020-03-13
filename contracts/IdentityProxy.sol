pragma solidity ^0.5.0;
import "./libs/Ownable.sol";
import "./EternalStorage.sol";

contract IdentityProxy is EternalStorage, Ownable {
    address public Implementation;
    constructor(address owner) public Ownable(owner) {
        creator = msg.sender;
    }

    function updateImplementation(address _newImplementation)
        external
        onlyOwnerOrManager
    {
        Implementation = _newImplementation;
    }

    function getCreator() public view returns (address) {
        return creator;
    }

    modifier onlyOwnerOrManager() {
        require(
            msg.sender == creator || msg.sender == owner(),
            "Not the Owner or Manager"
        );
        _;
    }

    function getNonce() public view returns (uint256) {
        return nonce;
    }
    function() external payable {
        if (msg.data.length == 0) {
            emit Received(msg.sender, msg.value);
        } else {
            address impl = latestLogic;
            require(impl != address(0));
            assembly {
                let ptr := mload(0x40)
                calldatacopy(ptr, 0, calldatasize)
                let result := delegatecall(gas, impl, ptr, calldatasize, 0, 0)
                let size := returndatasize
                returndatacopy(ptr, 0, size)

                switch result
                    case 0 {
                        revert(ptr, size)
                    }
                    default {
                        return(ptr, size)
                    }
            }
        }

    }

}

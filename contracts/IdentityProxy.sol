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

    function() external payable {
        emit Received(msg.sender, msg.value);
    }

    function getNonce() public view returns (uint256) {
        return nonce;
    }

    function forward(
        address payable destination,
        uint256 amount,
        bytes memory data
    ) public payable onlyOwnerOrManager {
        (bool status, ) = Implementation.delegatecall(
            abi.encodeWithSelector(
                bytes4(keccak256("forward(address,uint256,bytes)")),
                destination,
                amount,
                data
            )
        );
        require(status, "DelegateCall Failed");
    }

    // Ref => https://github.com/gnosis/gnosis-safe-contracts/blob/master/contracts/GnosisSafe.sol
    // function executeCall(address to, uint256 amount, bytes memory data)
    //     public
    //     returns (bool success)
    // {
    //     assembly {
    //         success := call(gas, to, amount, add(data, 0x20), mload(data), 0, 0)
    //     }
    // }

    function withdraw(address payable receiver, uint256 amount)
        public
        onlyOwnerOrManager
    {
        (bool status, ) = Implementation.delegatecall(
            abi.encodeWithSelector(
                bytes4(keccak256("withdraw(address,uint256)")),
                receiver,
                amount
            )
        );
        require(status, "DelegateCall Failed");
    }

    function transferERC20(
        address erc20ContractAddress,
        address destination,
        uint256 amount
    ) public onlyOwnerOrManager {
        (bool status, ) = Implementation.delegatecall(
            abi.encodeWithSelector(
                bytes4(keccak256("transferERC20(address,address,uint256)")),
                erc20ContractAddress,
                destination,
                amount
            )
        );
        require(status, "DelegateCall Failed");
    }

    function transferERC721(
        address erc721ContractAddress,
        address destination,
        uint256 tokenId
    ) public onlyOwnerOrManager {
        (bool status, ) = Implementation.delegatecall(
            abi.encodeWithSelector(
                bytes4(keccak256("transferERC721(address,address,uint256)")),
                erc721ContractAddress,
                destination,
                tokenId
            )
        );
        require(status, "DelegateCall Failed");
    }

}

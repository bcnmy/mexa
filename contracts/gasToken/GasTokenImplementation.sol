pragma solidity 0.5.13;
import "./ICHITOKEN.sol";
import "../RelayerManager.sol";
import "../libs/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract GasTokenImplementation is Ownable(msg.sender) {
    using SafeMath for uint256;

    ICHITOKEN public chiToken;
    RelayerManager public relayerManager;

    // MODIFIERS
    modifier onlyRelayerOrOwner() {
        require(
            relayerManager.getRelayerStatus(msg.sender) || msg.sender == owner(),
            "You are not allowed to perform this operation"
        );
        _;
    }

    modifier discountCHI {
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = gasStart.sub(gasleft()).add(msg.data.length.mul(16)).add(21000);
        uint256 tokenToBurn = (gasSpent.add(14154)).div(41947);

        chiToken.freeUpTo(tokenToBurn);
    }

    function forward(
        address payable destination,
        bytes memory data,
        uint256 gasLimit
    ) public onlyRelayerOrOwner discountCHI {
        require(
            gasleft() > gasLimit.div(63).add(gasLimit).add(1000),
            "Not enough gas"
        );
        int8 success;
        assembly {
            let txGas := gas
            if iszero(eq(gasLimit, 0)) {
                txGas := gasLimit
            }
            success := call(txGas, destination, 0, add(data, 0x20), mload(data), 0, 0)
        }
        require(success==1,"Internal Call failed");
    }

    function mintGasToken(uint256 mint) public onlyOwner {
        chiToken.mint(mint);
    }

    function freeGasTokenFrom(address from, uint256 value)
        public
        onlyOwner
        returns (uint256)
    {
        return chiToken.freeFrom(from, value);
    }

    function freeGasTokenFromUpTo(address from, uint256 value)
        public
        onlyOwner
        returns (uint256 freed)
    {
        return chiToken.freeFromUpTo(from, value);
    }

    function approveGasToken(address spender, uint256 value)
        public
        onlyOwner
        returns (bool success)
    {
        return chiToken.approve(spender, value);
    }

    function transferGasTokenFrom(
        address from,
        address to,
        uint256 value
    ) public onlyOwner returns (bool success) {
        return chiToken.transferFrom(from, to, value);
    }

    function transferGasToken(address to, uint256 value)
        public
        onlyOwner
        returns (bool success)
    {
        return chiToken.transfer(to, value);
    }
}

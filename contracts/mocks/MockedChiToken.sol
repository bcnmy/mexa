import "../gasToken/chitoken.sol";

contract MockedChiToken is ChiToken {

    uint256 public fakeMinttokenBalance;

    function mint(uint256 value) public {
        fakeMinttokenBalance = fakeMinttokenBalance + value;
    }

    function balanceOf(address who) public view returns (uint256){
        return fakeMinttokenBalance;
    }

    function free(uint256 value) public returns (uint256)  {
        fakeMinttokenBalance = fakeMinttokenBalance - value;
        return fakeMinttokenBalance;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success){
        return true;
    }

    function allowance(address owner, address spender) public view returns (uint256){
        return 2;
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        return true;
    }

    function freeFrom(address from, uint256 value) public returns (uint256) {
        return 2;
    }

    function freeFromUpTo(address from, uint256 value) public returns (uint256) {
        return 2;
    }

    function throwException() public returns (uint256) {
        revert("Not enough Ether provided.");
    }
}
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


    function freeUpTo(uint256 value) public returns (uint256) {}

    function freeFrom(address from, uint256 value) public returns (uint256) {}

    function freeFromUpTo(address from, uint256 value) public returns (uint256) {}
}
// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

// import "../GSN/Context.sol";

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
contract Pausable {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    event PauserChanged(
        address indexed previousPauser,
        address indexed newPauser
    );

    bool private _paused;
    address private _pauser;

    /**
     * @dev The pausable constructor sets the original `pauser` of the contract to the sender
     * account & Initializes the contract in unpaused state..
     */
    constructor(address pauser) public {
        _pauser = pauser;
        _paused = false;
    }

    /**
     * @dev Throws if called by any account other than the pauser.
     */
    modifier onlyPauser() {
        require(
            isPauser(),
            "Only pauser is allowed to perform this operation"
        );
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }

    /**
     * @return the address of the owner.
     */
    function pauser() public view returns (address) {
        return _pauser;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isPauser() public view returns (bool) {
        return msg.sender == _pauser;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function isPaused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Allows the current pauser to transfer control of the contract to a newPauser.
     * @param newPauser The address to transfer pauserShip to.
     */
    function changePauser(address newPauser) public onlyPauser {
        _changePauser(newPauser);
    }

    /**
     * @dev Transfers control of the contract to a newPauser.
     * @param newPauser The address to transfer ownership to.
     */
    function _changePauser(address newPauser) internal {
        require(newPauser != address(0));
        emit PauserChanged(_pauser, newPauser);
        _pauser = newPauser;
    }

    function renouncePauser() public onlyPauser {
        emit PauserChanged(_pauser, address(0));
        _pauser = address(0);
    }
    
    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function pause() public onlyPauser whenNotPaused {
        _paused = true;
        emit Paused(_pauser);
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public onlyPauser whenPaused {
        _paused = false;
        emit Unpaused(_pauser);
    }
}

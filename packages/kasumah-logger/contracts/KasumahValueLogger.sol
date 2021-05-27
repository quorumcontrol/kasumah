// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Arrays.sol";
// import "hardhat/console.sol";

contract KasumahValueLogger  {
    using Arrays for uint256[];

    mapping(address => mapping(address => bool)) private _approvals; // who is allowed to write for a user?

    mapping(bytes32 => uint[]) private _keys; // hash of address/key -> snapshot

    mapping(bytes32 => mapping(uint => bytes)) private _values;

    function set(address user, string calldata key, bytes calldata value) public {
        requireApprovedSender(user);
        bytes32 hsh = hashKey(user, key);
        uint blockNumber = block.number;
        uint[] storage snapshots = _keys[hsh];
        require(snapshots.length == 0 || snapshots[snapshots.length - 1] < blockNumber, "Key can only be set once per block");
        // console.log('pushing: ', blockNumber);
        snapshots.push(blockNumber);
        _values[hsh][blockNumber] = value;
    }

    function latest(address user, string calldata key) public view returns (bytes memory value) {
        return valueAt(user, key, block.number);
    }

    function valueAt(address user, string calldata key, uint blockNumber) public view returns (bytes memory value) {
        bytes32 hsh = hashKey(user, key);
        uint closest = _keys[hsh].findUpperBound(blockNumber);
        uint[] storage snapshots = _keys[hsh];
        // console.log('bn, close', blockNumber, closest);
        if (closest == 0) {
            return _values[hsh][snapshots[0]];
        }
        if (closest == snapshots.length) {
            return _values[hsh][snapshots[closest - 1]];
        }
        uint snapID = snapshots[closest];
        if (snapID > blockNumber) {
            return _values[hsh][snapshots[closest - 1]];
        }
        return _values[hsh][snapID];
    }

    function snapshotSlice(address user, string calldata key, uint start, uint length) public view returns (uint256[] memory blockNumbers) {
        uint[] storage snapshots = _keys[hashKey(user, key)];
        for (uint i = 0; i < length; i++) {
            blockNumbers[i] = snapshots[i + start];
        }
        return blockNumbers;
    }

    function setApproved(address user, bool isApproved) public {
        _approvals[msg.sender][user] = isApproved;
    }

    function requireApprovedSender(address user) internal view {
        require(user == msg.sender || _approvals[user][msg.sender], "must be the user or have an approval to log");
    }

    function hashKey(address user, string calldata key) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, key));
    }

}

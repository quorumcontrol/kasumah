// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Arrays.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// import "hardhat/console.sol";

/**
    @dev KasumahOwnerConfigs is a contract that lets the current owner of an 1155
    set arbitrary key/value pairs for the asset. Warning here that for *fungible*
    1155 tokens, *any* owner will be able to set the k/v pairs.
 */
contract KasumahOwnerConfigs is Context {
    using Arrays for uint256[];

    mapping(bytes32 => uint256[]) private _keys; // hash of address/id/key -> snapshot

    mapping(bytes32 => mapping(uint256 => bytes)) private _values;

    function set(
        address erc1155Contract,
        uint256 tokenID,
        string calldata key,
        bytes calldata value
    ) public {
        requireUserOwnerAndNFT(erc1155Contract, tokenID);
        bytes32 hsh = hashKey(erc1155Contract, tokenID, key);
        uint256 blockNumber = block.number;
        uint256[] storage snapshots = _keys[hsh];
        require(
            snapshots.length == 0 ||
                snapshots[snapshots.length - 1] < blockNumber,
            "Key can only be set once per block"
        );
        // console.log('pushing: ', blockNumber);
        snapshots.push(blockNumber);
        _values[hsh][blockNumber] = value;
    }

    function latest(
        address erc1155Contract,
        uint256 tokenID,
        string calldata key
    ) public view returns (bytes memory value) {
        return valueAt(erc1155Contract, tokenID, key, block.number);
    }

    function valueAt(
        address erc1155Contract,
        uint256 tokenID,
        string calldata key,
        uint256 blockNumber
    ) public view returns (bytes memory value) {
        bytes32 hsh = hashKey(erc1155Contract, tokenID, key);
        uint256 closest = _keys[hsh].findUpperBound(blockNumber);
        uint256[] storage snapshots = _keys[hsh];
        // console.log('bn, close', blockNumber, closest);
        if (closest == 0) {
            return _values[hsh][snapshots[0]];
        }
        if (closest == snapshots.length) {
            return _values[hsh][snapshots[closest - 1]];
        }
        uint256 snapID = snapshots[closest];
        if (snapID > blockNumber) {
            return _values[hsh][snapshots[closest - 1]];
        }
        return _values[hsh][snapID];
    }

    function snapshotSlice(
        address erc1155Contract,
        uint256 tokenID,
        string calldata key,
        uint256 start,
        uint256 length
    ) public view returns (uint256[] memory blockNumbers) {
        uint256[] storage snapshots = _keys[
            hashKey(erc1155Contract, tokenID, key)
        ];
        for (uint256 i = 0; i < length; i++) {
            blockNumbers[i] = snapshots[i + start];
        }
        return blockNumbers;
    }

    function requireUserOwnerAndNFT(address erc1155Contract, uint256 tokenID)
        internal
        view
    {
        IERC1155 ownedContract = IERC1155(erc1155Contract);
        require(
            ownedContract.balanceOf(_msgSender(), tokenID) >= 1,
            "KasumanOwnerConfigs#Ony an owner may set configs"
        );
    }

    function hashKey(
        address erc1155Contract,
        uint256 tokenID,
        string calldata key
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(erc1155Contract, tokenID, key));
    }
}

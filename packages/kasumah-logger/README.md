# kasumah-logger

Kasumah Logger is a repo with two smart contracts. 

KasumahValueLogger lets you log arbitrary bytes to the blockchain. This is useful for storing things like metadata, etc. The values are stored as a hash of `abi.packedEncoding(userAddress, key)` where the userAddress is a namespace and the key is any arbitrary string. Users may delegate out authority for saving values using a `setApproval` method which will let other senders update the keyvalue store on their behalf. The values are immutable (in the contract, not just because of the blockchain) and it's possible to search for what the value was at any time in the past (based on block number). This means, though, that only one update per block is allowed.

KasumahUintLogger allows you to store *sets* of uints in a key. The key is similar to KasumahValueLogger where the sets are stored as a hash of userAddress and key (arbitrary string). However, what's stored at the key is a simple set of Uids. This is useful for keeping track of collections of items that you want to grab for front ends, etc. In a perfect world event logs would take care of this, but that proves tricky given current RPC conditions and support for historic events. At crypto colosseum we use this technique for doing things like keeping track of all tournaments, etc.

These items can be used together in order to provide "here's a list of ids" and "here's where we store metadata about those ids" for things like fully onchain nfts, etc.

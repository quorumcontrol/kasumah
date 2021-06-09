#! /usr/bin/env bash

set -e -x

hardhat compile
rm -r types
rm -r dist
npm run typechain
tsc
rm dist/hardhat*
cp types/ethers-contracts/*.d.ts dist/types/ethers-contracts

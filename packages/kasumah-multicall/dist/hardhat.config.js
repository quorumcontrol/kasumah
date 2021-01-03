"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
const fs_1 = __importDefault(require("fs"));
// these tasks rely on types, which require a compile, but
// at initial install the types aren't there and so you can't compile.
// this lets a first run happen.
if (!process.env.FIRST_RUN) {
}
let secrets = {};
if (fs_1.default.existsSync('./secrets.json')) {
    secrets = JSON.parse(fs_1.default.readFileSync('./secrets.json').toString());
}
let networks = {};
// If you need to debug a bit and turn on console.log, you probably need to uncomment the below:
networks['hardhat'] = {
// forking: {
//   url: `https://eth-mainnet.alchemyapi.io/v2/${secretsJSON['mainnet']['alchemyAPI']}`,
// },
// allowUnlimitedContractSize: true,
};
networks['mumbai'] = {
    url: 'https://rpc-mumbai.maticvigil.com/v1/c0ce8ac6dcee6f838f2d4cf83d16b6ca1493aa0b',
    chainId: 80001,
};
if (secrets['80001']) {
    networks['mumbai'].accounts = [secrets['80001'].privateKey];
}
const config = {
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: {
            default: 0,
        },
        alice: {
            default: 2,
        }
    },
    solidity: {
        compilers: [
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1,
                    },
                    evmVersion: 'istanbul',
                },
            },
        ],
    },
    networks,
};
exports.default = config;

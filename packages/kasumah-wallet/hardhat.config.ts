import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-ethers"
import { HardhatUserConfig } from "hardhat/config"
import 'hardhat-deploy';
import { NetworkUserConfig } from "hardhat/types";
import dotenv from 'dotenv'
import { Wallet } from "ethers";

dotenv.config()

const networks:Record<string,NetworkUserConfig> = {}

if (process.env.CHAIN_ID) {
  const wallet = Wallet.fromMnemonic(process.env.MNEMONIC!)

  networks[process.env.CHAIN_ID] = {
    url: process.env.RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID, 10),
    accounts: [wallet.privateKey],
  } 
}


networks['mumbai'] = {
  url: 'https://rpc-mumbai.maticvigil.com/v1/c0ce8ac6dcee6f838f2d4cf83d16b6ca1493aa0b',
  chainId: 80001,
}

const config: HardhatUserConfig = {
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
export default config;

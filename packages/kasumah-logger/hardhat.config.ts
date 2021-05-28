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
  console.log('address: ', wallet.address)

  networks[process.env.CHAIN_ID] = {
    url: process.env.RPC_URL,
    chainId: parseInt(process.env.CHAIN_ID, 10),
    accounts: [wallet.privateKey],
  } 
}

networks['mumbai'] = {
  ...(networks['mumbai'] || {}),
  url: 'https://rpc-mumbai.maticvigil.com/',
  chainId: 80001,
}

networks['matic'] = {
  ...(networks['matic'] || {}),
  url: 'https://rpc-mainnet.maticvigil.com/',
  chainId: 137,
}

const config: HardhatUserConfig = {
  networks,
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
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: 'istanbul',
        },
      },
    ],
  },
};
export default config;

import { BigNumber, BigNumberish, constants, Signer, utils, VoidSigner } from "ethers"
import { GnosisSafe, GnosisSafeProxyFactory, GnosisSafeProxyFactory__factory, GnosisSafe__factory } from "../types/ethers-contracts"

export type Address = string
const addr0 = constants.AddressZero

const PROXY_ADDR = '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
const MASTER_COPY_ADDR = '0x6851D6fDFAfD08c0295C392436245E5bc78B0185'

const voidSigner = new VoidSigner(addr0)
const voidMasterCopy = new GnosisSafe__factory(voidSigner).attach(addr0)

export interface WalletMakerConstructorArgs {
  signer: Signer
  chainId: number
}

export function safeFromAddr(signer:Signer, safeAddr:Address) {
  return (new GnosisSafe__factory(signer)).attach(safeAddr)
}

async function setupDataForUser(user:Address) {
  const setupData = await voidMasterCopy.populateTransaction.setup([user], 1, addr0, '0x', addr0, addr0, 0, addr0)
  if (!setupData.data) {
      throw new Error("no setup data")
  }
  return setupData.data
}


export class WalletMaker {
  proxyFactory:GnosisSafeProxyFactory
  chainId: number
  signer: Signer

  constructor({ signer, chainId }:WalletMakerConstructorArgs) {
    this.signer = signer

    const proxyFactory = new GnosisSafeProxyFactory__factory(signer).attach(PROXY_ADDR)

    this.proxyFactory = proxyFactory
    this.chainId = chainId
  }

  async deployWallet(user:Address):Promise<Address> {
    const setupData = await setupDataForUser(user)
    const walletTx = await this.proxyFactory.createProxyWithNonce(MASTER_COPY_ADDR, setupData, this.chainId)
    const walletReceipt = await walletTx.wait()

    return walletReceipt.events![0].args?.proxy.toLowerCase()
  }

  async walletAddressForUser(user:Address):Promise<Address> {
    const setupData = await setupDataForUser(user)

    const salt = utils.keccak256(utils.solidityPack(['bytes', 'uint256'], [utils.keccak256(setupData), this.chainId]))
    const initCode = utils.solidityKeccak256(['bytes', 'bytes'], [await this.proxyFactory.proxyCreationCode(), utils.defaultAbiCoder.encode(['address'], [MASTER_COPY_ADDR])])
    
    const addr = utils.getCreate2Address(this.proxyFactory.address, salt, initCode)
    return addr.toLowerCase()
  }

  async isDeployed(user:Address) {
    const addr = await this.walletAddressForUser(user)
    const code = await this.signer.provider!.getCode(addr)
    return code  !== '0x'
  }

}

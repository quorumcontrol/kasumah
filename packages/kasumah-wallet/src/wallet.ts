import { BigNumber, BigNumberish, constants, Signer, VoidSigner } from "ethers"
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

  async createWallet(user:Address):Promise<Address> {
    const setupData = await setupDataForUser(user)
    const walletTx = await this.proxyFactory.createProxyWithNonce(MASTER_COPY_ADDR, setupData, this.chainId)
    const walletReceipt = await walletTx.wait()

    return walletReceipt.events![0].args?.proxy.toLowerCase()
  }

  async walletAddressForUser(user:Address):Promise<Address> {
    var futureAddr:string = ''
    const setupData = await setupDataForUser(user)
    try {
      await this.proxyFactory.callStatic.calculateCreateProxyWithNonceAddress(MASTER_COPY_ADDR, setupData, this.chainId)
    } catch (e) {
      futureAddr =  '0x' + e.stackTrace[0].message.toString('hex').substring(136, 136 + 40)
    }
    return futureAddr.toLowerCase()
  }
}

// const nonce = 2

// const createWalletForUser(user:Address) {

    // var futureAddr:string = ''
    // try {
    //   await proxyFactory.callStatic.calculateCreateProxyWithNonceAddress(masterCopy.address, setupData.data, nonce)
    // } catch (e) {
    //   console.log('revert', e.stackTrace[0].message.toString('hex'))

    //   console.dir(e, {depth: null})

    //   futureAddr =  '0x' + e.stackTrace[0].message.toString('hex').substring(136, 136 + 40)
// }

    // const setupData = await masterCopy.populateTransaction.setup([deployer.address], 1, addr0, '0x', addr0, addr0, 0, addr0)
    // if (!setupData.data) {
    //     throw new Error("no setup data")
    // }

    // var futureAddr:string = ''
    // try {
    //   await proxyFactory.callStatic.calculateCreateProxyWithNonceAddress(masterCopy.address, setupData.data, nonce)
    // } catch (e) {
    //   console.log('revert', e.stackTrace[0].message.toString('hex'))

    //   console.dir(e, {depth: null})

    //   futureAddr =  '0x' + e.stackTrace[0].message.toString('hex').substring(136, 136 + 40)

    // }
    // console.log('hi')

    // const walletTx = await proxyFactory.createProxyWithNonce(masterCopy.address, setupData.data, nonce)
    // const walletReceipt = await walletTx.wait()

    // const addr = walletReceipt.events![0].args?.proxy
    // console.log("addr from working: ", addr)
    // expect(futureAddr).to.equal(addr.toLowerCase())

// export async function getAddressForUser(proxyFactory:GnosisSafeProxyFactory, userAddr:string, chainId:BigNumberish) {
//     if (!BigNumber.isBigNumber(chainId)) {
//         chainId = BigNumber.from(chainId)
//     }

//     var futureAddr:string = ''
//     try {
//       await proxyFactory.callStatic.calculateCreateProxyWithNonceAddress(masterCopy.address, setupData.data, nonce)
//     } catch (e) {
//       console.log('revert', e.stackTrace[0].message.toString('hex'))

//       console.dir(e, {depth: null})

//       futureAddr =  '0x' + e.stackTrace[0].message.toString('hex').substring(136, 136 + 40)

// }
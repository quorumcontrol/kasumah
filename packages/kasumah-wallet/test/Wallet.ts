import { ethers, network } from "hardhat";
import { expect } from "chai";
import { deployCanonicals } from "../src/helpers/deploy";
import { GnosisSafeProxy__factory, GnosisSafeProxyFactory, GnosisSafeProxyFactory__factory, GnosisSafe__factory } from "../types/ethers-contracts";
import { GnosisSafe } from '../types/ethers-contracts/GnosisSafe'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { OPERATION, signer } from "../src/helpers/txSigner";
import { BigNumber, constants, utils, Wallet } from "ethers";

const addr0 = ethers.constants.AddressZero

describe("MulticallWrapper", () => {
  let masterCopy:GnosisSafe
  let gnosisSafeFactory:GnosisSafe__factory
  let proxyFactory:GnosisSafeProxyFactory

  let deployer:SignerWithAddress
  let alice:SignerWithAddress

  before(async () => {
    const signers = await ethers.getSigners()
    deployer = signers[0]
    alice = signers[1]
    await deployCanonicals(deployer)
    gnosisSafeFactory = new GnosisSafe__factory(deployer)
    // const gs = new GnosisSafe('0x6851D6fDFAfD08c0295C392436245E5bc78B0185', gsf.interface, deployer)
    masterCopy = gnosisSafeFactory.attach('0x6851D6fDFAfD08c0295C392436245E5bc78B0185')

    const proxyFactoryFactory = new GnosisSafeProxyFactory__factory(deployer)
    proxyFactory = proxyFactoryFactory.attach('0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B')
  });

  it('can get a future address', async ()=> {
    const nonce = 2

    const setupData = await masterCopy.populateTransaction.setup([deployer.address], 1, addr0, '0x', addr0, addr0, 0, addr0)
    if (!setupData.data) {
        throw new Error("no setup data")
    }

    var futureAddr:string = ''
    try {
      await proxyFactory.calculateCreateProxyWithNonceAddress(masterCopy.address, setupData.data, nonce)
    } catch (e) {
      console.log('revert', e.stackTrace[0].message.toString('hex'))

      console.dir(e, {depth: null})

      futureAddr =  '0x' + e.stackTrace[0].message.toString('hex').substring(136, 136 + 40)

    }
    console.log('hi')

    const walletTx = await proxyFactory.createProxyWithNonce(masterCopy.address, setupData.data, nonce)
    const walletReceipt = await walletTx.wait()

    const addr = walletReceipt.events![0].args?.proxy
    expect(futureAddr).to.equal(addr.toLowerCase())
  })

  it("sanity works", async () => {
    const setupData = await masterCopy.populateTransaction.setup([deployer.address], 1, addr0, '0x', addr0, addr0, 0, addr0)
    if (!setupData.data) {
        throw new Error("no setup data")
    }
    const walletTx = await proxyFactory.createProxyWithNonce(masterCopy.address, setupData.data, 1)
    const walletReceipt = await walletTx.wait()

    const userWallet = gnosisSafeFactory.attach(walletReceipt.events![0].args?.proxy)
    console.log('userWallet: ', userWallet.addres)

    console.log('sending ', (await deployer.getBalance()).toString())
    const sendTx = await deployer.sendTransaction({
        to: userWallet.address,
        from: deployer.address,
        value: utils.parseEther('1').toHexString(),
        gasLimit: 50000,
    })
    console.log('sent')

    const halfEth = utils.parseEther('0.5')

    const sig = await signer(deployer, userWallet.address, alice.address, halfEth, '0x', OPERATION.CALL, 0, 0, 0, constants.AddressZero, constants.AddressZero, 0)
    console.log('sig: ', sig.length)
    await userWallet.execTransaction(
        alice.address, 
        halfEth, 
        '0x', 
        OPERATION.CALL, 
        0, 
        0, 
        0, 
        constants.AddressZero, 
        constants.AddressZero,
        sig
    )
    expect(await deployer.provider?.getBalance(userWallet.address)).to.equal(halfEth)
  });

});

import { ethers, network } from "hardhat";
import { expect } from "chai";
import { deployCanonicals, isCanonicalDeployed } from "../src/helpers/deploy";
import { Echo, GnosisSafeProxyFactory, GnosisSafeProxyFactory__factory, GnosisSafe__factory, MultiSend, MultiSend__factory } from "../types/ethers-contracts";
import { GnosisSafe } from '../types/ethers-contracts/GnosisSafe'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { OPERATION, signer } from "../src/helpers/txSigner";
import {  BigNumber, BigNumberish, constants, utils } from "ethers";
import { safeFromAddr, WalletMaker } from "../src/wallet";
import { encode } from "punycode";
import { encodeMultiSend } from "../src";

const addr0 = ethers.constants.AddressZero

describe("MulticallWrapper", () => {
  let masterCopy:GnosisSafe
  let gnosisSafeFactory:GnosisSafe__factory
  let proxyFactory:GnosisSafeProxyFactory
  let multiSend:MultiSend

  let deployer:SignerWithAddress
  let alice:SignerWithAddress

  let echo:Echo

  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: []
    })
    const signers = await ethers.getSigners()
    deployer = signers[0]
    alice = signers[1]
    expect(await isCanonicalDeployed(deployer.provider!)).to.be.false
    await deployCanonicals(deployer)
    expect(await isCanonicalDeployed(deployer.provider!)).to.be.true
    gnosisSafeFactory = new GnosisSafe__factory(deployer)
    // const gs = new GnosisSafe('0x6851D6fDFAfD08c0295C392436245E5bc78B0185', gsf.interface, deployer)
    masterCopy = gnosisSafeFactory.attach('0x6851D6fDFAfD08c0295C392436245E5bc78B0185')

    multiSend = (new MultiSend__factory(deployer)).attach('0x8D29bE29923b68abfDD21e541b9374737B49cdAD')

    const proxyFactoryFactory = new GnosisSafeProxyFactory__factory(deployer)
    proxyFactory = proxyFactoryFactory.attach('0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B')

    const echoFactory = await ethers.getContractFactory('Echo')
    echo = (await echoFactory.deploy()) as Echo
    await echo.deployed()

  });

  it('can canonically deploy twice', async () => {
    await deployCanonicals(deployer)
  })

  it('gets a future address', async ()=> {
    const walletMaker = new WalletMaker({signer: deployer, chainId: network.config.chainId!})

    const futureAddr = await walletMaker.walletAddressForUser(deployer.address)
    const realAddr = await walletMaker.deployWallet(deployer.address)
    expect(futureAddr).to.equal(realAddr)
  })

  it('detects if a wallet is deployed', async ()=> {
    const walletMaker = new WalletMaker({signer: deployer, chainId: network.config.chainId!})
    expect(await walletMaker.isDeployed(deployer.address)).to.be.false
    await walletMaker.deployWallet(deployer.address)
    expect(await walletMaker.isDeployed(deployer.address)).to.be.true
  })

  it('has the default handler', async ()=> {
    const code = await deployer.provider!.getCode('0xd5D82B6aDDc9027B22dCA772Aa68D5d74cdBdF44')
    expect(code).to.not.equal('0x')
  })

  it('multisends', async () => {
    const walletMaker = new WalletMaker({signer: deployer, chainId: network.config.chainId!})
    const walletAddr = await walletMaker.deployWallet(deployer.address)
    const userWallet = safeFromAddr(deployer, walletAddr)
    await echo.transferOwnership(walletAddr)

    const tx1 = await echo.populateTransaction.setMapping(utils.formatBytes32String('hello'), utils.formatBytes32String('world'))
    const tx2 = await echo.populateTransaction.setMapping(utils.formatBytes32String('hello2'), utils.formatBytes32String('world2'))

    const multiTx = await encodeMultiSend([tx1,tx2])
    if (!multiTx.data) {
      throw new Error('no data on multitx')
    }

    const sig = await signer(deployer, userWallet.address, multiSend.address, 0, multiTx.data, OPERATION.DELEGATE_CALL, 0, 0, 0, constants.AddressZero, constants.AddressZero, 0)
    const tx = await userWallet.execTransaction(
        multiSend.address, 
        0, 
        multiTx.data, 
        OPERATION.DELEGATE_CALL, 
        0, 
        0, 
        0, 
        constants.AddressZero, 
        constants.AddressZero,
        sig,
        {
          gasLimit: 9500000
        }
    )

    expect(await echo.publicMapping(utils.formatBytes32String('hello'))).to.equal(utils.formatBytes32String('world'))
    expect(await echo.publicMapping(utils.formatBytes32String('hello2'))).to.equal(utils.formatBytes32String('world2'))
  })

  it("creates functional wallets", async () => {
    const walletMaker = new WalletMaker({signer: deployer, chainId: network.config.chainId!})

    const walletAddr = await walletMaker.deployWallet(deployer.address)
    const userWallet = safeFromAddr(deployer, walletAddr)

    expect(await userWallet.nonce()).to.equal(0)

    const sendTx = await deployer.sendTransaction({
        to: userWallet.address,
        from: deployer.address,
        value: utils.parseEther('1').toHexString(),
        gasLimit: 50000,
    })
    await sendTx.wait()

    const halfEth = utils.parseEther('0.5')

    const sig = await signer(deployer, userWallet.address, alice.address, halfEth, '0x', OPERATION.CALL, 0, 0, 0, constants.AddressZero, constants.AddressZero, 0)
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
    expect(await userWallet.nonce()).to.equal(1)
  });

});

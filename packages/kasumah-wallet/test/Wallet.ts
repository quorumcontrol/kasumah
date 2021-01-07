import { ethers, network } from "hardhat";
import { expect } from "chai";
import { deployCanonicals, isCanonicalDeployed } from "../src/helpers/deploy";
import { GnosisSafeProxyFactory, GnosisSafeProxyFactory__factory, GnosisSafe__factory } from "../types/ethers-contracts";
import { GnosisSafe } from '../types/ethers-contracts/GnosisSafe'
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { OPERATION, signer } from "../src/helpers/txSigner";
import {  constants, utils } from "ethers";
import { safeFromAddr, WalletMaker } from "../src/wallet";

const addr0 = ethers.constants.AddressZero

describe("MulticallWrapper", () => {
  let masterCopy:GnosisSafe
  let gnosisSafeFactory:GnosisSafe__factory
  let proxyFactory:GnosisSafeProxyFactory

  let deployer:SignerWithAddress
  let alice:SignerWithAddress

  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: []
    })
    const signers = await ethers.getSigners()
    deployer = signers[0]
    alice = signers[1]
    await deployCanonicals(deployer)
    expect(await isCanonicalDeployed(deployer.provider!)).to.be.true
    gnosisSafeFactory = new GnosisSafe__factory(deployer)
    // const gs = new GnosisSafe('0x6851D6fDFAfD08c0295C392436245E5bc78B0185', gsf.interface, deployer)
    masterCopy = gnosisSafeFactory.attach('0x6851D6fDFAfD08c0295C392436245E5bc78B0185')

    const proxyFactoryFactory = new GnosisSafeProxyFactory__factory(deployer)
    proxyFactory = proxyFactoryFactory.attach('0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B')
  });

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

  it("creates functional wallets", async () => {
    const walletMaker = new WalletMaker({signer: deployer, chainId: network.config.chainId!})

    const walletAddr = await walletMaker.deployWallet(deployer.address)
    const userWallet = safeFromAddr(deployer, walletAddr)
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
  });

});

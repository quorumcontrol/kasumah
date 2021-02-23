import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Echo } from "../types/ethers-contracts/Echo";
import { providers, Signer, utils, Wallet } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { wrapContract } from "../src";
import { GnosisLocalRelayer } from "../src/relayers";
import { WalletMaker, deployCanonicals } from 'kasumah-wallet'

describe("RelayWrapper", () => {
  let chainId: number;
  let echo: Echo;
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress
  let aliceSafeAddr:string
  let walletMaker: WalletMaker

  const testKey = utils.formatBytes32String("test");
  const testValue = utils.formatBytes32String("value");

  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: []
    })

    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];
  
    chainId = network.config.chainId!;

    await deployCanonicals(deployer)

    walletMaker = new WalletMaker({ signer: deployer, chainId })

    aliceSafeAddr = await walletMaker.walletAddressForUser(alice.address)

    const EchoFactory = await ethers.getContractFactory("Echo");
    echo = (await EchoFactory.deploy()) as Echo;
    await echo.deployed();
  });

  it('executes', async ()=> {
    await echo.transferOwnership(aliceSafeAddr)

    await walletMaker.deployWallet(alice.address)
    const relayer = new GnosisLocalRelayer({ transmitSigner: deployer, userSigner: alice, chainId })

    const wrapped = wrapContract<Echo>(echo, relayer)

    const resp = await wrapped.setMapping(testKey, testValue)
    await resp.wait()
    expect(await echo.publicMapping(testKey)).to.equal(testValue)
  })

  it('uses a wallet with a local private key', async () => {
    const localSigner = Wallet.createRandom({ provider: deployer.provider })
    const localSafeAddress = await walletMaker.deployWallet(localSigner.address)
    await echo.transferOwnership(localSafeAddress)

    const relayer = new GnosisLocalRelayer({ transmitSigner: deployer, userSigner: localSigner, chainId })

    const wrapped = wrapContract<Echo>(echo, relayer)

    const resp = await wrapped.setMapping(testKey, testValue)
    await resp.wait()
    expect(await echo.publicMapping(testKey)).to.equal(testValue)
  })


  it('supports subscriptions after wrapping', async () => {
    await echo.transferOwnership(aliceSafeAddr)

    await walletMaker.deployWallet(alice.address)
    const relayer = new GnosisLocalRelayer({ transmitSigner: deployer, userSigner: alice, chainId })

    const wrapped = wrapContract<Echo>(echo, relayer)

    return new Promise((resolve) => {
      wrapped.on(wrapped.filters.Echoed(testKey, null), ()=> { resolve() })
      wrapped.setMapping(testKey, testValue)
    })
  })


});

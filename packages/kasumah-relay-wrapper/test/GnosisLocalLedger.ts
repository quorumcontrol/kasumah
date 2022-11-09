import { ethers, network } from "hardhat";
import { expect } from "chai";
import { Echo } from "../types/ethers-contracts/Echo";
import { utils } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { wrapContract } from "../src";
import { GnosisLocalLedgerRelayer } from "../src/relayers";
import { WalletMaker, deployCanonicals } from "kasumah-wallet";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";

describe("GnosisLocalLedger", () => {
  let chainId: number;
  let echo: Echo;
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let walletMaker: WalletMaker;

  let axiosMock: MockAdapter;

  const testKey = utils.formatBytes32String("test");
  const testValue = utils.formatBytes32String("value");

  before(() => {
    axiosMock = new MockAdapter(axios);
  });

  after(() => {
    axiosMock.reset();
  });

  beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [],
    });

    const signers = await ethers.getSigners();
    deployer = signers[0];
    alice = signers[1];

    chainId = network.config.chainId!;

    await deployCanonicals(deployer);

    walletMaker = new WalletMaker({ signer: deployer, chainId });

    const aliceSafeAddr = await walletMaker.walletAddressForUser(alice.address);

    const EchoFactory = await ethers.getContractFactory("Echo");
    echo = (await EchoFactory.deploy()) as Echo;
    await echo.deployed();

    await echo.transferOwnership(aliceSafeAddr);
  });

  it("multisends", async () => {
    await walletMaker.deployWallet(alice.address);

    // const factory = new GnosisSafe__factory(deployer);

    const relayer = new GnosisLocalLedgerRelayer({
      transmitSigner: deployer,
      userSigner: alice,
      chainId,
    });

    const tx1 = await echo.populateTransaction.setMapping(
      utils.formatBytes32String("multi"),
      utils.formatBytes32String("send")
    );
    const tx2 = await echo.populateTransaction.setMapping(
      utils.formatBytes32String("multi2"),
      utils.formatBytes32String("send2")
    );
    if (!tx1.data || !tx2.data) {
      throw new Error("error on data");
    }

    const resp = await relayer.multisend([tx1, tx2]);

    await resp.wait();
    expect(
      await echo.publicMapping(utils.formatBytes32String("multi"))
    ).to.equal(utils.formatBytes32String("send"));
    expect(
      await echo.publicMapping(utils.formatBytes32String("multi2"))
    ).to.equal(utils.formatBytes32String("send2"));
  });

  it("executes transactions", async () => {
    await walletMaker.deployWallet(alice.address);

    const relayer = new GnosisLocalLedgerRelayer({
      transmitSigner: deployer,
      userSigner: alice,
      chainId,
    });

    const wrapped = wrapContract<Echo>(echo, relayer);

    const resp = await wrapped.setMapping(testKey, testValue);
    await resp.wait();
    expect(await echo.publicMapping(testKey)).to.equal(testValue);
  });

  it("accepts value", async () => {
    await walletMaker.deployWallet(alice.address);
    const value = utils.parseEther('2.2')

    await alice.sendTransaction({
        to: await walletMaker.walletAddressForUser(alice.address),
        value,
    })

    const relayer = new GnosisLocalLedgerRelayer({
      transmitSigner: deployer,
      userSigner: alice,
      chainId,
    });

    const wrapped = wrapContract<Echo>(echo, relayer);

    const resp = await wrapped.setValueMapping(testKey, { value });
    await resp.wait();
    expect(await echo.publicMapping(testKey)).to.equal(value);
  });
});

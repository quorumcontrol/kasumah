import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "chai";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  KasumahUintLogger,
  KasumahUintLogger__factory,
} from "../types/ethers-contracts";

const { BigNumber } = ethers;

function advanceBlock() {
  return ethers.provider.send("evm_mine", []);
}

function bufferFromRet(ret: string) {
  return Buffer.from(ret.slice(2), "hex");
}

describe("KasumahUintLogger", () => {
  let logger: KasumahUintLogger;
  let signers: SignerWithAddress[];
  let alice: SignerWithAddress;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    alice = signers[0];
    const factory = (await ethers.getContractFactory(
      "KasumahUintLogger"
    )) as KasumahUintLogger__factory;
    logger = await factory.deploy();
    await logger.deployed();
  });

  it("logs for user", async () => {
    await logger.add(alice.address, "aliceKey", 100);
    expect((await logger.all(alice.address, "aliceKey"))[0]).to.equal(
      BigNumber.from("100")
    );
  });

  it("does not log for unapproved user", async () => {
    const bob = signers[1];
    await expect(logger.add(bob.address, "bobKey", 100)).to.be.reverted;
  });

  it("logs for approved users", async () => {
    const bob = signers[1];
    await logger.connect(bob).setApproved(alice.address, true);
    await logger.add(bob.address, "bobKey", 100);
    expect((await logger.all(bob.address, "bobKey"))[0]).to.equal(
      BigNumber.from("100")
    );
  });

  it("removes for user", async () => {
    await logger.add(alice.address, "aliceKey", 100);
    await logger.remove(alice.address, "aliceKey", 100);
    expect(await logger.length(alice.address, "aliceKey")).to.equal(0);
  });

  it("does not remove for unapproved user", async () => {
    const bob = signers[1];
    await logger.connect(bob).add(bob.address, "bobKey", 100);
    await expect(logger.remove(bob.address, "bobKey", 100)).to.be.reverted;
    expect(await logger.length(bob.address, "bobKey")).to.equal(1);
  });

  it("removes for approved user", async () => {
    const bob = signers[1];
    await logger.connect(bob).add(bob.address, "bobKey", 100);
    await logger.connect(bob).setApproved(alice.address, true);

    logger.remove(bob.address, "bobKey", 100);
    expect(await logger.length(bob.address, "bobKey")).to.equal(0);
  });

  const BIG_LOG_COUNT = 20;

  describe(`logging ${BIG_LOG_COUNT} times`, () => {
    const key = "aliceBigKey";

    beforeEach(async () => {
      for (let i = 0; i < BIG_LOG_COUNT; i++) {
        await logger.add(alice.address, key, i);
      }
    });

    it(`returns all ${BIG_LOG_COUNT}`, async () => {
      expect(await logger.all(alice.address, key)).to.have.lengthOf(
        BIG_LOG_COUNT
      );
    });

    it("slices", async () => {
      const slice = await logger.slice(alice.address, key, 2, 2);
      expect(slice).to.have.lengthOf(2);
      expect(slice[0]).to.equal(BigNumber.from(2));
      expect(slice[1]).to.equal(BigNumber.from(3));
    });

    it("returns length", async () => {
      expect(await logger.length(alice.address, key)).to.equal(BIG_LOG_COUNT);
    });

    it("removes", async () => {
      for (let i = 0; i < BIG_LOG_COUNT; i++) {
        await logger.remove(alice.address, key, i);
        expect(await logger.length(alice.address, key)).to.equal(
          BIG_LOG_COUNT - (i + 1)
        );
      }
    });
  });
});

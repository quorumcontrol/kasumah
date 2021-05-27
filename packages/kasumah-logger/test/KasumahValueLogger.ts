import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import "chai";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  KasumahValueLogger,
  KasumahValueLogger__factory,
} from "../types/ethers-contracts";

function advanceBlock() {
  return ethers.provider.send("evm_mine", []);
}

function bufferFromRet(ret: string) {
  return Buffer.from(ret.slice(2), "hex");
}

describe("KasumahValueLogger", () => {
  let logger: KasumahValueLogger;
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await ethers.getSigners();
    const factory = (await ethers.getContractFactory(
      "KasumahValueLogger"
    )) as KasumahValueLogger__factory;
    logger = await factory.deploy();
    await logger.deployed();
  });

  it("sets when sender is user", async () => {
    const alice = signers[0];
    const key = "bob";
    const value = Buffer.from("bob");
    await logger.set(alice.address, key, value);
    expect(
      bufferFromRet(await logger.latest(alice.address, key)).toString()
    ).to.equal(value.toString());
  });

  it("denies when sender is unauthorized", async () => {
    const bob = signers[1];
    const key = "bob";
    const value = Buffer.from("bob");
    await expect(logger.set(bob.address, key, value)).to.be.reverted;
  });

  it("allows when sender is approved", async () => {
    const alice = signers[0];
    const bob = signers[1];
    const key = "bob";
    const value = Buffer.from("bob");
    await logger.connect(bob).setApproved(alice.address, true);
    await expect(logger.set(bob.address, key, value)).to.not.be.reverted;
  });

  it("stores all values", async () => {
    const current = await ethers.provider.getBlockNumber();
    const alice = signers[0];
    const key = "bob";
    const value1 = Buffer.from("bob1");
    const value2 = Buffer.from("bob2");
    await logger.set(alice.address, key, value1);
    await advanceBlock()
    await advanceBlock()
    await advanceBlock()
    await logger.set(alice.address, key, value2);

    const initialSet = bufferFromRet(
      await logger.valueAt(alice.address, key, current + 1)
    );
    const valueBetweenSets = bufferFromRet(
      await logger.valueAt(alice.address, key, current + 3)
    );
    const latestSet = bufferFromRet(
      await logger.valueAt(alice.address, key, current + 5)
    );
    await advanceBlock()

    const latest = bufferFromRet(await logger.latest(alice.address, key));

    expect(valueBetweenSets.toString()).to.equal(initialSet.toString());
    expect(initialSet.toString()).to.equal(value1.toString());
    expect(latestSet.toString()).to.equal(value2.toString());
    expect(latestSet.toString()).to.equal(latest.toString());
  });
});

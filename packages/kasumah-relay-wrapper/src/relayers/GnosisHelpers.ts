import { GnosisSafe } from "kasumah-wallet/dist/types/ethers-contracts/GnosisSafe";
import {
  Signer,
  Contract,
  PopulatedTransaction,
  constants,
  PayableOverrides,
  BytesLike,
  BigNumber,
} from "ethers";
import { Address, encodeMultiSend, OPERATION } from "kasumah-wallet";
import { signer } from "./signer";
import debug from "debug";

const log = debug("GnosisHelpers");

export const MULTI_SEND_ADDR = "0x8D29bE29923b68abfDD21e541b9374737B49cdAD";

export async function multisendTx(txs: PopulatedTransaction[]) {
  return encodeMultiSend(txs);
}

export type ExecParams = Parameters<GnosisSafe["execTransaction"]>;

export async function safeFromPopulated(
  safe: GnosisSafe,
  nonce: BigNumber,
  userSigner: Signer,
  userWalletAddr: string,
  to: Address,
  data: BytesLike,
  operation: OPERATION,
  isLedger?: boolean,
  overrides?: PayableOverrides,
): Promise<[PopulatedTransaction, ExecParams]> {

  let value = constants.Zero;
  if (overrides && overrides.hasOwnProperty("value")) {
    value = BigNumber.from(await overrides.value);
  }

  const sig = await signer(
    safe,
    userSigner,
    userWalletAddr,
    to,
    value,
    data,
    operation,
    0,
    0,
    0,
    constants.AddressZero,
    constants.AddressZero,
    nonce,
    !!isLedger,
  );

  const execArgs: ExecParams = [
    to,
    value.toHexString(),
    data,
    operation,
    0,
    0,
    0,
    constants.AddressZero,
    constants.AddressZero,
    sig,
  ];

  let txArgs: ExecParams = [...execArgs];
  if (overrides) {
    delete overrides.value;
    txArgs.push(overrides);
  }

  return [await safe.populateTransaction.execTransaction(...txArgs), execArgs];
}

export async function safeTx(
  safe: GnosisSafe,
  nonce: BigNumber,
  userSigner: Signer,
  userWalletAddr: string,
  to: Contract,
  funcName: string,
  ...args: any
): Promise<[PopulatedTransaction, ExecParams]> {
  log(`sign ${funcName} on ${to.address}: `, ...args);
  const populatedTx = await to.populateTransaction[funcName](...args);
  if (!populatedTx.data) {
    throw new Error("populating returned no data");
  }

  let override: PayableOverrides | undefined = undefined;
  const lastArg = args[args.length - 1];
  if (lastArg.gasLimit || lastArg.value) {
    override = lastArg;
  }

  return safeFromPopulated(
    safe,
    nonce,
    userSigner,
    userWalletAddr,
    to.address,
    populatedTx.data,
    OPERATION.CALL,
    false,
    override
  );
}

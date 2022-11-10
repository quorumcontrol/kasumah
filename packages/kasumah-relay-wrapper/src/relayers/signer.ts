import { BigNumber, BigNumberish, BytesLike, Signer, Wallet } from "ethers";
import { OPERATION } from "kasumah-wallet";
import {
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { GnosisSafe } from "kasumah-wallet/dist/types/ethers-contracts";
import { keccak256 } from "ethers/lib/utils";

const log = console.log

const MIN_VALID_V_VALUE = 27;

export interface TypedData {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>;
}

// see https://github.com/gnosis/safe-react/blob/dev/src/logic/safe/transactions/offchainSigner/utils.ts#L26
export const adjustV = (signature: string): string => {
  let sigV = parseInt(signature.slice(-2), 16);

  // Metamask with ledger returns V=0/1 here too, we need to adjust it to be ethereum's valid value (27 or 28)
  if (sigV < MIN_VALID_V_VALUE) {
    sigV += MIN_VALID_V_VALUE;
  }

  return signature.slice(0, -2) + sigV.toString(16);
};

export const knownVAdjust = (signature: string, num:number): string => {
  let sigV = parseInt(signature.slice(-2), 16);

  sigV += 4

  return signature.slice(0, -2) + sigV.toString(16);
};

async function sendForSigning(
  signer: Signer,
  addr: string,
  typedData: TypedData
) {
  log("send for signing addr: ", addr.toLowerCase(), " typed data ", typedData);
  // if the signer has a private key then we can just sign directly from there.
  if (Reflect.get(signer, "_signingKey") && (signer as Wallet)._signingKey()) {
    log("signer has private key");
    // ethers is "helpful" and already adds the EIP712Domain to the types, but
    // metamask does not. so we get the types WITHOUT the EIP712Domain to feed
    // into the local ethers signer. If you leave the EIP712Domain *in* the types
    // then ethers complains about unused types.
    const { EIP712Domain, ...localSigningTypes } = typedData.types;
    return (signer as Wallet)._signTypedData(
      typedData.domain,
      localSigningTypes,
      typedData.message
    );
  }

  log("browser environment, using eth_signTypedData_v4");
  return (signer.provider as any).send("eth_signTypedData_v4", [
    addr.toLowerCase(),
    JSON.stringify(typedData),
  ]).then((sig:string) => adjustV(sig));
}

type Address = string;

export const signer = async function (
  safe: GnosisSafe,
  signer: Signer,
  verifyingContract: Address,
  to: Address,
  value: BigNumberish,
  data: BytesLike,
  operation: OPERATION,
  txGasEstimate: BigNumberish,
  baseGasEstimate: BigNumberish,
  gasPrice: BigNumberish,
  txGasToken: Address,
  refundReceiver: Address,
  nonce: BigNumberish,
  isLedger: boolean
) {
  if (!BigNumber.isBigNumber(value)) {
    value = BigNumber.from(value);
  }

  if (isLedger) {
    log('using ledger for signature', await signer.getAddress(), to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce)
    data = await safe.encodeTransactionData(to, value, data, operation, txGasEstimate, baseGasEstimate, gasPrice, txGasToken, refundReceiver, nonce, )
    log("signing message using personal_sign for ledger")
    const dataHash = Buffer.from(keccak256(data).slice(2), 'hex')
    log("hash: ", dataHash.toString('hex'))
    const sig = await signer.signMessage(dataHash)
    log("sig: ", sig)
    return knownVAdjust(adjustV(sig), 4)
  }
  log('not using ledger for signature')

  let typedData = {
    types: {
      EIP712Domain: [{ type: "address", name: "verifyingContract" }],
      SafeTx: [
        { type: "address", name: "to" },
        { type: "uint256", name: "value" },
        { type: "bytes", name: "data" },
        { type: "uint8", name: "operation" },
        { type: "uint256", name: "safeTxGas" },
        { type: "uint256", name: "baseGas" },
        { type: "uint256", name: "gasPrice" },
        { type: "address", name: "gasToken" },
        { type: "address", name: "refundReceiver" },
        { type: "uint256", name: "nonce" },
      ],
    },
    domain: {
      verifyingContract,
    },
    primaryType: "SafeTx",
    message: {
      to: to,
      value: value.toHexString(),
      data: data,
      operation: operation,
      safeTxGas: txGasEstimate,
      baseGas: baseGasEstimate,
      gasPrice: gasPrice,
      gasToken: txGasToken,
      refundReceiver: refundReceiver,
      nonce: BigNumber.from(nonce).toNumber(),
    },
  };

  const addr = await signer.getAddress();
  try {
    const sig = await sendForSigning(signer, addr, typedData);
    log("signature: ", sig);
    return sig;
  } catch (e) {
    console.error("error signing; ", e);
    throw e;
  }
};

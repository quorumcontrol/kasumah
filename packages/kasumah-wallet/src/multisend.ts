import { BigNumber, BigNumberish, PopulatedTransaction, utils } from "ethers";
import { encode } from "punycode";
import { MultiSend__factory } from "../types/ethers-contracts";
import { addr0, voidSigner } from "./void";

const MULTI_SEND_ADDR = "0x8D29bE29923b68abfDD21e541b9374737B49cdAD";

const voidMultisend = MultiSend__factory.connect(MULTI_SEND_ADDR, voidSigner)

const removeHexPrefix = (input: string) =>
  input.toLowerCase().startsWith("0x") ? input.slice(2) : input;

const encodeData = function (
  operation: number,
  to: string,
  value: BigNumberish,
  data: string
) {
  let dataBuffer = Buffer.from(removeHexPrefix(data), "hex");
  return removeHexPrefix(
    utils.solidityPack(
      ["uint8", "address", "uint256", "uint256", "bytes"],
      [
        operation,
        to,
        BigNumber.from(value).toHexString(),
        dataBuffer.length,
        dataBuffer,
      ]
    )
  );
};

export async function encodeMultiSend(transactions:PopulatedTransaction[]):Promise<PopulatedTransaction> {
    const data = transactions.map((tx) => {
        return encodeData(0, tx.to || addr0, tx.value || 0, tx.data || '0x00') // currently only supporting call and not delegate call
    }).join('')

    return voidMultisend.populateTransaction.multiSend('0x' + data)
}

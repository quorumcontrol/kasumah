import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber, BigNumberish, BytesLike } from "ethers"

type Address = string

export enum OPERATION {
    CALL = 0,
    CREATE = 2,
}

export const signer = async function(signer:SignerWithAddress, verifyingContract:Address, to:Address, value:BigNumberish, data:BytesLike, operation:OPERATION, txGasEstimate:BigNumberish, baseGasEstimate:BigNumberish, gasPrice:BigNumberish, txGasToken:Address, refundReceiver:Address, nonce:BigNumberish) {
    if (!BigNumber.isBigNumber(value)) {
        value = BigNumber.from(value)
    }
    let typedData = {
        types: {
            EIP712Domain: [
                { type: "address", name: "verifyingContract" }
            ],
            // "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
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
            ]
        },
        domain: {
            verifyingContract
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
            nonce: BigNumber.from(nonce).toNumber()
        }
    }

    let sig = await (signer.provider as any).send("eth_signTypedData",[signer.address,typedData]);

    
    return sig
}
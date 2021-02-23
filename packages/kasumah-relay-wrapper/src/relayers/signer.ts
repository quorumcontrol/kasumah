import { BigNumber, BigNumberish, BytesLike, Signer, Wallet } from "ethers"
import { OPERATION } from 'kasumah-wallet'
import debug from 'debug'
import { TypedDataDomain, TypedDataField } from "@ethersproject/abstract-signer";

const log = debug('GnosisSigner')

const isNode = (typeof window == "undefined" || window == null);

export interface TypedData {
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>, 
    message: Record<string, any>
}

async function sendForSigning(signer:Signer, addr:string, typedData:TypedData) {
    log('send for signing addr: ', addr.toLowerCase(), ' typed data ', typedData)
    // if the signer has a private key then we can just sign directly from there.
    if (Reflect.get(signer, '_signingKey') && (signer as Wallet)._signingKey()) {
        log('signer has private key')
        // ethers is "helpful" and already adds the EIP712Domain to the types, but
        // metamask does not. so we get the types WITHOUT the EIP712Domain to feed
        // into the local ethers signer. If you leave the EIP712Domain *in* the types
        // then ethers complains about unused types.
        const {EIP712Domain, ...localSigningTypes} = typedData.types
        return (signer as Wallet)._signTypedData(typedData.domain, localSigningTypes, typedData.message)
    }
    // if no private key on the signer, then we'll use the provider interface to get the signature
    // browser wallets (metamask, etc) use eth_signTypedData_v4 but node (hardhat) uses eth_signTypedData
    // and as far as I can tell there is no way to detect the availability without trying it (which is a network request).
    if (isNode) {
        log('node environment, using eth_signTypedData')
        return (signer.provider as any).send('eth_signTypedData',[addr.toLowerCase(), typedData]);
    } else {
        log('browser environment, using eth_signTypedData_v4')
        return (signer.provider as any).send('eth_signTypedData_v4',[addr.toLowerCase(), JSON.stringify(typedData)]);
    }
}

type Address = string

export const signer = async function(signer:Signer, verifyingContract:Address, to:Address, value:BigNumberish, data:BytesLike, operation:OPERATION, txGasEstimate:BigNumberish, baseGasEstimate:BigNumberish, gasPrice:BigNumberish, txGasToken:Address, refundReceiver:Address, nonce:BigNumberish) {
    if (!BigNumber.isBigNumber(value)) {
        value = BigNumber.from(value)
    }
    let typedData = {
        types: {
            EIP712Domain: [
                { type: "address", name: "verifyingContract" }
            ],
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
            nonce: BigNumber.from(nonce).toNumber()
        }
    }

    const addr = await signer.getAddress()
    try {
        const sig = await sendForSigning(signer, addr, typedData)
        log('signature: ', sig)
        return sig
    } catch (e) {
        console.error('error signing; ', e)
        throw e
    }
}
import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ContractFactory, Overrides } from "@ethersproject/contracts";
import type { Echo } from "../Echo";
export declare class Echo__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides): Promise<Echo>;
    getDeployTransaction(overrides?: Overrides): TransactionRequest;
    attach(address: string): Echo;
    connect(signer: Signer): Echo__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Echo;
}

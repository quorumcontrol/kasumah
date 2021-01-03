import { Signer } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import { ContractFactory, Overrides } from "@ethersproject/contracts";
import type { Multicall } from "../Multicall";
export declare class Multicall__factory extends ContractFactory {
    constructor(signer?: Signer);
    deploy(overrides?: Overrides): Promise<Multicall>;
    getDeployTransaction(overrides?: Overrides): TransactionRequest;
    attach(address: string): Multicall;
    connect(signer: Signer): Multicall__factory;
    static connect(address: string, signerOrProvider: Signer | Provider): Multicall;
}

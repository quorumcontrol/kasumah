import {  Contract, ContractTransaction, PopulatedTransaction } from "ethers";

export type Address = string

export interface Relayer {
  multisend: (txs:PopulatedTransaction[]) => Promise<ContractTransaction>
  transmit: (to:Contract, funcName:string, ...args:any) => Promise<ContractTransaction> // take a contract function, some args and return a tx hash
}

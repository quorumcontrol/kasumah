import { Contract } from "ethers";
import { FunctionFragment } from "ethers/lib/utils";
import { Relayer } from "./relayers";

export const wrapContract = <T = Contract>(
  contract: Contract,
  relayer: Relayer
): T => {
  const abi = contract.interface.fragments;

  const funcs = abi.reduce((memo, frag) => {
    if (frag.type === "function") {
      const funcFrag = frag as FunctionFragment;
      if (["payable", "nonpayable"].includes(funcFrag.stateMutability)) {
        const newFunc = async (...args: any) => {
          return relayer.transmit(contract, funcFrag.name, ...args);
        };
        memo[funcFrag.name] = newFunc;
      }
    }
    return memo;
  }, {} as Record<string, (...args: any) => any>);

  // The reason we return a new object here rather than a proxy
  // or modifying the original contract is that
  // Contract sets its properties as ReadOnly and so you cannot modify them
  // or else it throws a TypeError

  const newContract = {
    ...contract,
    ...funcs,
  };

  Object.setPrototypeOf(newContract, Contract.prototype);

  return (newContract as any) as T;
};

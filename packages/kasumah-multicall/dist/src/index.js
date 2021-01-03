"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MulticallWrapper = void 0;
const ethers_multicall_1 = require("ethers-multicall");
const ethers_1 = require("ethers");
const dataloader_1 = __importDefault(require("dataloader"));
class MulticallWrapper {
    constructor(provider, chainId) {
        this.ethcallProvider = new ethers_multicall_1.Provider(provider, chainId);
        this.dataLoader = new dataloader_1.default(this.doCalls.bind(this), { cache: false });
    }
    async doCalls(calls) {
        return this.ethcallProvider.all(calls);
    }
    async wrap(contract) {
        const abi = contract.interface.fragments;
        console.log(abi);
        const multicallContract = new ethers_multicall_1.Contract(contract.address, abi);
        const dataLoader = this.dataLoader;
        const funcs = abi.reduce((memo, frag) => {
            if (frag.type === 'function') {
                const funcFrag = frag;
                if (['pure', 'view'].includes(funcFrag.stateMutability)) {
                    const multicallFunc = multicallContract[funcFrag.name].bind(multicallContract);
                    const newFunc = (...args) => {
                        const contractCall = multicallFunc(...args);
                        return dataLoader.load(contractCall);
                    };
                    memo[funcFrag.name] = newFunc;
                }
            }
            return memo;
        }, {});
        // The reason we return a new object here rather than a proxy
        // or modifying the original contract is that
        // Contract sets its properties as ReadOnly and so you cannot modify them
        // or else it throws a TypeError
        const newContract = {
            ...contract,
            ...funcs,
        };
        Object.setPrototypeOf(newContract, ethers_1.Contract);
        return newContract;
    }
}
exports.MulticallWrapper = MulticallWrapper;
MulticallWrapper.setMulticallAddress = ethers_multicall_1.setMulticallAddress;
exports.default = MulticallWrapper;

import { Contract as MulticallContract, ContractCall, Provider, setMulticallAddress } from 'ethers-multicall'
import { Contract, providers } from 'ethers'
import { FunctionFragment } from 'ethers/lib/utils'
import DataLoader from 'dataloader'

// matic mumbai
setMulticallAddress(80001, '0x41eB847bD788F3219254371212C947793C392374')
setMulticallAddress(137, '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507')
setMulticallAddress(132333505628089, '0x905Db52890481E40552D9b7429F3419DAF8bC085')
setMulticallAddress(1032942172, '0xEF5bd9516021770d36E2E3e76737bA848AD79C26')
setMulticallAddress(1305754875840118, '0x139645624dab0027fdEeb4F23Df66a7b5cCFfE36')

export class MulticallWrapper {
    private ethcallProvider: Provider
    private dataLoader:DataLoader<ContractCall, any>

    static setMulticallAddress = setMulticallAddress

    constructor(provider:providers.Provider, chainId:number, dataLoaderOptions: DataLoader.Options<ContractCall, any> = { cache: false }) {
        this.ethcallProvider = new Provider(provider, chainId)
        this.dataLoader = new DataLoader(this.doCalls.bind(this), dataLoaderOptions)
    }

    private async doCalls(calls:readonly ContractCall[]) {
        return this.ethcallProvider.all(calls as ContractCall[])
    }

    async wrap<T=Contract>(contract:Contract) {
        return this.syncWrap<T>(contract)
    }

    // wrap was original implemented as an async function, but it is no longer needed. However, we do not want to break the interface.
    syncWrap<T=Contract>(contract:Contract) {
        const abi = contract.interface.fragments
        const multicallContract = new MulticallContract(contract.address, abi as any)
        const dataLoader = this.dataLoader

        const funcs = abi.reduce((memo, frag)=> {
            if (frag.type === 'function') {
                const funcFrag = frag as FunctionFragment
                if (['pure', 'view'].includes(funcFrag.stateMutability)) {
                    const multicallFunc = multicallContract[funcFrag.name].bind(multicallContract)
                    const newFunc = (...args:any) => {
                        const contractCall = multicallFunc(...args)
                        return dataLoader.load(contractCall)
                    }
                    memo[funcFrag.name] = newFunc
                }
            }
            return memo
        }, {} as Record<string,(...args:any)=>any>)

        // The reason we return a new object here rather than a proxy
        // or modifying the original contract is that
        // Contract sets its properties as ReadOnly and so you cannot modify them
        // or else it throws a TypeError

        const newContract = {
            ...contract,
            ...funcs,
        }
        
        return Object.setPrototypeOf(newContract, Contract.prototype) as any as T
    }
}

export default MulticallWrapper
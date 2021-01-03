import { setMulticallAddress } from 'ethers-multicall';
import { Contract, providers } from 'ethers';
export declare class MulticallWrapper {
    private ethcallProvider;
    private dataLoader;
    static setMulticallAddress: typeof setMulticallAddress;
    constructor(provider: providers.Provider, chainId: number);
    private doCalls;
    wrap<T = Contract>(contract: Contract): Promise<T>;
}
export default MulticallWrapper;

import { ethers, network } from 'hardhat'
import { expect } from 'chai'
import { Multicall } from '../types/ethers-contracts/Multicall'
import { Echo } from '../types/ethers-contracts/Echo'
import { MulticallWrapper } from '../src'
import { Contract, Provider } from 'ethers-multicall'


describe('MulticallWrapper', ()=> {
    let multicall:Multicall
    let chainId:number
    let echo:Echo

    beforeEach(async ()=> {
        chainId = network.config.chainId!

        const MulticallFactory = await ethers.getContractFactory('Multicall')
        multicall = await MulticallFactory.deploy() as Multicall
        await multicall.deployed()
        MulticallWrapper.setMulticallAddress(chainId, multicall.address)

        const EchoFactory = await ethers.getContractFactory('Echo')
        echo = await EchoFactory.deploy() as Echo
        await echo.deployed()
    })

    it('sanity works', async () => {
        const ethcallProvider = new Provider(ethers.provider, chainId)
        const wrap = new Contract(echo.address, echo.interface.fragments)
        
        const resp = await ethcallProvider.all([wrap.echo('hi')])
        expect(resp[0]).to.equal('hi')
    })

    it('wraps', async ()=> {
        const wrapper = new MulticallWrapper(ethers.provider, chainId)
        const wrappedEcho = await wrapper.wrap<Echo>(echo)
        expect(await wrappedEcho.echo('hi')).to.equal('hi')
    })
})
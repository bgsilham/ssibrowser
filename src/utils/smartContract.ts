import { useSelector } from 'react-redux'
import * as tyron from 'tyron'
import { RootState } from '../app/reducers'

function smartContract() {
    const net = useSelector((state: RootState) => state.modal.net)

    const getSmartContract = async (address: string, field: string) => {
        let network = tyron.DidScheme.NetworkNamespace.Mainnet
        if (net === 'testnet') {
            network = tyron.DidScheme.NetworkNamespace.Testnet
        }
        const init = new tyron.ZilliqaInit.default(network)
        const substate = await init.API.blockchain.getSmartContractSubState(
            address,
            field
        )
        return substate
    }

    const getSmartContractInit = async (address: string) => {
        let network = tyron.DidScheme.NetworkNamespace.Mainnet
        if (net === 'testnet') {
            network = tyron.DidScheme.NetworkNamespace.Testnet
        }
        const init = new tyron.ZilliqaInit.default(network)
        const init_ = await init.API.blockchain.getSmartContractInit(address)
        return init_
    }

    return { getSmartContract, getSmartContractInit }
}

export default smartContract

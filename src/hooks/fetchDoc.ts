import * as tyron from 'tyron'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { updateDoc } from '../store/did-doc'
import { updateLoadingDoc } from '../store/loading'
import { RootState } from '../app/reducers'
import { updateShowSearchBar } from '../store/modal'
import { $resolvedInfo, updateResolvedInfo } from '../store/resolvedInfo'
import { useStore } from 'effector-react'
import { useTranslation } from 'next-i18next'

function fetchDoc() {
    const { t } = useTranslation()
    // const zcrypto = tyron.Util.default.Zcrypto()
    const net = useSelector((state: RootState) => state.modal.net)
    const Router = useRouter()
    const resolvedInfo = useStore($resolvedInfo)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain

    const fetch = async () => {
        updateShowSearchBar(false)
        updateLoadingDoc(true)
        // const path = window.location.pathname
        //     .toLowerCase()
        //     .replace('/es', '')
        //     .replace('/cn', '')
        //     .replace('/id', '')
        //     .replace('/ru', '')
        // const usernamePath = path.split('/')[1].split('.')[0]
        // const domainPath = path.includes('.')
        //     ? path.split('/')[1].split('.')[1]
        //     : path.split('/')[2] === 'didx'
        //         ? 'did'
        //         : path.split('/')[2]
        //             ? path.split('/')[2]
        //             : 'did' // @todo-i does this mean that empty defaults to did?
        // const _username = usernamePath
        // const _domain = domainPath
        await tyron.SearchBarUtil.default
            .fetchAddr(net, username!, domain!)
            .then(async (addr) => {
                let network = tyron.DidScheme.NetworkNamespace.Mainnet
                if (net === 'testnet') {
                    network = tyron.DidScheme.NetworkNamespace.Testnet
                }
                const init = new tyron.ZilliqaInit.default(network)
                let version = await init.API.blockchain
                    .getSmartContractSubState(addr, 'version')
                    .then((substate) => {
                        return substate.result.version as string
                    })
                    .catch(() => {
                        throw new Error('Version not supported.')
                    })
                version = version.slice(0, 7)
                if (
                    version === 'xwallet' ||
                    version === 'initi--'
                ) {
                    await tyron.SearchBarUtil.default
                        .Resolve(net, addr)
                        .then(async (result: any) => {
                            const did_controller =
                                result.controller.toLowerCase()

                            updateDoc({
                                did: result.did,
                                version: result.version,
                                doc: result.doc,
                                dkms: result.dkms,
                                guardians: result.guardians,
                            })
                            updateLoadingDoc(false)
                        })
                        .catch((err) => {
                            throw err
                        })
                }
            })
            .catch(() => {
                updateLoadingDoc(false)
                setTimeout(() => {
                    toast.warning('Create a new DID.', {
                        position: 'top-right',
                        autoClose: 6000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: 'dark',
                        toastId: '1',
                    })
                }, 1000)
                Router.push(`/`)
            })
    }

    // const fetchByAddress = async () => {
    //     updateShowSearchBar(false)
    //     updateLoadingDoc(true)
    //     await tyron.SearchBarUtil.default
    //         .Resolve(net, loginInfo.address)
    //         .then(async (result: any) => {
    //             const did_controller = result.controller.toLowerCase()

    //             updateDoc({
    //                 did: result.did,
    //                 version: result.version,
    //                 doc: result.doc,
    //                 dkms: result.dkms,
    //                 guardians: result.guardians,
    //             })

    //             updateResolvedInfo({
    //                 name: loginInfo?.username,
    //                 domain: 'did',
    //                 addr: loginInfo.address!,
    //                 controller: zcrypto.toChecksumAddress(did_controller),
    //                 status: result.status,
    //             })

    //             updateLoadingDoc(false)
    //         })
    //         .catch(() => {
    //             updateLoadingDoc(false)
    //             setTimeout(() => {
    //                 toast.warning('Create a new DID.', {
    //                     position: 'top-right',
    //                     autoClose: 6000,
    //                     hideProgressBar: false,
    //                     closeOnClick: true,
    //                     pauseOnHover: true,
    //                     draggable: true,
    //                     progress: undefined,
    //                     theme: 'dark',
    //                     toastId: '1',
    //                 })
    //             }, 1000)
    //             Router.push(`/`)
    //         })
    // }

    // const fetchPause = async () => {
    //     updateShowSearchBar(false)
    //     updateLoadingDoc(true)
    //     const path = window.location.pathname
    //         .toLowerCase()
    //         .replace('/es', '')
    //         .replace('/cn', '')
    //         .replace('/id', '')
    //         .replace('/ru', '')
    //     const usernamePath = path.split('/')[1].split('.')[0]
    //     const domainPath = path.includes('.')
    //         ? path.split('/')[1].split('.')[1]
    //         : path.split('/')[2] === 'didx'
    //             ? 'did'
    //             : path.split('/')[2]
    //                 ? path.split('/')[2]
    //                 : 'did'
    //     const _username = usernamePath
    //     const _domain = domainPath
    //     await tyron.SearchBarUtil.default
    //         .fetchAddr(net, _username!, 'did')
    //         .then(async (addr) => {
    //             let network = tyron.DidScheme.NetworkNamespace.Mainnet
    //             if (net === 'testnet') {
    //                 network = tyron.DidScheme.NetworkNamespace.Testnet
    //             }
    //             const init = new tyron.ZilliqaInit.default(network)
    //             let version = await init.API.blockchain
    //                 .getSmartContractSubState(addr, 'version')
    //                 .then((substate) => {
    //                     return substate.result.version as string
    //                 })
    //                 .catch(() => {
    //                     throw new Error('Version not supported.')
    //                 })
    //             version = version.slice(0, 7)
    //             if (
    //                 version === 'xwallet' ||
    //                 version === 'initi--' ||
    //                 version === '.stake-'
    //             ) {
    //                 await tyron.SearchBarUtil.default
    //                     .Resolve(net, addr)
    //                     .then(async (result: any) => {
    //                         const did_controller =
    //                             result.controller.toLowerCase()

    //                         updateDoc({
    //                             did: result.did,
    //                             version: result.version,
    //                             doc: result.doc,
    //                             dkms: result.dkms,
    //                             guardians: result.guardians,
    //                         })

    //                         await tyron.SearchBarUtil.default
    //                             .fetchAddr(net, _username!, _domain!)
    //                             .then(async (domain_addr) => {
    //                                 const controller =
    //                                     zcrypto.toChecksumAddress(
    //                                         did_controller
    //                                     )
    //                                 if (
    //                                     controller !== loginInfo.zilAddr?.base16
    //                                 ) {
    //                                     Router.push(`/${_username}`)
    //                                     setTimeout(() => {
    //                                         toast.error(
    //                                             t(
    //                                                 'Only X’s DID Controller can access this wallet.',
    //                                                 {
    //                                                     name: _username,
    //                                                 }
    //                                             ),
    //                                             {
    //                                                 position: 'top-right',
    //                                                 autoClose: 3000,
    //                                                 hideProgressBar: false,
    //                                                 closeOnClick: true,
    //                                                 pauseOnHover: true,
    //                                                 draggable: true,
    //                                                 progress: undefined,
    //                                                 theme: 'dark',
    //                                                 toastId: 9,
    //                                             }
    //                                         )
    //                                     }, 1000)
    //                                 }
    //                                 updateResolvedInfo({
    //                                     name: _username,
    //                                     domain: _domain,
    //                                     addr: domain_addr!,
    //                                     controller: controller,
    //                                     status: result.status,
    //                                 })
    //                                 const init = new tyron.ZilliqaInit.default(
    //                                     network
    //                                 )
    //                                 init.API.blockchain
    //                                     .getSmartContractSubState(
    //                                         domain_addr,
    //                                         'paused'
    //                                     )
    //                                     .then(async (res) => {
    //                                         const paused =
    //                                             res.result.paused
    //                                                 .constructor === 'True'
    //                                         updateLoadingDoc(false)
    //                                         return paused
    //                                     })
    //                                     .catch(() => {
    //                                         updateLoadingDoc(false)
    //                                     })
    //                             })
    //                             .catch(() => {
    //                                 updateLoadingDoc(false)
    //                                 toast.error(`Uninitialized DID Domain.`, {
    //                                     position: 'top-right',
    //                                     autoClose: 3000,
    //                                     hideProgressBar: false,
    //                                     closeOnClick: true,
    //                                     pauseOnHover: true,
    //                                     draggable: true,
    //                                     progress: undefined,
    //                                     theme: 'dark',
    //                                 })
    //                                 Router.push('/')
    //                             })
    //                     })
    //                     .catch((err) => {
    //                         throw err
    //                     })
    //             }
    //         })
    //         .catch(() => {
    //             updateLoadingDoc(false)
    //             setTimeout(() => {
    //                 toast.warning('Create a new DID.', {
    //                     position: 'top-right',
    //                     autoClose: 6000,
    //                     hideProgressBar: false,
    //                     closeOnClick: true,
    //                     pauseOnHover: true,
    //                     draggable: true,
    //                     progress: undefined,
    //                     theme: 'dark',
    //                     toastId: '1',
    //                 })
    //             }, 1000)
    //             Router.push(`/`)
    //         })
    // }

    return {
        fetch,
        //fetchByAddress,
        // fetchPause,
    }
}

export default fetchDoc

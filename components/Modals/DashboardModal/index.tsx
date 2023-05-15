import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useStore } from 'effector-react'
import { toast } from 'react-toastify'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { RootState } from '../../../src/app/reducers'
import {
    $modalDashboard,
    $modalBuyNft,
    updateDashboardState,
    updateModalDashboard,
    updateModalTx,
    updateModalBuyNft,
    updateModalTxMinimized,
    updateShowSearchBar,
    updateShowZilpay,
} from '../../../src/store/modal'
import {
    setTxId,
    setTxStatusLoading,
    updateLoginInfoAddress,
    updateLoginInfoUsername,
    updateLoginInfoZilpay,
    updateLoginInfoArAddress,
} from '../../../src/app/actions'
import ZilpayIcon from '../../../src/assets/logos/lg_zilpay.svg'
import ArrowDownReg from '../../../src/assets/icons/dashboard_arrow_down_icon.svg'
import ArrowUpReg from '../../../src/assets/icons/dashboard_arrow_up_icon.svg'
import ArrowDownBlack from '../../../src/assets/icons/dashboard_arrow_down_icon_black.svg'
import ArrowUpBlack from '../../../src/assets/icons/dashboard_arrow_up_icon_black.svg'
import LogOffIconReg from '../../../src/assets/icons/log_off.svg'
import LogOffIconBlack from '../../../src/assets/icons/log_off_black.svg'
import ArConnectIcon from '../../../src/assets/logos/lg_arconnect.png'
import CloseIconReg from '../../../src/assets/icons/ic_cross.svg'
import CloseIconBlack from '../../../src/assets/icons/ic_cross_black.svg'
import AddIconReg from '../../../src/assets/icons/add_icon.svg'
import MinusIconReg from '../../../src/assets/icons/minus_icon.svg'
import AddIconBlack from '../../../src/assets/icons/add_icon_black.svg'
import MinusIconBlack from '../../../src/assets/icons/minus_icon_black.svg'
import * as tyron from 'tyron'
import useArConnect from '../../../src/hooks/useArConnect'
import { ZilPayBase } from '../../ZilPay/zilpay-base'
import { updateBuyInfo } from '../../../src/store/buyInfo'
import { useTranslation } from 'next-i18next'
import { updateLoading } from '../../../src/store/loading'
import {
    $resolvedInfo,
    updateResolvedInfo,
} from '../../../src/store/resolvedInfo'
import routerHook from '../../../src/hooks/router'
import { Arrow, Spinner } from '../..'
import smartContract from '../../../src/utils/smartContract'
import { $arconnect, updateArConnect } from '../../../src/store/arconnect'
import toastTheme from '../../../src/hooks/toastTheme'
import { updateDoc } from '../../../src/store/did-doc'
import ThreeDots from '../../Spinner/ThreeDots'

function Component() {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { connect, disconnect } = useArConnect()
    const { navigate, logOff } = routerHook()
    const { getSmartContract, getSmartContractInit } = smartContract()
    // const { verifyArConnect } = useArConnect()
    const dispatch = useDispatch()
    const Router = useRouter()
    const loginInfo = useSelector((state: RootState) => state.modal)
    const net = useSelector((state: RootState) => state.modal.net)
    const modalDashboard = useStore($modalDashboard)
    const modalBuyNft = useStore($modalBuyNft)
    const [existingUser, setExistingUsername] = useState('')
    const [existingAddr, setExistingAddr] = useState('')
    const [menu, setMenu] = useState('')
    const [subMenu, setSubMenu] = useState('')
    const [loading, setLoading] = useState(false)
    const [didDomain, setDidDomain] = useState(Array())
    const [nftUsername, setNftUsername] = useState(Array())
    const [loadingList, setLoadingList] = useState(false)
    const [loadingDidx, setLoadingDidx] = useState(false)
    const { t } = useTranslation()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const styles = isLight ? stylesLight : stylesDark
    const ArrowUp = isLight ? ArrowUpBlack : ArrowUpReg
    const ArrowDown = isLight ? ArrowDownBlack : ArrowDownReg
    const MinusIcon = isLight ? MinusIconBlack : MinusIconReg
    const AddIcon = isLight ? AddIconBlack : AddIconReg
    const LogOffIcon = isLight ? LogOffIconBlack : LogOffIconReg
    const CloseIcon = isLight ? CloseIconBlack : CloseIconReg
    const resolvedInfo = useStore($resolvedInfo)
    const resolvedDomain = resolvedInfo?.user_domain

    const handleOnChangeUsername = ({
        currentTarget: { value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        setExistingUsername(value.toLowerCase().replace(/ /g, ''))
    }

    const resolveUsername = async () => {
        setLoading(true)
        await tyron.SearchBarUtil.default
            .fetchAddr(net, 'did', existingUser)
            .then(async (addr) => {
                await tyron.SearchBarUtil.default
                    .Resolve(net, addr)
                    .then(async (result: any) => {
                        const did_controller = zcrypto.toChecksumAddress(
                            result.controller
                        )
                        if (did_controller !== loginInfo.zilAddr?.base16) {
                            setLoading(false)
                            toast.error(
                                `Only ${existingUser}'s controller wallet can log in to ${existingUser}.`,
                                {
                                    position: 'top-right',
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    progress: undefined,
                                    theme: toastTheme(isLight),
                                }
                            )
                        } else {
                            dispatch(
                                updateLoginInfoAddress(
                                    zcrypto.toChecksumAddress(addr)
                                )
                            )
                            dispatch(updateLoginInfoUsername(existingUser))
                            updateModalDashboard(false)
                            setMenu('')
                            setSubMenu('')
                            setExistingUsername('')
                            setExistingAddr('')
                            setLoading(false)
                            updateResolvedInfo({
                                user_tld: 'did',
                                user_domain: existingUser,
                                user_subdomain: '',
                                addr: addr,
                            })
                            if (!modalBuyNft) {
                                //Router.push(`/did@${existingUsername}`)
                                Router.push(`/${existingUser}.did`)
                            }
                            await connect().then(() => {
                                const arConnect = $arconnect.getState()
                                if (arConnect) {
                                    updateDashboardState('loggedIn')
                                }
                            })
                        }
                    })
            })
            .catch(() => {
                setLoading(false)
                toast.error(`Wrong username.`, {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 11,
                })
            })
    }

    const handleOnChangeAddr = (event: { target: { value: any } }) => {
        setExistingAddr(event.target.value.replace(/ /g, ''))
    }

    const resolveExistingAddr = async () => {
        const addr = tyron.Address.default.verification(existingAddr)
        if (addr !== '') {
            try {
                setLoading(true)
                const res_v = await getSmartContract(addr, 'version')
                const version = res_v!.result.version
                const res_c = await getSmartContract(addr, 'controller')
                const controller = zcrypto.toChecksumAddress(
                    res_c!.result.controller
                )
                const is_supported =
                    version.slice(0, 7) === 'xwallet' ||
                    version.slice(0, 10) === 'DIDxWALLET'
                if (!is_supported) {
                    toast.error('Unsupported version.', {
                        position: 'top-right',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                    })
                    setLoading(false)
                } else if (controller !== loginInfo.zilAddr?.base16) {
                    toast.error(
                        `Only ${existingAddr.slice(
                            0,
                            7
                        )}'s controller wallet can log in to this SSI.`,
                        {
                            position: 'top-right',
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                        }
                    )
                    setLoading(false)
                } else {
                    await connect()
                        .then(() => {
                            const arConnect = $arconnect.getState()
                            if (arConnect) {
                                updateDashboardState('loggedIn')
                            }
                            dispatch(updateLoginInfoAddress(addr))
                            updateModalDashboard(false)
                            setMenu('')
                            setSubMenu('')
                            setExistingUsername('')
                            setExistingAddr('')
                            updateShowSearchBar(false)
                            navigate('/address')
                        })
                        .catch(() => {
                            toast.error('ArConnect is missing.', {
                                position: 'top-right',
                                autoClose: 2000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: toastTheme(isLight),
                            })
                        })
                    setLoading(false)
                }
            } catch (error) {
                setLoading(false)
                toast.error(`Unsupported.`, {
                    position: 'top-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
            }
        } else {
            toast.error(t('Wrong address.'), {
                position: 'top-right',
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 1,
            })
        }
    }

    const newWallet = async (wallet: string) => {
        try {
            if (loginInfo.zilAddr !== null && net !== null) {
                const zilpay = new ZilPayBase()
                const zp = await zilpay.zilpay()
                await zp.wallet.connect()

                updateModalDashboard(false)
                dispatch(setTxStatusLoading('true'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                const arConnect = $arconnect.getState()
                switch (wallet) {
                    case 'Decentralised Finance xWALLET':
                        await zilpay
                            //.deployDomainBeta(net, resolvedDomain!)
                            .deployDomain(net, wallet, resolvedDomain!)
                            .then(async (deploy: any) => {
                                setLoading(false)

                                dispatch(setTxId(deploy[0].ID))
                                dispatch(setTxStatusLoading('submitted'))

                                let tx = await tyron.Init.default.transaction(
                                    net
                                )
                                tx = await tx.confirm(deploy[0].ID, 33)
                                if (tx.isConfirmed()) {
                                    dispatch(setTxStatusLoading('confirmed'))

                                    let link = `https://viewblock.io/zilliqa/tx/${deploy[0].ID}`
                                    if (net === 'testnet') {
                                        link = `https://viewblock.io/zilliqa/tx/${deploy[0].ID}?network=${net}`
                                    }
                                    setTimeout(() => {
                                        window.open(link)
                                    }, 1000)

                                    const txn =
                                        await tyron.Init.default.contract(
                                            deploy[0].ID,
                                            net
                                        )
                                    let addr = '0x' + txn //deploy[0].ContractAddress
                                    addr = zcrypto.toChecksumAddress(addr)

                                    // updateDonation(null)
                                    // updateDomainAddr(addr)
                                    // updateDomainLegend2('saved')
                                } else if (tx.isRejected()) {
                                    dispatch(setTxStatusLoading('failed'))
                                    setTimeout(() => {
                                        toast.error(t('Transaction failed.'), {
                                            position: 'bottom-right',
                                            autoClose: 4000,
                                            hideProgressBar: false,
                                            closeOnClick: true,
                                            pauseOnHover: true,
                                            draggable: true,
                                            progress: undefined,
                                            theme: toastTheme(isLight),
                                            toastId: 4,
                                        })
                                    }, 1000)
                                }
                            })
                            .catch((error) => {
                                throw error
                            })
                        break
                    default:
                        await zilpay
                            .deployDid(
                                net,
                                loginInfo.zilAddr?.base16,
                                arConnect
                            )
                            .then(async (deploy: any) => {
                                dispatch(setTxId(deploy[0].ID))
                                dispatch(setTxStatusLoading('submitted'))

                                let tx = await tyron.Init.default.transaction(
                                    net
                                )
                                tx = await tx.confirm(deploy[0].ID, 33)
                                if (tx.isConfirmed()) {
                                    dispatch(setTxStatusLoading('confirmed'))
                                    let link = `https://viewblock.io/zilliqa/tx/${deploy[0].ID}`
                                    if (net === 'testnet') {
                                        link = `https://viewblock.io/zilliqa/tx/${deploy[0].ID}?network=${net}`
                                    }
                                    setTimeout(() => {
                                        window.open(link)
                                    }, 1000)
                                    const txn =
                                        await tyron.Init.default.contract(
                                            deploy[0].ID,
                                            net
                                        )
                                    let new_ssi = '0x' + txn
                                    new_ssi = zcrypto.toChecksumAddress(new_ssi)
                                    updateBuyInfo(null)
                                    dispatch(updateLoginInfoUsername(null!))
                                    dispatch(updateLoginInfoAddress(new_ssi))
                                    updateDashboardState('loggedIn')
                                    // updateModalTx(false)
                                    updateModalBuyNft(false)
                                    Router.push('/address')
                                } else if (tx.isRejected()) {
                                    // setLoadingSsi(false)
                                    dispatch(setTxStatusLoading('failed'))
                                }
                            })
                            .catch((error) => {
                                throw error
                            })
                        break
                }
            } else {
                toast.warn('Connect your ZilPay wallet.', {
                    position: 'bottom-left',
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 2,
                })
            }
        } catch (error) {
            dispatch(setTxStatusLoading('rejected'))
            updateModalTxMinimized(false)
            updateModalTx(true)
            toast.error(String(error), {
                position: 'bottom-right',
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: toastTheme(isLight),
                toastId: 3,
            })
        }
    }

    const continueLogIn = () => {
        if (existingUser === '') {
            resolveExistingAddr()
        } else {
            resolveUsername()
        }
    }

    const handleOnKeyPress = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            continueLogIn()
        }
    }

    const menuActive = async (val: React.SetStateAction<string>) => {
        if (val === menu) {
            setMenu('')
        } else {
            if (val === 'didDomains') {
                setLoadingList(true)
                setMenu(val)
                const addr = await tyron.SearchBarUtil.default.fetchAddr(
                    net,
                    'did',
                    loginInfo.username
                )
                getSmartContract(addr, 'did_domain_dns').then(async (res) => {
                    const key = Object.keys(res!.result.did_domain_dns)
                    setDidDomain(key)
                })
                setTimeout(() => {
                    setLoadingList(false)
                }, 1000)
            } else if (val === 'nftUsername') {
                setLoadingList(true)
                setMenu(val)
                const addr = await tyron.SearchBarUtil.default.fetchAddr(
                    net,
                    'did',
                    'init'
                )
                // const get_services = await getSmartContract(addr, 'services')
                // const services = await tyron.SmartUtil.default.intoMap(
                //     get_services.result.services
                // )
                // getSmartContract(services.get('init'), 'did_dns')
                let init
                const init_: any = await getSmartContractInit(addr)
                const init__ = init_.result
                for (let i = 0; i < init__.length; i += 1) {
                    if (init__[i].vname === 'init') {
                        init = init__[i].value
                    }
                }
                getSmartContract(init, 'did_dns').then(async (res) => {
                    console.log('@@', res)
                    const val = Object.values(res!.result.did_dns)
                    const key = Object.keys(res!.result.did_dns)
                    let list: any = []
                    for (let i = 0; i < val.length; i += 1) {
                        if (val[i] === loginInfo.address.toLowerCase()) {
                            list.push(key[i])
                        }
                    }
                    setNftUsername(list)
                })
                setTimeout(() => {
                    setLoadingList(false)
                }, 1000)
            } else {
                setMenu(val)
            }
        }
    }

    const subMenuActive = (val: React.SetStateAction<string>) => {
        if (val === subMenu) {
            setSubMenu('')
        } else {
            setSubMenu(val)
        }
    }

    const resolveDid = async (this_domain: string, this_tld: string) => {
        updateLoading(true)
        await tyron.SearchBarUtil.default
            .fetchAddr(net, this_tld, this_domain)
            .then(async (addr) => {
                const res = await getSmartContract(addr, 'version')
                updateResolvedInfo({
                    user_tld: this_tld,
                    user_domain: this_domain,
                    user_subdomain: '',
                    addr: addr,
                    version: res!.result.version,
                })
                //@todo-x we need a way to avoid this repeated switch

                let subdomain = ''
                if (this_tld === 'did') {
                    subdomain = 'did'
                }

                const version = res!.result.version.slice(0, 7)
                switch (version.toLowerCase()) {
                    case 'didxwal':
                        Router.push(`/${subdomain}@${this_domain}`)
                        break
                    case 'xwallet':
                        Router.push(`/${subdomain}@${this_domain}`)
                        break
                    case '.stake-':
                        Router.push(`/${subdomain}@${this_domain}/zil`)
                        break
                    case 'zilstak':
                        Router.push(`/${subdomain}@${this_domain}/zil`)
                        break
                    case 'zilxwal':
                        Router.push(`/${subdomain}@${this_domain}/zil`)
                        break
                    case 'vcxwall':
                        Router.push(`/${subdomain}@${this_domain}/sbt`)
                        break
                    case 'sbtxwal':
                        Router.push(`/${subdomain}@${this_domain}/sbt`)
                        break
                    case 'airxwal':
                        Router.push(`/${subdomain}@${this_domain}/airx`)
                        break
                    default:
                        Router.push(`/resolvedAddress`)
                    // @todo-x
                    // Router.push(`/did@${_username}`)
                    // updateResolvedInfo({
                    //     name: _username,
                    //     domain: 'did',
                    //     addr: addr,
                    //     version: res.result.version,
                    // })
                    // setTimeout(() => {
                    //     toast.error('Unsupported dapp.', {
                    //         position: 'top-right',
                    //         autoClose: 3000,
                    //         hideProgressBar: false,
                    //         closeOnClick: true,
                    //         pauseOnHover: true,
                    //         draggable: true,
                    //         progress: undefined,
                    //         theme: toastTheme(isLight),
                    //     })
                    // }, 1000)
                }
                updateLoading(false)
            })
            .catch((err) => {
                toast.error(String(err), {
                    position: 'top-right',
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                })
                updateLoading(false)
            })
    }

    const goToDidx = async () => {
        updateShowSearchBar(false)
        setLoadingDidx(true)
        //@todo-x we dont need to fetch the address again since it is in the resolved info
        await tyron.SearchBarUtil.default
            .fetchAddr(net, 'did', loginInfo?.username)
            .then(async (addr) => {
                let res = await getSmartContract(addr, 'version')
                const version = res!.result.version.slice(0, 7).toLowerCase()
                if (
                    version === 'didxwal' ||
                    version === 'xwallet' ||
                    version === 'initi--' ||
                    version === 'initdap'
                ) {
                    await tyron.SearchBarUtil.default
                        .Resolve(net, addr)
                        .then(async (result: any) => {
                            const did_controller = zcrypto.toChecksumAddress(
                                result.controller
                            )
                            updateDoc({
                                did: result.did,
                                controller: did_controller,
                                version: result.version,
                                doc: result.doc,
                                dkms: result.dkms,
                                guardians: result.guardians,
                            })
                            setLoadingDidx(false)
                            updateModalDashboard(false)
                            navigate(`/${loginInfo.username}.did/didx/wallet`)
                        })
                        .catch((err) => {
                            throw err
                        })
                }
            })
            .catch(async () => {
                setLoadingDidx(false)
                try {
                    await tyron.SearchBarUtil.default.fetchAddr(
                        net,
                        '',
                        loginInfo.username
                    )
                    setTimeout(() => {
                        toast.warn('Create a new DIDxWALLET.', {
                            position: 'bottom-left',
                            autoClose: 4000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                            theme: toastTheme(isLight),
                            toastId: '1',
                        })
                    }, 1000)
                    //navigate(`/did@${loginInfo.username}`)
                    navigate(`${loginInfo.username}.did`)
                } catch (error) {
                    Router.push(`/`)
                }
                setLoadingDidx(false)
            })
    }

    useEffect(() => {
        return () => {
            updateModalDashboard(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const spinner = <Spinner />

    if (!modalDashboard) {
        return null
    }

    return (
        <>
            <div className={styles.outerWrapper}>
                <div
                    className={styles.containerClose}
                    onClick={() => {
                        setMenu('')
                        updateModalDashboard(false)
                    }}
                />
                <div className={styles.container}>
                    <div className={styles.wrapperCloseIco}>
                        <div
                            onClick={() => updateModalDashboard(false)}
                            className="closeIcon"
                        >
                            <Image
                                alt="ico-close"
                                src={CloseIcon}
                                width={15}
                                height={15}
                            />
                        </div>
                    </div>
                    <div className={styles.loggedInInfo}>
                        {loginInfo.address !== null ? (
                            <>
                                <h6 className={styles.title1}>
                                    {t('YOU_HAVE_LOGGED_IN_SSI')}
                                </h6>
                                <div className={styles.addrWrapper}>
                                    {loginInfo.username ? (
                                        <>
                                            <div
                                                style={{
                                                    marginTop: '20px',
                                                    marginBottom: '20px',
                                                }}
                                                className={styles.addrSsi}
                                                onClick={goToDidx}
                                            >
                                                {loadingDidx ? (
                                                    <span
                                                        className={
                                                            styles.txtDomain
                                                        }
                                                    >
                                                        <ThreeDots color="basic" />
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={
                                                            styles.txtDomain
                                                        }
                                                    >
                                                        DIDxWALLET
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: '20px',
                                                    marginBottom: '20px',
                                                }}
                                                className={styles.txtDomain}
                                            >
                                                <div className={styles.addr}>
                                                    {/* <span>ID: </span> */}
                                                    <a
                                                        className={
                                                            styles.txtDomain
                                                        }
                                                        href={
                                                            net === 'testnet'
                                                                ? `https://viewblock.io/zilliqa/address/${zcrypto.toBech32Address(
                                                                      loginInfo?.address
                                                                  )}?network=${net}`
                                                                : `https://viewblock.io/zilliqa/address/${zcrypto.toBech32Address(
                                                                      loginInfo?.address
                                                                  )}`
                                                        }
                                                        rel="noreferrer"
                                                        target="_blank"
                                                    >
                                                        <span
                                                            className={
                                                                styles.txtDomain
                                                            }
                                                        >
                                                            Block Explorer
                                                            {/* did:tyron:zil:0x...
                                                            {loginInfo.address.slice(
                                                                -10
                                                            )} */}
                                                        </span>
                                                    </a>
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: '20px',
                                                    marginBottom: '20px',
                                                }}
                                                className={styles.txtDomain}
                                            >
                                                <span
                                                    onClick={() => {
                                                        resolveDid(
                                                            loginInfo.username,
                                                            'did'
                                                        )
                                                        updateModalDashboard(
                                                            false
                                                        )
                                                    }}
                                                >
                                                    {loginInfo?.username}
                                                    .did
                                                </span>{' '}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: '20px',
                                                    marginBottom: '20px',
                                                }}
                                                className={styles.txtDomain}
                                            >
                                                <span
                                                    onClick={() => {
                                                        resolveDid(
                                                            loginInfo.username,
                                                            ''
                                                        )
                                                        updateModalDashboard(
                                                            false
                                                        )
                                                    }}
                                                >
                                                    {loginInfo?.username}
                                                    .ssi
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={styles.addrSsi}>
                                            <a
                                                className={styles.txtDomain}
                                                onClick={() => {
                                                    updateModalDashboard(false)
                                                    updateShowSearchBar(false)
                                                    navigate('/address')
                                                }}
                                            >
                                                <span
                                                    className={styles.txtDomain}
                                                >
                                                    did:tyron:zil...
                                                    {loginInfo.address.slice(
                                                        -10
                                                    )}
                                                </span>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <></>
                        )}
                        {loginInfo?.username !== null && (
                            <>
                                <div
                                    className={styles.toggleMenuWrapper2}
                                    onClick={() => menuActive('nftUsername')}
                                >
                                    <div className={styles.txtList}>
                                        {t('NFT USERNAMES')}
                                    </div>
                                    <div className={styles.arrowIco}>
                                        <Image
                                            alt="arrow-ico"
                                            src={
                                                menu === 'nftUsername'
                                                    ? ArrowUp
                                                    : ArrowDown
                                            }
                                        />
                                    </div>
                                </div>
                                {menu === 'nftUsername' && (
                                    <div
                                        style={{
                                            marginLeft: '6%',
                                            marginBottom: '7%',
                                        }}
                                    >
                                        {loadingList ? (
                                            spinner
                                        ) : (
                                            <>
                                                {nftUsername.length > 0 ? (
                                                    <div>
                                                        <p
                                                            style={{
                                                                fontSize:
                                                                    '14px',
                                                            }}
                                                        >
                                                            Your DIDxWALLET
                                                            holds{' '}
                                                            {nftUsername.length}{' '}
                                                            <span
                                                                className={
                                                                    styles.addrSsi
                                                                }
                                                            >
                                                                domains
                                                            </span>
                                                        </p>
                                                        {/* {nftUsername?.map(
                                                            (val) => (
                                                                <div
                                                                    onClick={() => {
                                                                        resolveDid(
                                                                            val,
                                                                            'did'
                                                                        )
                                                                        updateModalDashboard(
                                                                            false
                                                                        )
                                                                    }}
                                                                    key={val}
                                                                    className={
                                                                        styles.txtDomainList
                                                                    }
                                                                >
                                                                    {val}
                                                                </div>
                                                            )
                                                        )} */}
                                                    </div>
                                                ) : (
                                                    <p
                                                        style={{
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        No other NFT
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                                <div
                                    className={styles.toggleMenuWrapper2}
                                    onClick={() => menuActive('didDomains')}
                                >
                                    <div className={styles.txtList}>
                                        {t('SUBDOMAINS')}
                                    </div>
                                    <div className={styles.arrowIco}>
                                        <Image
                                            alt="arrow-ico"
                                            src={
                                                menu === 'didDomains'
                                                    ? ArrowUp
                                                    : ArrowDown
                                            }
                                        />
                                    </div>
                                </div>
                                {menu === 'didDomains' && (
                                    <div
                                        style={{
                                            marginLeft: '6%',
                                            marginBottom: '7%',
                                        }}
                                    >
                                        {loadingList ? (
                                            spinner
                                        ) : (
                                            <>
                                                {didDomain.length > 0 ? (
                                                    <div>
                                                        {didDomain?.map(
                                                            (val) => (
                                                                <div
                                                                    onClick={() => {
                                                                        resolveDid(
                                                                            loginInfo.username,
                                                                            val
                                                                        )
                                                                        updateModalDashboard(
                                                                            false
                                                                        )
                                                                    }}
                                                                    key={val}
                                                                    className={
                                                                        styles.txtDomainList
                                                                    }
                                                                >
                                                                    {val}@
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p
                                                        style={{
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        {t('DID_NO_DOMAINS')}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {loginInfo.address !== null && (
                        <>
                            <div
                                className={styles.toggleHeaderWrapper}
                                onClick={() => subMenuActive('newUsers')}
                            >
                                <h6
                                    style={{ textTransform: 'none' }}
                                    className={styles.title2}
                                >
                                    NEW xWALLET
                                    {/* {t('NEW_SSI')} @todo-t */}
                                </h6>
                                <div className={styles.addIcon}>
                                    <Image
                                        alt="arrow-ico"
                                        src={
                                            subMenu === 'newUsers'
                                                ? MinusIcon
                                                : AddIcon
                                        }
                                    />
                                </div>
                            </div>
                            {subMenu === 'newUsers' && (
                                <>
                                    <div className={styles.newSsiSub}>
                                        {t('DEPLOY_NEW_SSI')}:
                                    </div>
                                    <div className={styles.wrapperNewWallet}>
                                        <div
                                            style={{
                                                width: '100%',
                                                marginTop: '0.5rem',
                                            }}
                                            onClick={() => newWallet('DIDx')}
                                            className={
                                                isLight
                                                    ? 'actionBtnLight'
                                                    : 'actionBtn'
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.txtBtnNewWallet
                                                }
                                            >
                                                {t('CREATE_SSI')}
                                            </div>
                                        </div>
                                        {/* <h5 className={styles.titleGas}>
                                        {t('GAS_AROUND')} 1 ZIL @todo-t decidir que info dar con respecto al gas
                                    </h5> */}
                                        <div
                                            style={{
                                                width: '100%',
                                                marginTop: '0.5rem',
                                            }}
                                            onClick={() =>
                                                newWallet(
                                                    'Decentralised Finance xWALLET'
                                                )
                                            }
                                            className={
                                                isLight
                                                    ? 'actionBtnLight'
                                                    : 'actionBtn'
                                            }
                                        >
                                            <div
                                                className={
                                                    styles.txtBtnNewWallet
                                                }
                                            >
                                                DEFIxWALLET
                                                {/* {t('CREATE_SSI')} @todo-t */}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    <div className={styles.headerWrapper}>
                        <div
                            className={styles.toggleHeaderWrapper}
                            onClick={() => {
                                updateShowZilpay(true)
                                menuActive('eoa')
                            }}
                        >
                            <h6 className={styles.title2}>
                                WEB3 WALLETS
                                {/* {t('EXTERNAL_WALLETS')} @todo-t */}
                            </h6>
                            <div className={styles.addIcon}>
                                <Image
                                    alt="arrow-ico"
                                    src={menu === 'eoa' ? MinusIcon : AddIcon}
                                />
                            </div>
                        </div>
                        {menu === 'eoa' && (
                            <>
                                <div className={styles.wrapperEoa}>
                                    <Image
                                        width={25}
                                        height={25}
                                        src={ZilpayIcon}
                                        alt="zilpay-ico"
                                    />
                                    <div className={styles.txtEoa}>
                                        {t('ZILLIQA_WALLET')}
                                    </div>
                                    <div
                                        onClick={() => logOff()}
                                        className={styles.txtDisconnect}
                                    >
                                        {/** @todo-x remove zilpay connection */}
                                        {t('DISCONNECT')}
                                    </div>
                                </div>
                                <div
                                    style={{
                                        marginTop: '1%',
                                        marginBottom: '5%',
                                        marginLeft: '3%',
                                    }}
                                >
                                    <a
                                        href={
                                            net === 'testnet'
                                                ? `https://viewblock.io/zilliqa/address/${loginInfo.zilAddr?.bech32}?network=${net}`
                                                : `https://viewblock.io/zilliqa/address/${loginInfo.zilAddr?.bech32}`
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.txtAddress}
                                    >
                                        {loginInfo.zilAddr?.bech32}
                                    </a>
                                </div>
                                {loginInfo.arAddr ? (
                                    <>
                                        <div className={styles.wrapperEoa}>
                                            <Image
                                                width={25}
                                                height={25}
                                                src={ArConnectIcon}
                                                alt="arconnect-ico"
                                            />
                                            <div className={styles.txtEoa}>
                                                {t('ARWEAVE_WALLET')}
                                            </div>
                                            <div
                                                onClick={() => disconnect()}
                                                className={styles.txtDisconnect}
                                            >
                                                {t('DISCONNECT')}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                marginTop: '1%',
                                                marginLeft: '3%',
                                            }}
                                        >
                                            <div
                                                style={{ marginBottom: '2rem' }}
                                                onClick={() =>
                                                    window.open(
                                                        `https://viewblock.io/arweave/address/${loginInfo.arAddr}`
                                                    )
                                                }
                                                className={styles.txtAddress}
                                            >
                                                {loginInfo.arAddr}{' '}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        style={{ marginBottom: '5%' }}
                                        className={styles.wrapperEoa}
                                    >
                                        <button
                                            onClick={connect}
                                            className={`button small ${
                                                isLight
                                                    ? toastTheme(isLight)
                                                    : 'secondary'
                                            }`}
                                        >
                                            <span
                                                className={
                                                    styles.txtBtnArConnect
                                                }
                                            >
                                                {t('CONNECT_WITH_ARCONNECT')}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    {loginInfo.address === null && (
                        <div className={styles.topLoginWrapper}>
                            <div
                                className={styles.toggleHeaderWrapper}
                                onClick={() => menuActive('login')}
                            >
                                <h6 className={styles.title2}>{t('LOG_IN')}</h6>
                                <div className={styles.addIcon}>
                                    <Image
                                        alt="arrow-ico"
                                        src={
                                            menu === 'login'
                                                ? MinusIcon
                                                : AddIcon
                                        }
                                    />
                                </div>
                            </div>
                            {menu === 'login' && (
                                <div className={styles.loginWrapper}>
                                    <div
                                        className={styles.toggleMenuWrapper}
                                        onClick={() =>
                                            subMenuActive('existingUsers')
                                        }
                                    >
                                        <div className={styles.title3}>
                                            {t('EXISTING_USER')}
                                        </div>
                                        <div className={styles.arrowIco}>
                                            <Image
                                                alt="arrow-ico"
                                                src={
                                                    subMenu === 'existingUsers'
                                                        ? ArrowUp
                                                        : ArrowDown
                                                }
                                            />
                                        </div>
                                    </div>
                                    {subMenu === 'existingUsers' && (
                                        <div
                                            style={{
                                                marginBottom: '5%',
                                                marginLeft: '6%',
                                            }}
                                        >
                                            <div
                                                className={styles.inputWrapper}
                                            >
                                                <h5 className={styles.txtInput}>
                                                    {t('NFT_USERNAME')}
                                                </h5>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <input
                                                        disabled={
                                                            existingAddr !== ''
                                                        }
                                                        value={existingUser}
                                                        onChange={
                                                            handleOnChangeUsername
                                                        }
                                                        onKeyPress={
                                                            handleOnKeyPress
                                                        }
                                                        className={
                                                            existingAddr !== ''
                                                                ? styles.inputDisabled
                                                                : styles.input
                                                        }
                                                    />
                                                    <div
                                                        style={{
                                                            marginLeft: '5%',
                                                            display: 'flex',
                                                        }}
                                                        onClick={continueLogIn}
                                                    >
                                                        {loading &&
                                                        existingAddr === '' ? (
                                                            <>{spinner}</>
                                                        ) : (
                                                            <Arrow />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <h6 className={styles.txtOr}>
                                                {t('OR')}
                                            </h6>
                                            <div
                                                className={styles.inputWrapper}
                                            >
                                                <h5 className={styles.txtInput}>
                                                    {t('ADDRESS')}
                                                </h5>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <input
                                                        disabled={
                                                            existingUser !== ''
                                                        }
                                                        value={existingAddr}
                                                        onChange={
                                                            handleOnChangeAddr
                                                        }
                                                        onKeyPress={
                                                            handleOnKeyPress
                                                        }
                                                        className={
                                                            existingUser !== ''
                                                                ? styles.inputDisabled
                                                                : styles.input
                                                        }
                                                    />
                                                    <div
                                                        style={{
                                                            marginLeft: '5%',
                                                            display: 'flex',
                                                        }}
                                                        onClick={continueLogIn}
                                                    >
                                                        {loading &&
                                                        existingUser === '' ? (
                                                            <>{spinner}</>
                                                        ) : (
                                                            <Arrow />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className={styles.toggleMenuWrapper}
                                        onClick={() =>
                                            subMenuActive('newUsers')
                                        }
                                    >
                                        <div className={styles.title3}>
                                            {t('NEW_USER_CREATE_SSI')}
                                        </div>
                                        <div className={styles.arrowIco}>
                                            <Image
                                                alt="arrow-ico"
                                                src={
                                                    subMenu === 'newUsers'
                                                        ? ArrowUp
                                                        : ArrowDown
                                                }
                                            />
                                        </div>
                                    </div>
                                    {subMenu === 'newUsers' && (
                                        <div className={styles.wrapperNewSsi}>
                                            <div className={styles.newSsiSub}>
                                                {t('DEPLOY_NEW_SSI')}:
                                            </div>
                                            <div
                                                style={{
                                                    width: '100%',
                                                    marginTop: '0.5rem',
                                                }}
                                                onClick={async () => {
                                                    // if (
                                                    //     arConnect === null
                                                    // ) {
                                                    //     verifyArConnect(
                                                    //         toast.warning(
                                                    //             'Connect with ArConnect for more features.',
                                                    //             {
                                                    //                 position:
                                                    //                     'top-center',
                                                    //                 autoClose: 2000,
                                                    //                 hideProgressBar:
                                                    //                     false,
                                                    //                 closeOnClick:
                                                    //                     true,
                                                    //                 pauseOnHover:
                                                    //                     true,
                                                    //                 draggable:
                                                    //                     true,
                                                    //                 progress:
                                                    //                     undefined,
                                                    //                 theme: toastTheme(
                                                    //                     isLight
                                                    //                 ),
                                                    //                 toastId: 5,
                                                    //             }
                                                    //         )
                                                    //     )
                                                    // } else {
                                                    //     // create newSsi with or without arconnect: even when user have arconnect installed, user can create new ssi without arconnect?
                                                    //     newSsi
                                                    // }
                                                    // verifyArConnect(
                                                    //     newSsi(arConnect)
                                                    // )
                                                    await connect().then(() => {
                                                        newWallet('DIDx')
                                                    })
                                                }}
                                                className={
                                                    isLight
                                                        ? 'actionBtnLight'
                                                        : 'actionBtn'
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.txtBtnNewWallet
                                                    }
                                                >
                                                    {t('CREATE_SSI')}
                                                </div>
                                            </div>
                                            <h5 className={styles.titleGas}>
                                                {t('GAS_AROUND')} 1 ZIL
                                            </h5>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {loginInfo.address !== null && (
                        <div onClick={logOff} className={styles.wrapperLogout}>
                            <div className={styles.logOffIco}>
                                <Image alt="log-off" src={LogOffIcon} />
                            </div>
                            <div
                                className={styles.txt}
                                style={{
                                    marginLeft: '5%',
                                    marginTop: '-2px',
                                }}
                            >
                                {t('LOG_OFF')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Component

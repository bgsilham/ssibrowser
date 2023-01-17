/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from 'react'
import * as tyron from 'tyron'
import Image from 'next/image'
import stylesDark from './styles.module.scss'
import stylesLight from './styleslight.module.scss'
import { useStore } from 'effector-react'
import { $resolvedInfo } from '../../../../../../../src/store/resolvedInfo'
import { useTranslation } from 'next-i18next'
import routerHook from '../../../../../../../src/hooks/router'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../../../../../src/app/reducers'
import ThreeDots from '../../../../../../Spinner/ThreeDots'
import {
    $donation,
    updateDonation,
} from '../../../../../../../src/store/donation'
import { toast } from 'react-toastify'
import toastTheme from '../../../../../../../src/hooks/toastTheme'
import TickIco from '../../../../../../../src/assets/icons/tick.svg'
import Selector from '../../../../../../Selector'
import {
    AddFunds,
    Arrow,
    Donate,
    ModalImg,
    SearchBarWallet,
    Spinner,
} from '../../../../../..'
import { ZilPayBase } from '../../../../../../ZilPay/zilpay-base'
import {
    setTxId,
    setTxStatusLoading,
} from '../../../../../../../src/app/actions'
import {
    updateModalTx,
    updateModalTxMinimized,
} from '../../../../../../../src/store/modal'
import smartContract from '../../../../../../../src/utils/smartContract'
import defaultCheckmarkLight from '../../../../../../../src/assets/icons/default_checkmark.svg'
import defaultCheckmarkDark from '../../../../../../../src/assets/icons/default_checkmark_black.svg'
import selectedCheckmarkDark from '../../../../../../../src/assets/icons/selected_checkmark.svg'
import selectedCheckmarkLight from '../../../../../../../src/assets/icons/selected_checkmark_purple.svg'
import AddIconBlack from '../../../../../../../src/assets/icons/add_icon_black.svg'
import AddIconReg from '../../../../../../../src/assets/icons/add_icon.svg'
import * as fetch_ from '../../../../../../../src/hooks/fetch'
import { $buyInfo, updateBuyInfo } from '../../../../../../../src/store/buyInfo'

function Component({ addrName }) {
    const zcrypto = tyron.Util.default.Zcrypto()
    const { getSmartContract } = smartContract()
    const { fetchLexica, fetchWalletBalance } = fetch_.default()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const resolvedInfo = useStore($resolvedInfo)
    const donation = useStore($donation)
    const buyInfo = useStore($buyInfo)
    const net = useSelector((state: RootState) => state.modal.net)
    const loginInfo = useSelector((state: RootState) => state.modal)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const domainNavigate = domain !== '' ? domain + '@' : ''
    const { navigate } = routerHook()
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const AddIcon = isLight ? AddIconBlack : AddIconReg
    const styles = isLight ? stylesLight : stylesDark
    const defaultCheckmark = isLight
        ? defaultCheckmarkDark
        : defaultCheckmarkLight
    const selectedCheckmark = isLight
        ? selectedCheckmarkLight
        : selectedCheckmarkDark
    const [txName, setTxName] = useState('')
    const [addr, setAddr] = useState('')
    const [gzil, setGzil] = useState('')
    const [savedAddr, setSavedAddr] = useState(false)
    const [savedGzil, setSavedGzil] = useState(false)
    const [recipient, setRecipient] = useState('')
    const [otherRecipient, setOtherRecipient] = useState('')
    const [loading, setLoading] = useState(false)
    const [loadingGzil, setLoadingGzil] = useState(false)
    const [loadingSubmit, setLoadingSubmit] = useState(false)
    const [usernameInput, setUsernameInput] = useState('')
    const [gzilInput, setGzilInput] = useState('')
    const [nftInput, setNftInput] = useState('')
    const [nftLoading, setNftLoading] = useState(false)
    const [nftList, setNftList] = useState([])
    const [selectedNft, setSelectedNft] = useState('')
    const [showModalImg, setShowModalImg] = useState(false)
    const [dataModalImg, setDataModalImg] = useState('')
    const [loadingPayment, setLoadingPayment] = useState(false)
    const [loadingBalance, setLoadingBalance] = useState(false)

    const handleInputAdddr = (event: { target: { value: any } }) => {
        setSavedAddr(false)
        setAddr(event.target.value)
    }

    const handleInputLexica = (event: { target: { value: any } }) => {
        setSelectedNft('')
        setNftList([])
        setNftInput(event.target.value)
    }

    const saveAddr = () => {
        const addr_ = tyron.Address.default.verification(addr)
        if (addr_ !== '') {
            setAddr(addr)
            setSavedAddr(true)
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
                toastId: 5,
            })
        }
    }

    const searchLexica = async () => {
        setNftLoading(true)
        const lexicaList = await fetchLexica()
        await fetch(`https://lexica.art/api/v1/search?q=${nftInput}`)
            .then((response) => response.json())
            .then((data) => {
                setNftLoading(false)
                let filteredData: any = Array()
                for (let i = 0; i < data.images.length; i += 1) {
                    if (!lexicaList?.some((arr) => arr === data.images[i].id)) {
                        filteredData.push(data.images[i])
                    }
                }
                let shuffled = filteredData
                    .map((value) => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value)
                // setTydra(data.resource)
                console.log(shuffled.slice(0, 10))
                setNftList(shuffled.slice(0, 10))
            })
            .catch(() => {
                setNftLoading(false)
            })
    }

    const handleOnKeyPressAddr = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            saveAddr()
        }
    }

    const handleOnKeyPressLexica = ({
        key,
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            searchLexica()
        }
    }

    const onChangeRecipient = (value: string) => {
        updateDonation(null)
        updateBuyInfo(null)
        setAddr('')
        setSavedAddr(false)
        setRecipient(value)
    }

    const onChangeTypeOther = (value: string) => {
        updateDonation(null)
        setAddr('')
        setSavedAddr(false)
        setOtherRecipient(value)
    }

    const handleInput = ({
        currentTarget: { value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        updateDonation(null)
        setSavedAddr(false)
        setAddr('')
        setUsernameInput(value)
    }

    const handleInputGzil = ({
        currentTarget: { value },
    }: React.ChangeEvent<HTMLInputElement>) => {
        updateDonation(null)
        updateBuyInfo(null)
        setSavedGzil(false)
        setGzil('')
        setGzilInput(value)
    }

    const toggleSelectNft = (val) => {
        if (selectedNft === val) {
            setSelectedNft('')
        } else {
            setSelectedNft(val)
        }
    }

    const resolveUsername = async (type: string) => {
        let input: string
        if (type === '.gzil') {
            setLoadingGzil(true)
            input = gzilInput.replace(/ /g, '')
        } else {
            setLoading(true)
            input = usernameInput.replace(/ /g, '')
        }
        let username = input.toLowerCase()
        if (type === '.gzil') {
            username = username.replace('.gzil', '')
        }
        let domain = ''
        if (input.includes('@')) {
            username = input
                .split('@')[1]
                .replace('.did', '')
                .replace('.ssi', '')
                .toLowerCase()
            domain = input.split('@')[0]
        } else if (input.includes('.')) {
            if (input.split('.')[1] === 'did') {
                username = input.split('.')[0].toLowerCase()
                domain = 'did'
            } else if (input.split('.')[1] === 'ssi') {
                username = input.split('.')[0].toLowerCase()
            } else {
                throw Error()
            }
        }
        if (type !== '.gzil') {
            const domainId =
                '0x' + (await tyron.Util.default.HashString(username))
            await tyron.SearchBarUtil.default
                .fetchAddr(net, domainId, domain)
                .then(async (addr) => {
                    if (type === '.gzil') {
                        setGzil(username)
                        setSavedGzil(true)
                    } else {
                        addr = zcrypto.toChecksumAddress(addr)
                        setAddr(addr)
                        setSavedAddr(true)
                    }
                })
                .catch(() => {
                    toast.error('Identity verification unsuccessful.', {
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
        } else {
            setGzil(username)
            setSavedGzil(true)
        }
        if (type === '.gzil') {
            setLoadingGzil(false)
        } else {
            setLoading(false)
        }
    }

    const handleOnChangePayment = async (value: any) => {
        updateDonation(null)
        updateBuyInfo({
            recipientOpt: buyInfo?.recipientOpt,
            anotherAddr: buyInfo?.anotherAddr,
            currency: undefined,
            currentBalance: undefined,
            isEnough: undefined,
        })
        if (value !== '') {
            updateBuyInfo({
                recipientOpt: buyInfo?.recipientOpt,
                anotherAddr: buyInfo?.anotherAddr,
                currency: value,
                currentBalance: 0,
                isEnough: false,
            })
            setLoadingPayment(true)
            try {
                const init_addr = await tyron.SearchBarUtil.default.fetchAddr(
                    net,
                    'init',
                    'did'
                )
                if (value === 'FREE') {
                    const get_freelist = await getSmartContract(
                        init_addr!,
                        'free_list'
                    )
                    const freelist: Array<string> =
                        get_freelist.result.free_list
                    const is_free = freelist.filter(
                        (val) => val === loginInfo.zilAddr.base16.toLowerCase()
                    )
                    if (is_free.length === 0) {
                        throw new Error('You are not on the free list')
                    }
                    toast("Congratulations! You're a winner, baby!!", {
                        position: 'bottom-left',
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: toastTheme(isLight),
                        toastId: 8,
                    })
                }
                const paymentOptions = async (id: string) => {
                    setLoadingBalance(true)
                    await fetchWalletBalance(
                        id,
                        loginInfo.address.toLowerCase()
                    )
                        .then((balances) => {
                            const balance = balances[0]
                            if (balance !== undefined) {
                                updateBuyInfo({
                                    recipientOpt: buyInfo?.recipientOpt,
                                    anotherAddr: buyInfo?.anotherAddr,
                                    currency: value,
                                    currentBalance: balance,
                                })
                                let price: number
                                switch (id) {
                                    case 'xsgd':
                                        price = 15
                                        break
                                    case 'zil':
                                        price = 500
                                        break
                                    default:
                                        price = 10
                                        break
                                }
                                if (balance >= price || id === 'zil') {
                                    updateBuyInfo({
                                        recipientOpt: buyInfo?.recipientOpt,
                                        anotherAddr: buyInfo?.anotherAddr,
                                        currency: value,
                                        currentBalance: balance,
                                        isEnough: true,
                                    })
                                } else {
                                    toast.warn(
                                        'Your DIDxWallet does not have enough balance',
                                        {
                                            position: 'bottom-right',
                                            autoClose: 3000,
                                            hideProgressBar: false,
                                            closeOnClick: true,
                                            pauseOnHover: true,
                                            draggable: true,
                                            progress: undefined,
                                            theme: toastTheme(isLight),
                                            toastId: 3,
                                        }
                                    )
                                }
                            }
                        })
                        .catch(() => {
                            toast.warning(t('Buy NFT: Unsupported currency'), {
                                position: 'bottom-left',
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                theme: toastTheme(isLight),
                                toastId: 4,
                            })
                        })
                    setLoadingBalance(false)
                }
                const id = value.toLowerCase()
                if (id !== 'free') {
                    paymentOptions(id)
                } else {
                    updateBuyInfo({
                        recipientOpt: buyInfo?.recipientOpt,
                        anotherAddr: buyInfo?.anotherAddr,
                        currency: value,
                        currentBalance: 0,
                        isEnough: true,
                    })
                }
            } catch (error) {
                updateBuyInfo({
                    recipientOpt: buyInfo?.recipientOpt,
                    anotherAddr: buyInfo?.anotherAddr,
                    currency: undefined,
                    currentBalance: undefined,
                    isEnough: undefined,
                })
                toast.error(String(error), {
                    position: 'bottom-right',
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: toastTheme(isLight),
                    toastId: 2,
                })
            }
            setLoadingPayment(false)
        }
    }

    const handleSubmit = async () => {
        setLoadingSubmit(true)
        let amount: any = '0'
        try {
            const init_addr = await tyron.SearchBarUtil.default.fetchAddr(
                net,
                'init',
                'did'
            )
            const get_services = await getSmartContract(init_addr, 'services')
            const services = await tyron.SmartUtil.default.intoMap(
                get_services.result.services
            )
            const serviceAddr = services.get('lexicassi')
            const get_premiumprice = await getSmartContract(
                serviceAddr,
                'premium_price'
            )
            const premium_price = await tyron.SmartUtil.default.intoMap(
                get_premiumprice.result.premium_price
            )
            amount = premium_price
        } catch {
            amount = '0'
        }
        const zilpay = new ZilPayBase()
        let tx = await tyron.Init.default.transaction(net)
        let tokenUri = selectedNft
        // try {
        //     tokenUri = await fetchTydra()
        // } catch (err) {
        //     throw new Error()
        // }
        let params: any = []
        const addrName_ = {
            vname: 'addrName',
            type: 'String',
            value: addrName,
        }
        params.push(addrName_)
        const id_ = {
            vname: 'id',
            type: 'String',
            value: addrName == '.gzil' ? buyInfo?.currency?.toLowerCase() : '',
        }
        params.push(id_)
        const recipient_ = {
            vname: 'to',
            type: 'ByStr20',
            value: recipient === 'SSI' ? resolvedInfo?.addr : addr,
        }
        params.push(recipient_)
        const token_uri = {
            vname: 'token_uri',
            type: 'String',
            value: addrName === 'lexicassi' ? tokenUri : gzil + '.gzil',
        }
        params.push(token_uri)
        const amount_ = {
            vname: 'amount',
            type: 'Uint128',
            value: amount,
        }
        params.push(amount_)
        const donation_ = await tyron.Donation.default.tyron(donation!)
        const tyron_ = {
            vname: 'tyron',
            type: 'Option Uint128',
            value: donation_,
        }
        params.push(tyron_)

        let amountCall: any = donation
        if (
            addrName == '.gzil' &&
            buyInfo?.currency?.toLowerCase() === 'zil' &&
            buyInfo?.currentBalance < 500
        ) {
            amountCall = String(
                Number(amountCall) + (500 - buyInfo?.currentBalance)
            )
        }

        setLoadingSubmit(false)
        dispatch(setTxStatusLoading('true'))
        updateModalTxMinimized(false)
        updateModalTx(true)
        await zilpay
            .call({
                contractAddress: resolvedInfo?.addr!,
                transition: 'ZRC6_Mint',
                params: params as unknown as Record<string, unknown>[],
                amount: String(amountCall),
            })
            .then(async (res) => {
                dispatch(setTxId(res.ID))
                dispatch(setTxStatusLoading('submitted'))
                tx = await tx.confirm(res.ID)
                if (tx.isConfirmed()) {
                    dispatch(setTxStatusLoading('confirmed'))
                    setTimeout(() => {
                        window.open(
                            `https://viewblock.io/zilliqa/tx/${res.ID}?network=${net}`
                        )
                    }, 1000)
                } else if (tx.isRejected()) {
                    dispatch(setTxStatusLoading('failed'))
                }
            })
            .catch((err) => {
                dispatch(setTxStatusLoading('rejected'))
                updateModalTxMinimized(false)
                updateModalTx(true)
                throw err
            })
    }

    const optionRecipient = [
        {
            value: 'SSI',
            label: t('This SSI'),
        },
        {
            value: 'ADDR',
            label: 'Another Wallet',
        },
    ]

    const optionTypeOtherAddr = [
        {
            value: 'address',
            label: 'Type Address',
        },
        {
            value: 'nft',
            label: 'NFT Domain Name',
        },
    ]

    const optionPayment = [
        {
            value: 'ZIL',
            label: '500 ZIL',
        },
        {
            value: 'TYRON',
            label: '10 TYRON',
        },
        {
            value: 'XSGD',
            label: '15 XSGD',
        },
        {
            value: 'zUSDT',
            label: '10 zUSDT',
        },
        {
            value: 'FREE',
            label: t('FREE'),
        },
    ]

    if (addrName === 'lexicassi') {
        return (
            <>
                {selectedNft === '' && (
                    <>
                        <div style={{ marginTop: '16px' }}>
                            <Selector
                                option={optionRecipient}
                                onChange={onChangeRecipient}
                                placeholder="Select Recipient"
                                defaultValue={
                                    recipient === '' ? undefined : recipient
                                }
                            />
                        </div>
                        {recipient === 'ADDR' && (
                            <>
                                <div
                                    style={{
                                        marginTop: '16px',
                                    }}
                                >
                                    <Selector
                                        option={optionTypeOtherAddr}
                                        onChange={onChangeTypeOther}
                                        placeholder="Select Type"
                                    />
                                </div>
                                {otherRecipient === 'address' ? (
                                    <div
                                        style={{
                                            marginTop: '16px',
                                        }}
                                    >
                                        <div className={styles.txt}>
                                            Input Address
                                        </div>
                                        <div className={styles.containerInput}>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder={t('Type address')}
                                                onChange={handleInputAdddr}
                                                onKeyPress={
                                                    handleOnKeyPressAddr
                                                }
                                            />
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div onClick={saveAddr}>
                                                    {!savedAddr ? (
                                                        <Arrow />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    '5px',
                                                            }}
                                                        >
                                                            <Image
                                                                width={40}
                                                                src={TickIco}
                                                                alt="tick"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : otherRecipient === 'nft' ? (
                                    <SearchBarWallet
                                        resolveUsername={resolveUsername}
                                        handleInput={handleInput}
                                        input={usernameInput}
                                        loading={loading}
                                        saved={savedAddr}
                                    />
                                ) : (
                                    <></>
                                )}
                            </>
                        )}
                    </>
                )}
                {(recipient === 'ADDR' && savedAddr) || recipient === 'SSI' ? (
                    <div>
                        {selectedNft === '' && (
                            <>
                                <div
                                    style={{
                                        marginTop: '16px',
                                    }}
                                >
                                    <div className={styles.txt}>
                                        <a
                                            href="https://lexica.art/"
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            lexica.art
                                        </a>
                                    </div>
                                    <div className={styles.containerInput}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            placeholder="Search for an image"
                                            onChange={handleInputLexica}
                                            onKeyPress={handleOnKeyPressLexica}
                                        />
                                        {nftLoading ? (
                                            <Spinner />
                                        ) : (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div onClick={searchLexica}>
                                                    <Arrow />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    {nftList.length > 0 && (
                                        <>
                                            {nftList.map((val: any, i) => (
                                                <div
                                                    className={
                                                        styles.wrapperNftOption
                                                    }
                                                    key={i}
                                                >
                                                    {val.id === selectedNft ? (
                                                        <div
                                                            onClick={() =>
                                                                toggleSelectNft(
                                                                    val.id
                                                                )
                                                            }
                                                            className={
                                                                styles.optionIco
                                                            }
                                                        >
                                                            <Image
                                                                src={
                                                                    selectedCheckmark
                                                                }
                                                                alt="arrow"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={
                                                                styles.optionIco
                                                            }
                                                            onClick={() =>
                                                                toggleSelectNft(
                                                                    val.id
                                                                )
                                                            }
                                                        >
                                                            <Image
                                                                src={
                                                                    defaultCheckmark
                                                                }
                                                                alt="arrow"
                                                            />
                                                        </div>
                                                    )}
                                                    {dataModalImg ===
                                                        val.src && (
                                                            <ModalImg
                                                                showModalImg={
                                                                    showModalImg
                                                                }
                                                                setShowModalImg={
                                                                    setShowModalImg
                                                                }
                                                                dataModalImg={
                                                                    dataModalImg
                                                                }
                                                                setDataModalImg={
                                                                    setDataModalImg
                                                                }
                                                            />
                                                        )}
                                                    <img
                                                        onClick={() =>
                                                            toggleSelectNft(
                                                                val.id
                                                            )
                                                        }
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                        width={200}
                                                        src={val.srcSmall}
                                                        alt="lexica-img"
                                                    />
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <div
                                                            onClick={() => {
                                                                setDataModalImg(
                                                                    val.src
                                                                )
                                                                setShowModalImg(
                                                                    true
                                                                )
                                                            }}
                                                            style={{
                                                                marginLeft:
                                                                    '5px',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <Image
                                                                alt="arrow-ico"
                                                                src={AddIcon}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                        {selectedNft !== '' && (
                            <>
                                <div
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <div
                                        onClick={() => {
                                            updateDonation(null)
                                            setSelectedNft('')
                                        }}
                                        className="button small"
                                    >
                                        BACK
                                    </div>
                                </div>
                                <Donate />
                                {donation !== null && (
                                    <div
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            onClick={handleSubmit}
                                            className={
                                                isLight
                                                    ? 'actionBtnLight'
                                                    : 'actionBtn'
                                            }
                                        >
                                            {loadingSubmit ? (
                                                <ThreeDots color="black" />
                                            ) : (
                                                'MINT'
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <></>
                )}
            </>
        )
    } else {
        return (
            <>
                {selectedNft === '' && (
                    <>
                        <div style={{ marginTop: '16px' }}>
                            <Selector
                                option={optionRecipient}
                                onChange={onChangeRecipient}
                                placeholder={t('Choose address')}
                                defaultValue={
                                    recipient === '' ? undefined : recipient
                                }
                            />
                        </div>
                        {recipient === 'ADDR' && (
                            <>
                                <div
                                    style={{
                                        marginTop: '16px',
                                    }}
                                >
                                    <Selector
                                        option={optionTypeOtherAddr}
                                        onChange={onChangeTypeOther}
                                        placeholder="Select Type"
                                    />
                                </div>
                                {otherRecipient === 'address' ? (
                                    <div
                                        style={{
                                            marginTop: '16px',
                                        }}
                                    >
                                        <div className={styles.txt}>
                                            Input Address
                                        </div>
                                        <div className={styles.containerInput}>
                                            <input
                                                type="text"
                                                className={styles.input}
                                                placeholder={t('Type address')}
                                                onChange={handleInputAdddr}
                                                onKeyPress={
                                                    handleOnKeyPressAddr
                                                }
                                            />
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div onClick={saveAddr}>
                                                    {!savedAddr ? (
                                                        <Arrow />
                                                    ) : (
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    '5px',
                                                            }}
                                                        >
                                                            <Image
                                                                width={40}
                                                                src={TickIco}
                                                                alt="tick"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : otherRecipient === 'nft' ? (
                                    <SearchBarWallet
                                        resolveUsername={resolveUsername}
                                        handleInput={handleInput}
                                        input={usernameInput}
                                        loading={loading}
                                        saved={savedAddr}
                                    />
                                ) : (
                                    <></>
                                )}
                            </>
                        )}
                    </>
                )}
                {(recipient === 'ADDR' && savedAddr) || recipient === 'SSI' ? (
                    <div>
                        <div
                            style={{ marginBottom: '-20px', marginTop: '20px' }}
                            className={styles.txt}
                        >
                            Search .gzil
                        </div>
                        <SearchBarWallet
                            resolveUsername={() => resolveUsername('.gzil')}
                            handleInput={handleInputGzil}
                            input={gzilInput}
                            loading={loadingGzil}
                            saved={savedGzil}
                        />
                        {savedGzil && (
                            <>
                                <Selector
                                    option={optionPayment}
                                    onChange={handleOnChangePayment}
                                    loading={loadingPayment || loadingBalance}
                                    placeholder={t('SELECT_PAYMENT')}
                                    defaultValue={
                                        buyInfo?.currency === undefined
                                            ? undefined
                                            : buyInfo?.currency
                                    }
                                />
                                {buyInfo?.currency !== undefined &&
                                    !loadingBalance &&
                                    !loadingPayment && (
                                        <>
                                            {buyInfo?.isEnough ? (
                                                <>
                                                    <Donate />
                                                    {donation !== null && (
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'center',
                                                            }}
                                                        >
                                                            <div
                                                                onClick={
                                                                    handleSubmit
                                                                }
                                                                className={
                                                                    isLight
                                                                        ? 'actionBtnLight'
                                                                        : 'actionBtn'
                                                                }
                                                            >
                                                                {loadingSubmit ? (
                                                                    <ThreeDots color="black" />
                                                                ) : (
                                                                    'MINT'
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            color: 'red',
                                                            marginBottom:
                                                                '2rem',
                                                        }}
                                                    >
                                                        Not enough balance to
                                                        mint .gzil
                                                    </div>
                                                    <div
                                                        style={{
                                                            width: '90%',
                                                        }}
                                                    >
                                                        <AddFunds
                                                            type="buy"
                                                            coin={
                                                                buyInfo?.currency
                                                            }
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                            </>
                        )}
                    </div>
                ) : (
                    <></>
                )}
            </>
        )
    }
}

export default Component

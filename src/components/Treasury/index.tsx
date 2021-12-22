import React, { useState, useCallback } from 'react';
import { useStore } from 'effector-react';
import * as tyron from 'tyron';
import * as zcrypto from '@zilliqa-js/crypto';
import { ZilPayBase } from '../ZilPay/zilpay-base';
import styles from './styles.module.scss';
import { $net } from 'src/store/wallet-network';
import { $contract } from 'src/store/contract';
import { $user } from 'src/store/user';
import { $arconnect } from 'src/store/arconnect';
import { HashString } from 'src/lib/util';
import { decryptKey } from 'src/lib/dkms';
import { fetchAddr, resolve } from '../SearchBar/utils';

function Component() {
    const callbackRef = useCallback(inputElement => {
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const user = useStore($user);
    const arConnect = useStore($arconnect);

    const contract = useStore($contract);
    const net = useStore($net);

    const [error, setError] = useState('');
    const [txName, setTxName] = useState('');
    const [inputA, setInputA] = useState(0);
    const [inputB, setInputB] = useState('');

    const map = new Map;
    const [balances, setBalances] = useState(map);
    const [price, setPrice] = useState('');

    const [txID, setTxID] = useState('');

    const handleOnChange = async (event: { target: { value: any; }; }) => {
        setError(''); setInputA(0); setInputB(''); setBalances(map); setPrice('');
        const selection = event.target.value;
        if (arConnect === null) {
            alert('To continue, connect your SSI Private Key: Click on Connect -> SSI Private Key')
        } else if (contract !== null) {
            setTxName(selection);
            let network = tyron.DidScheme.NetworkNamespace.Mainnet;
            if (net === 'testnet') {
                network = tyron.DidScheme.NetworkNamespace.Testnet;
            }
            const init = new tyron.ZilliqaInit.default(network);

            try {
                const balances_ = await init.API.blockchain.getSmartContractSubState(
                    contract.addr,
                    'balances'
                );
                const balances = await tyron.SmartUtil.default.intoMap(balances_.result.balances);
                setBalances(balances);
                const price_ = await init.API.blockchain.getSmartContractSubState(
                    contract.addr,
                    'price'
                );
                setPrice(price_.result.price);
            } catch (error) {
                throw new Error(
                    ('could not fetch balances')
                )
            }
        }
    };

    const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(''); setInputA(0);
        let input = event.target.value;
        const re = /,/gi;
        input = input.replace(re, ".");
        const input_ = Number(input);
        if (!isNaN(input_)) {
            if (input_ === 0) {
                setError('the amount cannot be zero')
            } else {
                setInputA(input_);
            }
        } else {
            setError('the input it not a number')
        }
    }

    const handleInputB = (event: { target: { value: any; }; }) => {
        setError(''); setInputB('');
        const input = event.target.value;
        setInputB(String(input).toLowerCase());
    };

    const handleSubmit = async () => {
        setError('');
        if (arConnect !== null && contract !== null) {
            try {
                const zilpay = new ZilPayBase();
                const params = [];
                let amount_ = '0';
                if (txName === 'Buy_Tyron') {
                    if (inputA === 0 || inputB === '') {
                        throw new Error(
                            'required input is missing'
                        )
                    }
                    amount_ = String(inputA * Number(price));
                    const t_amount = inputA * 1e12
                    const zil_amount = String(t_amount * Number(price));
                    const data = inputB + zil_amount;
                    const hash = await HashString(data);

                    const result = await fetchAddr({ net, username: inputB, domain: 'did' })
                        .then(async (addr) => {
                            return await resolve({ net, addr })
                        })
                        .catch(err => {
                            throw new Error(
                                'unregistered nft username'
                            )
                        })

                    let signature;
                    try {
                        const encrypted_key = result.dkms?.get('authentication');
                        const private_key = await decryptKey(arConnect, encrypted_key);
                        const public_key = zcrypto.getPubKeyFromPrivateKey(private_key);
                        signature = '0x' + zcrypto.sign(Buffer.from(hash, 'hex'), private_key, public_key);
                    } catch (error) {
                        throw new Error(
                            'identity verification unsuccessful'
                        )
                    }
                    const username_ = {
                        vname: 'username',
                        type: 'String',
                        value: inputB,
                    };
                    params.push(username_);
                    const signature_ = {
                        vname: 'signature',
                        type: 'ByStr64',
                        value: signature,
                    };
                    params.push(signature_);
                }

                if (txName === 'Buy_Tyron') {
                    alert(`You're about to buy ${inputA} $TYRON from the Tyron Coop!`);
                }

                await zilpay.call({
                    contractAddress: contract.addr,
                    transition: txName,
                    params: params,
                    amount: amount_
                })
                    .then(res => {
                        setTxID(res.ID);
                    })
                    .catch(err => { throw err })
            } catch (error) {
                setError(String(error));
            }
        }
    };

    return (
        <div style={{ marginTop: '14%', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '10%' }}>
                {user?.nft}&apos;s{' '}
                <span style={{ color: 'lightgreen', marginBottom: '7%' }}>
                    PSC treasury
                </span>
                {' '}dapp
            </h2>
            {
                txID === '' &&
                <>
                    <h3 style={{ marginBottom: '7%' }}>
                        <a
                            href={`https://ssiprotocol.notion.site/ssiprotocol/Buy-TYRON-from-the-Tyron-Coop-02749fd685584b119b12f263d9685d98`}
                            rel="noreferrer" target="_blank"
                        >
                            buy $TYRON from the tyron coop
                        </a>
                    </h3>
                    <select style={{ width: '55%' }} onChange={handleOnChange}>
                        <option value="">Select action</option>
                        <option value="Buy_Tyron">Buy $TYRON</option>
                        <option value="Join_PSC">Join our Profit-Sharing Community</option>
                    </select>
                    {
                        txName === 'Buy_Tyron' &&
                        <div className={styles.container}>
                            <p>
                                In this dapp, you can <strong>buy $TYRON at {price} ZIL per token</strong>.
                            </p>
                            <p>
                                It&apos;s only available for self-sovereign identities that have a Tyron Verifiable Credential. Get yours at tyron.vc!
                            </p>
                            <div style={{ marginTop: '7%', marginBottom: '7%' }}>
                                <code >
                                    <ul>
                                        <li>
                                            Available for sale: {balances.get('tyron') / 1e12} TYRON
                                        </li>
                                    </ul>
                                </code>
                            </div>
                            <div className={styles.containerBuy}>
                                <code>TYRON</code>
                                <input
                                    ref={callbackRef}
                                    style={{ width: '30%' }}
                                    type="text"
                                    placeholder="Type amount that you want to buy"
                                    onChange={handleInput}
                                    autoFocus
                                />
                                {
                                    inputA !== 0 &&
                                    <code>
                                        Cost: {inputA * Number(price)} ZIL
                                    </code>
                                }
                            </div>
                            <section className={styles.containerBuy}>
                                <label>NFT</label>
                                username
                                <input
                                    ref={callbackRef}
                                    className={styles.input}
                                    type="text"
                                    placeholder="Type your NFT Username without .did"
                                    onChange={handleInputB}
                                    autoFocus
                                />
                                {
                                    inputB !== '' &&
                                    <code>
                                        Your current balance: {balances.get(inputB) / 1e12} TYRON
                                    </code>
                                }
                            </section>
                        </div>
                    }
                    {
                        txName === 'Join_PSC' &&
                        <section className={styles.containerX}>
                            <p style={{ marginTop: '10%' }}>
                                Coming soon!
                            </p>
                        </section>
                    }
                    {
                        txName === 'Buy_Tyron' &&
                        <div style={{ marginTop: '10%' }}>
                            <button className={styles.button} onClick={handleSubmit}>
                                <span className={styles.x}>
                                    {txName}
                                </span>
                            </button>
                            {
                                txName === 'Buy_Tyron' &&
                                <p className={styles.gascost}>
                                    Gas: around 2 ZIL
                                </p>
                            }
                        </div>
                    }
                </>
            }
            {
                txID !== '' &&
                <code>
                    Transaction ID:{' '}
                    <a
                        href={`https://viewblock.io/zilliqa/tx/${txID}?network=${net}`}
                        rel="noreferrer" target="_blank"
                    >
                        {txID.substr(0, 11)}...
                    </a>
                </code>
            }
            {
                error !== '' &&
                <p className={styles.error}>
                    {error}
                </p>
            }
        </div>
    );
}

export default Component;
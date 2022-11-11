import React, { useState } from 'react';
import * as zcrypto from '@zilliqa-js/crypto';
import { ReactComponent as ZilpayIcon } from '../../assets/logos/lg_zilpay.svg';
import styles from './styles.module.scss';
import { useStore } from 'effector-react';
import { ZilPayBase } from './zilpay-base';
import { Block, Net } from '../../types/zil-pay';
import { $wallet, updateAddress, Wallet } from '../../store/wallet';
import {
    $transactions,
    updateTxList,
    clearTxList,
    writeNewList
} from '../../store/transactions';
import { $net, updateNet } from '../../store/wallet-network';
import { $contract } from 'src/store/contract';
import { updateIsAdmin } from 'src/store/admin';

let observer: any = null;
let observerNet: any = null;
let observerBlock: any = null;

export const ZilPay: React.FC = () => {
    const zil_address = useStore($wallet);
    const net = useStore($net);
    const [account, setAccount] = useState('');

    const transactions = useStore($transactions);
    const contract = useStore($contract);
    let zilpay_eoa;

    if (account !== undefined && account !== '') {
        zilpay_eoa = zcrypto.toBech32Address(account);
        if (contract !== null) {
            const zilpay_eoa = account.toLowerCase();

            if (contract.controller === zilpay_eoa) {
                updateIsAdmin({
                    verified: true,
                    hideWallet: true,
                    legend: 'access DID wallet'
                });
            } else {
                updateIsAdmin({
                    verified: false,
                    hideWallet: true,
                    legend: 'access DID wallet'
                });
            }
        }
    }

    const hanldeObserverState = React.useCallback(
        (zp) => {
            if (zp.wallet.defaultAccount) {
                const address = zp.wallet.defaultAccount;
                updateAddress(address);
                setAccount(address.base16);
                if (zil_address === null) {
                    alert(
                        `ZilPay account previously connected to: ${address.bech32}`
                    );
                }
            } else {
                updateIsAdmin({
                    verified: false,
                    hideWallet: true,
                    legend: 'access DID wallet'
                });
            }

            if (zp.wallet.net) {
                updateNet(zp.wallet.net);
            }

            if (observerNet) {
                observerNet.unsubscribe();
            }
            if (observer) {
                observer.unsubscribe();
            }
            if (observerBlock) {
                observerBlock.unsubscribe();
            }

            observerNet = zp.wallet
                .observableNetwork()
                .subscribe((net: Net) => {
                    updateNet(net);
                });

            observer = zp.wallet
                .observableAccount()
                .subscribe(async (address: Wallet) => {
                    if (zil_address?.base16 !== address.base16) {
                        updateAddress(address);
                        setAccount(address.base16);
                    }

                    clearTxList();

                    const cache = window.localStorage.getItem(
                        String(zp.wallet.defaultAccount?.base16)
                    );

                    if (cache) {
                        updateTxList(JSON.parse(cache));
                    }
                });

            observerBlock = zp.wallet
                .observableBlock()
                .subscribe(async (block: Block) => {
                    let list = $transactions.getState();
                    for (
                        let index = 0;
                        index < block.TxHashes.length;
                        index++
                    ) {
                        const element = block.TxHashes[index];

                        for (let i = 0; i < list.length; i++) {
                            const tx = list[i];

                            if (tx.confirmed) {
                                continue;
                            }

                            if (element.includes(tx.hash)) {
                                try {
                                    const res =
                                        await zp.blockchain.getTransaction(
                                            tx.hash
                                        );
                                    if (
                                        res &&
                                        res.receipt &&
                                        res.receipt.errors
                                    ) {
                                        tx.error = true;
                                    }
                                    list[i].confirmed = true;
                                } catch {
                                    continue;
                                }
                            }
                        }
                    }
                    const listOrPromises = list.map(async (tx) => {
                        if (tx.confirmed) {
                            return tx;
                        }

                        try {
                            const res = await zp.blockchain.getTransaction(
                                tx.hash
                            );

                            if (res && res.receipt && res.receipt.errors) {
                                tx.error = true;
                            }

                            tx.confirmed = true;
                            return tx;
                        } catch {
                            return tx;
                        }
                    });

                    list = await Promise.all(listOrPromises);
                    writeNewList(list);
                });

            const cache = window.localStorage.getItem(
                String(zp.wallet.defaultAccount?.base16)
            );

            if (cache) {
                updateTxList(JSON.parse(cache));
            }
        },
        [transactions]
    );
    //@todo update when changing zilpay wallets
    const handleConnect = React.useCallback(async () => {
        //@todo configure spinner
        try {
            const wallet = new ZilPayBase();
            const zp = await wallet.zilpay();
            const connected = await zp.wallet.connect();

            const network = zp.wallet.net;
            updateNet(network);

            if (connected && zp.wallet.defaultAccount) {
                const address = zp.wallet.defaultAccount;
                updateAddress(address);
                setAccount(address.base16);
                alert(`ZilPay account connected to: ${address.bech32}`);
            }

            const cache = window.localStorage.getItem(
                String(zp.wallet.defaultAccount?.base16)
            );
            if (cache) {
                updateTxList(JSON.parse(cache));
            }
        } catch (err) {
            alert(`Connection error: ${err}`);
        }
    }, []);

    React.useEffect(() => {
        const wallet = new ZilPayBase();

        wallet
            .zilpay()
            .then((zp: any) => {
                hanldeObserverState(zp);
            })
            .catch(() => {
                alert(`Install or connect to ZilPay.`);
            });

        return () => {
            if (observer) {
                observer.unsubscribe();
            }
            if (observerNet) {
                observerNet.unsubscribe();
            }
            if (observerBlock) {
                observerBlock.unsubscribe();
            }
        };
    }, []);

    return (
        <>
            {zil_address === null && (
                <button
                    type="button"
                    className={styles.button}
                    onClick={() => handleConnect()}
                >
                    <ZilpayIcon className={styles.zilpayIcon} />
                    <p className={styles.buttonText}>ZilPay</p>
                </button>
            )}
            {zil_address !== null && zilpay_eoa !== undefined && (
                <div className={styles.button}>
                    <ZilpayIcon className={styles.zilpayIcon} />
                    <p className={styles.buttonText2}>
                        <a
                            href={`https://viewblock.io/zilliqa/address/${zilpay_eoa}?network=${net}`}
                            rel="noreferrer"
                            target="_blank"
                        >
                            {zilpay_eoa.substr(0, 5)}...{zilpay_eoa.substr(33)}
                        </a>
                    </p>
                </div>
            )}
        </>
    );
};

export default ZilPay;

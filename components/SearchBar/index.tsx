import React, { useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router'
import {
    SMART_CONTRACTS_URLS,
    VALID_SMART_CONTRACTS
} from '../../src/constants/tyron';
import { DOMAINS } from '../../src/constants/domains';
import { fetchAddr, isValidUsername, resolve } from './utils';
import styles from './styles.module.scss';
import { $user, updateUser } from '../../src/store/user';
import { useStore } from 'effector-react';
import { updateContract } from '../../src/store/contract';
import { updateDoc } from '../../src/store/did-doc';
import { updateLoggedIn } from '../../src/store/loggedIn';
import { updateDonation } from '../../src/store/donation';
import { $wallet } from '../../src/store/wallet';
import { updateIsAdmin } from '../../src/store/admin';
import { $net } from '../../src/store/wallet-network';

interface LayoutSearchBarProps {
    children: ReactNode;
}

function Component(props: LayoutSearchBarProps) {
    const callbackRef = useCallback(inputElement => {
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const { children } = props;
    const Router = useRouter();
    const net = useStore($net);
    const zil_address = useStore($wallet);
    const user = useStore($user);
    const username: string = user?.name || 'Type an SSI username';
    const domain = user?.domain!;


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const spinner = (
        <i className="fa fa-lg fa-spin fa-circle-notch" aria-hidden="true"></i>
    );

    const handleOnChange = ({
        currentTarget: { value }
    }: React.ChangeEvent<HTMLInputElement>) => {
        Router.push('/'); setError('');
        updateLoggedIn(null); updateDonation(null); updateContract(null);
        updateIsAdmin({
            verified: false,
            hideWallet: true,
            legend: 'access DID wallet'
        })

        const input = value.toLowerCase();
        if (value.includes('.')) {
            const [username = '', domain = ''] = input.split('.');
            updateUser({
                name: username,
                domain: domain
            });
        } else {
            updateUser({
                name: input,
                domain: 'did'
            });
        }
    };

    const handleOnKeyPress = ({
        key
    }: React.KeyboardEvent<HTMLInputElement>) => {
        if (key === 'Enter') {
            getResults();
        }
    };

    const resolveDid = async () => {
        if (
            isValidUsername(username) ||
            username === 'init' ||
            username === 'tyron' || username === 'donate' || username === 'wfp'
        ) {
            await fetchAddr({ net, username, domain })
                .then(async (addr) => {
                    if (username === 'xpoints') {
                        Router.push('/XPoints')
                    } else {
                        try {
                            await resolve({ net, addr })
                                .then(result => {
                                    Router.push(`/${username}`);
                                    const controller = (result.controller).toLowerCase();
                                    updateContract({
                                        addr: addr,
                                        controller: controller,
                                        status: result.status
                                    });
                                    if (controller === zil_address?.base16.toLowerCase()) {
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
                                    updateDoc({
                                        did: result.did,
                                        version: result.version,
                                        doc: result.doc,
                                        dkms: result.dkms,
                                        guardians: result.guardians
                                    })
                                }).catch(err => { throw err })
                        } catch (error) {
                            alert('Coming soon!')
                        }
                    }
                })
                .catch(() => {
                    Router.push('/BuyNFTUsername')
                });
        } else {
            setError('Invalid username. Names with less than seven characters are premium and will be for sale later on.');
        }
    };

    const resolveDomain = async () => {
        await fetchAddr({ net, username, domain: 'did' })
            .then(async addr => {
                const result = await resolve({ net, addr });
                await fetchAddr({ net, username, domain })
                    .then(async (domain_addr) => {
                        const controller = result.controller;
                        if (controller.toLowerCase() === zil_address?.base16.toLowerCase()) {
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
                        updateContract({
                            addr: domain_addr,
                            controller: controller,
                            status: result.status
                        });
                        updateDoc({
                            did: result.did,
                            version: result.version,
                            doc: result.doc,
                            dkms: result.dkms,
                            guardians: result.guardians
                        })
                        switch (domain) {
                            case DOMAINS.VC:
                                Router.push('/VerifiableCredentials');
                                break;
                            case DOMAINS.TREASURY:
                                Router.push('/Treasury');
                                break;
                            default:
                                Router.push(`/${username}`);
                                break;
                        }
                    })
                    .catch(() => {
                        setError(`Initialize this xWallet domain  at ${username}'s NFT Username DNS.`)
                    });
            })
            .catch(() => {
                Router.push('/BuyNFTUsername')
            });
    }

    const getResults = async () => {
        setLoading(true); setError('');
        updateDonation(null);
        updateIsAdmin({
            verified: false,
            hideWallet: true,
            legend: 'access DID wallet'
        });
        updateUser({
            name: username,
            domain: domain
        });
        switch (domain) {
            case DOMAINS.TYRON:
                if (VALID_SMART_CONTRACTS.includes(username))
                    window.open(
                        SMART_CONTRACTS_URLS[
                        username as unknown as keyof typeof SMART_CONTRACTS_URLS
                        ]
                    );
                else setError('Invalid smart contract');
                break;
            case DOMAINS.DID: await resolveDid();
                break;
            case DOMAINS.VC: await resolveDomain();
                break;
            case DOMAINS.TREASURY: await resolveDomain();
                break;
            case DOMAINS.PSC: alert('Coming soon!') //await resolveDomain();
                break;
            case DOMAINS.DEX: await resolveDomain();
                break;
            case DOMAINS.STAKE: await resolveDomain();
                break;
            default:
                setError('Invalid domain.')
                break
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchDiv}>
                <input
                    ref={callbackRef}
                    type="text"
                    className={styles.searchBar}
                    onChange={handleOnChange}
                    onKeyPress={handleOnKeyPress}
                    placeholder={username}
                    autoFocus
                />
                <div>
                    <button onClick={getResults} className={styles.searchBtn}>
                        {loading ? spinner : <i className="fa fa-search"></i>}
                    </button>
                </div>
            </div>
            {children}
            {
                error !== '' &&
                <code>
                    Error: {error}
                </code>
            }
        </div>
    );
}

export default Component;

import React, { useState } from 'react';
import {
    SMART_CONTRACTS_URLS,
    VALID_SMART_CONTRACTS
} from '../../constants/tyron';
import { DOMAINS } from '../../constants/domains';
import { fetchAddr, isValidUsername, resolve } from './utils';
import { PublicIdentity, BuyNFTUsername, DIDxWallet } from '../index';
import styles from './styles.module.scss';
import { updateUser } from 'src/store/user';
import { useStore } from 'effector-react';
import { updateContract } from 'src/store/contract';
import { updateDoc } from 'src/store/did-doc';
import { updateLoggedIn } from 'src/store/loggedIn';
import { updateDonation } from 'src/store/donation';
import { $wallet } from 'src/store/wallet';
import { $isAdmin, updateIsAdmin } from 'src/store/admin';
import { $net } from 'src/store/wallet-network';

function Component() {
    const net = useStore($net);

    const zil_address = useStore($wallet);
    const is_admin = useStore($isAdmin);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [input, setInput] = useState('');
    const [register, setRegister] = useState(false);
    const [username, setUsername] = useState('');
    const [domain, setDomain] = useState('');
    const [exists, setExists] = useState(false);

    const spinner = (
        <i className="fa fa-lg fa-spin fa-circle-notch" aria-hidden="true"></i>
    );

    const handleInput = ({
        currentTarget: { value }
    }: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        updateLoggedIn(null);
        updateDonation(null);
        updateContract(null);
        updateIsAdmin({
            verified: false,
            hideWallet: true,
            legend: 'access DID wallet'
        });
        setExists(false);
        setRegister(false);

        const input = value.toLowerCase();
        setInput(input);
        if (value.includes('.')) {
            const [username = '', domain = ''] = input.split('.');
            setUsername(username);
            setDomain(domain);
        } else {
            setUsername(input);
            setDomain('did');
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
            username === 'tyron' ||
            username === 'init' ||
            username === 'donate'
        ) {
            await fetchAddr({ net, username, domain })
                .then(async (addr) => {
                    setExists(true);
                    await resolve({ net, addr })
                        .then((result) => {
                            const controller = result.controller.toLowerCase();
                            updateContract({
                                addr: addr,
                                controller: controller,
                                status: result.status
                            });
                            if (
                                controller === zil_address?.base16.toLowerCase()
                            ) {
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
                                doc: result.doc,
                                dkms: result.dkms,
                                guardians: result.guardians
                            });
                        })
                        .catch((err) => {
                            throw err;
                        });
                })
                .catch(() => {
                    setRegister(true);
                });
        } else {
            setError(
                'usernames with less than seven characters are premium and will be for sale later on.'
            );
        }
    };

    const resolveDomain = async () => {
        await fetchAddr({ net, username, domain: 'did' })
            .then(async (addr) => {
                const did = await resolve({ net, addr });
                await fetchAddr({ net, username, domain })
                    .then(async (domain_addr) => {
                        setExists(true);
                        const controller = did.controller;
                        if (
                            controller.toLowerCase() ===
                            zil_address?.base16.toLowerCase()
                        ) {
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
                            status: did.status
                        });
                        updateDoc({
                            did: did.did,
                            doc: did.doc,
                            dkms: did.dkms,
                            guardians: did.guardians
                        });
                    })
                    .catch(() => {
                        setError(
                            `initialize this xWallet domain  at ${username}'s NFT Username DNS.`
                        );
                    });
            })
            .catch(() => {
                setRegister(true);
            });
    };

    const getResults = async () => {
        setLoading(true);
        setError('');
        setExists(false);
        setRegister(false);
        updateDonation(null);
        updateIsAdmin({
            verified: false,
            hideWallet: true,
            legend: 'access DID wallet'
        });
        updateUser({
            nft: username,
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
                else setError('invalid smart contract');
                break;
            case DOMAINS.DID:
                await resolveDid();
                break;
            case DOMAINS.DEX:
                await resolveDomain();
                break;
            case DOMAINS.STAKE:
                await resolveDomain();
                break;
            default:
                setError('invalid domain.');
                break;
        }
        setLoading(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.searchDiv}>
                <input
                    type="text"
                    className={styles.searchBar}
                    onChange={handleInput}
                    onKeyPress={handleOnKeyPress}
                    value={input}
                    placeholder="Type a username"
                    autoFocus
                />
                <div>
                    <button onClick={getResults} className={styles.searchBtn}>
                        {loading ? spinner : <i className="fa fa-search"></i>}
                    </button>
                </div>
            </div>
            {register && <BuyNFTUsername />}
            {exists && is_admin?.hideWallet && <PublicIdentity />}
            {is_admin?.verified && !is_admin.hideWallet && <DIDxWallet />}
            {error !== '' && (
                <div style={{ marginLeft: '-1%' }}>
                    <code>Error: {error}</code>
                </div>
            )}
        </div>
    );
}
// @todo research/decide which router (consider working with next.js)
export default Component;

import * as tyron from 'tyron';

export const isValidUsername = (username: string) =>
    /^[\w\d_]+$/.test(username) && username.length > 6;

export const fetchAddr = async ({
    net,
    username,
    domain
}: {
    net: string;
    username: string;
    domain: string;
}) => {
    //@xalkan
    let network = tyron.DidScheme.NetworkNamespace.Mainnet;
    let init = '0xdfe5e46db3c01fd9a4a012c999d581f69fcacc61'//'0xdfc81a41a7a1ce6ed99e27f9aa1ede4f6d97c7d0';
    if (net === 'testnet') {
        network = tyron.DidScheme.NetworkNamespace.Testnet;
        init = '0xb36fbf7ec4f2ede66343f7e64914846024560595';
    }
    const addr = await tyron.Resolver.default
        .resolveDns(network, init, username, domain)
        .catch((err) => {
            throw err;
        });
    return addr;
};

export const resolve = async ({ net, addr }: { net: string; addr: string }) => {
    let network = tyron.DidScheme.NetworkNamespace.Testnet;
    if (net === 'mainnet') {
        network = tyron.DidScheme.NetworkNamespace.Mainnet;
    }
    const did_doc: any[] = [];
    const state = await tyron.State.default.fetch(network, addr);

    let did;
    if (state.did == '') {
        did = 'not created yet.';
    } else {
        did = state.did;
    }
    did_doc.push(['Decentralized identifier', did]);

    const controller = state.controller;

    if (state.services_ && state.services_?.size !== 0) {
        const services = [];
        for (const id of state.services_.keys()) {
            const result = state.services_.get(id);
            if (result && result[1] !== '') {
                services.push([id, result[1]]);
            }
        }
        did_doc.push(['DID services', services]);
    }

    if (state.verification_methods) {
        if (state.verification_methods.get('socialrecovery')) {
            did_doc.push([
                'DID social recovery key',
                [state.verification_methods.get('socialrecovery')]
            ]);
        }
        if (state.verification_methods.get('dex')) {
            did_doc.push([
                'DID decentralized exchange key',
                [state.verification_methods.get('dex')]
            ]);
        }
        if (state.verification_methods.get('stake')) {
            did_doc.push([
                'DID staking key',
                [state.verification_methods.get('stake')]
            ]);
        }
        if (state.verification_methods.get('general')) {
            did_doc.push([
                'General-purpose key',
                [state.verification_methods.get('general')]
            ]);
        }
        if (state.verification_methods.get('authentication')) {
            did_doc.push([
                'Authentication key',
                [state.verification_methods.get('authentication')]
            ]);
        }
        if (state.verification_methods.get('assertion')) {
            did_doc.push([
                'Assertion key',
                [state.verification_methods.get('assertion')]
            ]);
        }
        if (state.verification_methods.get('agreement')) {
            did_doc.push([
                'Agreement key: ',
                [state.verification_methods.get('agreement')]
            ]);
        }
        if (state.verification_methods.get('invocation')) {
            did_doc.push([
                'Invocation key',
                [state.verification_methods.get('invocation')]
            ]);
        }
        if (state.verification_methods.get('delegation')) {
            did_doc.push([
                'Delegation key',
                [state.verification_methods.get('delegation')]
            ]);
        }
    }
    const init = new tyron.ZilliqaInit.default(network);
    const social_recovery = await init.API.blockchain.getSmartContractSubState(
        addr,
        'social_guardians'
    );
    const guardians = await resolveGuardians(
        social_recovery.result.social_guardians
    );

    return {
        did: did,
        status: state.did_status,
        controller: controller,
        doc: did_doc,
        dkms: state.dkms,
        guardians: guardians
    };
};

async function resolveGuardians(object: any): Promise<any[]> {
    const entries = Object.entries(object);
    const result: any[] = [];
    entries.forEach((value: [string, unknown]) => {
        result.push(value[0]);
    });
    return result;
}

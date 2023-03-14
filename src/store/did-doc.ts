import { createDomain } from 'effector'

export interface Doc {
    did: string
    controller: string
    version: string
    doc: any[]
    dkms: any
    guardians: any
    nftDns?: string
}

const docDomain = createDomain()
export const updateDoc = docDomain.createEvent<Doc | null>()
export const $doc = docDomain
    .createStore<Doc | null>(null)
    .on(updateDoc, (_, payload) => payload)

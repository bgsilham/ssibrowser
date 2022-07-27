import { createDomain } from 'effector'

export interface User {
    name: string
    domain?: string
    addr?: string
    controller?: string
    status?: any
    version?: string //@todo-i add smart contract version as resolution result
}

const resolvedInfoDomain = createDomain()
export const updateResolvedInfo = resolvedInfoDomain.createEvent<User>()
export const $resolvedInfo = resolvedInfoDomain
    .createStore<User | null>(null)
    .on(updateResolvedInfo, (_, payload) => payload)

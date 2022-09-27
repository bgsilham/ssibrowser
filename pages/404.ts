import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Custom404() {
    const router = useRouter()

    useEffect(() => {
        const path = window.location.pathname
            .replace('/', '')
            .replace('/es', '')
            .replace('/cn', '')
            .replace('/id', '')
            .replace('/ru', '')
            .toLowerCase()
        if (
            // @todo-i
            // this redirection not valid anymore?
            // A: .domain is deprecated so we can remove it

            // since we always redirect user to /username on header useeffect
            // UPDATE: we still need /funds and /tree function from this file
            path.includes('.zil') ||
            path.includes('.vc') ||
            (path.includes('.treasury') && path.includes('/'))
        ) {
            router.push(`/${path.split('/')[0]}`)
        } else if (path.includes('/doc')) {
            if (path.includes('.did')) {
                router.push(`${path.split('.did')[0]}/didx/doc`)
            } else {
                router.push(`${path.split('/')[0]}/didx/doc`)
            }
        } else if (path.includes('/funds')) {
            if (path.includes('.did')) {
                router.push(`${path.split('.did')[0]}/didx/funds`)
            } else {
                router.push(`${path.split('/')[0]}/didx/funds`)
            }
        } else if (path.includes('/recovery')) {
            if (path.includes('.did')) {
                router.push(`${path.split('.did')[0]}/didx/recovery`)
            } else {
                router.push(`${path.split('/')[0]}/didx/recovery`)
            }
        } else if (path.includes('/wallet')) {
            if (path.includes('.did')) {
                router.push(`${path.split('.did')[0]}/didx/wallet`)
            } else {
                router.push(`${path.split('/')[0]}/didx/wallet`)
            }
        } else if (path.split('/')[1] === 'tree') {
            router.push(`${path.split('/')[0]}`)
        } else {
            router.replace('/')
        }
    })

    return null
}

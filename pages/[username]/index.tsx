import Layout from '../../components/Layout'
import { Headline, Services } from '../../components'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { GetStaticPaths } from 'next/types'
import { useEffect, useState } from 'react'
import stylesDark from '../styles.module.scss'
import stylesLight from '../styleslight.module.scss'
import { useTranslation } from 'next-i18next'
// import routerHook from '../../src/hooks/router'
import fetch from '../../src/hooks/fetch'
import { useSelector } from 'react-redux'
import { RootState } from '../../src/app/reducers'
import Tydra from '../../components/SSI/Tydra'
import { useStore } from 'effector-react'
import { $resolvedInfo } from '../../src/store/resolvedInfo'
import { $loadingTydra } from '../../src/store/loading'

function Header() {
    // const { t } = useTranslation()
    const { fetchDoc, resolveUser } = fetch()
    const [show, setShow] = useState(false)
    const isLight = useSelector((state: RootState) => state.modal.isLight)
    const resolvedInfo = useStore($resolvedInfo)
    const loadingTydra = useStore($loadingTydra)
    const username = resolvedInfo?.name
    const domain = resolvedInfo?.domain
    const styles = isLight ? stylesLight : stylesDark
    const path = window.location.pathname
        .toLowerCase()
        .replace('/es', '')
        .replace('/cn', '')
        .replace('/id', '')
        .replace('/ru', '')

    const data = []

    useEffect(() => {
        if (!path.includes('/getstarted')) {
            if (path.includes('did@')) {
                fetchDoc()
                setShow(true)
            } else if (path.includes('@')) {
                resolveUser().then(() => {
                    fetchDoc().then(() => {
                        setShow(true)
                    })
                })
            } else {
                fetchDoc()
                setShow(true)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username])

    return (
        <>
            <Layout>
                {show && (
                    <>
                        <div className={styles.headlineWrapper}>
                            {!loadingTydra && (
                                <>
                                    <Headline data={data} />
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <h1>
                                            <div className={styles.username}>
                                                <span
                                                    style={{
                                                        textTransform: 'none',
                                                    }}
                                                >
                                                    {domain !== '' &&
                                                        domain !== 'did' &&
                                                        `${domain}@`}
                                                </span>
                                                {username!?.length > 12 && (
                                                    <div
                                                        className={
                                                            styles.usernameMobile
                                                        }
                                                    >
                                                        <br />
                                                    </div>
                                                )}
                                                <span
                                                    style={{
                                                        textTransform:
                                                            'uppercase',
                                                    }}
                                                >
                                                    {username}
                                                </span>
                                                {username!?.length > 12 && (
                                                    <div
                                                        className={
                                                            styles.usernameMobile
                                                        }
                                                    >
                                                        <br />
                                                    </div>
                                                )}
                                                <span
                                                    style={{
                                                        textTransform:
                                                            'uppercase',
                                                    }}
                                                >
                                                    .
                                                    {domain === 'did'
                                                        ? 'did'
                                                        : 'ssi'}
                                                </span>
                                            </div>
                                        </h1>
                                    </div>
                                </>
                            )}
                            <div style={{ marginTop: '2%' }}>
                                <Tydra type="account" />
                            </div>
                        </div>
                        <Services />
                    </>
                )}
            </Layout>
        </>
    )
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
    return {
        paths: [],
        fallback: 'blocking',
    }
}

export const getStaticProps = async ({ locale }) => ({
    props: {
        ...(await serverSideTranslations(locale, ['common'])),
    },
})

export default Header

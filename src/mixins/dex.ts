/*
ZilPay.io
Copyright (c) 2023 by Rinat <https://github.com/hicaru>
All rights reserved.
You acknowledge and agree that ZilPay owns all legal right, title and interest in and to the work, software, application, source code, documentation and any other documents in this file (collectively, the Program), including any intellectual property rights which subsist in the Program (whether those rights happen to be registered or not, and wherever in the world those rights may exist), whether in source code or any other form.
Subject to the limited license below, you may not (and you may not permit anyone else to) distribute, publish, copy, modify, merge, combine with another program, create derivative works of, reverse engineer, decompile or otherwise attempt to extract the source code of, the Program or any part thereof, except that you may contribute to this software.
You are granted a non-exclusive, non-transferable, non-sublicensable license to distribute, publish, copy, modify, merge, combine with another program or create derivative works of the Program (such resulting program, collectively, the Resulting Program) solely for Non-Commercial Use as long as you:
1. give prominent notice (Notice) with each copy of the Resulting Program that the Program is used in the Resulting Program and that the Program is the copyright of ZilPay; and
2. subject the Resulting Program and any distribution, publication, copy, modification, merger therewith, combination with another program or derivative works thereof to the same Notice requirement and Non-Commercial Use restriction set forth herein.
Non-Commercial Use means each use as described in clauses (1)-(3) below, as reasonably determined by ZilPay in its sole discretion:
1. personal use for research, personal study, private entertainment, hobby projects or amateur pursuits, in each case without any anticipated commercial application;
2. use by any charitable organization, educational institution, public research organization, public safety or health organization, environmental protection organization or government institution; or
3. the number of monthly active users of the Resulting Program across all versions thereof and platforms globally do not exceed 10,000 at any time.
You will not use any trade mark, service mark, trade name, logo of ZilPay or any other company or organization in a way that is likely or intended to cause confusion about the owner or authorized user of such marks, names or logos.
If you have any questions, comments or interest in pursuing any other use cases, please reach out to us at mapu@ssiprotocol.com.*/

import type {
    DexPool,
    FieldTotalContributions,
    FiledBalances,
    FiledPools,
    Share,
} from '../types/zilliqa'
import type { SwapPair } from '../types/swap'

import Big from 'big.js'

import { Blockchain } from './custom-fetch'
import { ZilPayBase } from './zilpay-base'

import { $tokens, addToken, updateTokens } from '../store/tokens'

import { toHex } from '../lib/to-hex'
import { formatNumber } from '../filters/n-format'
import { addTransactions } from '../store/transactions'
import { SHARE_PERCENT, ZERO_ADDR } from '../config/const'
import {
    $liquidity,
    $tyron_liquidity,
    updateDexBalances,
    updateLiquidity,
    updateTyronBalances,
    updateTyronLiquidity,
} from '../store/shares'
import { $wallet } from '../store/wallet'
import { $settings } from '../store/settings'
import { Token, TokenState } from '../types/token'
import { $net } from '../store/network'
import { $dex, $dex_option } from '../store/dex'
// ssibrowser ---
import { useStore } from 'effector-react'
import { $resolvedInfo } from '../store/resolvedInfo'
import * as tyron from 'tyron'
import { dex_options } from '../constants/dex-options'
//---

Big.PE = 999

export enum SwapDirection {
    ZilToToken,
    TokenToZil,
    TokenToTokens,
    TydraDEX,
    TydraDeFi,
}

const CONTRACTS: {
    [net: string]: string
} = {
    mainnet: '0x30dfe64740ed459ea115b517bd737bbadf21b838',
    testnet: '0xb0c677b5ba660925a8f1d5d9687d0c2c379e16ee',
    private: '',
}

//@ssibrowser
const tyron_s$i_CONTRACTS: {
    [net: string]: string
} = {
    mainnet: '0x30dfe64740ed459ea115b517bd737bbadf21b838', //@mainnet
    testnet: '0x3cDf2c601D27a742DaB0CE6ee2fF129E78C2d3c2',
    private: '',
}

export class DragonDex {
    // public static REWARDS_DECIMALS = BigInt('100000000000')
    public static FEE_DEMON = BigInt('10000')

    private _provider = new Blockchain()

    public zilpay = new ZilPayBase()

    public get lp() {
        return $dex.state.lp
    }

    public get fee() {
        return $dex.state.fee
    }

    public get rewarded() {
        return $dex.state.rewardsPool
    }

    public get protoFee() {
        return $dex.state.protoFee
    }

    public get wallet() {
        return $wallet.state
    }

    //ssibrowser
    public get dex() {
        return $dex_option.state
    }
    public get tyron_s$i_contract() {
        return tyron_s$i_CONTRACTS[$net.state.net]
    }

    public get tyronProfitDenom() {
        return $dex.state.tyronProfitDenom
    }

    //---

    public get contract() {
        return CONTRACTS[$net.state.net]
    }

    public get pools() {
        return $liquidity.state.pools
    }

    //@ssibrowser
    public get tyron_reserves() {
        return $tyron_liquidity.state.reserves
    }

    public get tokens() {
        return $tokens.state.tokens
    }

    public get liquidityRewards() {
        const demon = Number(DragonDex.FEE_DEMON)
        return ((demon - Number(this.fee)) / demon) * 100
    }

    public async updateState() {
        //@ssibrowser
        const tyron_s$i = toHex(this.tyron_s$i_contract)
        //@zilpay
        const dragondex_contract = toHex(this.contract)
        const owner = String(this.wallet?.base16).toLowerCase()
        // const {
        //     pools,
        //     balances,
        //     totalContributions,
        //     protocolFee,
        //     liquidityFee,
        //     rewardsPool,
        // } = await this._provider.fetchFullState(contract, owner)
        //@ssibrowser
        const {
            balances,
            totalContributions,
            pools,
            liquidityFee,
            protocolFee,
            rewardsPool,
            tyron_balances,
            tyron_contributions,
            tyron_reserves,
            tyron_profit_denom,
        } = await this._provider.tyron_fetchFullState(
            tyron_s$i,
            dragondex_contract,
            owner
        )
        //@zilpay
        const shares = this._getShares(balances, totalContributions, owner)
        const dexPools = this._getPools(pools)

        $dex.setState({
            rewardsPool,
            fee: BigInt(liquidityFee),
            protoFee: BigInt(protocolFee),
            lp: $dex.state.lp,
            tyronProfitDenom: BigInt(tyron_profit_denom),
        })

        updateDexBalances(balances)
        updateLiquidity(shares, dexPools)
        //@ssibrowser
        console.log('TYRON_PROFIT_DENOM', tyron_profit_denom)
        console.log('TYRON_RESERVES')
        const tyronReserves = this._getTyronReserves(tyron_reserves)
        console.log(JSON.stringify(tyronReserves, null, 2))
        updateTyronBalances(tyron_balances)
        updateTyronLiquidity(tyronReserves)
    }

    public async updateTokens() {
        //ssibrowser ---
        // const tyron_token: Token = {
        //     balance: {
        //         [wallet!]: '0',
        //     },
        //     meta: tyron_token_state,
        // }

        // const ssi_token: Token = {
        //     balance: {
        //         [wallet!]: '0',
        //     },
        //     meta: ssi_token_state,
        // }

        let tokens = [...$tokens.state.tokens]

        // tokens = [tyron_token, ssi_token, ...$tokens.state.tokens]
        //@review: not logging
        console.log('tyrondex_dex:', JSON.stringify(tokens))
        //---
        const owner = String($wallet.state?.base16)
        const newTokens = await this._provider.fetchTokensBalances(
            owner,
            tokens // $tokens.state.tokens
        )

        updateTokens(newTokens)
    }

    public async addCustomToken(token: string, owner: string) {
        const { meta, balances } = await this._provider.getToken(token, owner)
        const zp = await this.zilpay.zilpay()
        addToken({
            meta: {
                base16: meta.address,
                bech32: zp.crypto.toBech32Address(meta.address),
                symbol: meta.symbol,
                name: meta.name,
                decimals: meta.decimals,
                scope: 0,
            },
            balance: balances,
        })
    }

    // public getRealPrice(pair: SwapPair[]) {
    //     const [exactToken, limitToken] = pair
    //     const exact = this._valueToBigInt(exactToken.value, exactToken.meta)
    //     let value = BigInt(0)
    //     const cashback =
    //         limitToken.meta.base16 !== this.rewarded &&
    //         exactToken.meta.base16 !== this.rewarded

    //     //@ssibrowser
    //     if (limitToken.meta.symbol === 'TYRON') {
    //         if (exactToken.meta.symbol === 'S$I') {
    //             value = this._ssiToTyron(
    //                 exact,
    //                 this.tyron_reserves['tyron_s$i']
    //             )
    //         }
    //     } else {
    //         //@zilpay
    //         if (
    //             //@dev: SwapExactZILForTokens
    //             exactToken.meta.base16 === ZERO_ADDR &&
    //             limitToken.meta.base16 !== ZERO_ADDR
    //         ) {
    //             value = this._zilToTokens(
    //                 exact,
    //                 this.pools[limitToken.meta.base16],
    //                 cashback
    //             )
    //         } else if (
    //             //@dev: SwapExactTokensForZIL
    //             exactToken.meta.base16 !== ZERO_ADDR &&
    //             limitToken.meta.base16 === ZERO_ADDR
    //         ) {
    //             value = this._tokensToZil(
    //                 exact,
    //                 this.pools[exactToken.meta.base16],
    //                 cashback
    //             )
    //         } else {
    //             //@dev: SwapExactTokensForTokens
    //             value = this._tokensToTokens(
    //                 exact,
    //                 this.pools[exactToken.meta.base16],
    //                 this.pools[limitToken.meta.base16],
    //                 cashback
    //             )
    //         }
    //     }
    //     return Big(String(value)).div(this.toDecimals(limitToken.meta.decimals))
    // }

    public getTydraPrice(pair: SwapPair[]) {
        const [exactToken, limitToken] = pair
        const exact = this._valueToBigInt(exactToken.value, exactToken.meta)
        let value = BigInt(0)
        const cashback =
            limitToken.meta.base16 !== this.rewarded &&
            exactToken.meta.base16 !== this.rewarded

        //@ssibrowser
        if (limitToken.meta.symbol === 'TYRON') {
            if (exactToken.meta.symbol === 'S$I') {
                value = this._ssiToTyron(
                    exact,
                    this.tyron_reserves['tyron_s$i']
                )
            }
        } else {
            //@zilpay
            if (
                //@dev: SwapExactZILForTokens
                exactToken.meta.base16 === ZERO_ADDR &&
                limitToken.meta.base16 !== ZERO_ADDR
            ) {
                value = this._zilToTokens(
                    exact,
                    this.pools[limitToken.meta.base16],
                    cashback
                )
            } else if (
                //@dev: SwapExactTokensForZIL
                exactToken.meta.base16 !== ZERO_ADDR &&
                limitToken.meta.base16 === ZERO_ADDR
            ) {
                value = this._tokensToZil(
                    exact,
                    this.pools[exactToken.meta.base16],
                    cashback
                )
            } else {
                //@dev: SwapExactTokensForTokens
                value = this._tokensToTokens(
                    exact,
                    this.pools[exactToken.meta.base16],
                    this.pools[limitToken.meta.base16],
                    cashback
                )
            }
        }

        const tydra = BigInt(1)
        return {
            dragondex: Big(String(value)).div(
                this.toDecimals(limitToken.meta.decimals)
            ),
            tydradex: Big(String(tydra)).div(
                this.toDecimals(limitToken.meta.decimals)
            ),
        }
    }

    public getDirection(pair: SwapPair[]) {
        const [exactToken, limitToken] = pair
        console.log(exactToken.meta.symbol)

        console.log(limitToken.meta.symbol)
        if (
            exactToken.meta.symbol === 'TYRON' &&
            limitToken.meta.symbol === 'S$I'
        ) {
            return SwapDirection.TydraDeFi
        } else if (
            exactToken.meta.symbol === 'TYRON' ||
            limitToken.meta.symbol === 'TYRON' ||
            exactToken.meta.symbol === 'S$I' ||
            limitToken.meta.symbol === 'S$I'
        ) {
            return SwapDirection.TydraDEX
        } else if (
            exactToken.meta.base16 === ZERO_ADDR &&
            limitToken.meta.base16 !== ZERO_ADDR
        ) {
            return SwapDirection.ZilToToken
        } else if (
            exactToken.meta.base16 !== ZERO_ADDR &&
            limitToken.meta.base16 === ZERO_ADDR
        ) {
            return SwapDirection.TokenToZil
        } else {
            return SwapDirection.TokenToTokens
        }
    }

    public tokensToZil(value: string | Big, token: TokenState) {
        const amount = Big(value)
        const cashback = token.base16 !== this.rewarded

        try {
            const decimals = this.toDecimals(token.decimals)
            const zilDecimails = this.toDecimals(this.tokens[0].meta.decimals)
            const qa = amount.mul(decimals).round().toString()
            const zils = this._tokensToZil(
                BigInt(qa),
                this.pools[token.base16],
                cashback
            )

            return Big(String(zils)).div(zilDecimails)
        } catch {
            return Big(0)
        }
    }

    public async swapExactZILForTokens(
        exact: bigint,
        limit: bigint,
        token: TokenState
    ) {
        const { blocks } = $settings.state
        const limitAfterSlippage = this.afterSlippage(limit)
        const { NumTxBlocks } = await this.zilpay.getBlockchainInfo()
        const nextBlock = Big(NumTxBlocks).add(blocks)
        const params = [
            {
                vname: 'token_address',
                type: 'ByStr20',
                value: token.base16,
            },
            {
                vname: 'min_token_amount',
                type: 'Uint128',
                value: String(limitAfterSlippage),
            },
            {
                vname: 'deadline_block',
                type: 'BNum',
                value: String(nextBlock),
            },
            {
                vname: 'recipient_address',
                type: 'ByStr20',
                value: this.wallet,
            },
        ]
        const contractAddress = this.contract
        const transition = 'SwapExactZILForTokens'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: String(exact),
            },
            this.calcGasLimit(SwapDirection.ZilToToken).toString()
        )

        const amount = Big(String(exact))
            .div(this.toDecimals(this.tokens[0].meta.decimals))
            .toString()
        const limitAmount = Big(String(limit))
            .div(this.toDecimals(token.decimals))
            .toString()
        addTransactions({
            timestamp: new Date().getTime(),
            name: `Swap exact (${formatNumber(amount)} ZIL), to (${formatNumber(
                limitAmount
            )} ${token.symbol})`,
            confirmed: false,
            hash: res.ID,
            from: res.from,
        })

        return res
    }

    public async swapExactTokensForZIL(
        exact: bigint,
        limit: bigint,
        token: TokenState
    ) {
        const { blocks } = $settings.state
        const limitAfterSlippage = this.afterSlippage(limit)
        const { NumTxBlocks } = await this.zilpay.getBlockchainInfo()
        const nextBlock = Big(NumTxBlocks).add(blocks)
        const params = [
            {
                vname: 'token_address',
                type: 'ByStr20',
                value: token.base16,
            },
            {
                vname: 'token_amount',
                type: 'Uint128',
                value: String(exact),
            },
            {
                vname: 'min_zil_amount',
                type: 'Uint128',
                value: String(limitAfterSlippage),
            },
            {
                vname: 'deadline_block',
                type: 'BNum',
                value: String(nextBlock),
            },
            {
                vname: 'recipient_address',
                type: 'ByStr20',
                value: this.wallet,
            },
        ]
        const contractAddress = this.contract
        const transition = 'SwapExactTokensForZIL'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: '0',
            },
            this.calcGasLimit(SwapDirection.TokenToZil).toString()
        )

        const amount = Big(String(exact))
            .div(this.toDecimals(token.decimals))
            .toString()
        const limitAmount = Big(String(limit))
            .div(this.toDecimals(this.tokens[0].meta.decimals))
            .toString()
        addTransactions({
            timestamp: new Date().getTime(),
            name: `Swap exact (${formatNumber(amount)} ${
                token.symbol
            }) to (${formatNumber(limitAmount)} ZIL)`,
            confirmed: false,
            hash: res.ID,
            from: res.from,
        })

        return res
    }

    public async swapExactTokensForTokens(
        exact: bigint,
        limit: bigint,
        inputToken: TokenState,
        outputToken: TokenState
    ) {
        const contractAddress = this.contract
        const { blocks } = $settings.state
        const limitAfterSlippage = this.afterSlippage(limit)
        const { NumTxBlocks } = await this.zilpay.getBlockchainInfo()
        const nextBlock = Big(NumTxBlocks).add(blocks)
        const params = [
            {
                vname: 'token0_address',
                type: 'ByStr20',
                value: inputToken.base16,
            },
            {
                vname: 'token1_address',
                type: 'ByStr20',
                value: outputToken.base16,
            },
            {
                vname: 'token0_amount',
                type: 'Uint128',
                value: String(exact),
            },
            {
                vname: 'min_token1_amount',
                type: 'Uint128',
                value: String(limitAfterSlippage),
            },
            {
                vname: 'deadline_block',
                type: 'BNum',
                value: String(nextBlock),
            },
            {
                vname: 'recipient_address',
                type: 'ByStr20',
                value: this.wallet,
            },
        ]
        const transition = 'SwapExactTokensForTokens'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: '0',
            },
            this.calcGasLimit(SwapDirection.TokenToTokens).toString()
        )

        const amount = formatNumber(
            Big(String(exact))
                .div(this.toDecimals(inputToken.decimals))
                .toString()
        )
        const receivedAmount = formatNumber(
            Big(String(limit))
                .div(this.toDecimals(outputToken.decimals))
                .toString()
        )
        addTransactions({
            timestamp: new Date().getTime(),
            name: `Swap exact (${formatNumber(amount)} ${
                inputToken.symbol
            }) to (${formatNumber(receivedAmount)} ${outputToken.symbol})`,
            confirmed: false,
            hash: res.ID,
            from: res.from,
        })

        return res
    }

    //ssibrowser ---
    public async swapTydraDEX(
        exact: bigint,
        limit: bigint,
        inputToken: TokenState,
        outputToken: TokenState
    ) {
        //@ssibrowser
        const contractAddress = this.wallet?.base16!
        //---
        //const contractAddress = this.contract
        const { blocks } = $settings.state
        const limitAfterSlippage = this.afterSlippage(limit)
        const { NumTxBlocks } = await this.zilpay.getBlockchainInfo()
        const nextBlock = Big(NumTxBlocks).add(blocks)
        const params = [
            {
                vname: 'token0_address',
                type: 'ByStr20',
                value: inputToken.base16,
            },
            {
                vname: 'token1_address',
                type: 'ByStr20',
                value: outputToken.base16,
            },
            {
                vname: 'token0_amount',
                type: 'Uint128',
                value: String(exact),
            },
            {
                vname: 'min_token1_amount',
                type: 'Uint128',
                value: String(limitAfterSlippage),
            },
            {
                vname: 'deadline_block',
                type: 'BNum',
                value: String(nextBlock),
            },
            {
                vname: 'recipient_address',
                type: 'ByStr20',
                value: this.wallet,
            },
        ]
        const transition = 'SwapExactTokensForTokens'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: '0',
            },
            this.calcGasLimit(SwapDirection.TokenToTokens).toString()
        )

        const amount = formatNumber(
            Big(String(exact))
                .div(this.toDecimals(inputToken.decimals))
                .toString()
        )
        const receivedAmount = formatNumber(
            Big(String(limit))
                .div(this.toDecimals(outputToken.decimals))
                .toString()
        )
        addTransactions({
            timestamp: new Date().getTime(),
            name: `Swap exact (${formatNumber(amount)} ${
                inputToken.symbol
            }) to (${formatNumber(receivedAmount)} ${outputToken.symbol})`,
            confirmed: false,
            hash: res.ID,
            from: res.from,
        })

        return res
    }
    public async swapTydraDeFi(limit: bigint) {
        const contractAddress = this.wallet?.base16!

        let none_addr = await tyron.TyronZil.default.OptionParam(
            tyron.TyronZil.Option.none,
            'ByStr20'
        )
        let none_str = await tyron.TyronZil.default.OptionParam(
            tyron.TyronZil.Option.none,
            'String'
        )
        let none_number = await tyron.TyronZil.default.OptionParam(
            tyron.TyronZil.Option.none,
            'Uint128'
        )
        const params = [
            {
                vname: 'dApp',
                type: 'String',
                value: 'tyrons$i_transmuter',
            },
            {
                vname: 'beneficiary',
                type: 'Option ByStr20',
                value: none_addr,
            },
            {
                vname: 'amount',
                type: 'Uint128',
                value: String(limit),
            },
            {
                vname: 'auth',
                type: 'Bool',
                value: { constructor: 'True', argtypes: [], arguments: [] },
            },
            {
                vname: 'subdomain',
                type: 'Option String',
                value: none_str,
            },
            {
                vname: 'tyron',
                type: 'Option Uint128',
                value: none_number,
            },
        ]
        const transition = 'MintAuth'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: '0',
            },
            this.calcGasLimit(SwapDirection.TokenToTokens).toString()
        )
        return res
    }
    //ssibrowser -end-

    // public async addLiquidity(
    //     addr: string,
    //     amount: Big,
    //     limit: Big,
    //     created: boolean
    // ) {
    //     //@ssibrowser
    //     const contractAddress = this.wallet?.base16!
    //     //---
    //     //const contractAddress = this.contract
    //     const { blocks } = $settings.state
    //     const { blockNum, totalContributions, pool } =
    //         await this._provider.getBlockTotalContributions(
    //             contractAddress,
    //             addr
    //         )
    //     const maxExchangeRateChange = BigInt($settings.state.slippage * 100)
    //     const nextBlock = Big(blockNum).add(blocks)
    //     const maxTokenAmount = created
    //         ? (BigInt(amount.toString()) *
    //             (DragonDex.FEE_DEMON + maxExchangeRateChange)) /
    //         DragonDex.FEE_DEMON
    //         : BigInt(amount.toString())
    //     let minContribution = BigInt(0)

    //     if (created) {
    //         const zilAmount = BigInt(limit.toString())
    //         const zilReserve = Big(pool[0])
    //         const totalContribution = BigInt(totalContributions)
    //         const numerator = totalContribution * zilAmount
    //         const denominator = Big(
    //             String(DragonDex.FEE_DEMON + maxExchangeRateChange)
    //         )
    //             .sqrt()
    //             .mul(zilReserve)
    //             .round()
    //         minContribution = numerator / BigInt(String(denominator))
    //     }

    //     const params = [
    //         {
    //             vname: 'token_address',
    //             type: 'ByStr20',
    //             value: addr,
    //         },
    //         {
    //             vname: 'min_contribution_amount',
    //             type: 'Uint128',
    //             value: String(minContribution),
    //         },
    //         {
    //             vname: 'max_token_amount',
    //             type: 'Uint128',
    //             value: String(maxTokenAmount),
    //         },
    //         {
    //             vname: 'deadline_block',
    //             type: 'BNum',
    //             value: String(nextBlock),
    //         },
    //     ]
    //     const transition = 'AddLiquidity'
    //     const res = await this.zilpay.call(
    //         {
    //             params,
    //             contractAddress,
    //             transition,
    //             amount: String(limit),
    //         },
    //         '3060'
    //     )

    //     const found = this.tokens.find((t) => t.meta.base16 === addr)

    //     if (found) {
    //         const max = amount
    //             .div(this.toDecimals(found.meta.decimals))
    //             .toString()
    //         addTransactions({
    //             timestamp: new Date().getTime(),
    //             name: `addLiquidity maximum ${formatNumber(max)} ${found.meta.symbol
    //                 }`,
    //             confirmed: false,
    //             hash: res.ID,
    //             from: res.from,
    //         })
    //     }

    //     return res.ID
    // }

    //@ssibrowser
    public async addLiquiditySSI(
        addr_name: string,
        min_contribution: Big,
        max_token: Big
    ) {
        const contractAddress = this.wallet?.base16!
        const dex_index = this.dex.dex_index
        const dex_value = dex_options[Number(dex_index)].value
        let dex = 'tyron_s$i'
        if (dex_index !== '0') {
            dex = dex_value
        }

        const { blocks } = $settings.state

        const maxExchangeRateChange = BigInt($settings.state.slippage * 100)
        const maxTokenAmount = BigInt(max_token)
        // created
        //     ? (BigInt(amount.toString()) *
        //         (DragonDex.FEE_DEMON + maxExchangeRateChange)) /
        //     DragonDex.FEE_DEMON
        //     : BigInt(amount.toString())
        let minContribution = BigInt(min_contribution)

        // if (created) {
        //     const zilAmount = BigInt(limit.toString())
        //     const zilReserve = Big(pool[0])
        //     const totalContribution = BigInt(totalContributions)
        //     const numerator = totalContribution * zilAmount
        //     const denominator = Big(
        //         String(DragonDex.FEE_DEMON + maxExchangeRateChange)
        //     )
        //         .sqrt()
        //         .mul(zilReserve)
        //         .round()
        //     minContribution = numerator / BigInt(String(denominator))
        // }

        let none_str = await tyron.TyronZil.default.OptionParam(
            tyron.TyronZil.Option.none,
            'String'
        )
        let none_number = await tyron.TyronZil.default.OptionParam(
            tyron.TyronZil.Option.none,
            'Uint128'
        )
        const params = [
            {
                vname: 'dApp',
                type: 'String',
                value: dex,
            },
            {
                vname: 'isSSI',
                type: 'Bool',
                value: { constructor: 'True', argtypes: [], arguments: [] },
            },
            {
                vname: 'addrName',
                type: 'String',
                value: addr_name.toLowerCase(),
            },
            {
                vname: 'minContributionAmount',
                type: 'Uint128',
                value: String(minContribution),
            },
            {
                vname: 'maxTokenAmount',
                type: 'Uint128',
                value: String(maxTokenAmount),
            },
            {
                vname: 'deadline',
                type: 'Uint128',
                value: String(blocks),
            },
            {
                vname: 'double_allowance',
                type: 'Bool',
                value: { constructor: 'False', argtypes: [], arguments: [] },
            },
            {
                vname: 'is_community',
                type: 'Bool',
                value: { constructor: 'True', argtypes: [], arguments: [] },
            },
            {
                vname: 'subdomain',
                type: 'Option String',
                value: none_str,
            },
            {
                vname: 'tyron',
                type: 'Option Uint128',
                value: none_number,
            },
        ]
        console.log('ADD LIQUIDITY:', JSON.stringify(params, null, 2))
        const transition = 'AddLiquidity'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: String(0),
            },
            '10000'
        )

        return res.ID
    }

    public async removeLiquidity(
        minzil: Big,
        minzrc: Big,
        minContributionAmount: Big,
        token: string,
        owner: string
    ) {
        const contractAddress = this.contract
        const { blocks } = $settings.state
        const { blockNum } =
            await this._provider.getUserBlockTotalContributions(
                contractAddress,
                token,
                owner
            )
        const zilsAfterSlippage = this.afterSlippage(BigInt(String(minzil)))
        const tokensAfterSlippage = this.afterSlippage(BigInt(String(minzrc)))
        const nextBlock = Big(blockNum).add(blocks)
        const params = [
            {
                vname: 'token_address',
                type: 'ByStr20',
                value: token,
            },
            {
                vname: 'contribution_amount',
                type: 'Uint128',
                value: String(minContributionAmount),
            },
            {
                vname: 'min_zil_amount',
                type: 'Uint128',
                value: String(zilsAfterSlippage),
            },
            {
                vname: 'min_token_amount',
                type: 'Uint128',
                value: String(tokensAfterSlippage),
            },
            {
                vname: 'deadline_block',
                type: 'BNum',
                value: String(nextBlock),
            },
        ]
        const transition = 'RemoveLiquidity'
        const res = await this.zilpay.call(
            {
                params,
                contractAddress,
                transition,
                amount: '0',
            },
            '3060'
        )

        addTransactions({
            timestamp: new Date().getTime(),
            name: `RemoveLiquidity`,
            confirmed: false,
            hash: res.ID,
            from: res.from,
        })

        return res
    }

    public toDecimals(decimals: number) {
        try {
            return Big(10 ** decimals)
        } catch (error) {
            console.error(error)
        }
    }

    public afterSlippage(amount: bigint) {
        const slippage = $settings.state.slippage

        if (slippage <= 0) {
            return amount
        }

        const _slippage = DragonDex.FEE_DEMON - BigInt(slippage * 100)

        return (amount * _slippage) / DragonDex.FEE_DEMON
    }

    public calcGasLimit(direction: SwapDirection) {
        switch (direction) {
            case SwapDirection.ZilToToken:
                return Big(4637)
            case SwapDirection.TokenToZil:
                return Big(5163)
            case SwapDirection.TokenToTokens:
                return Big(6183)
            default:
                return Big(7000)
        }
    }

    public calcPriceImpact(
        priceInput: Big,
        priceOutput: Big,
        currentPrice: Big
    ) {
        const nextPrice = priceInput.div(priceOutput)
        const priceDiff = nextPrice.sub(currentPrice)
        const value = priceDiff.div(currentPrice)
        const _100 = Big(100)
        const imact = value.mul(_100).round(3).toNumber()
        const v = Math.abs(imact)

        return v > 100 ? 100 : v
    }

    public calcVirtualAmount(amount: Big, token: TokenState, pool: string[]) {
        if (!pool || pool.length < 2) {
            return Big(0)
        }

        const zilReserve = Big(String(pool[0])).div(
            this.toDecimals($tokens.state.tokens[0].meta.decimals)
        )
        const tokensReserve = Big(String(pool[1])).div(
            this.toDecimals(token.decimals)
        )
        const zilRate = zilReserve.div(tokensReserve)

        return amount.mul(zilRate)
    }

    public sleepageCalc(value: string) {
        const slippage = $settings.state.slippage

        if (slippage <= 0) {
            return value
        }

        const amount = Big(value)
        const demon = Big(String(DragonDex.FEE_DEMON))
        const slip = demon.sub(slippage * 100)

        return amount.mul(slip).div(demon)
    }

    private _fraction(d: bigint, x: bigint, y: bigint) {
        return (d * y) / x
    }

    private _zilToTokens(
        amount: bigint,
        inputPool: string[],
        cashback: boolean
    ) {
        const [zilReserve, tokenReserve] = inputPool
        const amountAfterFee =
            this.protoFee === BigInt(0) || !cashback
                ? amount
                : amount - amount / this.protoFee
        return this._outputFor(
            amountAfterFee,
            BigInt(zilReserve),
            BigInt(tokenReserve)
        )
    }

    //@ssibrowser
    private _ssiToTyron(amount: bigint, inputReserve: string[]) {
        const [ssiReserve, tyronReserve] = inputReserve
        const amountAfterFee = amount - amount / this.tyronProfitDenom
        return this._outputFor(
            amountAfterFee,
            BigInt(ssiReserve),
            BigInt(tyronReserve)
        )
    }

    //@zilpay
    private _tokensToZil(
        amount: bigint,
        inputPool: string[],
        cashback: boolean
    ) {
        const [zilReserve, tokenReserve] = inputPool
        const zils = this._outputFor(
            amount,
            BigInt(tokenReserve),
            BigInt(zilReserve)
        )

        return this.protoFee === BigInt(0) || !cashback
            ? zils
            : zils - zils / this.protoFee
    }

    private _tokensToTokens(
        amount: bigint, //input
        inputPool: string[],
        outputPool: string[],
        cashback: boolean
    ) {
        const [inputZilReserve, inputTokenReserve] = inputPool
        const [outputZilReserve, outputTokenReserve] = outputPool
        const fee =
            DragonDex.FEE_DEMON - (DragonDex.FEE_DEMON - this.fee) / BigInt(2)
        const zilIntermediateAmount = this._outputFor(
            amount,
            BigInt(inputTokenReserve),
            BigInt(inputZilReserve),
            fee
        )

        const zils =
            this.protoFee === BigInt(0) || !cashback
                ? zilIntermediateAmount
                : zilIntermediateAmount - zilIntermediateAmount / this.protoFee

        return this._outputFor(
            zils,
            BigInt(outputZilReserve),
            BigInt(outputTokenReserve),
            fee
        )
    }

    private _outputFor(
        exactAmount: bigint,
        inputReserve: bigint,
        outputReserve: bigint,
        fee: bigint = this.fee
    ) {
        const exactAmountAfterFee = exactAmount * fee
        const numerator = exactAmountAfterFee * outputReserve
        const inputReserveAfterFee = inputReserve * DragonDex.FEE_DEMON
        const denominator = inputReserveAfterFee + exactAmountAfterFee

        return numerator / denominator
    }

    private _getShares(
        balances: FiledBalances,
        totalContributions: FieldTotalContributions,
        owner: string
    ) {
        const shares: Share = {}
        const _zero = BigInt(0)
        const userContributions = balances[owner] || {}

        for (const token in userContributions) {
            const contribution = BigInt(totalContributions[token])
            const balance = BigInt(userContributions[token])

            if (balance === _zero) {
                continue
            }

            shares[token] = (balance * SHARE_PERCENT) / contribution
        }

        return shares
    }

    private _getPools(pools: FiledPools) {
        const newPools: DexPool = {}

        for (const token in pools) {
            const [x, y] = pools[token].arguments

            newPools[token] = [x, y]
        }

        return newPools
    }

    private _valueToBigInt(amount: string, token: TokenState) {
        return BigInt(
            Big(amount).mul(this.toDecimals(token.decimals)).round().toString()
        )
    }

    //@ssibrowser
    private _getTyronReserves(reserves: any) {
        const newReserves: DexPool = {}
        const s$i_ = reserves.arguments[0]
        const tyron_ = reserves.arguments[0]
        newReserves['tyron_s$i'] = [s$i_, tyron_]
        return newReserves
    }
}

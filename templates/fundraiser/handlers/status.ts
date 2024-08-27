'use server'
import type {
    BuildFrameData,
    FrameButtonMetadata,
    FrameValidatedActionPayload,
} from '@/lib/farcaster'
import TextSlide from '@/sdk/components/TextSlide'
import { FrameError } from '@/sdk/error'
import { loadGoogleFontAllVariants } from '@/sdk/fonts'
import { updatePaymentTransaction, waitForSession } from '@paywithglide/glide-js'
import type { Config } from '..'
import { getClient } from '../common/onchain'
import { getGlideConfig } from '../common/shared'
import RefreshView from '../views/Refresh'
import initial from './initial'

export default async function status({
    body,
    config,
    params,
}: {
    body: FrameValidatedActionPayload
    config: Config
    storage: Storage
    params: { transactionId?: string; sessionId?: string }
}): Promise<BuildFrameData> {
    if (!config.address) {
        throw new FrameError('Fundraiser address not found.')
    }

    if (!(config.token?.chain && config.token.symbol)) {
        throw new FrameError('Fundraiser token not found.')
    }

    if (!body.validatedData.transaction && body.validatedData.tapped_button) {
        return initial({ config, body, storage: undefined })
    }

    if (!(body.validatedData.transaction?.hash || params.transactionId)) {
        throw new FrameError('Transaction Hash is missing')
    }

    if (!params.sessionId) {
        throw new FrameError('Session Id is missing')
    }

    const roboto = await loadGoogleFontAllVariants('Roboto')
    const fonts = [...roboto]

    if (config.success.title?.fontFamily) {
        const titleFont = await loadGoogleFontAllVariants(config.success.title.fontFamily)
        fonts.push(...titleFont)
    }

    if (config.success.subtitle?.fontFamily) {
        const subtitleFont = await loadGoogleFontAllVariants(config.success.subtitle.fontFamily)
        fonts.push(...subtitleFont)
    }

    if (config.success.bottomMessage?.fontFamily) {
        const customFont = await loadGoogleFontAllVariants(config.success.bottomMessage.fontFamily)
        fonts.push(...customFont)
    }

    const txHash = (
        body.validatedData.transaction ? body.validatedData.transaction.hash : params.transactionId
    ) as `0x${string}`

    const client = getClient(config.token.chain)
    const glideConfig = getGlideConfig(client.chain)

    try {
        // Get the status of the payment transaction
        await updatePaymentTransaction(glideConfig, {
            sessionId: params.sessionId,
            hash: txHash,
        })
        // Wait for the session to complete. It can take a few seconds
        await waitForSession(glideConfig, params.sessionId)

        const buildData: Record<string, any> = {
            fonts,
            buttons: [
                {
                    label: 'Donate again',
                },
                {
                    label: `View on ${client.chain.blockExplorers?.default.name}`,
                    action: 'link',
                    target: `https://${client.chain.blockExplorers?.default.url}/tx/${txHash}`,
                },
                {
                    label: 'Create Your Own',
                    action: 'link',
                    target: 'https://www.frametra.in',
                },
            ],
            handler: 'success',
        }

        if (config.success?.image) {
            buildData['image'] = config.success?.image
        } else {
            buildData['component'] = TextSlide(config.success)
        }

        return buildData as BuildFrameData
    } catch (e) {
        const buttons: FrameButtonMetadata[] = []
        const error = e as Error
        // updatePaymentTransaction throws an error if the transaction is already paid
        const paid = error.message.toLowerCase().includes('session is already paid')
        const buildData: Record<string, any> = {
            handler: paid ? 'success' : 'status',
            params: {
                transactionId: txHash,
                sessionId: params.sessionId,
                isFresh: false,
            },
            fonts,
        }

        if (paid) {
            buttons.push(
                {
                    label: 'Donate again',
                },
                {
                    label: `View on ${client.chain.blockExplorers?.default.name}`,
                    action: 'link',
                    target: `https://${client.chain.blockExplorers?.default.url}/tx/${txHash}`,
                },
                {
                    label: 'Create Your Own',
                    action: 'link',
                    target: 'https://www.frametra.in',
                }
            )
        } else {
            buttons.push({
                label: 'Refresh',
            })
        }

        if (config.success?.image) {
            buildData['image'] = paid ? config.success?.image : undefined
        } else {
            buildData['component'] = paid ? TextSlide(config.success) : RefreshView()
        }

        return buildData as BuildFrameData
    }
}

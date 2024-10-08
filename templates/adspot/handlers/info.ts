'use server'
import type { BuildFrameData, FramePayloadValidated } from '@/lib/farcaster'
import { FrameError } from '@/sdk/error'
import { loadGoogleFontAllVariants } from '@/sdk/fonts'
import { supportedChains } from '@/sdk/viem'
import type { Config, Storage } from '..'
import { fetchUser } from '../utils'
import InfoView from '../views/Info'

export default async function info({
    config,
    storage,
}: {
    body: FramePayloadValidated
    config: Config
    storage: Storage
    params: any
}): Promise<BuildFrameData> {
    if (!(config.fid && config.token?.chain && config.token?.symbol && config.address)) {
        throw new FrameError('Frame not fully configured')
    }

    const chain = supportedChains.filter((chain) => chain.key === config.token!.chain)

    const user = await fetchUser(config.fid)
    const fonts = await loadGoogleFontAllVariants('Nunito Sans')

    return {
        buttons: [
            {
                label: 'Back',
            },
            {
                label: 'Buy Space',
            },
            {
                label: 'Manage',
            },
        ],
        component: InfoView({
            config,
            user,
            chainName: chain[0].label,
        }),
        handler: 'buy',
        fonts,
        storage,
    }
}

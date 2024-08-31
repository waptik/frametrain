'use server'
import type { BuildFrameData, FrameValidatedActionPayload } from '@/lib/farcaster'
import type { Config } from '..'
import TextSlide from '@/sdk/components/TextSlide'
import { loadGoogleFontAllVariants } from '@/sdk/fonts'

export default async function about({
    config,
}: {
    body: FrameValidatedActionPayload
    config: Config
    storage: undefined
}): Promise<BuildFrameData> {
    const fontSet = new Set(['Roboto'])
    const fonts: any[] = []

    if (config.about.title?.fontFamily) {
        fontSet.add(config.about.title.fontFamily)
    }

    if (config.about.subtitle?.fontFamily) {
        fontSet.add(config.about.subtitle.fontFamily)
    }

    if (config.about.bottomMessage?.fontFamily) {
        fontSet.add(config.about.bottomMessage.fontFamily)
    }

    for (const font of fontSet) {
        const loadedFont = await loadGoogleFontAllVariants(font)
        fonts.push(...loadedFont)
    }

    return {
        buttons: [
            {
                label: '←',
            },
        ],
        image: config.about.image,
        component: config.about.image ? undefined : TextSlide(config.about),
        handler: 'success',
    }
}

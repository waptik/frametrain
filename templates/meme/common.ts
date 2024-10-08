'use server'

import ms from 'ms'
import { unstable_cache } from 'next/cache'

type MemeTemplate = {
    id: string
    name: string
    url: string
    width: number
    height: number
    box_count: number
    captions: number
}

export const getMemeTemplates = unstable_cache(
    async () => {
        try {
            const response = await fetch('https://api.imgflip.com/get_memes')
            const data = (await response.json()) as
                | {
                      success: true
                      data: {
                          memes: MemeTemplate[]
                      }
                  }
                | {
                      success: false
                      error_message: string
                  }

            if (!data.success) {
                throw new Error(data.error_message)
            }

            return data.data.memes
        } catch {
            throw {
                success: false,
                message: 'An error occurred while fetching meme templates',
            }
        }
    },
    [],
    {
        revalidate: ms('7d') / 1000,
    }
)

export async function createMeme(captions: string[], id: string) {
    const url = new URL('https://api.imgflip.com/caption_image')
    url.searchParams.append('template_id', id)
    url.searchParams.append('username', process.env.IMGFLIP_USERNAME!)
    url.searchParams.append('password', process.env.IMGFLIP_PASSWORD!)

    captions.forEach((caption, index) => {
        url.searchParams.append(`boxes[${index}][text]`, caption)
    })

    try {
        const response = await fetch(url.toString(), {
            method: 'POST',
        })

        const data = (await response.json()) as
            | {
                  success: true
                  data: {
                      url: string
                      page_url: string
                  }
              }
            | { success: false; error_message: string }

        if (!data.success) {
            throw new Error(data.error_message)
        }

        return data.data.url
    } catch {
        throw {
            success: false,
            message: 'An error occurred while generating the meme',
        }
    }
}

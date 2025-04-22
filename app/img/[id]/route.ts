import Joi from 'joi'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '~src/db'

const schema = Joi.number().integer().min(1)

class BadRequestError extends Error {
    constructor(message: string) {
        super(message)
    }
}

const getErrorMsg = (request: NextRequest) => {
    const method = request.method
    const pathname = request.nextUrl.pathname

    return `Error processing ${method} ${pathname}`
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const validatedId = schema.validate(Number.parseInt(id, 10))

        if (validatedId.error) {
            throw new BadRequestError('Invalid image ID')
        }

        const data = await db.getImageData(validatedId.value)

        if (!data) {
            return new NextResponse('Not Found', { status: 404 })
        }

        return new NextResponse(data, {
            status: 200,
            headers: {
                'Content-Type': 'image/jpeg',
                'Cache-Control': 'public, max-age=3600',
            },
        })
    } catch (error) {
        const msg = getErrorMsg(request)
        if (error instanceof BadRequestError) {
            return new NextResponse(`${msg} ${error.message}`, {
                status: 400,
            })
        } else {
            return new NextResponse(msg, {
                status: 500,
            })
        }
    }
}

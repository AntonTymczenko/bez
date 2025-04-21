import '~app/global.css'

import type { ChildrenProps, PageParamsLang } from '~src/types'

export default async function Root(props: ChildrenProps & PageParamsLang) {
    const { children } = props
    const { lang } = await props.params

    return (
        <html lang={lang}>
            <body>{children}</body>
        </html>
    )
}

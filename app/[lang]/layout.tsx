import '~app/global.css'

import Config from '~src/config'
import LocaleSwitcher from '~src/components/locale-switcher'
import type { PageParams } from '~src/types'
import type { ChildrenProps } from '~src/types'
import HeaderNavigation from '~src/components/header-navigation'
import I18n from '~src/i18n'

const locales = new I18n(Config.locales).getLocalesWithFlags()

export default async function Root(props: ChildrenProps & PageParams) {
    const { children } = props

    const params = await props.params
    const { lang } = params

    return (
        <html lang={lang}>
            <body>
                <HeaderNavigation lang={lang} />
                <LocaleSwitcher current={lang} locales={locales} />
                {children}
            </body>
        </html>
    )
}

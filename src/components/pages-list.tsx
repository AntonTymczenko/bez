import Link from 'next/link'
import type { PageList } from '~src/types'

export default function PagesList(props: { list: PageList }) {
    return !!props.list.length ? (
        <ul>
            {props.list.map((page) => (
                <li key={page.url}>
                    <Link href={page.url}>{page.heading}</Link>
                </li>
            ))}
        </ul>
    ) : (
        ''
    )
}

import Link from 'next/link'
import type { PageListed } from '~src/types'

export default function PagesList(props: { list: PageListed[] }) {
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

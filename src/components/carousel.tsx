'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import styles from './styles/carousel.module.scss'

type Slide = {
    url: string
    imageUrl: string
    title: string
    description?: string
}

type CarouselProps = {
    slides: Slide[]
}

// must match '$mainHeight' in the 'carousel.module.scss'
const CAROUSEL_HEIGHT = '400px'

function PreviewSlide({
    slide,
    priority,
}: {
    slide: Slide
    priority: boolean
}) {
    return (
        <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            sizes={`${CAROUSEL_HEIGHT}, 33vw}`}
            style={{
                objectFit: 'cover',
            }}
            priority={priority}
        />
    )
}

export function Carousel(props: CarouselProps) {
    const { slides: elements } = props
    const [focused, setFocused] = useState(2)
    const [shift, setShift] = useState(0)
    const [visualShift, setVisualShift] = useState(0)

    const handleNext = () => {
        if (visualShift !== 0) return
        setVisualShift(1)
        setFocused((prev) => prev + 1)
    }

    const handlePrev = () => {
        if (visualShift !== 0) return
        setVisualShift(-1)
        setFocused((prev) => prev - 1)
    }

    const handleTransitionEnd = () => {
        if (visualShift === 0) return

        // After animation finishes, logically shift items
        setShift(
            (prev) => (prev + visualShift + elements.length) % elements.length
        )
        setVisualShift(0) // reset visual shift
        setFocused(2)
    }

    // return 5 items
    const getVisibleItems = () => {
        const size = elements.length

        return [
            elements[(shift - 1 + size) % size],
            elements[shift % size],
            elements[(shift + 1) % size],
            elements[(shift + 2) % size],
            elements[(shift + 3) % size],
        ]
    }

    const x = 70 // how much space the middle item should visually take, %
    const it = 40 // item percent
    const items = getVisibleItems()
    const trackShift = (0.5 + visualShift) * it + (100 - x) / 2 + x / 2

    return (
        <div className={styles.container}>
            <div
                className={styles.track}
                style={{
                    transform: `translateX(-${trackShift}%)`,
                    transition:
                        visualShift !== 0 ? 'transform 0.3s ease' : 'none',
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {items.map((item, idx) => (
                    <div key={idx} className={styles.item}>
                        <PreviewSlide
                            slide={item}
                            priority={idx !== 0 && idx !== 4}
                        />
                    </div>
                ))}
            </div>
            <div className={styles.controls}>
                <div className={styles.card}>
                    <Link href={items[focused].url}>
                        <h2>{items[focused].title}</h2>
                        <div className={styles.meta}>
                            {items[focused].description}
                        </div>
                    </Link>
                </div>
                <div className={`${styles.blur} ${styles.left}`}></div>
                <div className={`${styles.blur} ${styles.right}`}></div>
                <button
                    className={`${styles.arrow} ${styles.left}`}
                    onClick={handlePrev}
                >
                    <Image
                        src="/images/icon-arrow.svg"
                        alt="Left Arrow"
                        width={16}
                        height={16}
                    />
                </button>
                <button
                    className={`${styles.arrow} ${styles.right}`}
                    onClick={handleNext}
                >
                    <Image
                        src="/images/icon-arrow.svg"
                        alt="Right Arrow"
                        width={16}
                        height={16}
                    />
                </button>
            </div>
        </div>
    )
}

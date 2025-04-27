'use client'

import Image from 'next/image'
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
                filter: 'blur(0.1rem)',
            }}
            priority={priority}
        />
    )
}

export function Carousel(props: CarouselProps) {
    const { slides: elements } = props
    const [shift, setShift] = useState(0)
    const [visualShift, setVisualShift] = useState(0)

    const handleNext = () => {
        if (visualShift !== 0) return
        setVisualShift(1)
    }

    const handlePrev = () => {
        if (visualShift !== 0) return
        setVisualShift(-1)
    }

    const handleTransitionEnd = () => {
        if (visualShift === 0) return

        // After animation finishes, logically shift items
        setShift(
            (prev) => (prev + visualShift + elements.length) % elements.length
        )
        setVisualShift(0) // reset visual shift
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

    return (
        <div className={styles.container}>
            <div
                className={styles.track}
                style={{
                    transform: `translateX(calc(${visualShift * -20}% - 20%))`,
                    transition:
                        visualShift !== 0 ? 'transform 0.3s ease' : 'none',
                }}
                onTransitionEnd={handleTransitionEnd}
            >
                {getVisibleItems().map((item, idx) => (
                    <div key={idx} className={styles.item}>
                        <PreviewSlide
                            slide={item}
                            priority={idx !== 0 && idx !== 4}
                        />
                    </div>
                ))}
            </div>
            <div className={styles.controls}>
                <button onClick={handlePrev}>Previous</button>
                <button onClick={handleNext}>Next</button>
            </div>
        </div>
    )
}

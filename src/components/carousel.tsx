'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useRef, useState } from 'react'
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

function PreviewSlide({ slide }: { slide: Slide }) {
    return (
        <div className={`${styles.slide} ${styles.preview}`}>
            <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                sizes={`${CAROUSEL_HEIGHT}, 33vw}`}
                style={{
                    objectFit: 'cover',
                    filter: 'blur(0.1rem)',
                }}
                priority={false}
            />
        </div>
    )
}

export function Carousel(props: CarouselProps) {
    const { slides } = props

    const [activeIndex, setActiveIndex] = useState(0)
    const touchStartX = useRef<number | null>(null)
    const touchEndX = useRef<number | null>(null)

    const handlePrev = () => {
        setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
    }

    const handleNext = () => {
        setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.changedTouches[0].clientX
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX
        if (touchStartX.current !== null && touchEndX.current !== null) {
            const delta = touchStartX.current - touchEndX.current
            if (Math.abs(delta) > 50) {
                if (delta > 0) {
                    handleNext()
                } else {
                    handlePrev()
                }
            }
        }
        touchStartX.current = null
        touchEndX.current = null
    }

    const prevIndex = (activeIndex - 1 + slides.length) % slides.length
    const nextIndex = (activeIndex + 1) % slides.length

    return (
        <div className={styles.carousel}>
            <div
                className={styles.track}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {
                    // Left Side Preview
                    slides.length > 1 && (
                        <PreviewSlide slide={slides[prevIndex]} />
                    )
                }

                {/* Main slide */}
                <div className={`${styles.slide} ${styles.active}`}>
                    {slides.length ? (
                        <>
                            <Image
                                src={slides[activeIndex].imageUrl}
                                alt={slides[activeIndex].title}
                                fill
                                style={{ objectFit: 'cover' }}
                                priority
                            />
                            <div className={styles.card}>
                                <Link
                                    href={slides[activeIndex].url}
                                    className={styles.homeLink}
                                >
                                    <h2>{slides[activeIndex].title}</h2>
                                    <div className={styles.meta}>
                                        {slides[activeIndex].description}
                                    </div>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div></div>
                    )}
                    {slides.length > 1 && (
                        <>
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
                        </>
                    )}
                </div>

                {slides.length > 1 && (
                    <PreviewSlide slide={slides[nextIndex]} />
                )}
            </div>
        </div>
    )
}

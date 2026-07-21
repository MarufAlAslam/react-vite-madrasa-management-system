import { useEffect, useState } from 'react'

const slides = [
  { src: '/images/img-1.jpg', alt: 'Moulovirhat H. Fazil Madrasah campus life' },
  { src: '/images/img-2.jpg', alt: 'Moulovirhat H. Fazil Madrasah students' },
  { src: '/images/img-3.jpg', alt: 'Moulovirhat H. Fazil Madrasah learning environment' },
  // { src: '/images/img-4.jpg', alt: 'Moulovirhat H. Fazil Madrasah community' },
]

function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="hero-carousel">
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={`hero-carousel-slide ${index === activeIndex ? 'is-active' : ''}`}
        />
      ))}

      <div className="hero-carousel-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={`hero-carousel-dot ${index === activeIndex ? 'is-active' : ''}`}
            aria-label={`Show slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroCarousel

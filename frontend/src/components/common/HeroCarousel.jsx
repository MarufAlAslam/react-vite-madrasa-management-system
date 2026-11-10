import { useEffect, useState } from 'react'
import { useData } from '../../context/DataContext'
import { getMadrasaName } from '../../utils/institution'

const slides = [
  { src: '/images/img-1.jpg', caption: 'campus life' },
  { src: '/images/img-2.jpg', caption: 'students' },
  { src: '/images/img-3.jpg', caption: 'learning environment' },
]

function HeroCarousel() {
  const { settings } = useData()
  const madrasaName = getMadrasaName(settings)
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
          alt={`${madrasaName} ${slide.caption}`}
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

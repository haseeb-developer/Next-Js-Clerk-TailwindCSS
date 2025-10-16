'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import { useState, useEffect } from 'react'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

interface SwiperSliderProps {
  children: React.ReactNode[]
  className?: string
  slidesPerView?: number
  spaceBetween?: number
  showPagination?: boolean
  breakpoints?: {
    [width: number]: {
      slidesPerView: number
      spaceBetween: number
    }
  }
}

export function SwiperSlider({ 
  children, 
  className = '', 
  slidesPerView = 3,
  spaceBetween = 24,
  showPagination = false,
  breakpoints
}: SwiperSliderProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const defaultBreakpoints = {
    320: {
      slidesPerView: 1,
      spaceBetween: 16
    },
    640: {
      slidesPerView: 2,
      spaceBetween: 20
    },
    1024: {
      slidesPerView: 3,
      spaceBetween: 24
    }
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation={{
          nextEl: '.swiper-button-next-custom',
          prevEl: '.swiper-button-prev-custom',
        }}
        pagination={showPagination ? {
          clickable: true,
          bulletClass: 'swiper-pagination-bullet-custom',
          bulletActiveClass: 'swiper-pagination-bullet-active-custom',
        } : false}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        breakpoints={breakpoints || defaultBreakpoints}
        className="swiper-container-custom"
      >
        {children.map((child, index) => (
          <SwiperSlide key={index}>
            {child}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Arrows */}
      <button className="swiper-button-prev-custom group">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-800/80 hover:bg-gray-700/90 rounded-full border border-gray-600/50 hover:border-gray-500/70 transition-all duration-200 backdrop-blur-sm">
          <svg 
            className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </button>

      <button className="swiper-button-next-custom group">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-800/80 hover:bg-gray-700/90 rounded-full border border-gray-600/50 hover:border-gray-500/70 transition-all duration-200 backdrop-blur-sm">
          <svg 
            className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors duration-200" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Custom Styles */}
      <style jsx global>{`
        .swiper-container-custom {
          padding: 0 60px;
          overflow: hidden;
        }

        .swiper-wrapper {
          align-items: stretch;
        }

        .swiper-slide {
          height: auto;
          display: flex;
        }

        .swiper-button-prev-custom,
        .swiper-button-next-custom {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 20;
          cursor: pointer;
          width: auto;
          height: auto;
          margin: 0;
          background: none;
          border: none;
          outline: none;
          transition: all 0.3s ease;
        }

        .swiper-button-prev-custom {
          left: 0px;
        }

        .swiper-button-next-custom {
          right: 0px;
        }

        .swiper-button-prev-custom:hover,
        .swiper-button-next-custom:hover {
          transform: translateY(-50%) scale(1.1);
        }

        .swiper-button-prev-custom.swiper-button-disabled,
        .swiper-button-next-custom.swiper-button-disabled {
          opacity: 0.3;
          cursor: not-allowed;
          transform: translateY(-50%);
        }

        .swiper-button-prev-custom.swiper-button-disabled:hover,
        .swiper-button-next-custom.swiper-button-disabled:hover {
          transform: translateY(-50%);
        }

        /* Mobile responsive arrows */
        @media (max-width: 768px) {
          .swiper-container-custom {
            padding: 0 50px;
          }
          
          .swiper-button-prev-custom {
            left: 5px;
          }
          
          .swiper-button-next-custom {
            right: 5px;
          }
        }

        /* Ensure slides don't overflow */
        .swiper-container-custom .swiper-slide > * {
          width: 100%;
          max-width: 100%;
        }

        /* Pagination dots */
        .swiper-pagination-bullet-custom {
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          margin: 0 4px;
          transition: all 0.3s ease;
        }

        .swiper-pagination-bullet-active-custom {
          background: #3b82f6;
          transform: scale(1.2);
        }
      `}</style>
    </div>
  )
}

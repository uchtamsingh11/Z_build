"use client"

import React, { useRef, useEffect } from 'react'
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'

interface InfiniteSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gap?: number
  speed?: number
  reverse?: boolean
  direction?: 'horizontal' | 'vertical'
}

export function InfiniteSlider({
  children,
  gap = 32,
  speed = 20,
  reverse = false,
  direction = 'horizontal',
  className,
  ...props
}: InfiniteSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLUListElement>(null)
  const x = useMotionValue(0)
  
  // Simple animation using useAnimationFrame
  useAnimationFrame((_, delta) => {
    const speedFactor = speed * (delta / 1000)
    const directionFactor = reverse ? 1 : -1
    
    x.set(x.get() + speedFactor * directionFactor)
    
    // Reset position when it's gone far enough to create a seamless loop
    if (scrollerRef.current) {
      const scrollWidth = scrollerRef.current.scrollWidth / 2
      if (Math.abs(x.get()) > scrollWidth) {
        x.set(0)
      }
    }
  })
  
  return (
    <div 
      ref={containerRef} 
      className={`overflow-hidden ${className || ''}`}
      {...props}
    >
      <motion.ul
        ref={scrollerRef}
        style={{
          x: direction === 'horizontal' ? x : 0,
          y: direction === 'vertical' ? x : 0,
          gap: `${gap}px`,
        }}
        className="flex flex-nowrap items-center"
      >
        {/* Show children twice to ensure smooth looping */}
        {React.Children.map(children, (child, j) => (
          <li key={`a-${j}`} className="flex items-center" style={{ padding: `0 ${gap/2}px` }}>
            {child}
          </li>
        ))}
        {React.Children.map(children, (child, j) => (
          <li key={`b-${j}`} className="flex items-center" style={{ padding: `0 ${gap/2}px` }}>
            {child}
          </li>
        ))}
      </motion.ul>
    </div>
  )
} 
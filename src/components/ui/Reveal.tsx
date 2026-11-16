import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1] as const

type RevealProps = {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  as?: 'div' | 'p' | 'li' | 'span' | 'section' | 'figure' | 'header'
  amount?: number
}

/** restrained scroll-triggered entrance; transform is dropped automatically in calm mode */
export function Reveal({ children, delay = 0, y = 22, className, as = 'div', amount = 0.15 }: RevealProps) {
  const Comp = motion[as]
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1, ease: EASE, delay }}
    >
      {children}
    </Comp>
  )
}

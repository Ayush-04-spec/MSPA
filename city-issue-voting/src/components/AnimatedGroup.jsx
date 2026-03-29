import React from 'react'
import { motion } from 'framer-motion'

const presets = {
  fade: {
    container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
    item:      { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  },
  'blur-slide': {
    container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
    item:      { hidden: { opacity: 0, filter: 'blur(4px)', y: 20 }, visible: { opacity: 1, filter: 'blur(0px)', y: 0 } },
  },
  slide: {
    container: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } },
    item:      { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
  },
}

export function AnimatedGroup({ children, variants, preset, className, style }) {
  const selected = preset ? presets[preset] : presets.fade
  const containerV = variants?.container || selected.container
  const itemV      = variants?.item      || selected.item

  return (
    <motion.div initial="hidden" animate="visible" variants={containerV} className={className} style={style}>
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={itemV}>{child}</motion.div>
      ))}
    </motion.div>
  )
}

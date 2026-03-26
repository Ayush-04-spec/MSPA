import { motion, AnimatePresence } from 'framer-motion'

const variants = {
  initial:  { opacity: 0, y: 24, scale: 0.98, filter: 'blur(4px)' },
  animate:  { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)',
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  exit:     { opacity: 0, y: -16, scale: 0.97, filter: 'blur(4px)',
    transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] } },
}

export default function PageTransition({ children, tabKey }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={tabKey} variants={variants} initial="initial" animate="animate" exit="exit">
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

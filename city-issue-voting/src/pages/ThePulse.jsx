import { motion } from 'framer-motion'
import Analytics from '../components/Analytics'
import { useIssues } from '../IssuesContext'

const pageVariants = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.23,1,0.32,1] } },
  exit:    { opacity: 0, y: -16, filter: 'blur(4px)', transition: { duration: 0.25 } },
}

export default function ThePulse() {
  const { issues } = useIssues()
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <Analytics issues={issues} />
    </motion.div>
  )
}

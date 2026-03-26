import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Leaderboard from '../components/Leaderboard'
import { leaderboard as lbApi } from '../api'
import { useIssues } from '../IssuesContext'

const pageVariants = {
  initial: { opacity: 0, y: 28, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.23,1,0.32,1] } },
  exit:    { opacity: 0, y: -16, filter: 'blur(4px)', transition: { duration: 0.25 } },
}

export default function HallOfImpact() {
  const { issues } = useIssues()
  const [lbData, setLbData] = useState([])

  useEffect(() => {
    lbApi.get().then(setLbData).catch(() => {})
  }, [])

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <Leaderboard issues={issues} mlaList={lbData} />
    </motion.div>
  )
}

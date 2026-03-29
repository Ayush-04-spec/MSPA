import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, OrbitControls, Stars } from '@react-three/drei'

function MapPin({ pulse }) {
  const groupRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += 0.008
    const t = state.clock.elapsedTime
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.08

    if (glowRef.current) {
      const s = pulse ? 1 + Math.sin(t * 6) * 0.15 : 1 + Math.sin(t * 1.5) * 0.04
      glowRef.current.scale.setScalar(s)
      glowRef.current.material.opacity = pulse ? 0.4 + Math.sin(t * 6) * 0.2 : 0.12
    }
  })

  return (
    <group ref={groupRef}>
      {/* Pin body — Royal Blue metallic sphere */}
      <Sphere args={[0.55, 48, 48]}>
        <MeshDistortMaterial
          color="#4A78E0"
          distort={0.18}
          speed={2}
          roughness={0.05}
          metalness={0.9}
          transparent opacity={0.95}
        />
      </Sphere>

      {/* Wireframe overlay — Steel Gray 0.2 opacity */}
      <Sphere args={[0.57, 20, 20]}>
        <meshBasicMaterial color="#5A6473" wireframe transparent opacity={0.2} />
      </Sphere>

      {/* Soft White aura pulse */}
      <Sphere ref={glowRef} args={[0.75, 24, 24]}>
        <meshBasicMaterial color="#F4F6FA" transparent opacity={0.12} />
      </Sphere>

      {/* Pin spike */}
      <mesh position={[0, -0.85, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.5, 8]} />
        <meshStandardMaterial color="#4A78E0" metalness={0.9} roughness={0.05} />
      </mesh>
    </group>
  )
}

function CityMarkers() {
  const positions = [
    [1.1, 0.3, 0.4], [-0.9, 0.6, 0.7], [0.5, -0.8, 0.8],
    [-0.4, 0.9, -0.6], [0.8, -0.4, -0.7], [-0.7, -0.5, 0.6],
  ]
  return positions.map((pos, i) => (
    <mesh key={i} position={pos}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color={i % 2 === 0 ? '#4A78E0' : '#F4F6FA'} />
    </mesh>
  ))
}

export default function CityGlobe({ pulse = false }) {
  return (
    <div style={{
      width: '100%', height: 200, borderRadius: 14, overflow: 'hidden', marginBottom: 22,
      border: '1px solid rgba(90,100,115,0.3)', background: 'rgba(13,15,20,0.6)'
    }}>
      <Canvas camera={{ position: [0, 0, 2.6], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[4, 4, 4]} intensity={1.5} color="#4A78E0" />
        <pointLight position={[-4, -3, -4]} intensity={0.5} color="#F4F6FA" />
        <Stars radius={80} depth={50} count={1000} factor={2.5} fade speed={0.4} />
        <MapPin pulse={pulse} />
        <CityMarkers />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  )
}

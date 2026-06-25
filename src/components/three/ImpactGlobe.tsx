import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PINE = '#3E5F55'
const SAGE = '#A9CDBA'
const MINT = '#CDEBD6'

/** A slowly spinning low-poly globe dotted with glowing "impact" markers. */
export default function ImpactGlobe({ markers = 40 }: { markers?: number }) {
  const group = useRef<THREE.Group>(null)

  const points = useMemo(() => {
    const out: [number, number, number][] = []
    const R = 1.62
    for (let i = 0; i < markers; i++) {
      // fibonacci sphere for even distribution
      const y = 1 - (i / (markers - 1)) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = Math.PI * (3 - Math.sqrt(5)) * i
      out.push([Math.cos(theta) * radius * R, y * R, Math.sin(theta) * radius * R])
    }
    return out
  }, [markers])

  useFrame((_, delta) => { if (group.current) group.current.rotation.y += delta * 0.18 })

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.6, 4]} />
        <meshStandardMaterial color={PINE} roughness={0.5} metalness={0.1} flatShading />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.62, 1]} />
        <meshBasicMaterial color={SAGE} wireframe transparent opacity={0.18} />
      </mesh>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color={MINT} />
        </mesh>
      ))}
    </group>
  )
}

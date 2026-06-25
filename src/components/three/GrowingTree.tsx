import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

// Brand palette
const PINE = '#3E5F55'
const SAGE = '#A9CDBA'
const MINT = '#CDEBD6'
const SAND_DEEP = '#9C7B5E'

type FoliageBlob = { pos: [number, number, number]; scale: number; color: string }

/**
 * A stylised low-poly tree whose canopy "grows" with `progress` (0..1) — wired to
 * the user's lifetime credits. The whole tree sways gently in the wind.
 */
export default function GrowingTree({ progress = 1 }: { progress?: number }) {
  const group = useRef<THREE.Group>(null)
  const p = Math.max(0.08, Math.min(1, progress))

  const blobs = useMemo<FoliageBlob[]>(() => {
    const greens = [SAGE, MINT, '#B9D8C7', '#8FBBA8']
    const out: FoliageBlob[] = []
    // deterministic pseudo-random canopy so it doesn't reshuffle each render
    let seed = 7
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2
      const r = 0.3 + rand() * 1.7
      const y = 2.4 + rand() * 2.6
      out.push({
        pos: [Math.cos(a) * r, y, Math.sin(a) * r],
        scale: 0.55 + rand() * 0.85,
        color: greens[Math.floor(rand() * greens.length)],
      })
    }
    return out
  }, [])

  // canopy springs in as progress rises
  const { canopyScale } = useSpring({ canopyScale: p, config: { mass: 1, tension: 80, friction: 26 } })

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.z = Math.sin(t * 0.6) * 0.025
      group.current.rotation.x = Math.cos(t * 0.4) * 0.015
    }
  })

  return (
    <group ref={group} position={[0, -2.2, 0]}>
      {/* trunk */}
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.22, 0.42, 2.6, 12]} />
        <meshStandardMaterial color={SAND_DEEP} roughness={0.9} />
      </mesh>
      {/* a few main branches */}
      {[-0.5, 0.4, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 2.2 + i * 0.25, i % 2 ? 0.2 : -0.2]} rotation={[0, 0, x * 0.8]}>
          <cylinderGeometry args={[0.07, 0.13, 1.3, 8]} />
          <meshStandardMaterial color={SAND_DEEP} roughness={0.9} />
        </mesh>
      ))}
      {/* canopy */}
      <animated.group scale={canopyScale}>
        {blobs.map((b, i) => (
          <mesh key={i} position={b.pos} castShadow>
            <icosahedronGeometry args={[b.scale, 1]} />
            <meshStandardMaterial color={b.color} roughness={0.65} flatShading />
          </mesh>
        ))}
      </animated.group>
    </group>
  )
}

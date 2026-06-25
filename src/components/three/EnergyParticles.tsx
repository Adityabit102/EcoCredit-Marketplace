import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Upward-drifting "energy" motes — represents clean energy / carbon being captured.
 * A single Points cloud with additive blending for a soft glow. Cheap (one draw call).
 */
export default function EnergyParticles({ count = 240, color = '#CDEBD6' }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null)

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const r = Math.random() * 5
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = Math.random() * 8 - 3
      positions[i * 3 + 2] = Math.sin(a) * r
      speeds[i] = 0.15 + Math.random() * 0.5
    }
    return { positions, speeds }
  }, [count])

  useFrame((_, delta) => {
    const pts = ref.current
    if (!pts) return
    const arr = pts.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = -3 // recycle to the bottom
    }
    pts.geometry.attributes.position.needsUpdate = true
    pts.rotation.y += delta * 0.04
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={color}
        transparent
        opacity={0.85}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

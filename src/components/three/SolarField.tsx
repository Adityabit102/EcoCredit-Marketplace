import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PINE = '#3E5F55'
const SAGE = '#A9CDBA'
const MINT = '#CDEBD6'
const CREAM = '#FDFBF6'
const CELL = '#243B57'        // deep PV blue
const FRAME = '#E7E3D8'
const GOLD = '#F3C969'
const GOLD_SOFT = '#F7DDA0'

const SUN_POS = new THREE.Vector3(2.6, 2.7, -1.6)

/* A detailed PV module: metal frame, tilted glass face, a grid of cells, on legs. */
function PanelModule({ position, cellMat }: { position: [number, number, number]; cellMat: THREE.Material }) {
  const cols = 6, rows = 3, cw = 0.3, ch = 0.3, gap = 0.04
  const w = cols * cw + (cols - 1) * gap
  const h = rows * ch + (rows - 1) * gap
  const cells = useMemo(() => {
    const out: [number, number, number][] = []
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        out.push([-w / 2 + cw / 2 + c * (cw + gap), 0.045, -h / 2 + ch / 2 + r * (ch + gap)])
    return out
  }, [w, h])

  return (
    <group position={position}>
      {/* legs + torque tube */}
      <mesh position={[0, -0.32, 0.32]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.7, 8]} /><meshStandardMaterial color={FRAME} metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, -0.16, -0.32]}><cylinderGeometry args={[0.03, 0.03, 0.4, 8]} /><meshStandardMaterial color={FRAME} metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, w + 0.1, 10]} /><meshStandardMaterial color="#9CA59E" metalness={0.6} roughness={0.4} /></mesh>

      {/* tilted module facing the sun/camera */}
      <group rotation={[-0.5, 0, 0]} position={[0, 0.04, 0]}>
        <mesh castShadow><boxGeometry args={[w + 0.08, 0.05, h + 0.08]} /><meshStandardMaterial color={FRAME} metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, 0.026, 0]}><boxGeometry args={[w + 0.02, 0.04, h + 0.02]} /><meshStandardMaterial color="#16202E" metalness={0.9} roughness={0.12} /></mesh>
        {cells.map((p, i) => <mesh key={i} position={p} material={cellMat}><boxGeometry args={[cw, 0.03, ch]} /></mesh>)}
      </group>
    </group>
  )
}

function Motes({ count = 50 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { positions, speed } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7
      positions[i * 3 + 1] = Math.random() * 3
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      speed[i] = 0.25 + Math.random() * 0.5
    }
    return { positions, speed }
  }, [count])
  useFrame((_, d) => {
    const p = ref.current; if (!p) return
    const a = p.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) { a[i * 3 + 1] += speed[i] * d; if (a[i * 3 + 1] > 3.2) a[i * 3 + 1] = -0.4 }
    p.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.06} color={MINT} transparent opacity={0.7} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

export default function SolarField() {
  const sun = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const rays = useRef<THREE.Group>(null)
  const array = useRef<THREE.Group>(null)

  const cellMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: CELL, emissive: new THREE.Color(SAGE), emissiveIntensity: 0.5, metalness: 0.5, roughness: 0.25,
  }), [])

  useFrame((s) => {
    const t = s.clock.elapsedTime
    cellMat.emissiveIntensity = 0.45 + Math.sin(t * 2) * 0.3
    if (sun.current) sun.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04)
    if (halo.current) {
      halo.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.1)
      ;(halo.current.material as THREE.MeshBasicMaterial).opacity = 0.26 + Math.sin(t * 1.4) * 0.08
    }
    if (rays.current) rays.current.rotation.z += 0.004
    if (array.current) array.current.rotation.x = Math.sin(t * 0.4) * 0.04 // slow sun tracking
  })

  // 3 rows × 3 modules on a field
  const modules: [number, number, number][] = []
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++)
      modules.push([(c - 1) * 1.55, 0, (r - 1) * 1.35])

  return (
    <group position={[0, -0.55, 0]}>
      {/* grassy field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]} receiveShadow>
        <circleGeometry args={[5.5, 64]} />
        <meshStandardMaterial color={SAGE} roughness={1} flatShading />
      </mesh>

      <group ref={array}>
        {modules.map((p, i) => <PanelModule key={i} position={p} cellMat={cellMat} />)}
      </group>

      {/* inverter cabinet */}
      <group position={[2.4, -0.05, 1.6]}>
        <mesh castShadow><boxGeometry args={[0.5, 0.6, 0.3]} /><meshStandardMaterial color={CREAM} metalness={0.4} roughness={0.5} /></mesh>
        <mesh position={[0, 0.05, 0.16]}><boxGeometry args={[0.34, 0.34, 0.02]} /><meshStandardMaterial color={PINE} emissive={SAGE} emissiveIntensity={0.4} /></mesh>
      </group>

      {/* golden sun */}
      <group position={SUN_POS.toArray()}>
        <mesh ref={sun}><sphereGeometry args={[0.6, 32, 32]} /><meshBasicMaterial color={GOLD} /></mesh>
        <mesh><sphereGeometry args={[0.74, 32, 32]} /><meshBasicMaterial color={GOLD_SOFT} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        <mesh ref={halo}><sphereGeometry args={[1.05, 32, 32]} /><meshBasicMaterial color={GOLD} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        <group ref={rays}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0]} rotation={[0, 0, a]}>
                <boxGeometry args={[0.38, 0.045, 0.045]} />
                <meshBasicMaterial color={GOLD_SOFT} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
              </mesh>
            )
          })}
        </group>
        <pointLight color={GOLD} intensity={1.3} distance={11} />
      </group>

      <Motes />
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei'
import * as THREE from 'three'

const PINE = '#3E5F55'
const SAGE = '#A9CDBA'
const MINT = '#CDEBD6'
const SAND = '#E7D7C8'
const CREAM = '#FDFBF6'

/* ── Wind farm: detailed 3-blade turbines with aerodynamic blades ─ */
const WHITE = '#F0EEE6'

function Blade() {
  // tapered + twisted airfoil blade (flattened tapered cylinder + cuff + tip)
  return (
    <group>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 0.26, 12]} />
        <meshStandardMaterial color="#E4E1D6" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.12, 0]} rotation={[0.22, 0, 0]} scale={[1, 1, 0.32]}>
        <cylinderGeometry args={[0.012, 0.08, 1.95, 16]} />
        <meshStandardMaterial color={WHITE} metalness={0.1} roughness={0.4} flatShading />
      </mesh>
    </group>
  )
}

function Turbine({ position = [0, 0, 0] as [number, number, number], scale = 1, speed = 1.4 }) {
  const rotor = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (rotor.current) rotor.current.rotation.z += d * speed })
  return (
    <group position={position} scale={scale}>
      {/* foundation */}
      <mesh position={[0, -0.02, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.46, 0.2, 24]} />
        <meshStandardMaterial color="#D6D1C3" roughness={0.95} />
      </mesh>
      {/* tapered tower */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.21, 3.6, 24]} />
        <meshStandardMaterial color={WHITE} metalness={0.15} roughness={0.42} />
      </mesh>
      {/* nacelle (horizontal capsule) + tail fin */}
      <group position={[0, 3.7, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.17, 0.5, 6, 16]} />
          <meshStandardMaterial color="#ECE9E1" metalness={0.2} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.12, -0.42]}>
          <boxGeometry args={[0.025, 0.26, 0.34]} />
          <meshStandardMaterial color={SAGE} />
        </mesh>
        {/* rotor faces +z */}
        <group position={[0, 0, 0.4]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.14, 0.3, 18]} />
            <meshStandardMaterial color="#E4E1D6" metalness={0.3} roughness={0.4} />
          </mesh>
          <group ref={rotor} position={[0, 0, 0.05]}>
            {[0, 1, 2].map((i) => (
              <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}><Blade /></group>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}

function Cloud({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[[0, 0, 0, 0.5], [0.5, 0.05, 0, 0.38], [-0.45, 0.02, 0, 0.34], [0.2, 0.22, 0, 0.3]].map((c, i) => (
        <mesh key={i} position={[c[0], c[1], c[2]]}>
          <sphereGeometry args={[c[3], 16, 16]} />
          <meshStandardMaterial color={CREAM} roughness={1} flatShading transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function GrassTufts({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const blades = useMemo(() => Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 4.6
    return { x: Math.cos(a) * r, z: Math.sin(a) * r, s: 0.12 + Math.random() * 0.16, rot: Math.random() * Math.PI }
  }), [count])
  useFrame((s) => {
    const m = ref.current; if (!m) return
    const sway = Math.sin(s.clock.elapsedTime * 2) * 0.12
    blades.forEach((b, i) => {
      dummy.position.set(b.x, b.s * 0.5, b.z)
      dummy.rotation.set(sway, b.rot, sway * 0.5)
      dummy.scale.set(1, b.s * 6, 1)
      dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}>
      <coneGeometry args={[0.03, 0.18, 4]} />
      <meshStandardMaterial color="#7FB29C" flatShading />
    </instancedMesh>
  )
}

function Birds() {
  const ref = useRef<THREE.Group>(null)
  useFrame((s) => {
    if (!ref.current) return
    const t = s.clock.elapsedTime
    ref.current.position.x = ((t * 0.6) % 14) - 7
    ref.current.children.forEach((c, i) => { c.rotation.z = Math.sin(t * 6 + i) * 0.5 })
  })
  return (
    <group ref={ref} position={[0, 4.6, -2]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 0.7, Math.sin(i) * 0.3, i * 0.4]} scale={0.16}>
          <mesh rotation={[0, 0, 0.5]}><boxGeometry args={[0.6, 0.05, 0.05]} /><meshStandardMaterial color={PINE} /></mesh>
          <mesh rotation={[0, 0, -0.5]} position={[0.5, 0, 0]}><boxGeometry args={[0.6, 0.05, 0.05]} /><meshStandardMaterial color={PINE} /></mesh>
        </group>
      ))}
    </group>
  )
}

export function WindTurbine() {
  return (
    <group position={[0, -1.7, 0]}>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial color={SAGE} roughness={1} flatShading />
      </mesh>
      {/* low rolling hills on the horizon */}
      <mesh position={[3.2, -0.1, -4]} scale={[3.4, 0.7, 1.6]}>
        <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={MINT} roughness={1} flatShading />
      </mesh>
      <mesh position={[-3.6, -0.1, -4.5]} scale={[4, 0.55, 1.8]}>
        <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#BCDBC8" roughness={1} flatShading />
      </mesh>

      <GrassTufts />

      {/* hero turbine + farm */}
      <Turbine position={[0, 0, 0]} scale={1} speed={1.5} />
      <Turbine position={[-2.6, 0, -2.2]} scale={0.58} speed={1.1} />
      <Turbine position={[2.7, 0, -2.6]} scale={0.5} speed={1.9} />
      <Turbine position={[1.2, 0, -3.6]} scale={0.34} speed={1.4} />

      <Cloud position={[-2.6, 4.4, -1.5]} />
      <Cloud position={[2.8, 5, -2]} />
      <Birds />
    </group>
  )
}

/* ── Hydro: an organic, rippling water droplet (distorted blob) ── */
export function HydroDroplet() {
  const m = useRef<THREE.Mesh>(null)
  useFrame((s) => { if (m.current) m.current.position.y = Math.sin(s.clock.elapsedTime * 1.2) * 0.18 })
  return (
    <group>
      <mesh ref={m}>
        <sphereGeometry args={[1.5, 64, 64]} />
        {/* MeshDistortMaterial gives that liquid, "alive" surface */}
        <MeshDistortMaterial color={SAGE} speed={2.4} distort={0.42} roughness={0.05} metalness={0.35} emissive={MINT} emissiveIntensity={0.25} />
      </mesh>
      {/* ripple ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]}>
        <torusGeometry args={[1.9, 0.03, 16, 80]} />
        <meshBasicMaterial color={MINT} />
      </mesh>
    </group>
  )
}

/* ── Recycling motif: three rotating arcs forming a triangle ───── */
export function RecycleRings() {
  const g = useRef<THREE.Group>(null)
  useFrame((_, d) => { if (g.current) g.current.rotation.z -= d * 0.6 })
  const colors = [SAGE, MINT, SAND]
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3
        return (
          <mesh key={i} rotation={[0, 0, a]} position={[Math.cos(a + Math.PI / 2) * 1, Math.sin(a + Math.PI / 2) * 1, 0]}>
            <torusGeometry args={[0.55, 0.13, 16, 48, Math.PI * 1.1]} />
            <meshStandardMaterial color={colors[i]} roughness={0.3} metalness={0.2} emissive={colors[i]} emissiveIntensity={0.25} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ── Leaf swarm: instanced leaves drifting in a slow vortex ─────── */
export function LeafSwarm({ count = 60 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(
    () => Array.from({ length: count }, () => ({
      r: 1 + Math.random() * 3, a: Math.random() * Math.PI * 2,
      y: (Math.random() - 0.5) * 5, spd: 0.2 + Math.random() * 0.5, sc: 0.1 + Math.random() * 0.2,
    })), [count]
  )
  useFrame((s) => {
    const mesh = ref.current; if (!mesh) return
    const t = s.clock.elapsedTime
    seeds.forEach((p, i) => {
      const a = p.a + t * p.spd * 0.3
      dummy.position.set(Math.cos(a) * p.r, p.y + Math.sin(t * p.spd + i) * 0.3, Math.sin(a) * p.r)
      dummy.rotation.set(t * p.spd, a, t * 0.5)
      dummy.scale.setScalar(p.sc)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, count]}>
      <coneGeometry args={[0.5, 1, 5]} />
      <meshStandardMaterial color={MINT} flatShading roughness={0.6} emissive={SAGE} emissiveIntensity={0.2} />
    </instancedMesh>
  )
}

/* ── Hydro: detailed concrete gravity dam with spillways ───────── */
const CONCRETE = '#CBC5B6'
const CONCRETE_DK = '#B3AC9B'
const SPILL_X = [-1.5, -0.5, 0.5, 1.5]

// Spillway cascades: water pouring down the battered downstream face, then foaming.
function Spillways({ perBay = 60 }: { perBay?: number }) {
  const ref = useRef<THREE.Points>(null)
  const count = SPILL_X.length * perBay
  const { positions, vel } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    let i = 0
    for (const x of SPILL_X) {
      for (let k = 0; k < perBay; k++) {
        positions[i * 3] = x + (Math.random() - 0.5) * 0.55
        positions[i * 3 + 1] = 0.85 - Math.random() * 1.7
        positions[i * 3 + 2] = 0.5 + Math.random() * 0.2
        vel[i] = 1.4 + Math.random() * 1.6
        i++
      }
    }
    return { positions, vel }
  }, [count, perBay])
  useFrame((_, d) => {
    const p = ref.current; if (!p) return
    const a = p.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] -= vel[i] * d
      a[i * 3 + 2] += d * 0.7 // follow the sloped face outward
      if (a[i * 3 + 1] < -0.9) { a[i * 3 + 1] = 0.85; a[i * 3 + 2] = 0.5 + Math.random() * 0.2 }
    }
    p.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.085} color={MINT} transparent opacity={0.92} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function Foam({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 4
      a[i * 3 + 1] = -0.92 + Math.random() * 0.18
      a[i * 3 + 2] = 1.0 + Math.random() * 0.9
    }
    return a
  }, [count])
  useFrame((s) => {
    const p = ref.current; if (!p) return
    const a = p.geometry.attributes.position.array as Float32Array
    const t = s.clock.elapsedTime
    for (let i = 0; i < count; i++) a[i * 3 + 1] = -0.9 + Math.sin(t * 3 + i) * 0.05
    p.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial size={0.1} color={CREAM} transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export function Dam() {
  const reservoir = useRef<THREE.Mesh>(null)

  // gravity-dam cross-section (thickness × height), extruded across the width
  const damGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.55, -0.9); s.lineTo(-0.55, 0.9); s.lineTo(-0.25, 0.9); s.lineTo(0.75, -0.9); s.lineTo(-0.55, -0.9)
    const g = new THREE.ExtrudeGeometry(s, { depth: 4, bevelEnabled: false })
    g.translate(0, 0, -2)
    g.rotateY(-Math.PI / 2) // bring width to the horizontal (x) axis, downstream face toward camera
    g.computeVertexNormals()
    return g
  }, [])

  useFrame((s) => {
    if (reservoir.current) {
      const m = reservoir.current.material as THREE.MeshStandardMaterial
      m.opacity = 0.5 + Math.sin(s.clock.elapsedTime * 1.4) * 0.06
    }
  })

  return (
    <group position={[0, 0, 0]} rotation={[0, 0.05, 0]}>
      {/* dam body */}
      <mesh geometry={damGeo} castShadow receiveShadow>
        <meshStandardMaterial color={CONCRETE} roughness={0.92} flatShading />
      </mesh>
      {/* crest road */}
      <mesh position={[0, 0.92, 0.05]}>
        <boxGeometry args={[4.05, 0.08, 0.5]} />
        <meshStandardMaterial color={CONCRETE_DK} roughness={0.8} />
      </mesh>
      {/* crest railing posts */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} position={[-2 + i * 0.285, 1.05, 0.27]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 6]} />
          <meshStandardMaterial color={CREAM} />
        </mesh>
      ))}
      {/* spillway gate piers */}
      {SPILL_X.map((x, i) => (
        <mesh key={i} position={[x + 0.5, 0.55, 0.45]}>
          <boxGeometry args={[0.14, 0.8, 0.3]} />
          <meshStandardMaterial color={CONCRETE_DK} roughness={0.85} />
        </mesh>
      ))}
      {/* intake towers on the upstream side */}
      {[-1.2, 1.2].map((x, i) => (
        <group key={i} position={[x, 0.2, -0.75]}>
          <mesh><cylinderGeometry args={[0.16, 0.18, 2.3, 16]} /><meshStandardMaterial color={CREAM} roughness={0.6} /></mesh>
          <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.22, 0.22, 0.2, 16]} /><meshStandardMaterial color={SAGE} /></mesh>
        </group>
      ))}

      {/* reservoir water (upstream) */}
      <mesh ref={reservoir} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.78, -2.4]}>
        <planeGeometry args={[5, 3.4]} />
        <meshStandardMaterial color={SAGE} transparent opacity={0.55} metalness={0.45} roughness={0.12} />
      </mesh>
      {/* downstream river */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 1.8]}>
        <planeGeometry args={[4.4, 2]} />
        <meshStandardMaterial color={MINT} transparent opacity={0.5} metalness={0.3} roughness={0.2} />
      </mesh>

      <Spillways />
      <Foam />
    </group>
  )
}

/* ── Minimal eco-sphere: wobbling solid + wireframe shell ──────── */
export function EcoSphere() {
  const wire = useRef<THREE.Mesh>(null)
  useFrame((_, d) => { if (wire.current) { wire.current.rotation.y += d * 0.25; wire.current.rotation.x += d * 0.1 } })
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[1.4, 6]} />
        <MeshWobbleMaterial color={PINE} factor={0.35} speed={1.2} roughness={0.2} metalness={0.4} emissive={SAGE} emissiveIntensity={0.2} />
      </mesh>
      <mesh ref={wire} scale={1.18}>
        <icosahedronGeometry args={[1.4, 2]} />
        <meshBasicMaterial color={MINT} wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

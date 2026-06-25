import { Suspense, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import GrowingTree from './GrowingTree'
import EnergyParticles from './EnergyParticles'
import ImpactGlobe from './ImpactGlobe'
import SolarField from './SolarField'
import { WindTurbine, HydroDroplet, RecycleRings, LeafSwarm, EcoSphere, Dam } from './extras'

// Shared, palette-tuned lighting (no external HDRI — fully offline-safe).
function Lights() {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[5, 8, 5]} intensity={1.25} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-5, 3, -3]} intensity={0.7} color="#CDEBD6" />
      <pointLight position={[4, -2, 4]} intensity={0.45} color="#A9CDBA" />
    </>
  )
}

// Cinematic glow — the "reel" look. Kept subtle so text over canvases stays clean.
function Glow({ intensity = 0.7 }: { intensity?: number }) {
  return (
    <EffectComposer>
      <Bloom intensity={intensity} luminanceThreshold={0.6} luminanceSmoothing={0.35} mipmapBlur radius={0.6} />
      <Vignette eskil={false} offset={0.55} darkness={0.28} />
    </EffectComposer>
  )
}

type Props = { className?: string; interactive?: boolean }

// Detect WebGL once — some machines/privacy settings disable it; we degrade gracefully.
let _webgl: boolean | null = null
function hasWebGL() {
  if (_webgl !== null) return _webgl
  try {
    const c = document.createElement('canvas')
    _webgl = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')))
  } catch { _webgl = false }
  return _webgl
}

function Frame({ children, className, interactive, camera, bloom = 0.7, autoRotate = true, autoRotateSpeed = 0.7, target = [0, 0, 0] }: Props & {
  children: ReactNode; camera: [number, number, number]; bloom?: number; autoRotate?: boolean; autoRotateSpeed?: number; target?: [number, number, number]
}) {
  // Themed poster fallback when WebGL isn't available (keeps layout, never blank)
  if (typeof window !== 'undefined' && !hasWebGL()) {
    return (
      <div className={className}>
        <div className="h-full w-full ring-grid animate-pulse-glow"
          style={{ background: 'radial-gradient(circle at 50% 40%, #A9CDBA33, transparent 70%), linear-gradient(160deg,#3E5F55,#2C453E)' }} />
      </div>
    )
  }
  return (
    <div className={className}>
      <Canvas shadows dpr={[1, 1.8]} camera={{ position: camera, fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Lights />
          {children}
          <OrbitControls
            enableZoom={false} enablePan={false}
            target={target}
            autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed}
            enabled={!!interactive}
            minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 1.85}
          />
          {bloom > 0 && <Glow intensity={bloom} />}
        </Suspense>
      </Canvas>
    </div>
  )
}

export function TreeScene({ progress = 1, className = '', interactive = false, fill = false }: Props & { progress?: number; fill?: boolean }) {
  // `fill` = hero mode: big tree that fills the viewport without clipping
  return (
    <Frame
      className={className}
      interactive={interactive}
      camera={fill ? [0, 0.4, 7.6] : [0, 2, 10.5]}
      target={fill ? [0, 0.9, 0] : [0, 0.6, 0]}
      bloom={0.55}
      autoRotateSpeed={0.45}
    >
      <Float speed={1.1} rotationIntensity={0.12} floatIntensity={0.35}>
        <group scale={fill ? 1.25 : 1}>
          <GrowingTree progress={progress} />
        </group>
      </Float>
      <LeafSwarm count={fill ? 55 : 40} />
      <EnergyParticles count={fill ? 320 : 240} />
    </Frame>
  )
}

export function GlobeScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 0, 5.2]} bloom={0.8}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}><ImpactGlobe /></Float>
      <EnergyParticles count={120} />
    </Frame>
  )
}

export function SolarScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 2.6, 9.5]} target={[0, 0.5, 0]} bloom={0.55} autoRotateSpeed={0.8}>
      <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.2}><SolarField /></Float>
    </Frame>
  )
}

export function WindScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 1, 10]} target={[0, 0.6, 0]} bloom={0.4} autoRotateSpeed={0.6}>
      <Float speed={0.5} rotationIntensity={0.04} floatIntensity={0.15}><WindTurbine /></Float>
    </Frame>
  )
}

export function DamScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 1.3, 8]} target={[0, 0.1, 0]} bloom={0.45} autoRotateSpeed={0.5}>
      <Float speed={0.4} rotationIntensity={0.03} floatIntensity={0.12}><Dam /></Float>
    </Frame>
  )
}

export function HydroScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 0, 5.5]} bloom={1}>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}><HydroDroplet /></Float>
    </Frame>
  )
}

export function RecycleScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 0, 5]} bloom={0.9}>
      <Float speed={1} rotationIntensity={0.3} floatIntensity={0.5}><RecycleRings /></Float>
    </Frame>
  )
}

export function EcoSphereScene({ className = '', interactive = false }: Props) {
  return (
    <Frame className={className} interactive={interactive} camera={[0, 0, 5]} bloom={1}>
      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.5}><EcoSphere /></Float>
      <EnergyParticles count={90} />
    </Frame>
  )
}

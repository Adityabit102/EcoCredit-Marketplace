import { motion } from 'framer-motion'
import { Wind, Droplets, Recycle, Globe2, Sun, TreePine } from 'lucide-react'
import { WindScene, HydroScene, RecycleScene, EcoSphereScene, SolarScene, GlobeScene } from './three/Scene3D'

const items = [
  { key: 'wind', label: 'Wind Energy', desc: 'Harness the breeze', Icon: Wind, Scene: WindScene },
  { key: 'hydro', label: 'Hydro Power', desc: 'Living water systems', Icon: Droplets, Scene: HydroScene },
  { key: 'solar', label: 'Solar Fields', desc: 'Capture the sun', Icon: Sun, Scene: SolarScene },
  { key: 'recycle', label: 'Circular Economy', desc: 'Nothing wasted', Icon: Recycle, Scene: RecycleScene },
  { key: 'sphere', label: 'Carbon Capture', desc: 'Balance restored', Icon: Globe2, Scene: EcoSphereScene },
  { key: 'globe', label: 'Global Impact', desc: 'Worldwide change', Icon: TreePine, Scene: GlobeScene },
]

export default function Sustainability3DShowcase() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-mint/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-3">Powered by every kind of green</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Six pathways to a regenerative planet — explore each in 3D. Drag any tile to look around.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(({ key, label, desc, Icon, Scene }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -8 }}
              className="group relative rounded-2xl overflow-hidden glass glow-sage"
            >
              <Scene className="h-56 w-full" interactive />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 to-transparent">
                <div className="flex items-center gap-2 text-pine">
                  <Icon className="w-5 h-5 text-sage-deep" />
                  <span className="font-semibold">{label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

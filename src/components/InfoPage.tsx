import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

type Block = { heading?: string; text?: string; items?: string[] }
type Topic = { title: string; updated?: boolean; blocks: Block[] }

const CONTENT: Record<string, Topic> = {
  terms: {
    title: 'Terms of Service', updated: true,
    blocks: [
      { text: 'By using EcoCredit India, you agree to these terms. EcoCredit is a marketplace for buying, selling, and retiring verified carbon credits generated from real-world green actions.' },
      { heading: '1. Accounts', text: 'You are responsible for your account and for keeping your credentials secure. You must provide accurate information when submitting green actions.' },
      { heading: '2. Credits', text: 'Credits are issued only for actions that pass our AI/manual verification. Credits represent an estimated CO₂ offset and may be traded or permanently retired. Retired credits cannot be reused.' },
      { heading: '3. Acceptable use', text: 'Submitting fraudulent or inflated claims, manipulating the marketplace, or attempting to bypass verification will result in suspension.' },
      { heading: '4. Liability', text: 'The platform is provided "as is". Carbon-offset estimates are good-faith approximations, not financial or legal guarantees.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy', updated: true,
    blocks: [
      { text: 'We respect your privacy and collect only what we need to run the platform.' },
      { heading: 'What we collect', items: ['Account details (name, email)', 'Submitted actions and their photos/metadata', 'Transactions and wallet address (if you connect one)'] },
      { heading: 'How we use it', text: 'To verify actions, run the marketplace, show your impact, and secure your account. We never sell your personal data.' },
      { heading: 'Security', text: 'Passwords are hashed (bcrypt), sessions use rotating httpOnly tokens, and traffic is encrypted in transit. You can request deletion of your data at any time.' },
    ],
  },
  cookie: {
    title: 'Cookie Policy',
    blocks: [
      { text: 'EcoCredit uses a single essential cookie to keep you signed in (the httpOnly refresh-token cookie). We do not use third-party advertising or tracking cookies.' },
      { heading: 'Your access token', text: 'A short-lived access token is stored in your browser to authenticate API requests. Logging out clears it.' },
    ],
  },
  compliance: {
    title: 'Compliance',
    blocks: [
      { text: 'EcoCredit aligns its verification and retirement processes with widely-used carbon-market principles: additionality, measurability, and permanence.' },
      { heading: 'Verification', text: 'Every credit traces back to a verified action with an AI legitimacy score and (optionally) an on-chain record for tamper-proof provenance.' },
      { heading: 'Retirement', text: 'Retiring a credit produces a public, verifiable proof so an offset can never be double-counted.' },
    ],
  },
  faq: {
    title: 'Frequently Asked Questions',
    blocks: [
      { heading: 'How do I earn credits?', text: 'Submit a green action with a photo on the Submit page. Our AI validation engine checks the claim, and verified actions earn credits automatically.' },
      { heading: 'What is "retiring" a credit?', text: 'Retiring permanently claims the offset so it can’t be resold — you get a shareable public proof. Use it to go carbon-neutral.' },
      { heading: 'Do I need a crypto wallet?', text: 'No. The whole platform works without one. A wallet is only needed for the optional on-chain (blockchain) record.' },
      { heading: 'How is the CO₂ estimate checked?', text: 'A scikit-learn model compares your estimate against realistic ranges for that action type and flags unrealistic claims.' },
    ],
  },
  help: {
    title: 'Help Center',
    blocks: [
      { text: 'Need a hand? Most answers live in the FAQ. For anything else, reach our team below.' },
      { heading: 'Getting started', items: ['Create an account', 'Submit your first green action', 'Earn credits and trade or retire them', 'Track everything on your Dashboard'] },
    ],
  },
  contact: {
    title: 'Contact Support',
    blocks: [
      { text: 'We usually reply within one business day.' },
    ],
  },
  careers: {
    title: 'Careers',
    blocks: [
      { text: 'EcoCredit is a student-built climate-tech project by Team Chainmakers. We’re not formally hiring yet — but if you’re passionate about climate + software, we’d love to hear from you at the contact below.' },
    ],
  },
  team: {
    title: 'The Chainmakers',
    blocks: [
      { text: 'EcoCredit India was built by Team Chainmakers.' },
      { items: ['Panya Kapoor', 'Tanisha Bhargava', 'Aditya Raj Singh'] },
    ],
  },
}

export default function InfoPage({ topic, onBack }: { topic: string; onBack: () => void }) {
  const t = CONTENT[topic] || CONTENT.faq

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-pine mb-6"><ArrowLeft className="w-4 h-4" /> Back</button>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl glass glow-sage p-8 md:p-10">
        <h1 className="text-4xl font-bold text-gradient mb-2">{t.title}</h1>
        {t.updated && <p className="text-xs text-muted-foreground mb-6">Last updated: June 2026</p>}

        <div className="space-y-5 text-muted-foreground leading-relaxed">
          {t.blocks.map((b, i) => (
            <div key={i}>
              {b.heading && <h2 className="text-lg font-semibold text-pine mb-1">{b.heading}</h2>}
              {b.text && <p>{b.text}</p>}
              {b.items && <ul className="list-disc pl-5 space-y-1 mt-1">{b.items.map((it) => <li key={it}>{it}</li>)}</ul>}
            </div>
          ))}

          {(topic === 'contact' || topic === 'help' || topic === 'careers') && (
            <div className="rounded-2xl bg-secondary/40 p-5 mt-2 space-y-2 text-pine">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-sage-deep" /> hello@ecocreditindia.com</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-sage-deep" /> +91 11 1234-5678</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-sage-deep" /> New Delhi, India</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

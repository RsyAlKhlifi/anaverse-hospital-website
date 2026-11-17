import {
  Baby, BedDouble, Brain, Circle, FlaskConical, HeartPulse, Pill, ScanLine, Scissors, Siren, Sparkles, Stethoscope,
  Eye, Bone, Activity, Syringe, Ambulance,
  type LucideIcon, type LucideProps,
} from 'lucide-react'

const map: Record<string, LucideIcon> = {
  Baby, BedDouble, Brain, FlaskConical, HeartPulse, Pill, ScanLine, Scissors, Siren, Sparkles, Stethoscope,
  Eye, Bone, Activity, Syringe, Ambulance,
}

export const ICON_NAMES = Object.keys(map)

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = map[name] ?? Circle
  return <C aria-hidden="true" {...props} />
}

import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Slider horizontal berbasis scroll-snap dengan tombol navigasi (mendukung geser sentuh & keyboard). */
export function Carousel({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.8), behavior: 'smooth' })
  }
  const arrow = 'grid h-10 w-10 place-items-center rounded-full border border-royal/20 bg-white text-royal shadow-card hover:bg-soft'
  return (
    <div className="relative">
      <div ref={ref} role="region" aria-label={label} tabIndex={0}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-4 focus-visible:outline-royal">
        {children}
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button className={arrow} onClick={() => scroll(-1)} aria-label="Sebelumnya"><ChevronLeft className="h-5 w-5" /></button>
        <button className={arrow} onClick={() => scroll(1)} aria-label="Berikutnya"><ChevronRight className="h-5 w-5" /></button>
      </div>
    </div>
  )
}

export const Slide = ({ children, className = 'w-72' }: { children: ReactNode; className?: string }) => (
  <div className={`shrink-0 snap-start ${className}`}>{children}</div>
)

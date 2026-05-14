import { TC } from './tokens'

export default function GraphPaperBg() {
  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    >
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke={TC.grid} strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f7f1df" />
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}

// ── Design tokens ────────────────────────────────────────────────
// Palette tuned for the noir / case-file aesthetic (cream paper +
// sepia frame). The 4 accent hues are deliberately desaturated so
// the 60-30-10 ratio reads as 60% paper, 30% ink/frame, 10% ink-
// stamp accents — instead of neon UI chips fighting each other.
//
// Hue semantics:
//   orange  tobacco brown  — warm signal / code / source / warning
//   green   olive ink     — success / verified / completed
//   magenta burnt bordeaux— critical / charge / fail / required
//   blue    navy ink      — information / reference / textbook
export const TC = {
  cream:     '#F5F0E1',
  ink:       '#1A1A1A',
  green:     '#4F7A3A', // olive ink        (was #34A853)
  magenta:   '#8E2A2A', // burnt bordeaux   (was #C13584)
  orange:    '#6B4A2B', // tobacco brown    (was #B8541F → cooler, calmer next to bordeaux)
  blue:      '#2D5C8A', // navy ink         (was #2C6FBB)
  grid:      '#E5DFCE',
  grey:      '#5A5448',
  greyLight: '#C9C3B0',
} as const

export type TCKey = keyof typeof TC

export const PIXEL_FONT = "'Press Start 2P', cursive"
export const HAND_FONT  = "'IBM Plex Serif', Georgia, serif"
export const MONO_FONT  = "'JetBrains Mono', monospace"

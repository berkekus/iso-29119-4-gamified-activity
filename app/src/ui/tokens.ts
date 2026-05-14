export const TC = {
  cream:     '#F5F0E1',
  ink:       '#1A1A1A',
  green:     '#34A853',
  magenta:   '#C13584',
  orange:    '#F26B1F',
  blue:      '#2C6FBB',
  grid:      '#E5DFCE',
  grey:      '#5A5448',
  greyLight: '#C9C3B0',
} as const

export type TCKey = keyof typeof TC

export const PIXEL_FONT = "'Press Start 2P', cursive"
export const HAND_FONT  = "'IBM Plex Serif', Georgia, serif"
export const MONO_FONT  = "'JetBrains Mono', monospace"

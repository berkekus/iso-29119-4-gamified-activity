interface SpriteProps {
  size?: number | string
  pose?: string
  className?: string
}

export function JudgeSprite({ size, pose = 'idle', className = '' }: SpriteProps) {
  return (
    <img
      src="/assets/judge.png"
      alt="Judge"
      className={`w-64 h-64 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

export function ProsecutorSprite({ size, pose = 'idle', className = '' }: SpriteProps) {
  return (
    <img
      src="/assets/prosecutor.png"
      alt="Prosecutor"
      className={`w-64 h-64 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

export function DefenseSprite({ size, pose = 'idle', className = '' }: SpriteProps) {
  return (
    <img
      src="/assets/defense.png"
      alt="Defense"
      className={`w-64 h-64 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

interface BugProps {
  size?: number | string
  type?: 'mcdc' | 'combinatorial' | 'dataflow' | 'bcc'
  mood?: 'nervous' | 'caught'
  className?: string
}

export function BugSprite({ size, type = 'mcdc', mood = 'nervous', className = '' }: BugProps) {
  return (
    <img
      src="/assets/bug-defendant.png"
      alt="Bug Defendant"
      className={`w-48 h-48 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

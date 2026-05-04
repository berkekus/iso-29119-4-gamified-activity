interface SpriteProps {
  size?: number | string
  pose?: string
  className?: string
  isTalking?: boolean
}

export function JudgeSprite({ size, pose = 'idle', className = '', isTalking }: SpriteProps) {
  return (
    <img
      src={isTalking ? "/assets/judge_talk.png" : "/assets/judge.png"}
      alt="Judge"
      className={`w-64 h-64 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

export function ProsecutorSprite({ size, pose = 'idle', className = '', isTalking }: SpriteProps) {
  return (
    <img
      src={isTalking ? "/assets/prosecutor_talk.png" : "/assets/prosecutor.png"}
      alt="Prosecutor"
      className={`w-64 h-64 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

export function DefenseSprite({ size, pose = 'idle', className = '', isTalking }: SpriteProps) {
  return (
    <img
      src={isTalking ? "/assets/defense_talk.png" : "/assets/defense.png"}
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
  mood?: 'nervous' | 'caught' | 'prisoned'
  className?: string
  isTalking?: boolean
}

export function BugSprite({ size, type = 'mcdc', mood = 'nervous', className = '', isTalking }: BugProps) {
  let src = "/assets/bug-defendant.png"
  if (mood === 'prisoned') {
    src = "/assets/bug-defendant-prisoned.png"
  } else if (isTalking) {
    src = "/assets/bug-defendant-talk.png"
  }

  return (
    <img
      src={src}
      alt="Bug Defendant"
      className={`w-48 h-48 object-contain ${className}`}
      style={{
        imageRendering: 'pixelated',
        ...(size ? { width: size, height: size } : {})
      }}
    />
  )
}

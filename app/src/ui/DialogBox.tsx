import { useState, useEffect, type ReactNode } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from './tokens'
import PixelButton from './PixelButton'

interface Props {
  speaker?: string
  text: string
  portrait?: ReactNode
  onNext: () => void
  isLast?: boolean
  onTypingChange?: (isTyping: boolean) => void
}

export default function DialogBox({ speaker, text, portrait, onNext, isLast, onTypingChange }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    onTypingChange?.(!done)
  }, [done, onTypingChange])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayed('')
    setDone(false)
    let i = 0
    const iv = setInterval(() => {
      i++
      if (i >= text.length) {
        clearInterval(iv)
        setDone(true)
      }
      setDisplayed(text.slice(0, i))
    }, 22)
    return () => clearInterval(iv)
  }, [text])

  return (
    <div
      style={{
        background: TC.cream,
        border: `3px solid ${TC.ink}`,
        boxShadow: `4px 4px 0 ${TC.ink}`,
        padding: 16,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        maxWidth: 700,
      }}
    >
      {portrait && <div style={{ flexShrink: 0 }}>{portrait}</div>}
      <div style={{ flex: 1 }}>
        {speaker && (
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.blue, marginBottom: 8 }}>
            {speaker}
          </div>
        )}
        <div
          style={{
            fontFamily: HAND_FONT,
            fontSize: 18,
            color: TC.ink,
            lineHeight: 1.55,
            minHeight: 50,
          }}
        >
          {displayed}
          {!done && (
            <span style={{ animation: 'blink 0.5s steps(2) infinite' }}>▋</span>
          )}
        </div>
        {done && (
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <PixelButton small variant="secondary" onClick={onNext}>
              {isLast ? 'PROCEED' : 'NEXT ▶'}
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect, type ReactNode } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from './tokens'
import PixelButton from './PixelButton'

interface Props {
  speaker?: string
  text: string
  portrait?: ReactNode
  onNext: () => void
  isLast?: boolean
}

export default function DialogBox({ speaker, text, portrait, onNext, isLast }: Props) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

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
      }}
    >
      {/* Portrait + speaker row */}
      {(portrait || speaker) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {portrait && <div style={{ flexShrink: 0 }}>{portrait}</div>}
          {speaker && (
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.blue }}>
              {speaker}
            </div>
          )}
        </div>
      )}
      {/* Dialog text */}
      <div
        style={{
          fontFamily: HAND_FONT,
          fontSize: 10,
          color: TC.ink,
          lineHeight: 2,
          minHeight: 40,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
        }}
      >
        {displayed}
        {!done && (
          <span style={{ animation: 'blink 0.5s steps(2) infinite' }}>▋</span>
        )}
      </div>
      {/* Proceed button */}
      {done && (
        <div style={{ textAlign: 'right', marginTop: 12, borderTop: `1px solid ${TC.grid}`, paddingTop: 10 }}>
          <PixelButton small variant="secondary" onClick={onNext}>
            {isLast ? 'PROCEED' : 'NEXT ▶'}
          </PixelButton>
        </div>
      )}
    </div>
  )
}

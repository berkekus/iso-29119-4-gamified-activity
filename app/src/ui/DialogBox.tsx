import { useState, useEffect, useRef, type ReactNode } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from './tokens'
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
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    onTypingChange?.(!done)
  }, [done, onTypingChange])

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    ivRef.current = setInterval(() => {
      i++
      if (i >= text.length) {
        clearInterval(ivRef.current!)
        ivRef.current = null
        setDone(true)
      }
      setDisplayed(text.slice(0, i))
    }, 22)
    return () => {
      if (ivRef.current) clearInterval(ivRef.current)
    }
  }, [text])

  const handleSkip = () => {
    if (ivRef.current) {
      clearInterval(ivRef.current)
      ivRef.current = null
    }
    setDisplayed(text)
    setDone(true)
  }

  return (
    <div
      style={{
        background: TC.cream,
        border: `3px solid ${TC.ink}`,
        boxShadow: `4px 4px 0 ${TC.ink}`,
        padding: 0,
        overflow: 'hidden',
        maxWidth: 700,
        width: '100%',
      }}
    >
      {/* Header strip */}
      <div style={{
        background:    TC.ink,
        color:         TC.cream,
        fontFamily:    PIXEL_FONT,
        fontSize:      9,
        letterSpacing: 1,
        padding:       '6px 10px',
      }}>
        {speaker ? speaker.toUpperCase() : 'DIALOGUE'}
      </div>

      <div style={{
        display:             'grid',
        gridTemplateColumns: portrait ? '120px 1fr' : '1fr',
        gap:                 0,
      }}>
        {portrait && (
          <div style={{
            background:    TC.grid,
            borderRight:   `2px solid ${TC.ink}`,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            justifyContent:'space-between',
            padding:       '12px 8px 12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              {portrait}
            </div>
          </div>
        )}

        <div style={{
          position:   'relative',
          padding:    '14px 14px 16px',
          display:    'flex',
          flexDirection: 'column',
          minHeight:  140,
        }}>
          {portrait && (
            <div
              aria-hidden="true"
              style={{
                position:     'absolute',
                left:         -8,
                top:          24,
                width:        0,
                height:       0,
                borderTop:    '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight:  `8px solid ${TC.ink}`,
              }}
            />
          )}

          <div
            style={{
              fontFamily: HAND_FONT,
              fontSize: 16,
              fontWeight: 400,
              color: TC.ink,
              lineHeight: 1.5,
              flex: 1,
            }}
          >
            “{displayed}”
            {!done && (
              <span style={{ animation: 'blink 0.5s steps(2) infinite' }}>▋</span>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            {!done && (
              <PixelButton small variant="secondary" onClick={handleSkip}>
                SKIP ▶▶
              </PixelButton>
            )}
            {done && (
              <PixelButton small variant="secondary" onClick={onNext}>
                {isLast ? 'PROCEED' : 'NEXT ▶'}
              </PixelButton>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

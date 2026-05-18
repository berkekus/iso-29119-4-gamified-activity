import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import type { QuestionPublic } from '../speed-trial/types'

const TECHNIQUE_COLORS: Record<string, string> = {
  STATEMENT: TC.blue,
  BRANCH:    TC.green,
  BCC:       TC.orange,
  MCDC:      TC.magenta,
  DATA_FLOW: TC.grey,
}

interface Props {
  question: QuestionPublic
  selectedOptionId: string | null
  correctOptionId: string | null  // revealed after round ends
  onSelect: (optionId: string) => void
  disabled: boolean
}

export default function SpeedTrialQuestionCard({
  question,
  selectedOptionId,
  correctOptionId,
  onSelect,
  disabled,
}: Props) {
  const techColor = TECHNIQUE_COLORS[question.technique] ?? TC.grey

  return (
    <div style={{
      background: TC.cream,
      border: `3px solid ${TC.ink}`,
      boxShadow: `6px 6px 0 ${TC.ink}`,
      padding: '24px 32px',
      maxWidth: 720,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Technique badge */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: PIXEL_FONT,
          fontSize: 10,
          color: '#fff',
          background: techColor,
          padding: '4px 12px',
          border: `2px solid ${TC.ink}`,
          boxShadow: `2px 2px 0 ${TC.ink}`,
        }}>
          {question.technique.replace('_', ' ')}
        </span>
        <span style={{ fontFamily: MONO_FONT, fontSize: 12, color: TC.grey, fontWeight: 700 }}>
          {question.timeLimitSeconds}s LIMIT
        </span>
      </div>

      {/* Prompt */}
      <div style={{
        fontFamily: HAND_FONT,
        fontSize: 18,
        color: TC.ink,
        lineHeight: 1.6,
        marginBottom: 20,
        whiteSpace: 'pre-wrap',
      }}>
        {question.prompt}
      </div>

      {/* Code snippet exhibit */}
      {question.codeSnippet && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: TC.orange, marginBottom: 8 }}>
            EXHIBIT — SOURCE CODE
          </div>
          <pre style={{
            background: '#1e1e2e',
            color: '#cdd6f4',
            fontFamily: MONO_FONT,
            fontSize: 13,
            padding: 20,
            border: `2px solid ${TC.ink}`,
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
          }}>
            {question.codeSnippet}
          </pre>
        </div>
      )}

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {question.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id
          const isCorrect  = correctOptionId === opt.id
          const isWrong    = correctOptionId !== null && isSelected && !isCorrect

          let bg = TC.cream
          let border = `3px solid ${TC.ink}`
          let shadow = `4px 4px 0 ${TC.ink}`
          let letterColor = TC.magenta

          if (isCorrect && correctOptionId !== null) {
            bg = `${TC.green}15`; border = `3px solid ${TC.green}`; shadow = `4px 4px 0 ${TC.green}`; letterColor = TC.green
          } else if (isWrong) {
            bg = `${TC.magenta}15`; border = `3px solid ${TC.magenta}`; shadow = `4px 4px 0 ${TC.magenta}`; letterColor = TC.magenta
          } else if (isSelected) {
            bg = `${TC.blue}15`; border = `3px solid ${TC.blue}`; shadow = `4px 4px 0 ${TC.blue}`; letterColor = TC.blue
          }

          const isMuted = correctOptionId !== null && !isCorrect && !isSelected

          return (
            <button
              key={opt.id}
              disabled={disabled || !!selectedOptionId}
              onClick={() => onSelect(opt.id)}
              style={{
                background: bg,
                border,
                boxShadow: shadow,
                padding: '14px 18px',
                cursor: disabled || selectedOptionId ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                opacity: isMuted ? 0.6 : 1,
                transition: 'all 0.1s ease',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <span style={{
                fontFamily: PIXEL_FONT,
                fontSize: 11,
                color: letterColor,
                minWidth: 24,
                flexShrink: 0,
                marginTop: 2,
                fontWeight: 700,
              }}>
                {opt.id.toUpperCase()}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: HAND_FONT,
                  fontSize: 16,
                  color: TC.ink,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}>
                  {opt.text}
                </div>
                {isCorrect && correctOptionId !== null && (
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.green, marginTop: 8 }}>
                    ✓ CERTIFIED EXHIBIT
                  </div>
                )}
                {isWrong && (
                  <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.magenta, marginTop: 8 }}>
                    ✗ OBJECTION OVERRULED
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

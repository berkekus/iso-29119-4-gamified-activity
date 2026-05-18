import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import type { QuestionPublic } from '../speed-trial/types'

const TECHNIQUE_COLORS: Record<string, string> = {
  STATEMENT: TC.blue,
  BRANCH:    TC.green,
  BCC:       TC.orange,
  MCDC:      TC.magenta,
  DATA_FLOW: TC.grey,
}

const OPTION_COLORS = ['#C13584', '#2C6FBB', '#34A853', '#F26B1F']

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
      padding: '20px 24px',
      maxWidth: 720,
      width: '100%',
    }}>
      {/* Technique badge */}
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: PIXEL_FONT,
          fontSize: 9,
          color: '#fff',
          background: techColor,
          padding: '3px 10px',
          border: `2px solid ${TC.ink}`,
        }}>
          {question.technique.replace('_', ' ')}
        </span>
        <span style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.grey }}>
          {question.timeLimitSeconds}s
        </span>
      </div>

      {/* Prompt */}
      <div style={{
        fontFamily: HAND_FONT,
        fontSize: 18,
        color: TC.ink,
        lineHeight: 1.55,
        marginBottom: 16,
        whiteSpace: 'pre-wrap',
      }}>
        {question.prompt}
      </div>

      {/* Code snippet */}
      {question.codeSnippet && (
        <pre style={{
          fontFamily: MONO_FONT,
          fontSize: 12,
          background: '#1A1A1A',
          color: '#F5F0E1',
          padding: '12px 16px',
          border: `2px solid ${TC.ink}`,
          overflowX: 'auto',
          marginBottom: 20,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {question.codeSnippet}
        </pre>
      )}

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {question.options.map((opt, idx) => {
          const accentColor = OPTION_COLORS[idx % OPTION_COLORS.length]!
          const isSelected = selectedOptionId === opt.id
          const isCorrect  = correctOptionId === opt.id
          const isWrong    = correctOptionId !== null && isSelected && !isCorrect

          let bg = TC.cream
          let border = `3px solid ${TC.ink}`
          let shadow = `4px 4px 0 ${TC.ink}`

          if (isCorrect && correctOptionId !== null) {
            bg = TC.green; border = `3px solid ${TC.ink}`; shadow = `4px 4px 0 ${TC.ink}`
          } else if (isWrong) {
            bg = TC.magenta; border = `3px solid ${TC.ink}`; shadow = `4px 4px 0 ${TC.ink}`
          } else if (isSelected) {
            bg = `${accentColor}22`; border = `3px solid ${accentColor}`; shadow = `4px 4px 0 ${accentColor}`
          }

          return (
            <button
              key={opt.id}
              disabled={disabled || !!selectedOptionId}
              onClick={() => onSelect(opt.id)}
              style={{
                background: bg,
                border,
                boxShadow: shadow,
                padding: '12px 14px',
                cursor: disabled || selectedOptionId ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                transition: 'transform 0.06s steps(2)',
              }}
            >
              <span style={{
                fontFamily: PIXEL_FONT,
                fontSize: 11,
                color: isCorrect && correctOptionId ? '#fff' : isWrong ? '#fff' : accentColor,
                minWidth: 20,
                flexShrink: 0,
                marginTop: 2,
              }}>
                {opt.id.toUpperCase()}
              </span>
              <span style={{
                fontFamily: HAND_FONT,
                fontSize: 15,
                color: isCorrect && correctOptionId ? '#fff' : isWrong ? '#fff' : TC.ink,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
              }}>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { TC, PIXEL_FONT } from './tokens'

interface Props {
  value: number
  max: number
  label?: string
  color?: string
  width?: number | string
}

export default function CoverageMeter({ value, max, label, color = TC.green, width = 200 }: Props) {
  const steps = 10
  const filled = Math.round((value / max) * steps)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.ink }}>{label}</span>
      )}
      <div style={{ display: 'flex', gap: 2, width }}>
        {Array.from({ length: steps }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 16,
              background: i < filled ? color : TC.grid,
              border: `2px solid ${TC.ink}`,
              transition: 'background 0.08s steps(2)',
            }}
          />
        ))}
      </div>
      <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: TC.grey }}>
        {value}/{max}
      </span>
    </div>
  )
}

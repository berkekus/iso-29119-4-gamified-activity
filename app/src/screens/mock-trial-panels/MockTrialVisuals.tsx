import { TC, HAND_FONT, MONO_FONT, PIXEL_FONT } from '../../ui/tokens'
import type { AvatarId, MockTrialPlayer, MockTrialRole, Side } from '../../mock-trial/types'

export const ROLE_LABEL: Record<MockTrialRole, string> = {
  prosecutor: 'Prosecutor',
  defense: 'Defense',
  jury1: 'Jury 1',
  jury2: 'Jury 2',
  scribe: 'Scribe',
}

export const ROLE_TONE: Record<MockTrialRole | Side, string> = {
  prosecutor: TC.magenta,
  defense: TC.green,
  jury1: TC.orange,
  jury2: TC.orange,
  scribe: TC.blue,
}

const ROLE_ASSET: Record<MockTrialRole, AvatarId> = {
  prosecutor: 'new_prosecutor',
  defense: 'new_defense',
  jury1: 'new_judge',
  jury2: 'new_judge',
  scribe: 'new_judge',
}

const ROLE_MARK: Record<MockTrialRole, string> = {
  prosecutor: 'P',
  defense: 'D',
  jury1: 'J1',
  jury2: 'J2',
  scribe: 'S',
}

export function avatarSrc(avatar: AvatarId | null | undefined, role?: MockTrialRole): string {
  const resolved = avatar ?? (role ? ROLE_ASSET[role] : 'new_judge')
  return `/assets/${resolved}.png`
}

export function RoleAvatar({
  player,
  role,
  size = 58,
  pose = 'idle',
  label,
}: {
  player?: MockTrialPlayer | null
  role: MockTrialRole
  size?: number
  pose?: 'idle' | 'thinking' | 'submitted' | 'disconnected' | 'celebrate'
  label?: string
}) {
  const connected = player?.connected ?? true
  const className = [
    'mt-avatar',
    `mt-avatar-${pose}`,
    connected ? '' : 'mt-avatar-disconnected',
  ].filter(Boolean).join(' ')

  return (
    <div className={className} style={{ width: size, minWidth: size }}>
      <div style={{
        width: size,
        height: size,
        border: `2px solid ${ROLE_TONE[role]}`,
        background: player ? '#fff' : TC.grid,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}>
        {player ? (
          <img
            src={avatarSrc(player.avatar, role)}
            alt={player.nickname}
            style={{ width: '92%', height: '92%', objectFit: 'contain', imageRendering: 'pixelated' }}
          />
        ) : (
          <span style={{ fontFamily: MONO_FONT, color: ROLE_TONE[role], fontWeight: 800 }}>
            {ROLE_MARK[role]}
          </span>
        )}
      </div>
      {label ? (
        <div style={{ fontFamily: HAND_FONT, color: connected ? TC.ink : TC.grey, fontSize: 11, textAlign: 'center', marginTop: 3 }}>
          {label}
        </div>
      ) : null}
    </div>
  )
}

export function RolePanelHeader({
  role,
  player,
  title,
  subtitle,
  pose,
}: {
  role: MockTrialRole
  player?: MockTrialPlayer | null
  title: string
  subtitle: string
  pose?: 'idle' | 'thinking' | 'submitted' | 'disconnected' | 'celebrate'
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <RoleAvatar player={player ?? null} role={role} pose={pose} size={64} />
      <div>
        <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 15, color: ROLE_TONE[role], margin: '0 0 5px 0', lineHeight: 1.5 }}>
          {title}
        </h3>
        <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13 }}>{subtitle}</div>
      </div>
    </div>
  )
}

export function ArgumentDocket({
  title,
  color,
  card,
  note,
  empty = 'Waiting for argument...',
}: {
  title: string
  color: string
  card?: string
  note?: string
  empty?: string
}) {
  return (
    <div className={card ? 'mt-argument-card' : undefined} style={{ border: `2px solid ${color}`, padding: 10, background: '#fff', minHeight: 92 }}>
      <strong style={{ color, fontFamily: PIXEL_FONT, fontSize: 11 }}>{title}</strong>
      {card ? (
        <>
          <div style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 13, marginTop: 6 }}>{card}</div>
          {note ? <div style={{ fontFamily: HAND_FONT, fontSize: 12, marginTop: 6, color: TC.grey }}>"{note}"</div> : null}
        </>
      ) : (
        <div style={{ fontFamily: HAND_FONT, color: TC.grey, fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>
          {empty}
        </div>
      )}
    </div>
  )
}

export function ReadyStamp({ ready }: { ready: boolean }) {
  return (
    <span className={ready ? 'mt-ready-stamp' : undefined} style={{
      fontFamily: PIXEL_FONT,
      color: ready ? TC.green : TC.magenta,
      fontSize: 10,
      border: `2px solid ${ready ? TC.green : TC.magenta}`,
      padding: '4px 7px',
      background: ready ? '#f4ffe9' : '#fff1f1',
    }}>
      {ready ? 'READY' : 'NEEDS P+D+S'}
    </span>
  )
}

export function VerdictStamp({ verdict }: { verdict: string }) {
  const satisfied = verdict === 'satisfied'
  return (
    <div className="mt-verdict-stamp" style={{
      border: `4px solid ${satisfied ? TC.green : TC.magenta}`,
      color: satisfied ? TC.green : TC.magenta,
      fontFamily: PIXEL_FONT,
      fontSize: 18,
      padding: '10px 14px',
      display: 'inline-block',
      transform: 'rotate(-2deg)',
      background: '#fff',
    }}>
      {satisfied ? 'SATISFIED' : 'NOT SATISFIED'}
    </div>
  )
}

export function ScoreChip({ label, value, tone = TC.blue }: { label: string; value: number; tone?: string }) {
  const display = `${value >= 0 ? '+' : ''}${value}`
  return (
    <div className="mt-score-chip" style={{
      border: `2px solid ${tone}`,
      background: '#fff',
      color: TC.ink,
      padding: '6px 8px',
      fontFamily: MONO_FONT,
      fontSize: 12,
      minWidth: 112,
    }}>
      <strong style={{ color: tone }}>{display}</strong> {label}
    </div>
  )
}

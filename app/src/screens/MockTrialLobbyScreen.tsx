import { useEffect, useState } from 'react'
import { TC, PIXEL_FONT, HAND_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { useMockTrialStore } from '../stores/mockTrialStore'
import type { AvatarId } from '../mock-trial/types'
import type { Screen } from '../stores/gameStore'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

const AVATARS: { id: AvatarId; label: string }[] = [
  { id: 'new_judge', label: 'Judge' },
  { id: 'new_prosecutor', label: 'Prosecutor' },
  { id: 'new_defense', label: 'Defense' },
  { id: 'bug-defendant', label: 'Bug' },
]

export default function MockTrialLobbyScreen({ onNavigate, onBack }: Props) {
  const { connect, createRoom, joinRoom, error, clearError, roleScope, playerId, reset } = useMockTrialStore()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState<AvatarId>('new_judge')
  const [code, setCode] = useState('')
  const [caseCount, setCaseCount] = useState<3 | 5 | 7>(5)
  const [argSec, setArgSec] = useState<60 | 90 | 120>(90)
  const [delibSec, setDelibSec] = useState<30 | 45 | 60>(45)

  useEffect(() => { connect() }, [connect])

  useEffect(() => {
    if (!playerId || !roleScope) return
    if (roleScope === 'host') onNavigate('mock-trial-host')
    else onNavigate('mock-trial-court-select')
  }, [playerId, roleScope, onNavigate])

  const handleBack = () => { reset(); onBack() }

  const handleCreate = () => {
    if (!nickname.trim()) return
    createRoom(nickname.trim(), avatar, { caseCount, defaultArgumentSec: argSec, defaultDeliberationSec: delibSec })
  }
  const handleJoin = () => {
    if (!nickname.trim() || !code.trim()) return
    joinRoom(code.trim().toUpperCase(), nickname.trim(), avatar)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, gap: 16, zIndex: 1, position: 'relative' }}>
      <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 32, color: TC.ink, margin: 0 }}>Mock Trial</h1>
      <p style={{ fontFamily: HAND_FONT, color: TC.ink, fontSize: 16, maxWidth: 480, textAlign: 'center' }}>
        Role-based group play: form courts of 4-5, assign Prosecutor / Defense / Jury / Scribe, and argue coverage cases together.
      </p>

      {error && (
        <div style={{ background: TC.magenta, color: TC.cream, padding: 8, borderRadius: 4, fontFamily: HAND_FONT }}>
          {error} <button onClick={clearError} style={{ marginLeft: 8 }}>×</button>
        </div>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', gap: 16 }}>
          <PixelButton onClick={() => setMode('create')}>Host a Room</PixelButton>
          <PixelButton onClick={() => setMode('join')}>Join a Room</PixelButton>
          <PixelButton onClick={handleBack} variant="secondary">Back</PixelButton>
        </div>
      )}

      {mode !== 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360, width: '100%' }}>
          <label style={{ fontFamily: HAND_FONT, color: TC.ink }}>
            Nickname
            <input value={nickname} onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              style={{ width: '100%', padding: 8, fontFamily: HAND_FONT, fontSize: 16, border: `2px solid ${TC.ink}` }} />
          </label>

          <div>
            <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 4 }}>Avatar</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {AVATARS.map((a) => (
                <button key={a.id} onClick={() => setAvatar(a.id)}
                  style={{
                    padding: '4px 10px',
                    fontFamily: HAND_FONT,
                    background: avatar === a.id ? TC.blue : TC.cream,
                    color: avatar === a.id ? TC.cream : TC.ink,
                    border: `2px solid ${TC.ink}`, cursor: 'pointer',
                  }}>{a.label}</button>
              ))}
            </div>
          </div>

          {mode === 'create' && (
            <>
              <ConfigRow label="Case count" value={caseCount} options={[3, 5, 7]} onChange={(v) => setCaseCount(v as 3 | 5 | 7)} />
              <ConfigRow label="Argument time (sec)" value={argSec} options={[60, 90, 120]} onChange={(v) => setArgSec(v as 60 | 90 | 120)} />
              <ConfigRow label="Deliberation time (sec)" value={delibSec} options={[30, 45, 60]} onChange={(v) => setDelibSec(v as 30 | 45 | 60)} />
              <PixelButton onClick={handleCreate} disabled={!nickname.trim()}>Create Room</PixelButton>
            </>
          )}
          {mode === 'join' && (
            <>
              <label style={{ fontFamily: HAND_FONT, color: TC.ink }}>
                Room code
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6} placeholder="ABCDEF"
                  style={{ width: '100%', padding: 8, fontFamily: 'monospace', fontSize: 22, letterSpacing: 4, border: `2px solid ${TC.ink}` }} />
              </label>
              <PixelButton onClick={handleJoin} disabled={!nickname.trim() || !code.trim()}>Join Room</PixelButton>
            </>
          )}
          <PixelButton onClick={() => setMode('choose')} variant="secondary">Back</PixelButton>
        </div>
      )}
    </div>
  )
}

function ConfigRow({ label, value, options, onChange }: {
  label: string; value: number; options: number[]; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ fontFamily: HAND_FONT, color: TC.ink, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)}
            style={{
              padding: '4px 12px',
              fontFamily: 'monospace',
              background: value === o ? TC.blue : TC.cream,
              color: value === o ? TC.cream : TC.ink,
              border: `2px solid ${TC.ink}`, cursor: 'pointer',
            }}>{o}</button>
        ))}
      </div>
    </div>
  )
}

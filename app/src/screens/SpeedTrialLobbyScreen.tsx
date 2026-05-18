import { useState, useEffect } from 'react'
import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import { JudgeSprite } from '../ui/CharacterSprites'
import { useSpeedTrialStore } from '../stores/speedTrialStore'
import type { Screen } from '../stores/gameStore'
import type { AvatarId } from '../speed-trial/types'

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3001'

interface Props {
  onNavigate: (screen: Screen) => void
  onBack: () => void
}

type Tab = 'host' | 'join'

const AVATARS: { id: AvatarId; label: string }[] = [
  { id: 'new_judge', label: 'JUDGE' },
  { id: 'new_prosecutor', label: 'PROSEC.' },
  { id: 'new_defense', label: 'DEFENSE' },
  { id: 'bug-defendant', label: 'BUG DEF.' },
]

export default function SpeedTrialLobbyScreen({ onNavigate, onBack }: Props) {
  const [tab, setTab]         = useState<Tab>('host')
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [avatar, setAvatar]     = useState<AvatarId>('new_judge')

  const { connect, createRoom, joinRoom, roomCode: joinedCode, role, error, clearError, reset } = useSpeedTrialStore()

  // Connect socket when this screen mounts
  useEffect(() => {
    connect()
    return () => { /* keep socket alive — reset() is called explicitly on back */ }
  }, [connect])

  // Navigate to host/player screen once room is confirmed
  useEffect(() => {
    if (!joinedCode) return
    if (role === 'host')   onNavigate('speed-trial-host')
    if (role === 'player') onNavigate('speed-trial-player')
  }, [joinedCode, role, onNavigate])

  const handleBack = () => {
    reset()
    onBack()
  }

  const canSubmit = nickname.trim().length >= 2

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 1,
      padding: 24,
      gap: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <JudgeSprite size={100} pose="idle" className="mb-2" />
        <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, letterSpacing: 3, marginBottom: 8 }}>
          ISO 29119-4 · CLASSROOM TOURNAMENT
        </div>
        <h1 style={{ fontFamily: PIXEL_FONT, fontSize: 28, color: TC.orange, margin: 0, textShadow: `3px 3px 0 ${TC.grid}` }}>
          SPEED TRIAL
        </h1>
        <div style={{ fontFamily: HAND_FONT, fontSize: 16, color: TC.grey, marginTop: 8 }}>
          Speed Court Tournament — up to 70 players
        </div>
      </div>

      {/* Tab selector */}
      <div style={{ display: 'flex', gap: 0, border: `3px solid ${TC.ink}` }}>
        {(['host', 'join'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); clearError() }}
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              padding: '10px 24px',
              background: tab === t ? TC.ink : TC.cream,
              color: tab === t ? TC.cream : TC.ink,
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {t === 'host' ? 'HOST A ROOM' : 'JOIN ROOM'}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div style={{
        background: TC.cream,
        border: `3px solid ${TC.ink}`,
        boxShadow: `6px 6px 0 ${TC.ink}`,
        padding: '28px 32px',
        width: '100%',
        maxWidth: 520,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxSizing: 'border-box',
      }}>
        <AvatarSelector value={avatar} onChange={setAvatar} />

        {tab === 'host' ? (
          <>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink, marginBottom: 4 }}>
              YOUR HOST NICKNAME
            </div>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="e.g. Judge Smith"
              maxLength={20}
              style={inputStyle}
            />
            <PixelButton
              variant="warning"
              disabled={!canSubmit}
              onClick={() => canSubmit && createRoom(nickname.trim(), avatar)}
            >
              CREATE ROOM
            </PixelButton>
          </>
        ) : (
          <>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink }}>
              YOUR NICKNAME
            </div>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value.slice(0, 20))}
              placeholder="e.g. Alice"
              maxLength={20}
              style={inputStyle}
            />
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.ink }}>
              ROOM CODE
            </div>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              maxLength={6}
              style={{ ...inputStyle, fontFamily: MONO_FONT, fontSize: 22, letterSpacing: 6, textAlign: 'center' }}
            />
            <PixelButton
              variant="primary"
              disabled={!canSubmit || roomCode.length < 4}
              onClick={() => canSubmit && roomCode.length >= 4 && joinRoom(roomCode, nickname.trim(), avatar)}
            >
              JOIN ROOM
            </PixelButton>
          </>
        )}

        {error && (
          <div style={{
            border: `2px solid ${TC.magenta}`,
            padding: '12px 14px',
            background: `${TC.magenta}11`,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ fontFamily: HAND_FONT, fontSize: 15, color: TC.magenta }}>
              {error.includes('xhr poll') || error.includes('Connection failed')
                ? 'Cannot reach the Speed Trial server.'
                : error}
            </div>
            {(error.includes('xhr poll') || error.includes('Connection failed')) && (
              <div style={{ fontFamily: MONO_FONT, fontSize: 10, color: TC.grey }}>
                Start the server first:
                <br />  cd app/server &amp;&amp; npm run dev
                <br />Expected at: {SOCKET_URL}
              </div>
            )}
            <PixelButton small variant="secondary" onClick={() => { clearError(); connect() }}>
              RETRY CONNECTION
            </PixelButton>
          </div>
        )}
      </div>

      {/* Rules */}
      <div style={{
        fontFamily: HAND_FONT,
        fontSize: 13,
        color: TC.grey,
        maxWidth: 400,
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        5 rounds · ISO 29119-4 test techniques · Speed bonus points ·
        Top 5 advance to Grand Jury Final
      </div>

      <PixelButton variant="secondary" small onClick={handleBack}>
        ← BACK TO MENU
      </PixelButton>
    </div>
  )
}

function AvatarSelector({ value, onChange }: { value: AvatarId; onChange: (v: AvatarId) => void }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: TC.ink, marginBottom: 10, textTransform: 'uppercase', textAlign: 'center' }}>
        SELECT YOUR AVATAR
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {AVATARS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              background: value === item.id ? `${TC.blue}15` : TC.cream,
              border: `2px solid ${value === item.id ? TC.blue : TC.ink}`,
              boxShadow: value === item.id ? `4px 4px 0 ${TC.blue}` : `3px 3px 0 ${TC.ink}`,
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              boxSizing: 'border-box',
            }}
          >
            <img
              src={`/assets/${item.id}.png`}
              alt={item.label}
              style={{ width: 72, height: 72, objectFit: 'contain', imageRendering: 'pixelated' }}
            />
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: value === item.id ? TC.blue : TC.ink, fontWeight: value === item.id ? 700 : 400 }}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: "'Special Elite', cursive",
  fontSize: 18,
  padding: '10px 14px',
  border: `3px solid ${TC.ink}`,
  background: '#fffef8',
  color: TC.ink,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

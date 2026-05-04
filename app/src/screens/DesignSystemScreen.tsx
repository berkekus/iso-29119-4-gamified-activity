import { TC, PIXEL_FONT, HAND_FONT, MONO_FONT } from '../ui/tokens'
import PixelButton from '../ui/PixelButton'
import CoverageMeter from '../ui/CoverageMeter'
import ScoreChip from '../ui/ScoreChip'
import DialogBox from '../ui/DialogBox'
import Badge from '../ui/Badge'
import { JudgeSprite, ProsecutorSprite, DefenseSprite, BugSprite } from '../ui/CharacterSprites'

interface Props {
  onBack: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: TC.grey, marginBottom: 12, borderBottom: `2px solid ${TC.grid}`, paddingBottom: 6 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function DesignSystemScreen({ onBack }: Props) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, padding: 'clamp(16px, 3vw, 30px) clamp(16px, 4vw, 40px)', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 30 }}>
        <PixelButton small variant="secondary" onClick={onBack}>← MENU</PixelButton>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 16, color: TC.ink, margin: 0 }}>DESIGN SYSTEM</h2>
      </div>

      {/* Colours */}
      <Section title="COLOUR PALETTE">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {Object.entries(TC).map(([name, hex]) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: hex, border: `2px solid ${TC.ink}`, boxShadow: `3px 3px 0 ${TC.ink}` }} />
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 6, marginTop: 6, color: TC.ink }}>{name}</div>
              <div style={{ fontFamily: MONO_FONT, fontSize: 9, color: TC.grey }}>{hex}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section title="TYPOGRAPHY">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey }}>PIXEL — Press Start 2P</span>
            <div style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: TC.ink, marginTop: 4 }}>BUTTONS · BADGES · SCORES</div>
          </div>
          <div>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey }}>HAND — Special Elite</span>
            <div style={{ fontFamily: HAND_FONT, fontSize: 28, color: TC.ink, marginTop: 4 }}>Body text, narratives, and case descriptions</div>
          </div>
          <div>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: TC.grey }}>MONO — JetBrains Mono</span>
            <div style={{ fontFamily: MONO_FONT, fontSize: 13, color: TC.ink, marginTop: 4 }}>
              {'if (verticalSpeed > LIMIT && autopilotEngaged) disengage();'}
            </div>
          </div>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="PIXEL BUTTONS">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <PixelButton variant="primary">PRIMARY</PixelButton>
          <PixelButton variant="secondary">SECONDARY</PixelButton>
          <PixelButton variant="danger">DANGER</PixelButton>
          <PixelButton variant="success">SUCCESS</PixelButton>
          <PixelButton variant="warning">WARNING</PixelButton>
          <PixelButton disabled>DISABLED</PixelButton>
          <PixelButton small variant="primary">SMALL</PixelButton>
        </div>
      </Section>

      {/* Characters */}
      <Section title="CHARACTER SPRITES">
        <div style={{ display: 'flex', gap: 30, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {[
            { label: 'idle',      el: <JudgeSprite size={120} /> },
            { label: 'verdict',   el: <JudgeSprite size={120} pose="verdict" /> },
            { label: 'idle',      el: <ProsecutorSprite size={120} /> },
            { label: 'pointing',  el: <ProsecutorSprite size={120} pose="pointing" /> },
            { label: 'idle',      el: <DefenseSprite size={120} /> },
            { label: 'objecting', el: <DefenseSprite size={120} pose="objecting" /> },
          ].map(({ label, el }, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              {el}
              <div style={{ fontFamily: PIXEL_FONT, fontSize: 7, marginTop: 6, color: TC.grey }}>{label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Bugs */}
      <Section title="BUG DEFENDANTS">
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
          {(['mcdc', 'combinatorial', 'dataflow', 'bcc'] as const).map(t => (
            <BugSprite key={t} size={70} type={t} />
          ))}
        </div>
      </Section>

      {/* Meters & Chips */}
      <Section title="METERS & CHIPS">
        <div style={{ display: 'flex', gap: 30, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <CoverageMeter value={70} max={100} label="COVERAGE" color={TC.green} width={180} />
          <CoverageMeter value={30} max={100} label="FAULT DET." color={TC.magenta} width={180} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ScoreChip label="SCORE" value="1250" color={TC.blue} />
            <ScoreChip label="COMBO" value="x3" color={TC.orange} />
            <ScoreChip label="TIME" value="4:32" color={TC.green} />
          </div>
        </div>
      </Section>

      {/* Dialog */}
      <Section title="DIALOG BOX">
        <DialogBox
          speaker="THE JUDGE"
          text="The court is now in session. Prosecutor, present your evidence carefully — every coverage gap is a chance for the defendant to walk free."
          portrait={<JudgeSprite size={60} />}
          onNext={() => {}}
        />
      </Section>

      {/* Badges */}
      <Section title="BADGES">
        <div style={{ display: 'flex', gap: 16 }}>
          <Badge name="Independence\nDetective" icon="🔍" unlocked={true} color={TC.magenta} />
          <Badge name="Coverage\nCartographer" icon="🗺" unlocked={true} color={TC.blue} />
          <Badge name="Locked Badge" icon="🔒" unlocked={false} color={TC.grey} />
        </div>
      </Section>
    </div>
  )
}

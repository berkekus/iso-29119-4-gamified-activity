# Oyun Akışı Yeniden Tasarımı — Tek Sayfa Kaydırmalı Düzen

> **Hedef:** Oyuncuyu butonla yeni ekrana yönlendirmek yerine, aynı sayfada aşağı doğru ilerleyen tek bir akışa geçmek. Mevcut tasarım dilini (krem kart + ink border + pixel/hand font) ve faz bazlı oyun mantığını **bozmadan** uygulamak.

---

## 1. Mevcut Durum

5 ayrı ekran, her biri `useGameStore().screen` ile tam ekran olarak swap ediliyor:

| Ekran               | Dosya                       | Tetikleyici (mevcut)                       |
| ------------------- | --------------------------- | ------------------------------------------ |
| Briefing            | `BriefingScreen.tsx`        | Dialog'un sonunda `onNavigate('investigation')` |
| Investigation       | `InvestigationScreen.tsx`   | `VALIDATE MODEL` butonu → `evidence`       |
| Evidence            | `EvidenceScreen.tsx`        | `SUBMIT FOR VERDICT` butonu → `trial`      |
| Trial               | `TrialScreen.tsx`           | Otomatik animasyon → `VIEW DEBRIEF` → `debrief` |
| Debrief             | `DebriefScreen.tsx`         | `NEXT CASE` / `RETRY CASE` butonu          |

**State zaten faz tabanlı:** `gameStore.phase: GamePhase` alanı (`briefing | investigation | evidence | trial | debrief`) ve `advancePhase()` action'ı mevcut. Yani backend mantığı zaten doğru modellenmiş, sadece view katmanı 5 parçaya bölünmüş durumda.

---

## 2. Hedef Akış (Yeni)

Tek bir `CasePlayScreen` (yeni komponent) **5 bölümü dikey olarak** render eder:

```
┌─────────────────────────────────────┐
│  Header (sticky)                    │  ← Case başlığı, PHASE indicator, ← MENU
├─────────────────────────────────────┤
│  § 1  BRIEFING                      │  ← Aktif faz buradayken focuslu
│       Case File + Dialog            │
│       [▼ BEGIN INVESTIGATION]       │  ← Aşağı kaydır + bir sonraki bölümü aç
├─────────────────────────────────────┤
│  § 2  INVESTIGATION  (locked)       │  ← Faz < investigation iken görünmez
│       Truth table picker            │
│       [▼ COLLECT EVIDENCE]          │
├─────────────────────────────────────┤
│  § 3  EVIDENCE  (locked)            │
│       Pair selector                 │
│       [▼ SUBMIT FOR VERDICT]        │
├─────────────────────────────────────┤
│  § 4  TRIAL  (locked)               │
│       Sahne + otomatik animasyon    │
│       [▼ READ DEBRIEF]              │
├─────────────────────────────────────┤
│  § 5  DEBRIEF  (locked)             │
│       Verdict + analysis            │
│       [RETRY] [NEXT CASE →]         │
└─────────────────────────────────────┘
```

### Davranış kuralları

1. **Progressive reveal:** Bir bölüm, ancak `phase` o bölüme veya sonrasına geçtiğinde DOM'a render edilir. Önceki tasarımdaki "screen swap" yerine "section reveal" var.
2. **Auto-scroll:** Faz ilerleyince yeni bölüm `scrollIntoView({ behavior: 'smooth', block: 'start' })` ile otomatik odaklanır.
3. **Geri okunabilir geçmiş:** Tamamlanan bölümler kaldırılmaz — oyuncu yukarı kaydırıp briefing'i tekrar okuyabilir. Ama interaktif elemanları (butonlar, formlar) **disabled** olur.
4. **Sticky header:** Aktif faz adı + case adı + ilerleme göstergesi (1/5, 2/5...) üstte sabit kalır. Kullanıcı her zaman nerede olduğunu görür.
5. **Tek "next" butonu:** Her bölümün altında o bölümü tamamlayan tek bir aksiyon (örn. "BEGIN INVESTIGATION") var. Mevcut butonlar (VALIDATE MODEL, SUBMIT FOR VERDICT) korunur ama navigasyon yerine `advancePhase()` çağırır.

---

## 3. Korunacak Şeyler (Dokunulmayacak)

- **`gameStore`** — `phase`, `advancePhase`, `caseFile`, `mcdc`, `markCaseCompleted`, hepsi aynı kalır.
- **Görsel dil** — `TC` token'ları, `PIXEL_FONT`, `HAND_FONT`, krem kartlar, ink border, pixel shadow.
- **Reusable componentler** — `PixelButton`, `ScoreChip`, `CoverageMeter`, `DialogBox`, `JudgeSprite/ProsecutorSprite/DefenseSprite/BugSprite`.
- **Engine'ler** — `mcdc.ts`, `simulator.ts`, `detector.ts`, `verdict/index.ts`. Hiçbiri değişmez.
- **Soru renderer'ları** — `QuestionRenderer.tsx` (OptionListPicker, CoverageTablePicker, vs.) olduğu gibi.
- **CampaignMapScreen → CasePlayScreen geçişi** — Hâlâ "play" tetikleyince yeni ekrana gidiyoruz. Sadece o ekranın içi 5 yerine 1 olacak.

---

## 4. Yeni Mimari

### 4.1 Komponentler

```
app/src/screens/
  CasePlayScreen.tsx           ← YENİ. Üst seviye container.
  sections/                    ← YENİ klasör.
    BriefingSection.tsx        ← BriefingScreen'in render bloğu (header/padding hariç)
    InvestigationSection.tsx
    EvidenceSection.tsx
    TrialSection.tsx
    DebriefSection.tsx
```

Mevcut `BriefingScreen.tsx` vs. dosyaları **silinmez**. Önce section komponentleri olarak yeniden paketlenir, ardından eski screen dosyaları wrapper olarak küçültülür (veya geçiş tamamlanınca tamamen kaldırılır).

### 4.2 Section komponent imzası

Tüm section'lar aynı props imzasını kullanır:

```tsx
interface SectionProps {
  isActive:    boolean   // Şu an üzerinde çalışılan faz mı?
  isCompleted: boolean   // Geçmişte bırakılmış mı?
  onAdvance:   () => void  // Faz tamamlandığında çağrılır
}
```

Section, `isActive=false && isCompleted=true` olduğunda:
- Tüm interaktif elemanları `disabled` veya `pointer-events: none` yapar.
- `opacity: 0.7` ile soluk bırakır (geçmiş hissi).
- "Next" butonunu gizler.

### 4.3 CasePlayScreen sorumluluğu

```tsx
function CasePlayScreen() {
  const { phase, advancePhase, caseFile } = useGameStore()
  const refs = { briefing: useRef(), investigation: useRef(), ... }

  // Faz değiştiğinde yeni section'a kaydır
  useEffect(() => {
    refs[phase].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [phase])

  return (
    <div>
      <StickyHeader phase={phase} caseFile={caseFile} />
      <BriefingSection ref={refs.briefing}
        isActive={phase === 'briefing'}
        isCompleted={phase !== 'briefing'}
        onAdvance={advancePhase} />
      {phaseAtLeast('investigation') && <InvestigationSection ... />}
      {phaseAtLeast('evidence')      && <EvidenceSection      ... />}
      {phaseAtLeast('trial')         && <TrialSection         ... />}
      {phaseAtLeast('debrief')       && <DebriefSection       ... />}
    </div>
  )
}
```

`phaseAtLeast` küçük yardımcı: `PHASES.indexOf(phase) >= PHASES.indexOf(target)`.

### 4.4 Sticky header

Mevcut her ekranda olan üst bar (← CAMPAIGN, ACT badge, PHASE chip, ScoreChip) **tek bir sticky komponent** olur — her section yenisini render etmez. Bu hem kod tekrarını siler hem de görsel sıçramayı önler.

```tsx
<div style={{ position: 'sticky', top: 0, zIndex: 10, background: TC.cream, ... }}>
  <PixelButton small onClick={onBackToCampaign}>← CAMPAIGN</PixelButton>
  <ActBadge act={caseFile.act} />
  <PhaseStepper current={phase} />  {/* 1·2·3·4·5 dolu/boş daireler */}
  <ScoreChip ... />
</div>
```

---

## 5. Faz Geçiş Tetikleyicileri

Mevcut `onNavigate('investigation')` çağrıları **`onAdvance()` ile değiştirilir**. Her section'da neye bağlandıkları:

| Section        | Mevcut tetikleyici                                  | Yeni tetikleyici            |
| -------------- | ---------------------------------------------------- | --------------------------- |
| Briefing       | Dialog'un son `onNext` çağrısı                       | `onAdvance()`               |
| Investigation  | `VALIDATE MODEL` butonu / pair_selector dışı submit  | `onAdvance()`               |
| Evidence       | `SUBMIT FOR VERDICT` butonu                          | `onAdvance()`               |
| Trial          | Otomatik `verdict` fazı sonunda `VIEW DEBRIEF →`     | `onAdvance()` (manuel buton korunur) |
| Debrief        | `NEXT CASE` → `loadCaseById(next)` + scroll-to-top  | Aynı; ama scroll-to-top için ref kullan |

**Önemli:** `advancePhase()` zaten store'da var. Sadece view tarafının onu çağırması gerekiyor.

---

## 6. Geçmiş Bölümlerin Davranışı

Üç seçenek var, **B önerilir**:

| Seçenek | Tanım | Avantaj | Dezavantaj |
| ------- | ----- | ------- | ---------- |
| A | Geçmiş section'ı **collapse** et (sadece başlık + ✓) | Az dikey alan | Oyuncu geri okuyamaz |
| **B** | Geçmiş section'ı **görünür ama disabled** bırak | Bağlamı kaybetmez, kaydırınca tekrar görür | Sayfa uzun olur |
| C | Geçmiş section'ı **gizle**, yalnız aktifi göster | Temiz | Mevcut tek-ekran modeline geri döner — yeni tasarımın anlamı kalmaz |

**Karar:** B. Briefing'de okuduğu kodu Investigation fazındayken hatırlamak için yukarı kaydırabilmesi pedagojik olarak değerli.

Daha fazla yer kazanmak için geçmiş section'larda:
- `opacity: 0.65`
- Üstte küçük `✓ COMPLETED — scroll up to review` chip'i
- Interaktif elemanlar `pointer-events: none`

---

## 7. Uygulama Adımları

> Her adımdan sonra oyun **çalışır durumda** kalmalı. Tek aşamada her şeyi değiştirme.

### Adım 1 — Section dosyalarını oluştur (no behavior change)
- `screens/sections/` klasörünü aç.
- Her mevcut Screen'den **render JSX'ini** kopyalayıp Section komponenti yap.
- Hooks ve state hâlâ Screen içinde — section yalnız sunum.
- `SectionProps` imzasını ekle ama henüz disabled davranışını uygulama.
- Mevcut Screen'ler yeni Section'ı sarmalayan ince wrapper'a dönüşür.
- **Test:** Oyun aynı çalışır, kırılma yok.

### Adım 2 — `CasePlayScreen` container'ını ekle
- `screens/CasePlayScreen.tsx` oluştur.
- `App.tsx`'te yeni bir `Screen` değeri ekle: `'play'` (veya mevcut `briefing` route'unu yeniden anlamlandır).
- `CampaignMapScreen` "play" tetikleyince `'play'` ekranına git.
- `CasePlayScreen` içinde sadece **briefing section'ı** render et. Diğerleri henüz yok.
- **Test:** Briefing tek başına çalışır; "BEGIN INVESTIGATION" butonu `advancePhase()` çağırıyor mu doğrula.

### Adım 3 — Section'ları sırayla ekle
- Investigation section'ını `CasePlayScreen`'e ekle (`phaseAtLeast('investigation')` koşuluyla).
- Evidence, Trial, Debrief'i tek tek ekle. Her ekleme sonrası tam akışı oyna.
- **Test:** Her case 5 fazı kesintisiz tamamlar.

### Adım 4 — Auto-scroll ve sticky header
- Her section'a `ref` ata, `phase` değişiminde `scrollIntoView` çağır.
- Sticky header'ı en üste yerleştir. Her section'daki tekrar eden başlık alanını kaldır.
- **Test:** Faz geçişi yumuşak, header sabit kalıyor.

### Adım 5 — Tamamlanmış section disabled davranışı
- Section'a `isActive`/`isCompleted` prop'ları geç.
- Disabled durumda interaktif elemanları kapat (`disabled`, `pointer-events: none`, soluk opacity).
- **Test:** Geçmiş section'da tıklama oyun state'ini bozmuyor.

### Adım 6 — Eski Screen dosyalarını temizle
- `BriefingScreen.tsx`, `InvestigationScreen.tsx`, `EvidenceScreen.tsx`, `TrialScreen.tsx`, `DebriefScreen.tsx` artık kullanılmıyor → sil.
- `App.tsx`'ten ilgili `case 'briefing':` ... dallarını kaldır.
- `Screen` union tipinden `'briefing'|'investigation'|'evidence'|'trial'|'debrief'` çıkar; yerine `'play'` koy.
- `gameStore.screenHistory` mantığını gözden geçir (geri tuşu hâlâ çalışıyor mu?).
- **Test:** Tam regression — campaign → play → debrief → next case → kampanyaya dönüş.

### Adım 7 — `DebriefSection.NEXT CASE` ve retry akışı
- "NEXT CASE" butonu: `loadCaseById(nextCaseId)` + `phase` faz `briefing`'e döner + sayfa en üste kaydırılır.
- "RETRY CASE" butonu: `resetMcdc()` + `phase = 'briefing'` + scroll-to-top.
- Aynı `CasePlayScreen` mount'ta kalır; case yenilenir.

---

## 8. Riskler ve Karar Noktaları

| Risk | Etki | Azaltma |
| ---- | ---- | ------- |
| `TrialScreen`'in `useEffect` ile otomatik faz animasyonu (presenting → deliberating → verdict) section içine taşındığında **mount/unmount** durumu değişir, timer yanlış tetiklenebilir. | Verdict ekranı bozulabilir. | Section mount olduğunda `setPhase('presenting')` local state ile başla. `useEffect` cleanup'ları zaten doğru — sadece koşullu render dikkatli yapılmalı. |
| Sayfa çok uzun olur → mobilde scroll yorgunluğu. | UX kötüleşir. | Geçmiş section'ları `max-height: 200px; overflow: hidden` ile "preview mode"a alıp tıklayınca aç. (Opsiyonel, ileri iterasyon.) |
| `DialogBox`'taki `onNext` Briefing'in sonunda investigation'a yönlendiriyor. Tek sayfaya geçince **bu davranış aynı section içinde tutulmalı.** | Diyalog bitince oto-advance | `onNext` artık `onAdvance()` çağırır. Davranış aynı. |
| Sticky header z-index çakışması (DialogBox bazen modal gibi davranıyor). | Görsel bozukluk | `position: sticky` yeterli — modal yok. z-index: 10 yeterli olur. |

---

## 9. Kapsam Dışı (Bu PR'da Yok)

- Section'ları collapse edilebilir accordion'a çevirmek (gerekirse sonra).
- Geçiş animasyonları (fade-in/slide-in) — varsayılan CSS `@keyframes fadeIn` zaten kullanılıyor, ekleyebiliriz ama opsiyonel.
- Mobile responsive iyileştirmesi — mevcut `.responsive-row` ile aynı davranır.
- Sound/music tetikleyicileri.
- "Stage map" gösterimi (sayfanın yanında dikey 1-2-3-4-5 mini-map). İleri iterasyon.

---

## 10. Tamamlama Kriterleri

- [ ] Bir kullanıcı bir case'i kampanyadan açıp **hiçbir butonla ekran değiştirmeden** debrief'e kadar tek sayfada ilerleyebiliyor.
- [ ] Faz geçişlerinde sayfa yumuşakça yeni bölüme kayıyor.
- [ ] Geçmiş bölümler okunabilir ama interaktif değil.
- [ ] Sticky header tüm fazlarda görünür ve case bağlamını veriyor.
- [ ] "NEXT CASE" yeni case'i aynı sayfada başlatıyor, sayfa en üste dönüyor.
- [ ] Mevcut görsel dil (krem kart + ink border + pixel font + shadow) hiçbir yerde kırılmamış.
- [ ] Eski 5 screen dosyası silinmiş veya wrapper olarak küçülmüş.
- [ ] `npm run build` ve `npx tsc --noEmit` temiz.

---

**Tahmini iş yükü:** 3-4 oturum.
**Geri çevrilebilirlik:** Yüksek — section dosyaları bir wrapper katmanı olarak yaratıldığı için, sorun çıkarsa eski screen'lere dönmek mümkün.

# Test Courthouse — Proje Dokümantasyonu

> ISO/IEC/IEEE 29119-4 tabanlı eğitim oyununun güncel içerik, oynanış ve tasarım analizi.
> Son güncelleme: 2026-05-09

---

## 1. Projeye Genel Bakış

**Test Courthouse**, ISO/IEC/IEEE 29119-4 standardındaki test tasarım tekniklerini öğretmek için tasarlanmış, tarayıcı tabanlı bir eğitim oyunudur. Hedef kitle, yazılım testi dersi alan lisans öğrencileri ve bu dersin öğretmenleridir (SENG 436).

### Temel Metafor: Mahkeme Salonu

Her oyun ögesi, bir ISO 29119-4 kavramına birebir karşılık gelir:

| Mahkeme ögesi | ISO 29119-4 karşılığı |
|---|---|
| Dava dosyası | Test edilecek sistem (SUT) + davranış spesifikasyonu |
| Sanık | Şüpheli yazılım hatası (seeded fault) |
| İddianame | Kanıtlanması gereken arıza modları |
| Soruşturma | Test modelinin oluşturulması (TD1) |
| Delil | Test vakaları |
| Kanıt standardı | Coverage kriteri (TD3) |
| Karar | GUILTY (hata yakalandı) veya MISTRIAL (hata kaçtı) |
| Hakim | Coverage validator — deterministik, şeffaf |

Pedagojik öncül: Yanlış uygulanan bir teknik, test suite'i *doğru görünse de* hiçbir hatayı yakalamayan bir sonuç verir. Oyun, yanlış anlamaları pasif çalışma yerine sonuç üzerinden görünür kılar.

---

## 2. Oyun Yapısı: Dört Perde

Kampanya, coverage hiyerarşisi üzerine sıralı dört perdeden oluşur. Her perde bir veya iki ISO §5.3.x tekniğine karşılık gelir. Her perdedeki vakalar basitten zora gider; bir vakayı tamamlamak bir sonrakini açar.

### Perde Listesi

| Perde | Ad | Alt Başlık | ISO Klozları | Vaka Sayısı |
|---|---|---|---|---|
| ACT I | Statement & Branch | Recognition | §5.3.1 – §5.3.2 | 3 |
| ACT II | Decision & BC | Discrimination | §5.3.3 – §5.3.4 | 3 |
| ACT III | BCC | Combinatorial Cost | §5.3.5 | 2 |
| ACT IV | MC/DC | Independence Pairs | §5.3.6 | 4 |

**Toplam: 12 oynanabilir vaka.**

### Tüm Vakalar

#### ACT I — Statement & Branch (§5.3.1 – §5.3.2)
| ID | Görüntülenen Ad | Zorluk |
|---|---|---|
| `stmt-tutorial-01` | First Trial | ★☆☆ |
| `stmt-hidden-branch-01` | The Missing Else | ★★☆ |
| `branch-loop-trap-01` | The Empty Loop | ★★★ |

#### ACT II — Decision & BC (§5.3.3 – §5.3.4)
| ID | Görüntülenen Ad | Zorluk |
|---|---|---|
| `decision-and-trap-01` | Two-Factor Login | ★☆☆ |
| `bc-or-three-cond-01` | Triple Alarm | ★★☆ |
| `bc-negation-mask-01` | Negation Mask | ★★★ |

#### ACT III — BCC (§5.3.5)
| ID | Görüntülenen Ad | Zorluk |
|---|---|---|
| `bcc-three-and-01` | Triple Lock | ★☆☆ |
| `bcc-cost-intuition-01` | The Cost Calculator | ★★☆ |

#### ACT IV — MC/DC (§5.3.6)
| ID | Görüntülenen Ad | Zorluk | Not |
|---|---|---|---|
| `mcdc-tutorial-01` | Simple Safety Gate | ★☆☆ | |
| `mcdc-altitude-disengage-01` | Altitude Hold Disengage | ★★☆ | |
| `mcdc-trap-isolation-01` | Emergency Override | ★★★ | |
| `mcdc-vault-boss-01` | Vault Authorization | ★★★ | FINAL BOSS |

---

## 3. Oynanış Döngüsü: Beş Aşama

Her vaka, sırayla beş aşamadan geçer (tek bir tur 8–12 dakika sürer):

```
BRIEFING → INVESTIGATION → EVIDENCE → TRIAL → DEBRIEF
(Faz 1)     (Faz 2)         (Faz 3)    (Faz 4)  (Faz 5)
```

### Faz 1 — BRIEFING (Brifing)

**Ekran:** `BriefingScreen.tsx`

Oyuncu bir dava dosyası görür:
- **Senaryo:** Test edilecek sistemi açıklayan kısa bir hikaye (örn. uçak otopilotu devre dışı bırakma kararı).
- **Exhibit A — Source Code:** Test edilecek kaynak kod, karanlık kod editörü temasında gösterilir.
- **CHARGES:** İddianame — oyuncunun kanıtlaması gereken iddialar (1–3 madde).
- **REQUIRED teknik:** Gerekli coverage standardı (örn. *"MC/DC (ISO 29119-4 §5.3.6)"*).

Ekranın sağında hakim ve savcı arasında 3 satırlık bir diyalog gösterilir (typewriter animasyonu ile).

**Law Reference:** Aktif vaka için bir `LAW CARD` eşlenmişse, gizlenebilir bir panel açılabilir. Bu panel ISO klozunu, kısa tanımı ve yaygın tuzağı gösterir.

### Faz 2 — INVESTIGATION (Soruşturma)

**Ekran:** `InvestigationScreen.tsx`

Soru tipi (`question_type`), vaka JSON dosyasındaki alandan belirlenir. İki büyük dal vardır:

#### Dal A: `pair_selector` (MC/DC Truth Table Akışı)

Oyuncu 8 satırlık tam truth table'ı görür (A, B, C koşulları ve D kararı). Her satıra tıklayarak seçim yapar. Minimum 4 satır (N+1) seçmeden "VALIDATE MODEL" düğmesine basılamaz. Model onaylandıktan sonra oyuncu delil derivasyon ekranına geçer.

#### Dal B: Diğer Soru Tipleri

| `question_type` | Bileşen | Açıklama |
|---|---|---|
| `binary_verdict` | `OptionListPicker` | "Bu iddia geçerli mi?" — 2 seçenekli |
| `level_picker` | `OptionListPicker` | "Hangi coverage seviyesine ulaşıldı?" — çoktan seçmeli |
| `coverage_table` | `CoverageTablePicker` | Test satırlarını toggle ile seç |
| `test_designer` | `TestDesignerPicker` | Minimum test setini tasarla, tam sayı gerekir |
| `numeric_input` | `NumericInputPicker` | Sayısal cevap gir (örn. "BCC için N=4'te kaç test?") |

Bu dal doğrudan `submitAnswer()` → `evaluateAnswer()` ile değerlendirilir ve anında TRIAL ekranına yönlendirir.

### Faz 3 — EVIDENCE (Delil Derivasyonu)

**Ekran:** `EvidenceScreen.tsx`

Yalnızca `pair_selector` akışında aktiftir. Oyuncu truth table'dan bağımsızlık çiftleri (independence pairs) seçer. Her çift bir koşulu kapsar: iki satır arasında yalnızca o koşul değişmeli ve karar sonucu (D) değişmelidir.

### Faz 4 — TRIAL (Yargılama)

**Ekran:** `TrialScreen.tsx`

Oyuncu test setini mahkemeye sunar. Motor üç hesaplama yapar:

1. **Coverage Validation** → `validateMcdcCoverage()` — hangi koşullar bağımsızlık çiftiyle kapsandı?
2. **Fault Simulation** → `simulateFaults()` — seeded fault'lar yakalandı mı?
3. **Misconception Detection** → `detectMisconceptions()` — bilinen yanlış anlama tetiklendi mi?

`computeVerdict()` bu üçünü birleştirir: `passed = coverageRatio === 1.0 && faultsMissed.length === 0`.

### Faz 5 — DEBRIEF (Değerlendirme)

**Ekran:** `DebriefScreen.tsx`

Karar ekranı üç katman gösterir:

- **VERDICT:** `GUILTY` (hata yakalandı, case kapandı) veya `MISTRIAL` (hata kaçtı).
- **Coverage Meter:** Yüzde olarak coverage değeri.
- **WHAT THE TEXTBOOK SAYS:** Tekniğe özel ISO §5.3.x özet paragrafı.
- **ISO Reference:** Vakanın ISO klozu referansları.
- **Fault Analysis:** Hangi seeded fault'lar yakalandı, hangileri kaçtı.
- **Misconception Log:** Tetiklenen yanlış anlamanın açıklaması (case JSON'daki `explanation_md`).

**Navigasyon düğmeleri:**
- `RETRY CASE` → Fazı sıfırlar, briefing'e döner (kampanya ilerlemesi korunur).
- `OPEN ANNEX C` → Law Library ekranına gider.
- `NEXT CASE →` → Yalnızca `GUILTY` kararında aktif olur; bir sonraki vakayı yükler.

---

## 4. Oyun Mantığı (Engine)

`app/src/engine/` dizini React'a bağımlı olmayan saf TypeScript'tir. Vitest ile bağımsız test edilir.

### 4.1 Case File Şeması

Her vaka, `app/src/content/cases/` altındaki bir JSON dosyasıdır. Zod ile doğrulanır (`CaseFileSchema`). Önemli alanlar:

```jsonc
{
  "id": "mcdc-tutorial-01",
  "act": "MCDC",              // Kampanya perdesi
  "difficulty": 1,            // 1–3
  "iso_clauses": ["§5.3.6"],  // Referans klozlar
  "technique": "MCDC",        // Motor tipi
  "question_type": "pair_selector", // Soru etkileşim tipi
  "scenario": {
    "title": "Simple Safety Gate",
    "narrative": "...",
    "code": "if (sensorTriggered && buttonPressed) activate();",
    "conditions": [{ "id": "sensorTriggered", "label": "..." }],
    "decision_expression": "sensorTriggered && buttonPressed"
  },
  "charges": ["..."],          // İddianame maddeleri
  "test_set": [...],           // Önceden verilmiş test satırları
  "seeded_faults": [{ "id": "F1", "trigger": {...} }],
  "misconceptions": [{ "id": "MCDC-INDEP-AS-ISOLATION", "explanation_md": "..." }],
  "hints": ["...", "...", "..."],  // 3 kademeli ipucu zinciri
  "options": [...],            // level_picker / binary_verdict için seçenekler
  "coverage_table": [...],     // coverage_table / test_designer için satırlar
  "numeric_prompts": [...]     // numeric_input için sayısal sorular
}
```

Yeni bir vaka eklemek için kod değişikliği gerekmez; yalnızca JSON dosyası eklenip `gameStore.ts`'deki `CASE_REGISTRY`'e ve `caseOrder.ts`'deki `CASE_ORDER`'a eklenir.

### 4.2 Oynanabilir Misconception Tipleri

`engine/types.ts`'te tanımlı beş yanlış anlama:

| ID | Açıklama |
|---|---|
| `STMT-BLIND-TO-BRANCH` | %100 statement coverage = tam test edildi yanılgısı |
| `STMT-GUARANTEES-BRANCH` | Statement coverage → branch coverage anlamına gelir yanılgısı |
| `DECISION-EQUALS-BC` | Decision coverage = Branch Condition coverage yanılgısı |
| `BCC-EQUALS-MCDC` | BCC ve MCDC aynı teknik yanılgısı |
| `MCDC-INDEP-AS-ISOLATION` | Her koşunu ayrı ayrı test etmek MCDC için yeterli yanılgısı |

### 4.3 Verdict Hesaplama Zinciri

```
computeVerdict(submission, truthTable, caseFile)
  ├─ validateMcdcCoverage()   → coverageRatio, covered/uncoveredConditions
  ├─ simulateFaults()         → detected[], missed[]
  └─ detectMisconceptions()   → tetiklenen misconception ID'leri
```

`passed = (coverageRatio === 1.0) && (faultsMissed.length === 0)`

### 4.4 Durum Yönetimi (Zustand Store)

`gameStore.ts` iki katman saklar:

**Kalıcı (localStorage):**
- `completedCases` — tamamlanan vaka ID'leri
- `collectedLawCards` — kazanılan law card ID'leri
- `unlockedAchievements` — açılan başarım ID'leri

**Oturum (sıfırlanır):**
- `screen` — aktif ekran
- `phase` — aktif faz
- `caseFile` — yüklü vaka
- `truthTable` — üretilmiş truth table
- `submission` — oyuncunun pair seçimleri
- `verdict` — son hesaplanan verdict
- `mcdc` — UI namespace (selectedRows, independencePairs, verdictResult)

### 4.5 Cevap Değerlendirme (`evaluateAnswer`)

Her `question_type` için ayrı doğrulama mantığı:
- `binary_verdict` / `level_picker` → `options[].is_correct` alanı
- `coverage_table` → Tüm `required: true` satırları seçilmeli, ekstra izinli
- `test_designer` → Tam olarak `required_pick_count` satır seçilmeli ve hepsi `required: true` olmalı
- `numeric_input` → `numeric_prompts[].answer` ile tam eşleşme

---

## 5. Kampanya İlerlemesi

### Kilit Açma Mekanizması

`CASE_ORDER` dizisindeki indeksler temel alınır. Bir vaka, önceki vakası (`CASE_ORDER[idx - 1]`) `completedCases` içindeyse açılır. İlk vaka (`idx === 0`) her zaman açıktır. Perde geçişleri doğal olarak bu mekanizmadan çıkar.

### Başarımlar

Dört başarım tanımlıdır:

| ID | Başlık | Gereksinim |
|---|---|---|
| `ach-act-1` | Foundations Forged | ACT I'in tüm vakaları |
| `ach-act-2` | Decisive Reasoning | ACT II'nin tüm vakaları |
| `ach-act-3` | Combinatorial Insight | ACT III'ün tüm vakaları |
| `ach-act-4` | Independence Proven | ACT IV'ün tüm vakaları |

Başarımlar, `unlockedAchievementIds(completedCases)` saf fonksiyonuyla hesaplanır. Yeni açılan başarım `newlyUnlockedAchievement` state alanında saklanır ve debrief ekranında banner olarak gösterilir.

### Law Cards (Hukuk Kartları)

Her tamamlanan vakaya karşılık bir Law Card eklenir. Card'lar `lawCards.json` içinde saklanır ve ISO klozunu, kısa tanımı, uzun açıklamayı ve yaygın tuzağı içerir. Law Library ekranında tüm kartlar görüntülenebilir.

---

## 6. Ekranlar

| Ekran | Bileşen | Açıklama |
|---|---|---|
| `menu` | `MainMenuScreen.tsx` | Ana menü |
| `how-to-play` | `HowToPlayScreen.tsx` | Oynanış rehberi |
| `campaign` | `CampaignMapScreen.tsx` | Kampanya haritası, perde/vaka seçimi |
| `briefing` | `BriefingScreen.tsx` | Faz 1: Dava dosyası, diyalog |
| `investigation` | `InvestigationScreen.tsx` | Faz 2: Soru/model inşası |
| `evidence` | `EvidenceScreen.tsx` | Faz 3: Bağımsızlık çifti seçimi |
| `trial` | `TrialScreen.tsx` | Faz 4: Test submission, verdict |
| `debrief` | `DebriefScreen.tsx` | Faz 5: Analiz, geri bildirim |
| `achievements` | `AchievementsScreen.tsx` | Başarım duvarı |
| `law-library` | `LawLibraryScreen.tsx` | ISO klozu referans kartları |
| `design-system` | `DesignSystemScreen.tsx` | Tasarım sistemi gösterimi (iç) |

---

## 7. Görsel Tasarım

### Estetik: Retro Sketchbook

İki görsel register kasıtlı olarak bir arada kullanılır:

- **Elle çizilmiş, monokrom line-art** — Rough.js ile çizilen titrek kenarlar, defter kağıdı dokusu, karalama karakterler. Mesaj: "Bu ciddi bir öğrenme içeriği."
- **Kalın piksel sanat chrome** — Düğmeler, score chip'ler, coverage meter'lar. Mesaj: "Hatalar ucuz, tekrar dene."

### Renk Paleti

| Rol | Hex | Kullanım |
|---|---|---|
| Cream paper | `#F5F0E1` | Sayfa arka planı |
| Notebook ink | `#1A1A1A` | Çizgi, metin |
| Pixel green | `#34A853` | Onay, fault detected, verdict-pass |
| Pixel magenta | `#C13584` | Misconception, retry, hata |
| Pixel orange | `#F26B1F` | Bilgi chip'leri, senaryo etiketleri |
| Pixel blue | `#2C6FBB` | Navigasyon, birincil CTA |
| Grid line | `#E5DFCE` | Kağıt karesi arka plan ızgarası |
| Grey | `#8A8474` | İkincil metinler |

### Yazı Tipleri

| Aile | Kullanım |
|---|---|
| `Press Start 2P` (piksel) | Düğmeler, badge'ler, skor göstergesi, bölüm başlıkları |
| `Special Elite` (el yazısı) | Gövde metni, anlatı, diyalog |
| `JetBrains Mono` (monospace) | Kaynak kod, ISO klozu alıntıları, teknik değerler |

Bu üç aile hiçbir zaman aynı cümlede karışmaz.

### Karakterler

| Karakter | Kullanım |
|---|---|
| **Judge** (Hakim) | Briefing diyalogu, debrief verdict paneli |
| **Prosecutor** (Savcı) | Briefing diyalogu |
| **Defense** (Savunma) | Senaryo bağlamında referans |
| **Bug** (Sanık) | Briefing'de sinirli sanık, campaign map'te perde ikonu |

Bug'ın dört tipi vardır: `combinatorial`, `bcc`, `mcdc`, `dataflow`. Her perde kendi bug arketipini kullanır.

### UI Bileşenleri

| Bileşen | Dosya | Açıklama |
|---|---|---|
| `PixelButton` | `ui/PixelButton.tsx` | 4 variant: primary, secondary, danger, success |
| `ScoreChip` | `ui/ScoreChip.tsx` | Etiket + değer chip'i |
| `CoverageMeter` | `ui/CoverageMeter.tsx` | Adımlı dolum barı (8–10 adım) |
| `DialogBox` | `ui/DialogBox.tsx` | Typewriter animasyonlu konuşma kutusu |
| `GraphPaperBg` | `ui/GraphPaperBg.tsx` | Kağıt karesi arka plan |
| `CharacterSprites` | `ui/CharacterSprites.tsx` | Judge, Prosecutor, Defense, Bug SVG'leri |
| `Badge` | `ui/Badge.tsx` | Başarım rozeti |

---

## 8. Teknik Mimari

### Tech Stack

| Katman | Tercih |
|---|---|
| Dil | TypeScript (strict) |
| Framework | React 19 |
| Build | Vite |
| State | Zustand + persist middleware |
| Stil | Tailwind CSS |
| Schema doğrulama | Zod |
| El çizimi grafikler | Rough.js |
| Testler | Vitest |
| Lint / Format | ESLint + Prettier |
| Kalıcılık | localStorage (Zustand persist) |
| Deploy | Statik (Vercel / Netlify / GitHub Pages) |

### Klasör Yapısı

```
app/src/
├── engine/               # React'a bağımlı olmayan TypeScript — oyun mantığı çekirdeği
│   ├── coverage/         # Teknik başına coverage validator
│   ├── faults/           # Deterministik fault simülatörü
│   ├── misconceptions/   # Misconception detector fonksiyonları
│   ├── verdict/          # Verdict hesaplama
│   ├── caseLoader.ts     # Zod-doğrulamalı JSON vaka yükleyici
│   └── types.ts          # Paylaşılan tip tanımları
├── content/
│   ├── cases/            # JSON vaka dosyaları (1 dosya = 1 level)
│   ├── achievements.json # Başarım tanımları
│   ├── achievements.ts   # Başarım mantığı
│   ├── caseOrder.ts      # Kampanya sırası ve kilit açma mantığı
│   ├── lawCards.json     # Law card içerikleri
│   └── lawCards.ts       # Vaka → law card eşlemesi
├── screens/              # React ekran bileşenleri
├── stores/               # Zustand game state
└── ui/                   # Yeniden kullanılabilir tasarım sistemi bileşenleri
```

---

## 9. Öğrenme Hedefleri

Oyunu tamamlayan bir öğrenci:

1. Dört kombinatoryal alt tekniği (All Combinations, Pair-wise, Each Choice, Base Choice) test sayısı öngörüsüyle birbirinden ayırt edebilir.
2. BCC ile MCDC'yi `2^N` vs `N+1` test sayılarını türeterek ve her birinin ne zaman gerektiğini açıklayarak birbirinden ayırt eder.
3. MCDC bağımsızlık kriterini, tam olarak bir koşulun değiştiği ve karar sonucunun değiştiği çiftler oluşturarak uygular.
4. Bir test suite'in neden başarısız olduğunu (TD1 → TD2 → TD3 sürecinin hangi adımında hata yapıldığını) tanılar.
5. Yanlış bir test kararını mahkeme metaforu üzerinden somut geri bildirimle düzeltir.

---

## 10. Mevcut Durum ve Yol Haritası

### Tamamlananlar

- [x] 12 oynanabilir vaka (4 akt)
- [x] 5 farklı soru etkileşim tipi
- [x] Achievement sistemi (kalıcı)
- [x] Law Library (ISO klozu referans kartları)
- [x] Debrief ekranı — coverage istatistikleri, fault analizi, misconception log
- [x] Kampanya haritası — sıralı kilit açma sistemi
- [x] localStorage kalıcılığı (Zustand persist)
- [x] Retro Sketchbook tasarım sistemi

### Planlanan

- [ ] Data Flow perdesi (def-use graf editörü)
- [ ] Yerel çok oyunculu mod (Mock Trial)
- [ ] Misconception geçmişine dayalı adaptif zorluk
- [ ] Annotation'lı replay
- [ ] Sınıf Modu (WebSocket / P2P)

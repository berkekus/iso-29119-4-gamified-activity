# HCI Review — Test Courthouse

> Yöntem: Kod tabanı analizi (5 ekran + design tokens + case JSON'ları)
> Standart: ISO 13407 · Alan Dix Learnability / Flexibility / Robustness · WCAG 2.1 AA
> Hedef kullanıcı: Senior lisans öğrencisi, SENG 436, Sufficient bilgisayar becerisi
> Birincil görev akışı: CampaignMap → Briefing → Investigation → Trial → Debrief

---

## 1. Bağlam

Test Courthouse, ISO/IEC/IEEE 29119-4 test tasarım tekniklerini mahkeme metaforu ile öğreten 12-case'lik bir eğitim oyunudur. Kullanıcı aynı anda hem öğrenci hem oyuncu rolündedir; bu çift kimlik her ekranın bilişsel yükünü artırır. Değerlendirme, öğrencinin ilk oturumda (daha önce uygulamayı hiç görmeden) 5-aşamalı akışı tamamlamasını baz almaktadır.

---

## 2. Kullanıcı Modeli

| Boyut | Kısıt |
|-------|-------|
| Bilişsel | ISO terminolojisi (MCDC, BCC) ve oyun metaforu aynı anda işleniyor — ikili yük |
| Algısal | Pixel fontlar dekoratif/içerik ayrımını zorlaştırıyor; küçük boyutlarda (<10px) foveal okuma güç |
| Ergonomik | Web uygulaması, masaüstü; kaydırma beklentisi yok ama bazı ekranlar dikey uzun |
| Motivasyonel | "Mistrial" → retry zorunluluğu hayal kırıklığı yaratabilir; ilerleme hissi kritik |

---

## 3. Alan Dix Sezgisel İnceleme

### Learnability
- **Predictability:** CampaignMapScreen'de act kartları tıklanabilir ancak bunu gösteren hiçbir affordance yok (ok/chevron yok). Kullanıcı act'in tıklanabileceğini denemeden bilemez.
- **Familiarity:** "GUILTY / MISTRIAL" ikilisi öğrenciye yabancı. "PASS / FAIL" yerine bu seçimin öğrenimi destekleyip desteklemediği sorgulanabilir; ilk oturumda anlam kurulması geç olabilir.
- **Consistency:** Üç farklı font (Press Start 2P / Special Elite / JetBrains Mono) tutarlı rol ayrımı yapıyor — başlıklar/yönergeler/kod — ancak 9px pixel fontta iki farklı renk kullanımı (`TC.grey` bilgi, `TC.magenta` vurgu) tutarsızca karışıyor.

### Flexibility
- **Dialog initiative:** Tüm ekranlar sıralı-geçişlidir; kullanıcı istediği phase'e atlayamaz. Hatalı bir adımı fark eden kullanıcı geri dönemez (sadece "← BRIEFING" var, genel navigasyon yok).
- **Task migratability:** Oyun ortasında ayrılıp kaldığı yerden devam etme mekanizması belirsiz (Zustand store persist mi ediyor, tarayıcı kapanınca kayıt gidiyor mu — UX'te bilgi yok).

### Robustness
- **Recoverability:** TrialScreen `presenting→deliberating` geçişi 2500ms auto-advance ile gerçekleşiyor, kullanıcı kontrolü yok. Hata yapan oyuncu geri alınamaz bir geçişle ilerliyor.
- **Responsiveness:** InvestigationScreen doğru cevap sonrası feedback 900ms gösteriyor, ardından otomatik navigasyon. Öğrenci mesajı okuyamadan ekran değişiyor.
- **Observability:** InvestigationScreen'de `caseFile?.hints?.[0]` sabit gösteriliyor — 3 seviyeli hint zinciri olmasına rağmen kullanıcı sadece hint[0]'ı görebiliyor.

---

## 4. Bulgular Tablosu

| # | Bulgu | Ekran | Etki | Önerilen Aksiyon | Referans |
|---|-------|-------|------|------------------|----------|
| F1 | **Hint zincirinin 2. ve 3. adımları erişilemez** — `hints[0]` sabit render ediliyor, hint[1]/hint[2] asla gösterilmiyor | InvestigationScreen:215 | Critical | "HINT 1 / 2 / 3" progressif butonları ekle; her tıklamada sonraki seviye açılsın | Alan Dix — Observability |
| F2 | **Doğru cevap geri bildirimi 900ms'de kayboluyor** — kullanıcı okuyamadan Trial'a geçiş oluyor | InvestigationScreen:69 | Critical | Geçişi kullanıcı tetiklesin (onay butonu); auto-advance kaldırılsın | Alan Dix — Recoverability |
| F3 | **MISTRIAL'da "NEXT CASE" devre dışı ama neden devre dışı olduğu açıklanmıyor** — `disabled={!canAdvance}` görsel geri bildirim yok | DebriefScreen:218 | High | Button yanına "Pass to unlock →" gibi kısa inline açıklama ekle | Nielsen H1 — Visibility of system status |
| F4 | **CampaignMapScreen act kartları tıklanabilir ancak affordance yok** — genişle/daralt davranışı tahmin edilemiyor | CampaignMapScreen:148 | High | Sağ köşeye ▶/▼ chevron ekle; hover'da border değişsin | Alan Dix — Predictability |
| F5 | **InvestigationScreen truth table kolonları "A, B, C" — case'in gerçek koşul isimleri kullanılmıyor** — öğrenci kodu ile tabloyu manuel eşleştirmek zorunda | InvestigationScreen:260–264 | High | `conditions[i].label` değerlerini kolon başlığı olarak kullan | ISO 13407 — Kullanıcı görev desteği |
| F6 | **Pixel font 7–9px boyutlarında WCAG AA kontrast testi başarısız** — `TC.grey` (#8A8474) üzerinde `TC.cream` (#F5F0E1): oran ≈ 3.1 (AA için ≥4.5 gerekli normal text) | tokens.ts + tüm ekranlar | High | Etiket metinleri ≥12px'e çıkar veya `TC.ink` kullan; 7px pixel font bilgi taşımamalı | WCAG 2.1 AA — §1.4.3 |
| F7 | **BriefingScreen EST. TIME sabit "8–12 MIN"** — `caseFile.estimated_time_sec` (60–240 arası) kullanılmıyor | BriefingScreen:240 | Medium | `Math.ceil(estimated_time_sec / 60)` ile dinamik dakika göster |  Alan Dix — Synthesizability |
| F8 | **Test set girişleri `JSON.stringify` ile ham gösteriliyor** — `inputs = {"name":"World"}` formatı öğrenciye yabancı | InvestigationScreen:151 | Medium | `name = "World"` formatında key=value çift render et |  Alan Dix — Familiarity |
| F9 | **Kilitli case'lerde açıklama sadece HTML `title` attribute ile mevcut** — hover ile görünür, touch cihazlarda erişilemez | CampaignMapScreen:184 | Medium | Kilitli butona "Complete «Önceki Case» to unlock" inline satır ekle | Alan Dix — Learnability |
| F10 | **MULTIPLAYER menü seçeneği uygulanmamış ekrana yönlendiriyor** — MainMenuScreen'de görünüyor, tıklayınca boş veya hata ekranı | MainMenuScreen:13 | Medium | Seçeneği "COMING SOON" rozetiyle deaktif et veya menüden geçici olarak kaldır | Nielsen H5 — Error prevention |
| F11 | **TrialScreen 2500ms auto-presenting → deliberating geçişinde geri alma yolu yok** | TrialScreen:40–41 | Medium | Geçişi kullanıcı kontrolüne bırak ("SUBMIT EVIDENCE →" butonu); sadece animasyon için auto-advance kullan | Alan Dix — Recoverability |
| F12 | **Dark mode desteği yok** — tüm renkler light-mode-only; öğrenciler genellikle dark tema kullanıyor | tokens.ts | Low | `prefers-color-scheme: dark` media query ile dark token seti ekle; en az cream↔dark-bg, ink↔off-white |  Erişilebilirlik |

---

## 5. Olumlu Noktalar

1. **Üç seviyeli zorluk göstergesi (difficulty dots)** CampaignMapScreen'de her case'in önünde tutarlı, anlık beklenti yönetimi sağlıyor.
2. **"WHAT THE TEXTBOOK SAYS" paneli** DebriefScreen'de teknik tanımı oyunun duygusal dilinden ayırıyor — öğrencinin sonucu standardla ilişkilendirmesi için iyi bir pedagojik tasarım.
3. **MISTRIAL ceza vermeden retry** — `markCaseCompleted` sadece doğru sonuçta çağrılıyor; hatalı deneme kayıt etmiyor. Bu "güvenli deneme" ortamı yaratıyor ve öğrenme için kritik.
4. **ACT renk kodlaması** dört act'te tutarlı biçimde uygulanıyor; kullanıcı hangi teknikte çalıştığını her ekranda renk ipucuyla takip edebiliyor.
5. **LAW REFERENCE açılır paneli** BriefingScreen'de ISO maddelerini doğrudan oyun ekranında sunuyor — öğrencinin sekme değiştirmesini önlüyor.

---

## 6. Sonraki Adım Önerileri

- **Kritik önce:** F1 (hint zinciri) ve F2 (auto-advance) doğrudan öğrenme çıktısını etkiliyor — usability testinden önce düzeltilmesi önerilen.
- **Detaylı kural denetimi:** `/sevgi-ai:heuristic-eval` ile her ekran için Nielsen 10 heuristic puanlaması.
- **Kontrast denetimi:** `/sevgi-ai:color-audit` ile tüm renk çiftleri WCAG 2.1 AA'ya karşı otomatik kontrol.
- **Test:** `USABILITY_PLAN_TestCourthouse.md` protokolündeki T2 (Briefing) ve T3 (Investigation) görevleri F1–F5 bulgularını doğrulayacak kritik görevler.

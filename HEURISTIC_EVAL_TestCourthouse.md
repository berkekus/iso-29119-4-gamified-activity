# Heuristic Evaluation — Test Courthouse
**Proje:** ISO/IEC/IEEE 29119-4 Gamified Activity (Test Courthouse)  
**Tarih:** 2026-05-10  
**Değerlendirici:** SevgiAI / sevgi-ai:heuristic-eval  
**Kapsam:** Tüm ekranlar — MainMenu, CampaignMap, Briefing, Investigation, Evidence, Trial, Debrief, HowToPlay, LawLibrary, Achievements  
**Yöntem:** Nielsen 10 Heuristic + Alan Dix Prensipleri + WCAG 2.1 AA eşikleri  
**Severity Skalası:** Nielsen 0–4 (0-1 Cosmetic · 2 Minor · 3 Major · 4 Catastrophic)

---

## Severity Özeti

```
Catastrophic (4): 1
Major       (3): 10
Minor       (2): 12
Cosmetic  (0-1):  2
─────────────────
TOPLAM       : 25
```

---

## Bulgu Tablosu

| # | Heuristic | Bulgu | Konum (dosya/ekran) | Severity | Önerilen Düzeltme | Kanıt |
|---|-----------|-------|---------------------|----------|-------------------|-------|
| H01 | **H1: Visibility of System Status** | Oyun kaydetme/yükleme sessiz gerçekleşiyor; localStorage'a yazılırken kullanıcıya hiçbir geri bildirim verilmiyor. Kullanıcı, progress'inin kaydedilip kaydedilmediğini bilemez. | `App.tsx`, tüm ekranlar | 1 | Header veya footer'a "İlerleme kaydedildi ✓" gibi kısa bir toast bildirimi ekle (auto-dismiss, 2 s). | Nielsen H1 |
| H02 | **H1: Visibility of System Status** | `TrialScreen` deliberating aşamasında yalnızca sonsuz "..." animasyonu gösteriliyor; ne kadar süreceği belli değil. | [TrialScreen.tsx:99-111](app/src/screens/TrialScreen.tsx#L99-L111) | 2 | Countdown veya deterministik ilerleme çubuğu ekle ("Simüle ediliyor… 2 sn"). `setTimeout` 2000 ms sabit değeri zaten belli. | Nielsen H1 |
| H03 | **H1: Visibility of System Status** | `DialogBox` metin yazılırken NEXT butonu görünmüyor; kullanıcı ~2-3 saniye boyunca bir şey yapılabileceğini bilmiyor (wait-state açıklanmıyor). | [DialogBox.tsx:67-78](app/src/ui/DialogBox.tsx#L67-L78) | 2 | Metin yazılırken "SKIP ▶" butonu göster ve tıklayınca tam metni anında ortaya çıkar. | Nielsen H1 · Alan Dix Observability |
| H04 | **H2: Match Between System and Real World** | "MISTRIAL" terimi hukuki anlamda yanlış bir metafor: gerçekte yargıç usul hatası yüzünden verilen bu karar, oyunda "eksik coverage → yanlış cevap" anlamında kullanılıyor. ISO 29119 öğrencisi için kafa karıştırıcı. | [TrialScreen.tsx:125](app/src/screens/TrialScreen.tsx#L125), [DebriefScreen.tsx:136](app/src/screens/DebriefScreen.tsx#L136) | 2 | "MISTRIAL" → "COVERAGE INSUFFICIENT" veya "CASE DISMISSED" olarak değiştir. Alternatif: tooltip ile kısa açıklama ekle. | Nielsen H2 |
| H05 | **H2: Match Between System and Real World** | `EvidenceScreen`'de karar ifadesi (`A && (B || C)`) hiçbir yerde gösterilmiyor. Kullanıcı önceki ekranda gördüğü ifadeyi hatırlayarak bağımsızlık çiftlerini kurmak zorunda. | [EvidenceScreen.tsx:104-115](app/src/screens/EvidenceScreen.tsx#L104-L115) | 3 | Tablonun üstüne `InvestigationScreen`'deki gibi bir "code reminder" satırı (`decision_expression`) ekle. | Nielsen H2 · Alan Dix Recoverability |
| H06 | **H3: User Control and Freedom** | `EvidenceScreen` CLEAR butonu tüm çiftleri tek seferde, onay kutusu olmadan siliyor. Yanlış tıklamada tüm çalışma kayboluyor. | [EvidenceScreen.tsx:204](app/src/screens/EvidenceScreen.tsx#L204) | 3 | Butona tıklayınca "Tüm çiftler silinsin mi?" onay modalı veya en az "UNDO LAST" seçeneği ekle. | Nielsen H3 |
| H07 | **H3: User Control and Freedom** | `BriefingScreen`'e geri dönüldüğünde dialog index'i sıfırlanıyor; kullanıcı 3 dialog'u baştan dinlemek zorunda. | [BriefingScreen.tsx:56](app/src/screens/BriefingScreen.tsx#L56) | 2 | Zaten son dialog'a ulaşıldıysa `dialogIdx` başlangıç değeri olarak `dialogs.length - 1` kullan; veya "Skip dialogs" butonu ekle. | Nielsen H3 |
| H08 | **H4: Consistency and Standards** | `InvestigationScreen` (pair_selector dalı) header'ında yalnızca `← BRIEFING` butonu var; CAMPAIGN ve ⌂ MENU butonları yok. Aynı ekranın non-pair_selector dalı ve diğer tüm ekranlar 3 buton gösteriyor. | [InvestigationScreen.tsx:257-263](app/src/screens/InvestigationScreen.tsx#L257-L263) | 3 | pair_selector dalının header'ına da `CAMPAIGN` ve `⌂ MENU` butonları ekle; non-pair_selector dalıyla tutarlı hale getir. | Nielsen H4 |
| H09 | **H4: Consistency and Standards** | `TrialScreen`'de teknik etiketi (`BCC`, `MC/DC`) ve "PHASE 4: TRIAL" chip'i ikisi de `TC.magenta` rengiyle gösteriliyor. Diğer ekranlarda faz rengi unique (Investigation=orange, Evidence=green). Renk kodlaması tutarsız. | [TrialScreen.tsx:70-71](app/src/screens/TrialScreen.tsx#L70-L71) | 2 | Faz chip'inin rengini diğer ekranların renk hiyerarşisiyle uyumlu yap (örn. Trial için farklı renk, teknik chip'i her zaman `TC.magenta` kalabilir). | Nielsen H4 |
| H10 | **H5: Error Prevention** | `EvidenceScreen` SUBMIT EVIDENCE butonu `pairs.length >= 1` koşulunda aktif oluyor, ancak UI "Need: 3" diyor. Kullanıcı 1 veya 2 çiftle Trial'a geçip kesin MISTRIAL alabiliyor. | [EvidenceScreen.tsx:207-213](app/src/screens/EvidenceScreen.tsx#L207-L213) | 3 | `disabled={pairs.length < 3}` olarak değiştir. Yetersiz çiftle ilerlemek anlamlı bir öğrenme deneyimi sunmuyor. | Nielsen H5 |
| H11 | **H5: Error Prevention** | `CampaignMapScreen`'de kilitli vaka tıklandığında `if (isLocked) return` ile sessizce yoksayılıyor. `title` tooltip'i yalnızca hover'da görünüyor, mobilde/dokunmatik ekranda hiç görünmüyor. | [CampaignMapScreen.tsx:178-180](app/src/screens/CampaignMapScreen.tsx#L178-L180) | 2 | Kilitli vakaya tıklandığında kısa inline feedback göster (örn. "Bu vakayı açmak için önce '{prevName}' vakasını tamamla"). | Nielsen H5 |
| H12 | **H5: Error Prevention** | CLEAR butonu onaysız çalışıyor (bkz. H06), ama ek olarak buton `pairs.length > 0` kontrolüyle gösteriliyor; "Pairs: 3 / Need: 3" counter'ın yanında yakın konumda olduğundan yanlış tıklanma riski yüksek. | [EvidenceScreen.tsx:203-204](app/src/screens/EvidenceScreen.tsx#L203-L204) | 2 | Butonu Evidence Log panelinin içine taşı, action butonlarından uzaklaştır. | Nielsen H5 |
| H13 | **H6: Recognition Rather Than Recall** | `EvidenceScreen`'de karar ifadesi gösterilmiyor (ayrıca H05). Investigation→Evidence geçişinde kullanıcının `A && (B || C)` ifadesini hafızasında tutması gerekiyor. | [EvidenceScreen.tsx](app/src/screens/EvidenceScreen.tsx) | 3 | Tablonun üstüne `caseFile.scenario.decision_expression` satırını göster (kod bloğu olarak). | Nielsen H6 · Alan Dix Observability |
| H14 | **H6: Recognition Rather Than Recall** | 5 aşamalı oyun akışında mevcut faz chip'i (`PHASE N: ...`) yalnızca sağ üstte küçük gösteriliyor; önceki fazları gösteren breadcrumb veya lineer ilerleme çubuğu yok. | Tüm gameplay ekranları | 2 | Her ekranın header'ına `1 → 2 → 3 → 4 → 5` formatında minimal faz breadcrumb'ı ekle (tamamlananlar renk değişir). | Nielsen H6 |
| H15 | **H7: Flexibility and Efficiency of Use** | Tüm tablo etkileşimleri (InvestigationScreen satır seçimi, EvidenceScreen çift oluşturma) yalnızca fare tıklamasıyla çalışıyor; klavye navigasyonu yok. | [InvestigationScreen.tsx:296-330](app/src/screens/InvestigationScreen.tsx#L296-L330), [EvidenceScreen.tsx:126-170](app/src/screens/EvidenceScreen.tsx#L126-L170) | 2 | Tablo satırlarına `onKeyDown` (Space/Enter) ve `tabIndex` ekle. WCAG 2.1 SC 2.1.1 (Keyboard) gereği. | Nielsen H7 · WCAG 2.1 SC 2.1.1 |
| H16 | **H7: Flexibility and Efficiency of Use** | Gameplay boyunca (Investigation, Evidence, Trial) HowToPlay ve LawLibrary'ye erişim yok. MainMenu veya CampaignMap'e dönmek gerekiyor; bu da ekran durumunu bozuyor. | [InvestigationScreen.tsx](app/src/screens/InvestigationScreen.tsx), [EvidenceScreen.tsx](app/src/screens/EvidenceScreen.tsx), [TrialScreen.tsx](app/src/screens/TrialScreen.tsx) | 3 | Aktif gameplay ekranlarının side panel veya header'ına `[?] HELP` ve `[LAW]` butonu ekle (modal overlay olarak aç, ekrandan çıkmadan). | Nielsen H7 |
| H17 | **H8: Aesthetic and Minimalist Design** | `MainMenuScreen`'deki "QUICK START → ACT III" `PixelButton`, 2×2 menü grid'inin dışında, footer'ın altında konumlandırılmış. Yeni kullanıcı için amaçsız görünüyor; sınav/geliştirici kısayolu olduğu belli değil. | [MainMenuScreen.tsx:106-109](app/src/screens/MainMenuScreen.tsx#L106-L109) | 2 | Bu buton için bir "DEV MODE" etiketi veya geliştirme ortamında gösterilme koşulu ekle (`import.meta.env.DEV`). | Nielsen H8 |
| H18 | **H8: Aesthetic and Minimalist Design** | `TrialScreen` verdict aşamasında faz indikatörü (PRESENTING · DELIBERATING · VERDICT) tüm pill'leri göstermeye devam ediyor. PRESENTING ve DELIBERATING pilleri görsel gürültü katıyor. | [TrialScreen.tsx:99-111](app/src/screens/TrialScreen.tsx#L99-L111) | 1 | Verdict aşamasında faz indikatörünü gizle veya yalnızca "VERDICT" pill'ini göster. | Nielsen H8 |
| H19 | **H9: Help Recognize, Diagnose, and Recover from Errors** | `EvidenceScreen` çift reddi mesajı "Invalid independence pair. Check: does exactly one condition change?" diyor ancak hangi koşulun (A, B veya C) neden başarısız olduğunu göstermiyor. | [EvidenceScreen.tsx:76-80](app/src/screens/EvidenceScreen.tsx#L76-L80) | 2 | Hata mesajını veri bazlı yap: "Rows 3 & 5: B değişiyor ama D de değişmiyor. Karar outcome'unun flip olması gerekiyor." | Nielsen H9 |
| H20 | **H9: Help Recognize, Diagnose, and Recover from Errors** | `InvestigationScreen` validasyon hatası "N+1 = 4 test cases" ile minimum koşulu açıklıyor ancak tabloda hangi satırların bu koşulu karşılayabileceğini vurgulamıyor. | [InvestigationScreen.tsx:86-93](app/src/screens/InvestigationScreen.tsx#L86-L93) | 2 | Validasyon başarısız olduğunda, D sonucu farklı olan satır çiftlerini sarı rengiyle önemsiz vurgula. | Nielsen H9 |
| H21 | **H10: Help and Documentation** | HowToPlayScreen yalnızca MainMenuScreen'den erişilebilir. Aktif gameplay ekranlarından (Briefing'den Debrief'e kadar) erişim yolu yok. | [MainMenuScreen.tsx:12-16](app/src/screens/MainMenuScreen.tsx#L12-L16) | 3 | Her ekranın header'ına `[?]` ikon butonu ekle; tıklandığında HowToPlayScreen'i overlay olarak aç veya mevcut ekrana ilgili fazın açıklamasını mini-panel olarak göster. | Nielsen H10 |
| H22 | **H10: Help and Documentation** | `LawLibraryScreen` yalnızca CampaignMapScreen ve DebriefScreen'den erişilebilir. Investigation/Evidence/Trial sırasında — kullanıcının coverage kriterini en çok ihtiyaç duyduğu anda — erişim yok. BriefingScreen'de yalnızca `lawCard` varsa LAW REFERENCE toggle'ı gösteriyor. | [BriefingScreen.tsx:164-199](app/src/screens/BriefingScreen.tsx#L164-L199), [InvestigationScreen.tsx](app/src/screens/InvestigationScreen.tsx) | 3 | Investigation ve Evidence side panel'ına "LAW CARD" shortcut ekle (case file'dan ilgili law card'ı inline göster). | Nielsen H10 |
| H23 | **WCAG 2.1 SC 1.4.3 — Contrast (Minimum)** | `TC.grey` (#8A8474) rengi `TC.cream` (#F5F0E1) üzerinde kullanılıyor → kontrast oranı ≈ **2.88:1**, WCAG AA minimum 4.5:1 gereksinimini karşılamıyor. Etkilenen alanlar: MainMenuScreen menü item açıklamaları (fontSize 17, Special Elite), CampaignMapScreen clause etiketleri, DebriefScreen "grey" label'lar. | [tokens.ts](app/src/ui/tokens.ts), tüm ekranlar | 4 | `TC.grey` → `#5A5448` (kontrast ≈ 5.2:1, AA pass) veya önemli metin için `TC.ink` kullan. Renk paleti değişikliği tüm stillere uygulanmalı. **WCAG 2.1 SC 1.4.3** |
| H24 | **WCAG 2.1 SC 4.1.2 — Name, Role, Value** | `HowToPlayScreen` step-dot butonları (`<button>`) metin içeriği ya da `aria-label` barındırmıyor. Ekran okuyucu kullanıcıları için bu butonların amacı tamamen belirsiz. | [HowToPlayScreen.tsx:122-137](app/src/screens/HowToPlayScreen.tsx#L122-L137) | 3 | Her dot butonuna `aria-label={Phase ${i + 1}: ${s.title}}` ekle. **WCAG 2.1 SC 4.1.2** |
| H25 | **WCAG 2.1 SC 1.4.4 — Resize Text + Alan Dix Learnability** | `fontSize: 7` (px) kullanımı: MainMenuScreen'de "COMING SOON", CampaignMapScreen'de "★ FINAL BOSS" ve önkoşul etiketleri. 7px ekrandaki nokta boyutunda; standart görüntüleme mesafesinde okunaksız. | [MainMenuScreen.tsx:92](app/src/screens/MainMenuScreen.tsx#L92), [CampaignMapScreen.tsx:219](app/src/screens/CampaignMapScreen.tsx#L219), [CampaignMapScreen.tsx:229](app/src/screens/CampaignMapScreen.tsx#L229) | 3 | Minimum font boyutunu `fontSize: 9` (veya 10) olarak güncelle. COMING SOON etiketi için badge şeklinde `padding` ile daha küçük görünüm sağlanabilir. **WCAG 2.1 SC 1.4.4** |

---

## Heuristic Tarama Özeti

| Heuristic | Bulunan İhlal Sayısı | Durum |
|-----------|---------------------|-------|
| H1: Visibility of System Status | 3 | İncelendi |
| H2: Match Real World | 2 | İncelendi |
| H3: User Control and Freedom | 2 | İncelendi |
| H4: Consistency and Standards | 2 | İncelendi |
| H5: Error Prevention | 3 | İncelendi |
| H6: Recognition Rather Than Recall | 2 | İncelendi |
| H7: Flexibility and Efficiency | 2 | İncelendi |
| H8: Aesthetic and Minimalist Design | 2 | İncelendi |
| H9: Help Recognize/Diagnose Errors | 2 | İncelendi |
| H10: Help and Documentation | 2 | İncelendi |
| WCAG + Alan Dix | 3 | İncelendi |
| **TOPLAM** | **25** | **✓ ≥15** |

---

## Severity Dağılımı (Görsel)

```
Catastrophic (4) ████  1 bulgu  → TC.grey kontrast WCAG failure
Major       (3)  ████████████████████  10 bulgu → H05, H06, H08, H10, H13, H16, H21, H22, H24, H25
Minor       (2)  ████████████████████████  12 bulgu → H02–H04, H07, H09, H11–H12, H14–H15, H17, H19–H20
Cosmetic  (0-1)  ████  2 bulgu  → H01, H18
```

---

## En Kritik 2 Bulgu (Severity ≥ 3 → Katastrofik + En Yüksek Kullanım Engeli)

### 1. Catastrophic — H23: Kontrast Başarısızlığı (WCAG 2.1 SC 1.4.3)
`TC.grey` (#8A8474) → `TC.cream` (#F5F0E1) üzerinde 2.88:1 kontrast. Tüm açıklama metinleri, alt başlıklar ve label'lar etkileniyor. Görme güçlüğü olan kullanıcılar için içerik erişilemez.  
**Acil Düzeltme:** `tokens.ts`'de `grey: '#5A5448'` olarak güncelle.

### 2. Major — H08: InvestigationScreen (pair_selector) Eksik Header Navigasyonu
Oyunun en uzun oturumu (MC/DC truth table) sırasında kullanıcı CAMPAIGN ve MENU'ye erişemiyor; tek kaçış yolu `← BRIEFING`. Bu özellikle yanlış yönlenmiş kullanıcı için ciddi kısıtlama.  
**Acil Düzeltme:** `InvestigationScreen.tsx:257-263` pair_selector dalına aynı üç buton setini ekle.

---

## Sonraki Adımlar

- `/sevgi-ai:usability-eval-plan` → Gerçek kullanıcılarla protokol tasarla (severity 3-4 bulgular için)
- `/sevgi-ai:color-audit` → TC.grey başta olmak üzere tam palet kontrast analizi
- `/sevgi-ai:wcag-checklist` → SC 2.1.1 keyboard, SC 1.3.1 info structure kontrolleri

---

*Input: 11 ekran TSX + tokens.ts + index.css + DialogBox/PixelButton bileşenleri + HCI_REVIEW referansları.*

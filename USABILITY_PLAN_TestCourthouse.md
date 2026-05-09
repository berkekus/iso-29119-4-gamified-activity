# Usability Evaluation Plan — Test Courthouse

> Proje: Test Courthouse (ISO/IEC/IEEE 29119-4 Gamified Activity)
> Ders: SENG 436
> Ortam: Doğal ortam (öğrenci masası)
> Zaman: Dönem sonu teslim öncesi
> Yöntem temeli: SENG 477 Usability Evaluation — 4–6. hafta protokolü

---

## 1. Test Hedefleri

1. Oyuncunun **BriefingScreen**'deki dava dosyasını (senaryo + suçlamalar) anlayıp anlamadığını ölçmek.
2. **InvestigationScreen**'de hangi soru tipinin (binary_verdict, level_picker, coverage_table vb.) daha fazla tereddüt yarattığını tespit etmek.
3. **CampaignMapScreen** üzerinden ilerleyen case navigasyonunun sezgisel olup olmadığını doğrulamak.
4. **DebriefScreen** geri bildiriminin öğrencinin yanlış anlamasını fark etmesine yeterince yardımcı olup olmadığını anlamak.
5. Genel bilişsel yükü ölçmek: oyuncu kaç kere yönlendirme arar, hangi adımda duraksıyor?

---

## 2. Yöntem Seçimi

**Ana yöntem: Görev odaklı User Test** (think-aloud protokolü ile)

Doğal ortam (öğrenci masası) tercih edildiğinden moderatör yerinde değil; katılımcı kendi bilgisayarında oturur, moderatör mümkünse aynı odada gözlemler ya da ekran kaydı alınır.

**Tamamlayıcı yöntem: Post-test Questionnaire** — Görev bittikten hemen sonra standart 13 soruluk form uygulanır.

**Pilot test:** 1 kişiyle tam protokol rehearsal (bkz. §8).

> **Lab vs. Doğal Ortam Notu:** Doğal ortam gerçek kullanım bağlamını yansıtır (öğrenci kendi makinesinde, tanıdık browser) ancak dikkat dağıtıcılar (bildirimler, arkadaş geçişi) kontrol edilemez. Bu riski azaltmak için katılımcıdan telefonu sessize alması ve tarayıcı sekmeleri kapatması istenir.

---

## 3. Görev Senaryoları

Görevler **ipucu vermeyen** formatta yazılmıştır — tıklanacak buton veya kavram ismi telaffuz edilmez.

| # | Görev | Başarı kriteri |
|---|-------|----------------|
| T1 | "Uygulamayı açın ve ilk davayı bulun." | CampaignMapScreen'den case seçilebiliyor |
| T2 | "Dava hakkında bilgi edinin ve devam edin." | BriefingScreen'i okuyup Investigation'a geçiyor |
| T3 | "Davayla ilgili soruları yanıtlayın." | InvestigationScreen'de doğru/yanlış seçim yapıyor |
| T4 | "Kararınızı bildirin ve sonucu görün." | TrialScreen → DebriefScreen'e ulaşıyor |
| T5 | "İkinci davaya geçin." | Campaign haritasına dönüp bir sonraki case'i açıyor |

---

## 4. Demografik Bilgi Formu

*(Hocanın slaytındaki 5 soru — değiştirilmeden)*

| # | Soru | Seçenekler |
|---|------|------------|
| D1 | Eğitim seviyeniz nedir? | Lisans 1/2/3/4. Yıl · Yüksek Lisans · Diğer |
| D2 | Yaşınız? | Açık uçlu |
| D3 | Bilgisayar kullanım seviyeniz? | Insufficient · Partial · Sufficient |
| D4 | İnternet kullanım seviyeniz? | Insufficient · Partial · Sufficient |
| D5 | Bu uygulamayı daha önce hiç kullandınız mı? | Yes · No |

---

## 5. Pre-test Soruları

Görev başlamadan önce katılımcıya sorulur; görev metninin anlaşılıp anlaşılmadığını kontrol eder.

1. Şimdi size bir web uygulaması göstereceğim. Başlamadan önce açık olmayan bir şey var mı?
2. "Dava dosyası" ifadesinden ne anlıyorsunuz?
3. Başarılı ya da başarısız olmanızın bir önemi yok; yalnızca sistemi değerlendiriyoruz — bunu aklınızda tutun.

---

## 6. Post-test Anketi

*(Hocanın 13 soruluk formu — birebir; 1 = Çok Zor / Çok Kötü, 3 = Kolay / İyi)*

| # | Soru |
|---|------|
| Q1 | İhtiyaç duyduğunuz bilgiyi ne kadar kolay buldunuz? |
| Q2 | Yardım / dokümantasyon yeterli miydi? |
| Q3 | Uygulamanın görsel tasarımını nasıl değerlendirirsiniz? |
| Q4 | Kullanılan dil (terimler, açıklamalar) ne kadar anlaşılırdı? |
| Q5 | Uygulamanın hızını nasıl değerlendirirsiniz? |
| Q6 | Uygulamayı öğrenmek ne kadar kolaydı? |
| Q7 | Bir sonraki oturumda uygulamayı kullanmayı ne kadar kolay hatırlarsınız? |
| Q8 | Sistem hataları önlemenize ne kadar yardımcı oldu? |
| Q9 | Kullanım sırasında kendinizi kaybolmuş hissettiniz mi? |
| Q10 | Bilgi mesajları (yönlendirmeler, ipuçları) yeterince açık mıydı? |
| Q11 | Hata mesajları ne kadar açıklayıcıydı? |
| Q12 | Hangi görev sizi en çok zorladı? Neden? |
| Q13 | Eksik ya da yanlış bulduğunuz bir şey var mı? |

---

## 7. Test Ortamı Kontrol Listesi

| Unsur | Durum |
|-------|-------|
| Cihaz | Katılımcının kendi bilgisayarı (doğal ortam) |
| Tarayıcı | Chrome / Firefox / Edge — güncel sürüm |
| İnternet | Stabil bağlantı; uygulama statik bundle olduğu için offline da çalışır |
| Ekran kaydı | OBS veya tarayıcı yerleşik kaydedici (izin alınacak) |
| Telefon | Sessize alınacak |
| Sekme | Diğer sekmeler kapatılacak |
| Aydınlatma / gürültü | Katılımcının alıştığı ortam — moderatör müdahale etmez |
| Görev kağıdı | Yazılı görev kartları hazırlanır; tek tek verilir |

---

## 8. Pilot Test

Pilot test, asıl testten en az 2 gün önce **1 katılımcı** ile tam protokol olarak yürütülür.

**Kontrol listesi:**

- [ ] Pre-test soruları katılımcıya anlaşılır geliyor mu?
- [ ] Görev metinleri ipucu vermiyor mu?
- [ ] Sistemin açılması ve ilk case'e ulaşma süresi kaç dakika?
- [ ] Ekran kaydı teknik engel çıkarıyor mu?
- [ ] Post-test anketi tamamlanma süresi ≤ 5 dakika mı?
- [ ] Herhangi bir görev açıklaması revize edilmeli mi?

Pilot test bulgularına göre görev metinleri veya form soruları güncellenir; pilot katılımcı veri analizine dahil **edilmez**.

---

## 9. Katılımcı Profili ve Sayısı

**Sayı: 5 katılımcı**

> Virzi (1990) ve Nielsen (1993): 5 kullanıcı, tek bir kullanıcı grubundaki kullanılabilirlik sorunlarının ~%85'ini ortaya çıkarır.

**Profil:**

| Özellik | Hedef |
|---------|-------|
| Statü | SENG 436 veya eşdeğer yazılım testi dersi alan öğrenciler |
| Deneyim | En az 1 yazılım testi dersi almış olma |
| Oyun deneyimi | Karışık: en az 1 yeni kullanıcı, en az 1 oyun alışkanlığı olan |
| Cinsiyet / yaş | Çeşitlilik gözetilir; zorunlu kota yok |
| Ön kullanım | Uygulamayı daha önce görmemiş kişiler tercih edilir |

---

## 10. Yürütme Adımları

*(Hocanın slaytındaki a–d adımları)*

**a) Tanıtım + Onay**
- Test amacı açıklanır: "Sizin performansınızı değil, sistemin kullanılabilirliğini test ediyoruz."
- Volunteer Participation Form imzalatılır.
- Ekran kaydı için izin alınır.

**b) Demografik Form**
- D1–D5 soruları katılımcı tarafından doldurulur (~2 dk).

**c) Kısa Sistem Tanıtımı**
- "Bu bir web uygulamasıdır. Herhangi bir şeye tıklayabilirsiniz. Takılırsanız sesli düşünün." (max 1 dakika)
- Teknik kılavuz **verilmez**.

**d) Görev Yürütme**
- Görev kartları tek tek verilir.
- Her görev için: başlangıç ve bitiş zamanı not edilir, tamamlama başarısı (✓/✗) işaretlenir, hata sayısı kaydedilir.
- Think-aloud teşvik edilir; moderatör görev sırasında yönlendirme yapmaz.

---

## 11. Metrikler

| Metrik | Tanım | Hedef |
|--------|-------|-------|
| Task Completion Rate | Görevi başarıyla tamamlayan katılımcı % | ≥ %80 her görev için |
| Task Completion Time | Görev başına saniye | T2 (Briefing) ≤ 90 sn |
| Error Count | Katılımcı başına yanlış tıklama / geri dönme sayısı | ≤ 2 T3–T4 için |
| Subjective Satisfaction | Post-test Q1–Q9 ortalama skoru (1–3) | ≥ 2.2 |
| Think-aloud Pauses | Katılımcının 5+ saniye duraksadığı nokta sayısı | Kalitatif analiz |

---

## 12. Çıktı / Raporlama

1. Her katılımcı için görev tablosu (completion rate + süre + hata).
2. Post-test anket ortalama skorları (Q1–Q9).
3. Nitel bulgular: think-aloud'dan öne çıkan 3–5 kritik problem.
4. Öncelik sıralaması: severity × frequency matrisi ile.
5. Aksiyon listesi: gelecek sprint'e girecek iyileştirmeler.

---

## 13. Bilinen Boşluklar

| # | Boşluk | Etki |
|---|--------|------|
| B1 | Doğal ortamda dikkat dağıtıcılar kontrol edilemiyor | Tamamlama süreleri normalize edilmeli |
| B2 | Ekran kaydı izni alınamazsa think-aloud notlaması el ile yapılacak | Gözlemci hatası riski |
| B3 | Katılımcı evreni küçük (5 kişi) — ACT III / IV case'leri test edilemeyebilir | Bulgular ACT I–II için geçerli sayılır |
| B4 | Dil: oyun İngilizce, katılımcılar Türkçe konuşuyor — dil yükü karıştırılabilir | Q4 (dil anlaşılırlığı) ayrıca not edilmeli |

---

*Sonraki adım: Test bulgularından sonra `/sevgi-ai:hci-review` veya `/sevgi-ai:grade-rubric` ile sonuçları değerlendirin.*

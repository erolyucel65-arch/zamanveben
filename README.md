# ZamanVeBen — yayina alma

## GitHub Pages
1. GitHub'da yeni bir repo olustur (ornek: `zamanveben`).
2. Bu klasordeki **tum dosyalari** reponun koküne yükle (index.html en üstte olmali).
3. Repo → Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)` → Save.
4. 1-2 dakika sonra adres hazir: `https://KULLANICIADI.github.io/zamanveben/`

## Telefona uygulama olarak kurmak
- **iPhone (Safari):** adresi ac → Paylas → "Ana Ekrana Ekle".
- **Android (Chrome):** adresi ac → menü → "Uygulamayi yükle".
- **Masaüstü (Chrome/Edge):** adres cubugundaki kurulum simgesi.

Kurulan uygulama ile tarayicidaki sekme **ayni veriyi** kullanir (ayni adres oldugu icin).
Ilk acilistan sonra internet olmadan da calisir; app kodu ve fontlar onbellege alinir.

## Guncelleme
Dosyalari repoda degistirdiginde uygulama bir sonraki acilista yeni surumu ceker.
Buyuk degisikliklerde `sw.js` icindeki `const V = 'zvb-v1'` degerini `zvb-v2` yap — eski onbellek temizlenir.

## Veri
Veriler tarayicinin yerel deposunda tutulur; sunucuya gitmez. Yedek icin Ayarlar → JSON yedek al.
Farkli bir adrese tasindiginda veri tasinmaz, yedekten yükle.

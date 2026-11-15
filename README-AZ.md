# Monopoli · Dörd Ada — kompüter versiyası

2–6 real oyunçu. Yalnız onlayn, klaviatura və siçan üçün hazırlanıb. Bot və eyni cihazdan hamını idarəetmə menyusu yoxdur. Mobil idarə düymələri söndürülüb.

## Başlatmaq
Node.js 22 və ya 24 ilə `npm ci`, sonra `npm start` işlədin. Windows-da BASLAT.cmd də istifadə edilə bilər. Brauzerdə http://localhost:3000 açın. Bu ünvan yalnız server işləyən kompüterə aiddir; internetdən dostların qoşulması üçün ayrıca yerləşdirmə və ya şəbəkə quruluşu lazımdır.

Render: bütün faylları GitHub-a yükləyin. Web Service, Build Command `npm ci`, Start Command `npm start`, Health Check `/healthz`. Yeni `board-engine.cjs` faylı mütləq yerləşdirilməlidir. Dəyişiklikdən sonra yeni otaq yaradın.

## Otaq və qaydalar
- Host başlanğıc pulu, zər vaxtı, mini oyunların aktivliyi, hər neçə zərdən sonra açılması, sıra və mükafatları seçir.
- Qonaq öz rəngini, fiqurunu və üz ifadəsini seçə bilər. Ümumi ayarları yalnız host dəyişir; səs hər cihazda ayrıdır.
- Başlanğıcda hamı zər atır, bərabər atanlar təkrar atır.
- Qəbul olunmuş mübadilə iki tərəfdən birinin növbəsi başlayanda atomik şəkildə icra olunur. Çoxlu mülk, həbs kartı və ya yalnız pul göndərmək mümkündür. Məcburi ödənişdən sonra pul çatmazsa bütün mübadilə ləğv edilir, qismən köçürmə edilmir.
- Müzayidədən çıxan həmin kart üçün qayıda bilməz. Bir iştirakçı qaldıqda alır. Hələ heç bir qiymət verilməyibsə minimum 1$ ilə alır. Son təklifdən sonra 10 saniyə yeni təklif gəlməzsə son təklif verən alır. Ödəniş imkanı yoxdursa mülk satılmır.
- Adaların nəticələrindən hamı basdıqda və ya 10 saniyə bitdikdə avtomatik qayıdılır.

## İdarəetmə
- Lazer: WASD və ya oxlar; Space tullanmaq, basılı saxlamaq süzülmək.
- Lava: WASD və ya oxlar; siçanla nişan, sol düyməni basılı saxlayaraq atəş.
- Top: WASD və ya oxlarla yayınmaq.
- Mayın: WASD və ya oxlar; hər ox üçün bir addım. Yalnız addım və partlayış səsləri var.

## Performans və server
Monopoli əmrləri Node serverində icra olunur; hostun brauzeri hesablamaları aparmır. Mini oyun simulyasiyası da serverdədir. Öz hərəkəti lokal göstərilir və serverlə düzəldilir; can, zərər və nəticə serverdə müəyyən edilir. FPS düşərsə render ölçüsü və hissəcik sayı avtomatik azalır. Səhnə kölgələri saxlanılıb. Ekranda FPS və ping görünür (FPS adalarda). Sıfır ping və bütün kompüterlərdə sabit 60 FPS zəmanəti verilmir.

Bir Node prosesi/instansiya istifadə edin. Otaqlar RAM-da saxlanır, server yenidən başladıqda oyunlar itir. Brauzer qısa ayrılarsa eyni brauzerdən eyni otağa qoşulmaq mümkündür. İnternetdən giriş ayrıca qurulmalıdır; bu paket kompüterinizdə şəbəkə və modem ayarlarını dəyişmir.

## Yoxlama
`npm test`: server qaydaları, real WebSocket müştəriləri, mübadilə, müzayidə, üz seçimi, dörd adanın məntiqi və modulların açılışı. Bu avtomatik yoxlamalar real GPU FPS ölçməsini əvəz etmir.

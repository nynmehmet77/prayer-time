if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = null;
}

const cities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", 
    "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", 
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", 
    "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", 
    "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", 
    "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", 
    "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", 
    "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
];

const citySelect = document.getElementById('city-select');

let lastPlayedMinute = ""; 

let prayerAudioPrefs = {
    Fajr: true,
    Sunrise: false, 
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true
};

document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn.querySelector('i');
    const savedTheme = localStorage.getItem('app-theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('app-theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('app-theme', 'light');
        }
    });

    const savedPrefs = localStorage.getItem('prayerAudioPrefs');
    if (savedPrefs) {
        prayerAudioPrefs = JSON.parse(savedPrefs);
    }
    
    const adhanAudio = document.getElementById('adhan-audio');

    // ZİL BUTONLARI DÖNGÜSÜ BAŞLANGICI
    document.querySelectorAll('.prayer-bell-btn').forEach(btn => {
        const timeKey = btn.getAttribute('data-time');
        const icon = btn.querySelector('i');
        
        if (prayerAudioPrefs[timeKey]) {
            btn.classList.add('active');
            icon.classList.replace('fa-bell-slash', 'fa-bell');
        } else {
            btn.classList.remove('active');
            icon.classList.replace('fa-bell', 'fa-bell-slash');
        }

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (adhanAudio) {
                adhanAudio.play().then(() => { 
                    adhanAudio.pause(); 
                    adhanAudio.currentTime = 0; 
                    
                    // YENİ: Çana basıldığında Chrome'da çıkan o oynatıcıyı anında yok eder
                    let mevcutKaynak = adhanAudio.src;
                    adhanAudio.src = ''; 
                    adhanAudio.src = mevcutKaynak; 
                    if ('mediaSession' in navigator) {
                        navigator.mediaSession.playbackState = 'none';
                    }
                }).catch(() => {});
            }

            prayerAudioPrefs[timeKey] = !prayerAudioPrefs[timeKey];
            localStorage.setItem('prayerAudioPrefs', JSON.stringify(prayerAudioPrefs));

            if (prayerAudioPrefs[timeKey]) {
                btn.classList.add('active');
                icon.classList.replace('fa-bell-slash', 'fa-bell');
            } else {
                btn.classList.remove('active');
                icon.classList.replace('fa-bell', 'fa-bell-slash');
            }
        });
    }); // <-- EKSİK OLAN KAPANIŞ BURASIYDI

    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        if (city === "Yalova") option.selected = true;
        citySelect.appendChild(option);
    });

    setTodayDate();
    setDailyQuote(); 
    getPrayerTimes(citySelect.value);
});

function setTodayDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateHeader = document.getElementById('current-date-header');
    if (dateHeader) dateHeader.textContent = today.toLocaleDateString('tr-TR', options);
}

async function getPrayerTimes(city) {
    const loading = document.getElementById('loading');
    const timesContainer = document.getElementById('times-container');

    if (loading) loading.classList.remove('hidden');
    if (timesContainer) timesContainer.style.opacity = '0.2';

    try {
        const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Turkey&method=13`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.code === 200) {
            const timings = data.data.timings;
            localStorage.setItem(`prayerTimings_${city}`, JSON.stringify(timings));
            updateTimesOnScreen(timings);
        }
    } catch (error) {
        const savedTimings = localStorage.getItem(`prayerTimings_${city}`);
        if (savedTimings) {
            updateTimesOnScreen(JSON.parse(savedTimings));
        } else {
            console.log("Çevrimdışı veri yok.");
        }
    } finally {
        if (loading) loading.classList.add('hidden');
        if (timesContainer) timesContainer.style.opacity = '1';
    }
}

function updateTimesOnScreen(timings) {
    document.getElementById('fajr').textContent = timings.Fajr;
    document.getElementById('sunrise').textContent = timings.Sunrise;
    document.getElementById('dhuhr').textContent = timings.Dhuhr;
    document.getElementById('asr').textContent = timings.Asr;
    document.getElementById('maghrib').textContent = timings.Maghrib;
    document.getElementById('isha').textContent = timings.Isha;
    highlightNextPrayer(timings);
}

citySelect.addEventListener('change', (e) => {
    getPrayerTimes(e.target.value);
});

function highlightNextPrayer(timings) {
    const rows = document.querySelectorAll('.time-row');
    rows.forEach(row => row.classList.remove('active'));

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayerMinutes = {
        fajr: timeToMinutes(timings.Fajr),
        sunrise: timeToMinutes(timings.Sunrise),
        dhuhr: timeToMinutes(timings.Dhuhr),
        asr: timeToMinutes(timings.Asr),
        maghrib: timeToMinutes(timings.Maghrib),
        isha: timeToMinutes(timings.Isha)
    };

    let nextPrayer = null;
    if (currentTime < prayerMinutes.fajr) nextPrayer = 'row-fajr';
    else if (currentTime < prayerMinutes.sunrise) nextPrayer = 'row-sunrise';
    else if (currentTime < prayerMinutes.dhuhr) nextPrayer = 'row-dhuhr';
    else if (currentTime < prayerMinutes.asr) nextPrayer = 'row-asr';
    else if (currentTime < prayerMinutes.maghrib) nextPrayer = 'row-maghrib';
    else if (currentTime < prayerMinutes.isha) nextPrayer = 'row-isha';
    else nextPrayer = 'row-fajr'; 

    if (nextPrayer) {
        const nextElement = document.getElementById(nextPrayer);
        if(nextElement) nextElement.classList.add('active');
    }
}

function timeToMinutes(timeStr) {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// --- ARKA PLAN DÖNGÜSÜ VE EZAN OKUMA ---
setInterval(() => {
    const fajrTime = document.getElementById('fajr').textContent;
    if (fajrTime !== '--:--') {
        const timings = {
            Fajr: fajrTime,
            Sunrise: document.getElementById('sunrise').textContent,
            Dhuhr: document.getElementById('dhuhr').textContent,
            Asr: document.getElementById('asr').textContent,
            Maghrib: document.getElementById('maghrib').textContent,
            Isha: document.getElementById('isha').textContent
        };
        
        const now = new Date();
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        highlightNextPrayer(timings);

        if (lastPlayedMinute !== currentTimeStr) {
            let shouldPlay = false;
            let playedName = "";

            if (currentTimeStr === timings.Fajr && prayerAudioPrefs.Fajr) { shouldPlay = true; playedName = "İmsak"; }
            else if (currentTimeStr === timings.Sunrise && prayerAudioPrefs.Sunrise) { shouldPlay = true; playedName = "Güneş"; }
            else if (currentTimeStr === timings.Dhuhr && prayerAudioPrefs.Dhuhr) { shouldPlay = true; playedName = "Öğle"; }
            else if (currentTimeStr === timings.Asr && prayerAudioPrefs.Asr) { shouldPlay = true; playedName = "İkindi"; }
            else if (currentTimeStr === timings.Maghrib && prayerAudioPrefs.Maghrib) { shouldPlay = true; playedName = "Akşam"; }
            else if (currentTimeStr === timings.Isha && prayerAudioPrefs.Isha) { shouldPlay = true; playedName = "Yatsı"; }

            if (shouldPlay) {
                const adhanAudio = document.getElementById('adhan-audio');
                if(adhanAudio) {
                    adhanAudio.play().catch(() => {});
                    
                    // 20 SANİYE SONRA SESİ OTOMATİK SUSTURUR
                    setTimeout(() => {
                        adhanAudio.pause(); 
                        adhanAudio.currentTime = 0; 

                        let mevcutKaynak = adhanAudio.src;
                        adhanAudio.src = ''; 
                        adhanAudio.src = mevcutKaynak; 

                        if ('mediaSession' in navigator) {
                            navigator.mediaSession.playbackState = 'none';
                        }
                    }, 20000); 
                
                    lastPlayedMinute = currentTimeStr;
                    
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification(`${playedName} Vakti`, { body: "Namaz vakti girdi.", icon: "logo.png" });
                    }
                }
            }
        }
    }
}, 10000);
// --- GÜNÜN SÖZÜ ---
const dailyQuotes = [
"Ameller niyetlere göredir. Herkes sadece niyetinin karşılığını alır. (Buhârî)",
    "İki nimet vardır ki insanların çoğu onun kıymetini bilmezler: Vücut sağlığı ve boş vakit. (Buhârî)",
    "Kolaylaştırınız, güçleştirmeyiniz, müjdeleyiniz, nefret ettirmeyiniz. (Buhârî)",
    "Sizin en hayırlınız, Kur'ân'ı öğrenen ve öğretendir. (Buhârî)",
    "Kim bir Müslümanın dünya sıkıntılarından birini giderirse, Allah da onun ahiret sıkıntısını giderir. (Müslim)",
    "Müslüman, elinden ve dilinden diğer Müslümanların güven içinde olduğu kimsedir. (Buhârî)",
    "Allah'a ve ahiret gününe iman eden kimse, ya hayır söylesin ya da sussun. (Buhârî)",
    "Her iyilik bir sadakadır. (Buhârî)",
    "İnsanlara merhamet etmeyene Allah da merhamet etmez. (Müslim)",
    "Rabbiniz bir, babanız bir, dininiz bir, peygamberiniz birdir. (İbn Hanbel)",
    "Nerede olursan ol Allah’a karşı gelmekten sakın; yaptığın kötülüğün arkasından bir iyilik yap ki onu yok etsin. (Tirmizî)",
    "Kendisi için istediğini kardeşi için de istemedikçe gerçek anlamda iman etmiş olamaz. (Buhârî)",
    "Allah sizin dış görünüşünüze ve mallarınıza bakmaz. O, kalplerinize ve amellerinize bakar. (Müslim)",
    "Kıskançlıktan sakının. Ateşin odunu yaktığı gibi, kıskançlık da iyilikleri yakar. (Ebû Dâvûd)",
    "Gerçek zenginlik, mal çokluğu değil, gönül tokluğudur. (Buhârî)",
    "Mümin, taze ekin gibidir; rüzgar estikçe yatar, rüzgar durunca doğrulur. (Buhârî)",
    "Güçlü kimse güreşte yenen değil, öfke anında kendine hakim olandır. (Buhârî)",
    "Bir insanın gerçek zenginliği, onun bu dünyada yaptığı iyiliklerdir. (Hadis-i Şerif)",
    "Gülümsemek sadakadır. (Tirmizî)",
    "İşçiye ücretini teri kurumadan önce veriniz. (İbn Mâce)",
    "Cennet annelerin ayakları altındadır. (Nesâî)",
    "Küçüklerimize merhamet etmeyen, büyüklerimize saygı göstermeyen bizden değildir. (Tirmizî)",
    "Bir baba, çocuğuna güzel terbiyeden daha iyi bir miras bırakamaz. (Tirmizî)",
    "Allah, kulunun tövbe etmesine, devesini çölde kaybedip bulan kimseden daha çok sevinir. (Müslim)",
    "İman etmedikçe cennete giremezsiniz, birbirinizi sevmedikçe de iman etmiş olamazsınız. (Müslim)",
    "Bir müminin diğer bir mümine üç günden fazla dargın durması helal olmaz. (Buhârî)",
    "Yalanı terk etmeyenin, yemesini içmesini bırakmasına Allah’ın ihtiyacı yoktur. (Buhârî)",
    "İyiliği gizli yapmak, sadakanın en efdalidir. (Taberânî)",
    "Ölümü çokça hatırlayın; çünkü o, lezzetleri acılaştırır. (Tirmizî)",
    "Dualarınızın kabul edileceğine kesin inanarak dua edin. (Tirmizî)",
    "Sizin en hayırlınız, ahlakı en güzel olanınızdır. (Buhârî)",
    "Şüphesiz Allah sabredenlerle beraberdir. (Bakara, 153)",
    "Beni anın ki, ben de sizi anayım. Bana şükredin, nankörlük etmeyin. (Bakara, 152)",
    "Allah hiçbir nefse gücünün yeteceğinden fazlasını yüklemez. (Bakara, 286)",
    "Ey iman edenler! Sabır ve namazla Allah'tan yardım isteyin. (Bakara, 153)",
    "İyilikle kötülük bir olmaz. Sen kötülüğü en güzel olan şeyle sav. (Fussilet, 34)",
    "Kalpler ancak Allah’ı anmakla huzur bulur. (Ra’d, 28)",
    "Kim zerre miktarı hayır yapmışsa onu görür. (Zilzâl, 7)",
    "Kim de zerre miktarı şer işlemişse onu görür. (Zilzâl, 8)",
    "Rabbiniz: 'Bana dua edin, size icabet edeyim' buyurdu. (Mü'min, 60)",
    "Namazı dosdoğru kılın, zekâtı verin. (Bakara, 43)",
    "Şüphesiz ki Allah adaleti, iyiliği, akrabaya yardım etmeyi emreder. (Nahl, 90)",
    "Çirkin işleri, fenalık ve azgınlığı da yasaklar. (Nahl, 90)",
    "Allah, samimiyetle tövbe edenleri sever, temizlenenleri de sever. (Bakara, 222)",
    "Onlar gayba inanırlar, namazı kılarlar, kendilerine verdiğimiz rızıktan infak ederler. (Bakara, 3)",
    "İnsan için ancak çalıştığının karşılığı vardır. (Necm, 39)",
    "Yeryüzünde böbürlenerek yürüme. (İsrâ, 37)",
    "Gevşemeyin, hüzünlenmeyin. Eğer gerçekten iman etmişseniz üstün olan sizsiniz. (Âl-i İmrân, 139)",
    "Allah bize yeter, O ne güzel vekildir. (Âl-i İmrân, 173)",
    "Elbette zorlukla beraber bir kolaylık vardır. (İnşirâh, 5)",
    "Gerçekten, zorlukla beraber bir kolaylık daha vardır. (İnşirâh, 6)",
    "Allah, kendisine ortak koşulmasını bağışlamaz. (Nisâ, 48)",
    "Kullarıma söyle, sözün en güzelini söylesinler. (İsrâ, 53)",
    "Rabbin, sadece kendisine kulluk etmenizi ve anne babaya iyilik yapmanızı emretti. (İsrâ, 23)",
    "Öfkenizi yutun ve insanları affedin. Allah iyilik edenleri sever. (Âl-i İmrân, 134)",
    "Şüphesiz ki namaz, hayasızlıktan ve kötülükten alıkoyar. (Ankebût, 45)",
    "Ey iman edenler! Zannın çoğundan sakının, şüphesiz zannın bir kısmı günahtır. (Hucurât, 12)",
    "Birbirinizin kusurunu araştırmayın, gıybet etmeyin. (Hucurât, 12)",
    "Allah yolunda mallarını harcayanların örneği, yedi başak bitiren bir tane gibidir. (Bakara, 261)",
    "O gün hiçbir malın ve evladın faydası olmaz. (Şuarâ, 88)",
    "Ancak Allah'a temiz bir kalple (kalb-i selim) gelenler kurtulur. (Şuarâ, 89)",
    "Biz insanı en güzel biçimde yarattık. (Tîn, 4)",
    "O hanginizin daha güzel amel yapacağını sınamak için ölümü ve hayatı yaratandır. (Mülk, 2)",
    "Göklerin ve yerin mülkü Allah'ındır. O dilediğini bağışlar. (Âl-i İmrân, 129)",
    "Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru. (Bakara, 201)",
    "Müminler ancak kardeştirler. Öyleyse kardeşlerinizin arasını düzeltin. (Hucurât, 10)",
    "Onlar, inananlar ve kalpleri Allah’ı anmakla huzura kavuşanlardır. (Ra'd, 28)",
    "Sizin yaratılışınızda ve yeryüzüne yaydığı canlılarda kesin inananlar için ibretler vardır. (Câsiye, 4)",
    "Allah'ın rahmetinden ümit kesmeyin. (Zümer, 53)",
    "Sana yakîn (ölüm) gelinceye kadar Rabbine kulluk et. (Hicr, 99)",
    "Onlar, bollukta ve darlıkta Allah için harcarlar. (Âl-i İmrân, 134)",
    "Kim Allah'a dayanıp güvenirse, Allah ona yeter. (Talâk, 3)",
    "Sizi bir çamurdan yaratan, sonra size bir ecel tayin eden O'dur. (En'âm, 2)",
    "Andolsun ki biz Kur'an'ı öğüt alınsın diye kolaylaştırdık. (Kamer, 17)",
    "De ki: 'Hiç bilenlerle bilmeyenler bir olur mu?' (Zümer, 9)",
    "Rabbinin rızasına ermek için sabret. (Müddessir, 7)",
    "Muhakkak ki Allah, çok tövbe edenleri ve çok temizlenenleri sever. (Bakara, 222)",
    "Biz insana anne babasına iyi davranmasını emrettik. (Ankebût, 8)",
    "Her can ölümü tadacaktır. Sonra bize döndürüleceksiniz. (Ankebût, 57)",
    "Sen af yolunu tut, iyiliği emret, cahillerden yüz çevir. (A'râf, 199)",
    "Şükrederseniz elbette size nimetimi artırırım. (İbrahim, 7)",
    "Yalnız sana ibadet ederiz ve yalnız senden yardım dileriz. (Fâtiha, 5)",
    "Bizi doğru yola, kendilerine nimet verdiklerinin yoluna ilet. (Fâtiha, 6-7)",
    "Şüphesiz inananlar, güzel işler yapanlar için Firdevs cennetleri konaktır. (Kehf, 107)",
    "Mallarınız ve çocuklarınız sizin için ancak bir imtihandır. (Tegâbün, 15)",
    "Kim bir cana kıyarsa bütün insanları öldürmüş gibi olur. (Mâide, 32)",
    "Ey iman edenler! Kendiniz, anne babanız ve akrabanız aleyhine de olsa adaleti ayakta tutun. (Nisâ, 135)",
    "Rabbim! İlmimi artır. (Tâhâ, 114)",
    "O (Allah) doğurmamış ve doğurulmamıştır. (İhlâs, 3)",
    "Hiçbir şey O'na denk değildir. (İhlâs, 4)",
    "De ki: O, Allah birdir. (İhlâs, 1)",
    "De ki: 'Hakk geldi, batıl yok oldu.' (İsrâ, 81)",
    "Şüphesiz Rabbinin azabı çok şiddetlidir. (Bürûc, 12)",
    "O, çok bağışlayandır, çok sevendir. (Bürûc, 14)",
    "Rabbini sabah akşam, yüksek olmayan bir sesle, kendi kendine an. Gafillerden olma. (A'râf, 205)",
    "Geceleyin kalkıp Rabbine secde et ve O'nu uzun uzun tesbih et. (İnsân, 26)",
    "Sizi boş yere yarattığımızı ve bize döndürülmeyeceğinizi mi sandınız? (Mü’minûn, 115)",
    "Andolsun ki biz insanı bir imtihandan geçirmek için yarattık. (İnsân, 2)",
    "Göklerde ve yerde ne varsa hepsi Allah'ı tesbih eder. (Cuma, 1)",
    "Rabbinin yüce ismini tesbih et. (A'lâ, 1)",
    "Hiçbir kimse kendi elinin emeğiyle kazandığından daha hayırlı bir yiyecek yememiştir. (Buhârî)",
    "Çocuklarınıza adil davranın. (Müslim)",
    "Bizi aldatan bizden değildir. (Müslim)",
    "Kolaylaştırın, zorlaştırmayın; müjdeleyin, nefret ettirmeyin. (Müslim)",
    "Her kim Allah'a ve ahiret gününe inanıyorsa, komşusuna eziyet etmesin. (Buhârî)",
    "Her kim Allah'a ve ahiret gününe inanıyorsa, misafirine ikram etsin. (Buhârî)",
    "Din nasihattir (samimiyettir). (Müslim)",
    "İki göz vardır ki cehennem ateşi onlara dokunmaz: Allah korkusundan ağlayan göz ve Allah yolunda nöbet bekleyen göz. (Tirmizî)",
    "İşlerin en hayırlısı, az da olsa devamlı olanıdır. (Buhârî)",
    "Dua, ibadetin özüdür. (Tirmizî)",
    "Cennet kılıçların gölgeleri altındadır. (Buhârî)",
    "Temizlik imanın yarısıdır. (Müslim)",
    "Sadaka malı eksiltmez. (Müslim)",
    "Allah, affeden kulunun şerefini artırır. (Müslim)",
    "Kim Allah için tevazu gösterirse, Allah onu yüceltir. (Müslim)",
    "İlim öğrenmek her Müslümana farzdır. (İbn Mâce)",
    "Beşikten mezara kadar ilim öğreniniz. (Hadis-i Şerif)",
    "Allah'ım! Bana öğrettiğin ilim ile beni faydalandır. (Tirmizî)",
    "Merhamet etmeyene merhamet edilmez. (Buhârî)",
    "Yumuşak huydan mahrum olan, iyilikten de mahrum olur. (Müslim)",
    "Bir kötülük gören onu eliyle düzeltsin, gücü yetmezse diliyle, ona da gücü yetmezse kalbiyle buğzetsin. (Müslim)",
    "Utanmak imandandır. (Buhârî)",
    "Pehlivan, öfkelendiği zaman nefsine hakim olandır. (Buhârî)",
    "Allah güzeldir, güzelliği sever. (Müslim)",
    "Kıyamet gününde müminin terazisinde güzel ahlaktan daha ağır bir şey bulunmaz. (Tirmizî)",
    "İnsanı ateşe yüzüstü sürükleyen, ancak dilinin ürettikleridir. (Tirmizî)",
    "Mümin, kınayan, lanet eden, kötü söz söyleyen ve hayasız kimse değildir. (Tirmizî)",
    "Hiçbiriniz, ben tokum diyerek komşusu açken uyumasın. (Beyhakî)",
    "Sabah namazını kılan kimse Allah’ın koruması altındadır. (Müslim)",
    "Söz taşıyanlar cennete giremez. (Müslim)",
    "Zulümden sakının! Çünkü zulüm, kıyamet gününde karanlıklar olacaktır. (Müslim)",
    "Borcunu ödeyebilecek durumda olanın ödemeyi geciktirmesi zulümdür. (Buhârî)",
    "En hayırlınız, ailesine karşı en hayırlı olanınızdır. (Tirmizî)",
    "Müslüman Müslümanın kardeşidir, ona zulmetmez ve onu yalnız bırakmaz. (Buhârî)",
    "Kim bir kötülüğe vesile olursa, onu yapan kadar günah kazanır. (Müslim)",
    "Kim bir iyiliğe vesile olursa, onu yapan kadar sevap kazanır. (Müslim)",
    "Gerçek muhacir, Allah'ın yasakladıklarını terk edendir. (Buhârî)",
    "Akıllı kimse, nefsini hesaba çeken ve ölümden sonrası için çalışandır. (Tirmizî)",
    "Aciz kimse ise nefsinin heveslerine uyan ve Allah'tan iyilik umandır. (Tirmizî)",
    "Helal bellidir, haram da bellidir. İkisinin arasında şüpheli şeyler vardır. (Buhârî)",
    "Cenab-ı Hak sizin kalplerinize bakar, suretlerinize değil. (Müslim)",
    "Şüphesiz rızık da ecel gibi kulu arar. (İbn Hibbân)",
    "Faydasız ilimden Allah'a sığınırım. (Tirmizî)",
    "Doymayan nefisten Allah'a sığınırım. (Tirmizî)",
    "Kabul edilmeyen duadan Allah'a sığınırım. (Tirmizî)",
    "Korkmayan kalpten Allah'a sığınırım. (Tirmizî)",
    "Biriniz ayakta iken öfkelenirse otursun; öfkesi geçmezse yatsın. (Ebû Dâvûd)",
    "Mümin, tek bir delikten iki defa ısırılmaz. (Buhârî)",
    "Selamı aranızda yayınız. (Müslim)",
    "Bir hastayı ziyaret eden kimse, dönünceye kadar cennet bahçesindedir. (Müslim)",
    "Kişi sevdiğiyle beraberdir. (Buhârî)",
    "Şükreden kalp, zikreden dil ve sabreden beden en hayırlı nimetlerdir. (Tirmizî)",
    "Hiç ölmeyecekmiş gibi dünya için, yarın ölecekmiş gibi ahiret için çalış. (Hadis-i Şerif)",
    "Güzel söz sadakadır. (Buhârî)",
    "Adaletsizlik eden bizden değildir. (Hadis-i Şerif)",
    "Ya öğrenen ol, ya öğreten ol, ya dinleyen ol, ya da bunları seven ol. Beşincisi olma, helak olursun. (Dârimî)",
    "Zamanın kıymetini bilmek, aklın alametidir. (Hadis-i Şerif)",
    "Hediyeleşin ki aranızdaki sevgi artsın. (Buhârî)",
    "Rızkın bereketi, yemekten önce ve sonra elleri yıkamaktadır. (Ebû Dâvûd)",
    "Her dinin bir ahlakı vardır; İslam’ın ahlakı da hayâdır. (İbn Mâce)",
    "Allah’a şirk koşmaktan, anne-babaya itaatsizlikten ve yalan şahitlikten sakının. (Buhârî)",
    "Müminler bir binanın tuğlaları gibidir, birbirlerine destek olurlar. (Buhârî)",
    "Yetimi himaye eden kimse ile ben cennette yan yana olacağız. (Buhârî)",
    "Öfke şeytandandır; şeytan ise ateşten yaratılmıştır. Ateş su ile söndürülür, öfkelenince abdest alın. (Ebû Dâvûd)",
    "En faziletli ibadet, vaktinde kılınan namazdır. (Tirmizî)",
    "Misvak kullanmak, ağzı temizler ve Rabb'i hoşnut eder. (Nesâî)",
    "Büyük günahların en büyüğü, Allah’a ortak koşmaktır. (Buhârî)",
    "Sizin en hayırlınız, kadınlarına karşı en iyi davrananınızdır. (Tirmizî)",
    "Şüphe veren şeyi bırak, şüphe vermeyene bak. (Tirmizî)",
    "Kim dünyada bir kulun ayıbını örterse, Allah da kıyamette onun ayıbını örter. (Müslim)",
    "Sadakanın en faziletlisi, su içirmektir. (İbn Mâce)",
    "Kur'an okuyan mümin, kokusu ve tadı güzel olan turunç gibidir. (Buhârî)",
    "Gözlerin zinası harama bakmaktır. (Buhârî)",
    "Gerçek Müslüman, insanların elinden ve dilinden emin olduğu kişidir. (Buhârî)",
    "Sabah duası rızkı bereketlendirir. (Hadis-i Şerif)",
    "İstişare eden pişman olmaz, kanaat eden darda kalmaz. (Taberânî)",
    "Cimrilik ile iman bir kulun kalbinde asla birleşmez. (Nesâî)",
    "Kendi nefsine hakim olan, en güçlü insandır. (Hadis-i Şerif)",
    "Az yiyin, az uyuyun, az konuşun. (Hadis-i Şerif)",
    "Zikrin en faziletlisi 'Lâ ilâhe illallah'tır. (Tirmizî)",
    "Sadaka bela ve musibetleri defeder. (Hadis-i Şerif)",
    "Haset, iyi amelleri ateşin odunu yediği gibi yer bitirir. (İbn Mâce)",
    "Yolculuk bir nevi azaptır, işinizi bitirince ailenize dönmekte acele edin. (Buhârî)",
    "Kim yalan yere yemin ederse, ahirette Allah'ın gazabıyla karşılaşır. (Buhârî)",
    "Ticarette dürüstlük, bereketin anahtarıdır. (Tirmizî)",
    "Ölüm bir köprüdür, dostu dosta kavuşturur. (Hadis-i Şerif)",
    "Allah'a kavuşmayı seveni, Allah da sever. (Buhârî)",
    "Allah, ancak merhametli olan kullarına merhamet eder. (Buhârî)",
    "Çok gülmek kalbi öldürür. (Tirmizî)",
    "Mümin, ne safdil olup aldanır, ne de kurnazlık edip aldatır. (Buhârî)",
    "Hayanın hepsi hayırdır. (Müslim)",
    "Aza şükretmeyen çoğa da şükretmez. (Ebû Dâvûd)",
    "Gıybetten sakının, çünkü gıybet zinadan daha şiddetlidir. (Beyhakî)",
    "Misafiri sevmeyende hayır yoktur. (İbn Hanbel)",
    "Küçük günahlarda ısrar edilirse küçük kalmazlar. (Hadis-i Şerif)",
    "Akrabalık bağlarını kesen cennete giremez. (Buhârî)",
    "Bir kötülük yaptıktan sonra hemen bir iyilik yap ki, onu silip süpürsün. (Tirmizî)",
    "Sabır ilk çarpma anındadır. (Buhârî)",
    "Günde yetmiş defa istiğfar ederim. (Buhârî)",
    "İman iki yarımdır; yarısı sabır, yarısı şükürdür. (Beyhakî)",
    "Bin kere mazlum olsan da, bir kere zalim olma. (Hz. Ali)",
    "Gören göze karanlık perde olamaz, görmek istemeyene ışık ne yapsın? (Hz. Ali)",
    "İlim maldan hayırlıdır; ilim seni korur, sense malı korursun. (Hz. Ali)",
    "Cahil ile sakın şaka etme. Dili zehirli olduğundan gönlünü yaralar. (Hz. Ali)",
    "Kötülük yapanı affetmek, zaferin zekâtıdır. (Hz. Ali)",
    "Güzel ahlak, en güzel dosttur. (Hz. Ali)",
    "Sabır, imanın başıdır. (Hz. Ali)",
    "Şükür, nimeti artırır. (Hz. Ali)",
    "Zenginlik, gurbette bile vatan; fakirlik, vatanda bile gurbettir. (Hz. Ali)",
    "Kalp kör olduktan sonra, gözlerin görmesinde hiçbir fayda yoktur. (Hz. Ali)",
    "Dil bir aslandır, serbest bırakırsan seni parçalar. (Hz. Ali)",
    "İki şeyin elden gitmeden değerini anlamak zordur: Sağlık ve gençlik. (Hz. Ali)",
    "Bir insanı tanımak istiyorsanız, onu makam ve para ile sınayın. (Hz. Ali)",
    "Bana bir harf öğretenin kırk yıl kölesi olurum. (Hz. Ali)",
    "Söz ilaç gibidir; azı yaşatır, çoğu öldürür. (Hz. Ali)",
    "Sırrın senin esirindir; sen onu söylersen, sen onun esiri olursun. (Hz. Ali)",
    "Kibir, insanın en büyük düşmanıdır. (Hz. Ali)",
    "Gerçek dost, senin hatalarını yüzüne söyleyendir. (Hz. Ali)",
    "Ne kadar okursan oku, bilgine yakışır şekilde davranmıyorsan cahilsin. (Hz. Mevlana)",
    "Kusur bulmak için bakma birine, bulmak için bakarsan bulursun. Kusuru örtmeyi marifet edin! (Hz. Mevlana)",
    "Dün zekiydim dünyayı değiştirmek isterdim. Bugün bilgeyim, kendimi değiştiriyorum. (Hz. Mevlana)",
    "Aynı dili konuşanlar değil, aynı duyguyu paylaşanlar anlaşabilir. (Hz. Mevlana)",
    "Yürek yorulunca, ter gözden akar. (Hz. Mevlana)",
    "Ya olduğun gibi görün, ya göründüğün gibi ol. (Hz. Mevlana)",
    "Gülü gül edene secde et. (Hz. Mevlana)",
    "Bozuk olunca maya, ne ar tanır ne de haya. (Hz. Mevlana)",
    "Söz söylemek için önce duymak, dinlemek gerek. (Hz. Mevlana)",
    "İncitme! İncittiğin yerden incinirsin. (Hz. Mevlana)",
    "Sabret ki her şey hissettiğin kadar derin ve temiz olsun. (Hz. Mevlana)",
    "Her şey vaktini bekler. Ne gül vaktinden önce açar, ne de güneş vaktinden erken doğar. (Hz. Mevlana)",
    "Gönlünü yıkayıp arıtmadıktan sonra, habire abdest alıp durmaktan fayda bekleme. (Hz. Mevlana)",
    "Aklın güzelliği dil ile, dilin güzelliği söz ile, kişinin güzelliği yüz ile, yüzün güzelliği göz ile belli olur. (Hz. Mevlana)",
    "Kalp deniz, dil kıyıdır. Denizde ne varsa kıyıya o vurur. (Hz. Mevlana)",
    "Susmak, manâ eksikliğinden değil; belki de manânın derinliğindendir. (Hz. Mevlana)",
    "Üzülme! İstediğin bir şey olmuyorsa, ya daha iyisi olacağı için ya da gerçekten de olmaması gerektiği için olmuyordur. (Hz. Mevlana)",
    "Kapı açılır, sen yeter ki vurmayı bil. (Hz. Mevlana)",
    "Aşk nasip işidir, hesap işi değil. (Hz. Mevlana)",
    "Yaratılanı hoş gör, Yaratan'dan ötürü. (Yunus Emre)",
    "İlim ilim bilmektir, ilim kendin bilmektir. (Yunus Emre)",
    "Sen kendini bilmezsen, ya nice okumaktır. (Yunus Emre)",
    "Sevelim sevilelim, bu dünya kimseye kalmaz. (Yunus Emre)",
    "Söz ola kese savaşı, söz ola kestire başı. (Yunus Emre)",
    "Mal sahibi, mülk sahibi; hani bunun ilk sahibi? (Yunus Emre)",
    "Ben gelmedim dava için, benim işim sevi için. (Yunus Emre)",
    "Gelin tanış olalım, işi kolay kılalım. (Yunus Emre)",
    "Bölüşerek tok oluruz, bölünerek yok oluruz. (Yunus Emre)",
    "Dostun evi gönüllerdir, gönüller yapmaya geldim. (Yunus Emre)",
    "Aşık olamayan gönül misal-i taşa benzer. (Yunus Emre)",
    "Edebim el vermez edepsizlik edene, susmak en güzel cevap edebi elden gidene. (Yunus Emre)",
    "Az söz erin yüküdür, çok söz hayvan yüküdür. (Yunus Emre)",
    "Gönül çalabın tahtı, çalap gönüle baktı; iki cihan bedbahtı, kim gönül yıkar ise. (Yunus Emre)",
    "Ahi evran ahlakı: Elini, dilini, belini bağlı tut. Kapını, kalbini, alnını açık tut. (Hacı Bektaş Veli)",
    "Eline, beline, diline sahip ol. (Hacı Bektaş Veli)",
    "İncinsen de incitme. (Hacı Bektaş Veli)",
    "Marifet ehlinin ilk makamı edeptir. (Hacı Bektaş Veli)",
    "En yüce servet ilimdir. (Hacı Bektaş Veli)",
    "Murada ermek, sabır iledir. (Hacı Bektaş Veli)",
    "Nefsine ağır geleni kimseye tatbik etme. (Hacı Bektaş Veli)",
    "Oturduğun yeri pak et, kazandığın lokmayı hak et. (Hacı Bektaş Veli)",
    "Ara bul, dünyada bırakma ahı. (Hacı Bektaş Veli)",
    "Doğruluk dost kapısıdır. (Hacı Bektaş Veli)",
    "Özünde ve sözünde temiz olmayanların, imanı tam olmaz. (Hacı Bektaş Veli)",
    "Ölümden korkmak, Allah'a güvenmemektir. (Gazali)",
    "Bir kalbiniz vardı, onu hatırlayınız. (Gazali)",
    "Gözü haramdan korumak, en güzel ibadettir. (Gazali)",
    "İnsanın sözü, aklının terazisidir. (Gazali)",
    "Tefekkürsüz ibadette hayır yoktur. (Hz. Ali)",
    "Edep, aklın dışarıdan görünüşüdür. (Hz. Ali)",
    "Her gecenin bir sabahı vardır. Sabret. (İslam Özlü Sözü)",
    "Her şeyin bir zekâtı vardır, bedenin zekâtı da oruçtur. (Hadis-i Şerif)",
    "Allah'ım, fayda vermeyen ilimden sana sığınırım. (Hadis-i Şerif)",
    "Günahtan tam dönen ve tövbe eden, o günahı hiç işlememiş gibidir. (İbn Mâce)",
    "Namaz dinin direğidir. Kim onu terk ederse dinini yıkmış olur. (Beyhakî)",
    "Öyle bir zaman gelecek ki, imanı kalpte tutmak kor ateşi elde tutmaktan zor olacak. (Tirmizî)",
    "Eğer Allah'a hakkıyla tevekkül etseydiniz, sabah aç çıkıp akşam tok dönen kuşlar gibi rızıklanırdınız. (Tirmizî)",
    "Komşusu açken tok yatan bizden değildir. (Hadis-i Şerif)",
    "Yarım hurma ile de olsa kendinizi cehennem ateşinden koruyun. (Buhârî)",
    "Kim Allah için sever, Allah için nefret ederse imanı kemale ermiştir. (Ebû Dâvûd)",
    "İşlenmiş günahları gözden yaş dökerek silin. (Hz. Ali)",
    "İmanın en üstün derecesi, nerede olursan ol Allah'ın seninle beraber olduğunu bilmendir. (Taberânî)",
    "Kim kıldan ince adaleti gözetirse, kılıçtan keskin sıratı kolay geçer. (Söz)",
    "Haklı olduğun zamanlarda bile öfkeni yutabilmek en büyük erdemdir. (Söz)",
    "Sükût, aklın süsü, cehaletin örtüsüdür. (Söz)",
    "Kalbini Allah'a veren, dünyayı ayağının altında bulur. (Söz)",
    "Her yeni gün, tövbe için verilmiş yeni bir fırsattır. (Söz)",
    "Göz nasıl ışıksız göremezse, kalp de imansız huzur bulamaz. (Söz)",
    "Duada acele edilmedikçe, Allah duaya icabet eder. (Hadis-i Şerif)",
    "Kıyamet kopsa da elinizdeki fidanı dikin. (Hadis-i Şerif)",
    "Büyüklenme! Topraktan geldin, toprağa döneceksin. (Hz. Ebu Bekir)",
    "Şükür, nimeti vereni bilmektir. (Hz. Ömer)",
    "En çok korktuğum şey, dindar görünümlü münafıklardır. (Hz. Ömer)",
    "Adalet, mülkün (devletin) temelidir. (Hz. Ömer)",
    "Her günahın bir cezası vardır, ama kul hakkı affedilmez. (Söz)",
    "Tövbelerin en güzeli, bir daha aynı günaha dönmemektir. (Söz)",
    "Zaman kılıçtır, sen onu kesmezsen o seni keser. (İmam Şafii)",
    "İlmi ile amel etmeyen alim, başkalarını giydiren fakat kendisi çıplak olan iğne gibidir. (İmam Gazali)",
    "Dostun sana düşmanlık ederse, onu affet. Zira kin tutmak kalbi yorar. (Söz)",
    "Söz kalpten çıkarsa kalbe ulaşır, dilden çıkarsa kulağı aşamaz. (Arap Atasözü)",
    "Allah’ım! Senden hidayet, takva, iffet ve gönül zenginliği isterim. (Müslim)",
    "Kim kalbinde zerre kadar kibir bulundurursa cennete giremez. (Müslim)",
    "Zulüm, kıyamet gününde zifiri karanlıktır. (Hadis-i Şerif)",
    "Kim kardeşinin ihtiyacını giderirse, Allah da onun ihtiyacını giderir. (Buhârî)",
    "Mümin, müminin aynasıdır. (Ebû Dâvûd)",
    "Rızkı göklerden indirene güven, yerdekilerin sözüne aldanma. (Söz)",
    "Göz yaşarır kalp hüzünlenir, ama biz yalnız Rabbimizin razı olacağı şeyi söyleriz. (Buhârî)",
    "Gündüzün güneşi gecenin karanlığını boğar; imanın nuru da günahın karanlığını boğar. (Söz)",
    "Kendine yapılmasını istemediğin şeyi, başkasına yapma. (Söz)",
    "Allah kulunun tövbesine, annenin evladına kavuşmasından daha çok sevinir. (Söz)",
    "Hiç kimseye hor bakma, incitme gönül yıkma. (Yunus Emre)",
    "Aklın kemali, güzel ahlaktır. (Hz. Muhammed s.a.v)",
    "En büyük cihad, kişinin kendi nefsiyle mücadelesidir. (Hadis-i Şerif)",
    "Sevdiğini ölçülü sev, belki bir gün düşmanın olur. Düşmanına da ölçülü kız, belki bir gün dostun olur. (Hz. Ali)",
    "Allah'a güvendim, O ne güzel vekildir. (Söz)",
    "Yarınlar yorgun insanların değil, rahatından vazgeçenlerin olacaktır. (Hasan el-Benna)"
];

function setDailyQuote() {
    const quoteElement = document.getElementById('daily-quote-text');
    if (quoteElement) {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const diff = today - startOfYear;
        const oneDay = 1000 * 60 * 60 * 24;
        
        const dayOfYear = Math.floor(diff / oneDay);
        const quoteIndex = (dayOfYear - 1) % dailyQuotes.length;
        
        quoteElement.textContent = dailyQuotes[quoteIndex];
    }
}

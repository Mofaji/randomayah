async function getRandomBackground() {
    try {
        const response = await fetch('https://api.unsplash.com/photos/random?query=nature,landscape,mountains&client_id=oZQma7v_znVRCBBdlJt5jwPwuyt2O4DfYHL350hq_rA');
        const data = await response.json();
        return data.urls.regular;
    } catch (error) {
        console.error('Error fetching background:', error);
        return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb';
    }
}

async function getRandomAyat() {
    try {
        // Get random surah (1-114) and ayah (1-286, though actual count varies by surah)
        const surah = Math.floor(Math.random() * 114) + 1;
        const response = await fetch(`https://api.alquran.cloud/v1/surah/${surah}`);
        const data = await response.json();
        
        if (!data.data || !data.data.ayahs || data.data.ayahs.length === 0) {
            throw new Error('Invalid API response');
        }

        const randomAyahIndex = Math.floor(Math.random() * data.data.ayahs.length);
        const ayah = data.data.ayahs[randomAyahIndex];
        
        // Get the translation and transliteration
        const [translationResponse, transliterationResponse] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/en.sahih`),
            fetch(`https://api.alquran.cloud/v1/ayah/${ayah.number}/en.transliteration`)
        ]);
        
        const translationData = await translationResponse.json();        const transliterationData = await transliterationResponse.json();        // Remove Bismillah if present (all variants)
        let arabicText = ayah.text;
        const bismillahVariants = [
            'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            'بِّسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ',
            'بِسْمِ اللَّٰهِ الرَّحْمَٰنِ الرَّحِيمِ',
            'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ',
            'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ'
        ];
        
        bismillahVariants.forEach(variant => {
            arabicText = arabicText.replace(variant, '').trim();
        });

        return {
            arabic: arabicText,
            translation: translationData.data.text,
            info: `Quran ${surah}:${ayah.numberInSurah}`,
            transcription: transliterationData.data.text
        };
    } catch (error) {
        console.error('Error fetching ayat:', error);
        return {
            arabic: 'Error loading verse',
            translation: 'Please try again',
            info: 'Error',
            transcription: 'Error loading verse'
        };
    }
}

async function updateAyat() {
    // Show loading state
    document.getElementById('arabic').textContent = 'Loading...';
    document.getElementById('translation').textContent = 'Loading...';
    document.getElementById('transcription').textContent = 'Loading...';
    document.getElementById('info').textContent = 'Loading...';

    try {
        const [background, ayat] = await Promise.all([
            getRandomBackground(),
            getRandomAyat()
        ]);

        document.body.style.background = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${background}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        
        document.getElementById('arabic').textContent = ayat.arabic;
        document.getElementById('transcription').textContent = ayat.transcription;
        document.getElementById('translation').textContent = ayat.translation;
        document.getElementById('info').textContent = ayat.info;
    } catch (error) {
        console.error('Error updating content:', error);
    }
}

async function downloadImage() {
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.style.display = 'none';

    try {
        // Ensure Arabic font is loaded
        await document.fonts.load('16px "Amiri"');

        const element = document.body;
        const canvas = await html2canvas(element, {
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            width: window.innerWidth,
            height: window.innerHeight,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            onclone: function (clonedDoc) {
                const arabicText = clonedDoc.querySelector('.arabic');
                if (arabicText) {
                    arabicText.style.fontFamily = 'Amiri, serif';
                    arabicText.style.direction = 'rtl';
                    arabicText.style.textAlign = 'center';
                    arabicText.style.letterSpacing = '0'; // Ensure no letter separation
                }
            },
        });

        buttonContainer.style.display = 'flex';

        // Convert to blob for better quality
        canvas.toBlob(
            (blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                link.download = `quran-ayat-${timestamp}.png`;
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            },
            'image/png',
            1.0
        );
    } catch (error) {
        console.error('Error generating image:', error);
        buttonContainer.style.display = 'flex';
    }
}

// Add event listeners
document.getElementById('refresh').addEventListener('click', updateAyat);
document.getElementById('downloadBtn').addEventListener('click', downloadImage);

// Initialize the page
updateAyat();

// Auto refresh every 30 seconds

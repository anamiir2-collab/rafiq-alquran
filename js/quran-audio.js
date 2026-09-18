'use strict';

(function initQuranAudio() {
  const RECITER = 'ar.minshawi';
  const BITRATE = 128;
  const CDN = 'https://cdn.islamic.network/quran/audio';

  const AYAH_COUNTS = [
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
    112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,
    59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,
    52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,
    21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6,3,6,5
  ];

  const OFFSETS = [];
  let total = 0;

  AYAH_COUNTS.forEach(count => {
    OFFSETS.push(total);
    total += count;
  });

  function toLatinDigits(value) {
    return String(value).replace(/[٠-٩]/g, d =>
      '٠١٢٣٤٥٦٧٨٩'.indexOf(d)
    );
  }

  function getGlobalAyah(surah, ayah) {
    if (!surah || !ayah) return null;
    if (!AYAH_COUNTS[surah - 1]) return null;

    return OFFSETS[surah - 1] + ayah;
  }

  let audio = null;
  let activeButton = null;

  function stopAudio() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (activeButton) {
      activeButton.innerHTML = '▶';
      activeButton.classList.remove('playing');
    }

    audio = null;
    activeButton = null;
  }

  function playAyah(surah, ayah, button) {
    const globalAyah = getGlobalAyah(surah, ayah);

    if (!globalAyah) return;

    if (activeButton === button && audio) {
      if (audio.paused) {
        audio.play();
        button.innerHTML = '❚❚';
        button.classList.add('playing');
      } else {
        audio.pause();
        button.innerHTML = '▶';
        button.classList.remove('playing');
      }

      return;
    }

    stopAudio();

    const url =
      `${CDN}/${BITRATE}/${RECITER}/${globalAyah}.mp3`;

    audio = new Audio(url);
    activeButton = button;

    button.innerHTML = '❚❚';
    button.classList.add('playing');

    audio.addEventListener('ended', () => {
      button.innerHTML = '▶';
      button.classList.remove('playing');

      audio = null;
      activeButton = null;
    });

    audio.addEventListener('error', () => {
      stopAudio();

      if (typeof toast === 'function') {
        toast('تعذر تشغيل التلاوة، حاول مرة أخرى', 'error');
      }
    });

    audio.play().catch(() => {
      stopAudio();

      if (typeof toast === 'function') {
        toast('اضغط على زر التشغيل مرة أخرى', 'error');
      }
    });
  }

  function getCurrentSurah() {
    try {
      const day = state?.plan?.days?.[app_dayIdx];
      return Number(day?.surahNumber || 0);
    } catch (e) {
      return 0;
    }
  }

  function addAudioButtons() {
    const surah = getCurrentSurah();

    if (!surah) return;

    document.querySelectorAll(
      '.verse-list .verse-item'
    ).forEach(item => {

      if (item.querySelector('.ayah-audio-btn')) return;

      const numberEl =
        item.querySelector('.verse-num');

      if (!numberEl) return;

      const ayah = Number(
        toLatinDigits(numberEl.textContent.trim())
      );

      if (!ayah) return;

      const button =
        document.createElement('button');

      button.className = 'ayah-audio-btn';
      button.type = 'button';
      button.innerHTML = '▶';

      button.setAttribute(
        'aria-label',
        'تشغيل الآية'
      );

      button.title =
        'استماع بصوت الشيخ محمد صديق المنشاوي';

      button.onclick = function(event) {
        event.stopPropagation();
        playAyah(surah, ayah, button);
      };

      item.insertBefore(
        button,
        item.firstChild
      );
    });
  }

  const style = document.createElement('style');

  style.textContent = `
    .verse-item {
      position: relative;
      padding-left: 50px !important;
    }

    .ayah-audio-btn {
      position: absolute;
      left: 8px;
      top: 50%;
      transform: translateY(-50%);

      width: 34px;
      height: 34px;

      border: 1px solid var(--border);
      border-radius: 50%;

      background: var(--card);
      color: var(--primary);

      display: flex;
      align-items: center;
      justify-content: center;

      cursor: pointer;

      font-size: 12px;
      font-family: Arial, sans-serif;

      transition: .2s ease;

      box-shadow:
        0 2px 6px rgba(0,0,0,.08);

      z-index: 2;
    }

    .ayah-audio-btn:hover,
    .ayah-audio-btn.playing {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
      transform: translateY(-50%) scale(1.06);
    }
  `;

  document.head.appendChild(style);

  const observer =
    new MutationObserver(addAudioButtons);

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  setTimeout(addAudioButtons, 300);

})();

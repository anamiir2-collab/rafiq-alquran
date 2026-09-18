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

  /* =========================
     أيقونة السماعة
  ========================= */

  function speakerIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10v4h4l5 4V6L8 10H4z"></path>
        <path d="M16 9.5c1.1 1.1 1.1 3.9 0 5"></path>
        <path d="M18.5 7c2.8 2.8 2.8 7.2 0 10"></path>
      </svg>
    `;
  }

  /* =========================
     أيقونة الإيقاف المؤقت
  ========================= */

  function pauseIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="5" width="4" height="14" rx="1"></rect>
        <rect x="14" y="5" width="4" height="14" rx="1"></rect>
      </svg>
    `;
  }

  let audio = null;
  let activeButton = null;

  /* =========================
     تغيير حالة زر الصوت
  ========================= */

  function setButtonState(button, playing) {
    if (!button) return;

    button.innerHTML = playing
      ? pauseIcon()
      : speakerIcon();

    button.classList.toggle('playing', playing);

    button.setAttribute(
      'aria-label',
      playing
        ? 'إيقاف مؤقت للتلاوة'
        : 'تشغيل الآية'
    );
  }

  /* =========================
     إيقاف الصوت
  ========================= */

  function stopAudio() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (activeButton) {
      setButtonState(activeButton, false);
    }

    audio = null;
    activeButton = null;
  }

  /* =========================
     تشغيل الآية
  ========================= */

  function playAyah(surah, ayah, button) {
    const globalAyah = getGlobalAyah(
      surah,
      ayah
    );

    if (!globalAyah) return;

    /* لو نفس الآية */
    if (
      activeButton === button &&
      audio
    ) {
      if (audio.paused) {

        audio.play()
          .then(() => {
            setButtonState(button, true);
          })
          .catch(() => {});

      } else {

        audio.pause();

        setButtonState(
          button,
          false
        );
      }

      return;
    }

    /* إيقاف أي آية أخرى */
    stopAudio();

    const url =
      `${CDN}/${BITRATE}/${RECITER}/${globalAyah}.mp3`;

    audio = new Audio(url);

    activeButton = button;

    setButtonState(
      button,
      true
    );

    /* عند انتهاء الآية */
    audio.addEventListener(
      'ended',
      () => {

        setButtonState(
          button,
          false
        );

        audio = null;
        activeButton = null;
      }
    );

    /* في حالة وجود خطأ */
    audio.addEventListener(
      'error',
      () => {

        stopAudio();

        if (typeof toast === 'function') {
          toast(
            'تعذر تشغيل التلاوة، حاول مرة أخرى',
            'error'
          );
        }
      }
    );

    /* تشغيل الصوت */
    audio.play()
      .catch(() => {

        stopAudio();

        if (typeof toast === 'function') {
          toast(
            'اضغط على زر التشغيل مرة أخرى',
            'error'
          );
        }
      });
  }

  /* =========================
     معرفة السورة الحالية
  ========================= */

  function getCurrentSurah() {
    try {

      const day =
        state?.plan?.days?.[app_dayIdx];

      return Number(
        day?.surahNumber || 0
      );

    } catch (e) {

      return 0;
    }
  }

  /* =========================
     إضافة أزرار الصوت
  ========================= */

  function addAudioButtons() {

    const surah =
      getCurrentSurah();

    if (!surah) return;

    document
      .querySelectorAll(
        '.verse-list .verse-item'
      )
      .forEach(item => {

        /* منع تكرار الزر */
        if (
          item.querySelector(
            '.ayah-audio-btn'
          )
        ) {
          return;
        }

        const numberEl =
          item.querySelector(
            '.verse-num'
          );

        if (!numberEl) return;

        const ayah =
          Number(
            toLatinDigits(
              numberEl.textContent.trim()
            )
          );

        if (!ayah) return;

        const button =
          document.createElement(
            'button'
          );

        button.className =
          'ayah-audio-btn';

        button.type =
          'button';

        setButtonState(
          button,
          false
        );

        button.title =
          'استماع بصوت الشيخ محمد صديق المنشاوي';

        button.onclick =
          function(event) {

            event.stopPropagation();

            playAyah(
              surah,
              ayah,
              button
            );
          };

        item.insertBefore(
          button,
          item.firstChild
        );
      });
  }

  /* =========================
     تصميم أزرار الصوت
  ========================= */

  const style =
    document.createElement('style');

  style.textContent = `

    /* مساحة للزر داخل الآية */
    .verse-item {
      position: relative;
      padding-left: 58px !important;
    }

    /* زر الصوت */
    .ayah-audio-btn {
      position: absolute;

      left: 9px;
      top: 50%;

      transform:
        translateY(-50%);

      width: 40px;
      height: 40px;

      padding: 0;

      border:
        1px solid
        rgba(194, 136, 78, .28);

      border-radius: 50%;

      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,.96),
          rgba(245,237,221,.96)
        );

      color:
        var(--primary);

      display: flex;

      align-items: center;
      justify-content: center;

      cursor: pointer;

      -webkit-tap-highlight-color:
        transparent;

      box-shadow:

        0 4px 12px
        rgba(92, 62, 32, .10),

        inset 0 1px 0
        rgba(255,255,255,.8);

      transition:

        transform .25s ease,
        box-shadow .25s ease,
        background .25s ease,
        color .25s ease;

      z-index: 2;
    }

    /* أيقونة السماعة */
    .ayah-audio-btn svg {

      width: 19px;
      height: 19px;

      fill: none;

      stroke:
        currentColor;

      stroke-width: 1.8;

      stroke-linecap: round;

      stroke-linejoin: round;

      transition:
        transform .25s ease;
    }

    /* عند المرور بالماوس */
    .ayah-audio-btn:hover {

      transform:
        translateY(-50%)
        scale(1.08);

      box-shadow:

        0 7px 18px
        rgba(92, 62, 32, .16),

        0 0 0 4px
        rgba(194, 136, 78, .08);
    }

    /* عند الضغط */
    .ayah-audio-btn:active {

      transform:
        translateY(-50%)
        scale(.94);
    }

    /* أثناء التشغيل */
    .ayah-audio-btn.playing {

      background:
        var(--primary);

      color:
        #fff;

      border-color:
        var(--primary);

      box-shadow:

        0 6px 18px
        rgba(92, 62, 32, .22),

        0 0 0 5px
        rgba(194, 136, 78, .12);
    }

    /* حركة أيقونة التشغيل */
    .ayah-audio-btn.playing svg {

      transform:
        scale(.94);
    }

    /* دائرة النبض */
    .ayah-audio-btn.playing::before {

      content: "";

      position: absolute;

      inset: -5px;

      border:
        1px solid
        rgba(194, 136, 78, .42);

      border-radius: 50%;

      animation:
        ayahAudioPulse
        1.5s
        ease-out
        infinite;

      pointer-events: none;
    }

    /* التركيز */
    .ayah-audio-btn:focus-visible {

      outline:
        3px solid
        rgba(194, 136, 78, .25);

      outline-offset:
        3px;
    }

    /* حركة النبض */
    @keyframes ayahAudioPulse {

      0% {

        transform:
          scale(.88);

        opacity: .8;
      }

      70% {

        transform:
          scale(1.28);

        opacity: 0;
      }

      100% {

        transform:
          scale(1.28);

        opacity: 0;
      }
    }

    /* =========================
       الوضع الليلي
    ========================= */

    @media (prefers-color-scheme: dark) {

      .ayah-audio-btn {

        background:
          linear-gradient(
            145deg,
            rgba(55,55,55,.96),
            rgba(38,38,38,.96)
          );

        border-color:
          rgba(255,255,255,.10);

        box-shadow:

          0 4px 12px
          rgba(0,0,0,.25),

          inset 0 1px 0
          rgba(255,255,255,.05);
      }
    }

    /* =========================
       تحسين للموبايل
    ========================= */

    @media (max-width: 480px) {

      .verse-item {

        padding-left:
          54px !important;
      }

      .ayah-audio-btn {

        left: 7px;

        width: 38px;
        height: 38px;
      }

      .ayah-audio-btn svg {

        width: 18px;
        height: 18px;
      }
    }

  `;

  document.head.appendChild(style);

  /* =========================
     مراقبة تغيير الآيات
  ========================= */

  const observer =
    new MutationObserver(
      addAudioButtons
    );

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );

  /* تشغيل أولي */
  setTimeout(
    addAudioButtons,
    300
  );

})();

/* رفيق القرآن - واجهة المستخدم (UI) و دوال العرض والتفاعل */
'use strict';

// ================== ROUTER ==================
function navigate(view, dayIdx) {
  app_view = view;
  if (view === 'day' && dayIdx != null) app_dayIdx = dayIdx;
  app_dayMode = 'overview';
  app_testState = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
}

function setTheme(t) {
  localStorage.setItem(THEME_KEY, t);
  if (t === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
  render();
}

// ================== MAIN RENDER ==================
function render() {
  const app = document.getElementById('app');
  if (!state.user || !state.plan) {
    app.innerHTML = renderOnboarding();
    attachOnboardingEvents();
    return;
  }
  // Auto-redistribute on dashboard view
  if (app_view === 'dashboard') {
    try {
      const today = formatDate(new Date());
      const result = redistributeMissedDays(today);
      if (result && result.daysAffected > 0) {
        addSuggestion({ type: 'rest', message: `فاتك ${result.daysAffected === 1 ? 'يوم' : result.daysAffected + ' أيام'}، أعدنا تنظيم خطة اليوم تلقائيًا حتى تستمر بدون ضغط 🌱`, severity: 'info' });
      }
    } catch (e) { console.warn('redistribute failed', e); }
  }

  let main = '';
  if (app_view === 'dashboard') main = renderDashboard();
  else if (app_view === 'day') main = renderDayDetail();
  else if (app_view === 'test') main = renderTestMode();
  else if (app_view === 'mistakes') main = renderMistakes();
  else if (app_view === 'calendar') main = renderCalendar();
  else if (app_view === 'reports') main = renderReports();
  else if (app_view === 'achievements') main = renderAchievements();

  app.innerHTML = `
    <header class="topbar">
      <div class="container-app">
        <div class="flex items-center gap-2">
          <img class="brand-logo" src="assets/ui-image-1.png" alt="شعار رفيق القرآن">
          <div>
            <div class="font-bold text-sm" style="line-height:1">رفيق القرآن</div>
            <div class="text-xs text-muted" style="margin-top:2px">مساعدك الذكي لحفظ القرآن</div>
            <div class="today-date-box text-xs">
              <span>${formatArabicDateWithDay(formatDate(new Date()))}</span>
              <span>•</span>
              <span class="hijri-date">${formatHijriDate(new Date())}</span>
            </div>
          </div>
        </div>
        <div class="flex gap-1">
          <button class="icon-btn" onclick="toggleTheme()" aria-label="تبديل الوضع">${document.documentElement.classList.contains('dark') ? ICONS.sun : ICONS.moon}</button>
          <button class="icon-btn" onclick="openSettings()" aria-label="الإعدادات">${ICONS.settings}</button>
        </div>
      </div>
    </header>
    <main>${main}</main>
    <nav class="bottomnav">
      <div class="container-app">
        <div class="nav-items">
          ${renderNavBtn('calendar', 'التقويم', ICONS.calendar)}
          ${renderNavBtn('test', 'اختبر حفظي', ICONS.list)}
          ${renderNavBtn('dashboard', 'الرئيسية', ICONS.book)}
          ${renderNavBtn('mistakes', 'أخطائي', ICONS.alert, state.mistakes.filter(m => !m.resolved).length)}
          ${renderNavBtn('reports', 'التقارير', ICONS.chart)}
          ${renderNavBtn('achievements', 'الإنجازات', ICONS.award)}
        </div>
      </div>
    </nav>
    ${app_settingsOpen ? renderSettings() : ''}
  `;
}

function renderNavBtn(view, label, icon, badge) {
  const active = app_view === view ? 'active' : '';
  return `<button class="nav-btn ${active}" onclick="navigate('${view}')">
    ${icon}
    <span class="nav-label">${label}</span>
    ${badge && badge > 0 ? `<span class="nav-badge">${badge > 9 ? '9+' : toAr(badge)}</span>` : ''}
  </button>`;
}

function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  setTheme(isDark ? 'light' : 'dark');
}

function openSettings() { app_settingsOpen = true; render(); }
function closeSettings() { app_settingsOpen = false; render(); }

// ================== ONBOARDING ==================
function renderOnboarding() {
  if (!app_onboardingData) {
    const today = formatDate(new Date());
    app_onboardingData = {
      name: '', level: 'beginner', mode: 'memorize_review',
      preferredMemorizeTime: '06:00', preferredReviewTime: '17:00',
      restDays: [5], notificationsEnabled: true,
      startDate: today, totalDays: 30,
      fromSurah: 78, fromAyah: 1, toSurah: 78, toAyah: 40,
      useAutoAmount: true, manualAmount: 10,
    };
  }
  const d = app_onboardingData;
  const totalAyahs = countAyahsInRange(d.fromSurah, d.fromAyah, d.toSurah, d.toAyah);
  const recommended = recommendDailyAmount(totalAyahs, d.totalDays, d.level, d.mode === 'memorize_review');
  const TOTAL = 6;
  const step = app_onboardingStep;

  return `
    <div class="pattern-bg" style="min-height:100vh;padding:32px 16px">
      <div class="container-app" style="max-width:600px">
        <div class="text-center mb-6">
          <div class="logo-icon" style="width:64px;height:64px;border-radius:16px;margin:0 auto 16px">${ICONS.book}</div>
          <h1 class="text-2xl font-bold mb-2">رفيق القرآن</h1>
          <p class="text-sm text-muted">مساعدك الذكي لحفظ القرآن الكريم ومراجعته</p>
        </div>
        <div class="flex items-center justify-center gap-2 mb-6">
          ${Array.from({length: TOTAL}).map((_, i) => `<div class="${i+1===step?'':i+1<step?'':''}" style="height:8px;border-radius:999px;transition:all 0.3s;${i+1===step?`width:32px;background:var(--primary)`:i+1<step?`width:8px;background:var(--primary);opacity:0.6`:`width:8px;background:var(--muted)`}"></div>`).join('')}
        </div>
        <div class="card">
          <div class="card-pad-lg">
            <span class="badge mb-2">الخطوة ${toAr(step)} من ${toAr(TOTAL)}</span>
            <h2 class="text-xl font-bold mt-2 mb-1">${['','معلوماتك الشخصية','مستواك في الحفظ','خطة الحفظ','السورة أو الجزء','المقدار اليومي','الوقت وأيام الراحة'][step]}</h2>
            <p class="text-sm text-muted mb-4">${['','الاسم الذي سيستخدمه النظام للتحدث معك بشكل شخصي','سيساعدنا هذا على ضبط سرعة الخطة بشكل مناسب لك','كم يومًا تريد أن تنهي خطة الحفظ فيها؟','من أين تبدأ وإلى أين تنتهي؟','مقدار الحفظ اليومي الذي يناسبك','الوقت المفضل للحفظ والمراجعة، وأيام الراحة الأسبوعية'][step]}</p>
            ${step === 1 ? `
              <div class="mb-3">
                <label class="label">الاسم</label>
                <input class="input" style="height:48px;font-size:18px" id="ob-name" value="${esc(d.name)}" placeholder="مثال: أحمد" oninput="updateOnboarding('name', this.value)" />
              </div>
              <div class="bg-muted" style="border-radius:8px;padding:12px;font-size:13px;color:var(--muted-fg)">
                ${ICONS.sparkles} سيستخدم النظام اسمك في رسائله لك، مثل: "أهلًا يا ${esc(d.name) || 'أحمد'} 👋"
              </div>
            ` : ''}

            ${step === 2 ? `
              <div class="mb-4">
                <label class="label">مستواك في الحفظ</label>
                <div class="grid grid-1">
                  ${[{v:'beginner',l:'مبتدئ',d:'بدأت للتو بحفظ القرآن، أحتاج لوتيرة هادئة',i:'🌱'},{v:'intermediate',l:'متوسط',d:'حفظت بعض السور سابقًا، أريد مواصلة الطريق',i:'🌿'},{v:'advanced',l:'متقدم',d:'حفظت أجزاء كبيرة، أريد إنهاء المتبقي',i:'🌳'}].map(o => `
                    <label class="radio-card ${d.level === o.v ? 'checked' : ''}">
                      <input type="radio" name="level" value="${o.v}" ${d.level === o.v ? 'checked' : ''} onchange="updateOnboarding('level', this.value)" />
                      <span style="font-size:24px">${o.i}</span>
                      <div class="flex-1">
                        <div class="font-semibold">${o.l}</div>
                        <div class="text-xs text-muted">${o.d}</div>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div>
                <label class="label">ماذا تريد أن تفعل؟</label>
                <div class="grid grid-1">
                  ${[{v:'memorize_review',l:'حفظ + مراجعة',d:'حفظ جديد كل يوم مع مراجعة منتظمة للمحفوظ السابق',i:'🔄'},{v:'memorize_only',l:'حفظ فقط',d:'تركيز كامل على الحفظ الجديد دون مراجعة منتظمة',i:'📖'}].map(o => `
                    <label class="radio-card ${d.mode === o.v ? 'checked' : ''}">
                      <input type="radio" name="mode" value="${o.v}" ${d.mode === o.v ? 'checked' : ''} onchange="updateOnboarding('mode', this.value)" />
                      <span style="font-size:24px">${o.i}</span>
                      <div class="flex-1">
                        <div class="font-semibold">${o.l}</div>
                        <div class="text-xs text-muted">${o.d}</div>
                      </div>
                    </label>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${step === 3 ? `
              <div class="mb-4">
                <label class="label">تاريخ بداية الخطة</label>
                <input type="date" class="input" style="height:48px" value="${d.startDate}" onchange="updateOnboarding('startDate', this.value)" />
              </div>
              <div class="mb-3">
                <div class="flex justify-between items-center mb-2">
                  <label class="label" style="margin:0">عدد أيام الخطة</label>
                  <span class="badge badge-primary">${toAr(d.totalDays)} يومًا</span>
                </div>
                <input type="range" min="7" max="1825" value="${d.totalDays}" oninput="updateOnboarding('totalDays', +this.value); document.getElementById('ob-days-badge').textContent = toAr(this.value) + ' يومًا'" />
                <div class="flex flex-wrap gap-2 mt-3">
                  ${[
                    {d: 15, l: '١٥ يومًا'}, {d: 30, l: '٣٠ يومًا'}, {d: 60, l: '٦٠ يومًا'},
                    {d: 90, l: '٩٠ يومًا'}, {d: 180, l: '٦ شهر'}, {d: 365, l: 'سنة'},
                    {d: 730, l: 'سنتان'}, {d: 1095, l: '٣ سنوات'},
                    {d: 1460, l: '٤ سنوات'}, {d: 1825, l: '٥ سنوات'},
                  ].map(o => `<button class="btn btn-sm ${d.totalDays === o.d ? 'btn-primary' : 'btn-outline'}" onclick="updateOnboarding('totalDays', ${o.d}); render()">${o.l}</button>`).join('')}
                </div>
              </div>
              ${d.startDate ? `
                <div class="bg-muted" style="border-radius:8px;padding:12px">
                  <div class="flex items-center gap-2 text-muted text-sm">${ICONS.calendar} تاريخ النهاية المتوقع:</div>
                  <div class="font-medium mt-1">${(() => { const dt = new Date(d.startDate + 'T00:00:00'); dt.setDate(dt.getDate() + d.totalDays - 1); return new Intl.DateTimeFormat('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' }).format(dt); })()}</div>
                </div>
              ` : ''}
            ` : ''}

            ${step === 4 ? `
              <div class="grid grid-2 mb-4">
                <div>
                  <label class="label">ابدأ من السورة</label>
                  <select class="select" style="height:48px" onchange="updateOnboarding('fromSurah', +this.value); updateOnboarding('fromAyah', 1)">
                    ${SURAH_META.map(s => `<option value="${s.number}" ${d.fromSurah === s.number ? 'selected' : ''}>${s.number}. ${s.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="label">الآية ${toAr(d.fromAyah)}</label>
                  <input type="range" min="1" max="${getSurahMeta(d.fromSurah)?.ayahCount || 1}" value="${d.fromAyah}" oninput="updateOnboarding('fromAyah', +this.value)" />
                </div>
              </div>
              <div class="grid grid-2 mb-4">
                <div>
                  <label class="label">إلى السورة</label>
                  <select class="select" style="height:48px" onchange="updateOnboarding('toSurah', +this.value)">
                    ${SURAH_META.filter(s => s.number >= d.fromSurah).map(s => `<option value="${s.number}" ${d.toSurah === s.number ? 'selected' : ''}>${s.number}. ${s.name}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="label">الآية ${toAr(d.toAyah)}</label>
                  <input type="range" min="1" max="${getSurahMeta(d.toSurah)?.ayahCount || 1}" value="${d.toAyah}" oninput="updateOnboarding('toAyah', +this.value)" />
                </div>
              </div>
              <div style="background:rgba(22,163,74,0.08);border-radius:8px;padding:12px">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-muted">عدد الآيات الإجمالي للحفظ:</span>
                  <span class="font-bold text-success text-lg">${toAr(totalAyahs)} آية</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-muted">المقدار اليومي الموصى به:</span>
                  <span class="font-semibold">${toAr(recommended)} آية يوميًا</span>
                </div>
              </div>
            ` : ''}

            ${step === 5 ? `
              <div class="flex justify-between items-center mb-4 p-3" style="border:1px solid var(--border);border-radius:8px">
                <div>
                  <div class="font-semibold">تحديد المقدار تلقائيًا</div>
                  <div class="text-xs text-muted mt-1">سنعتمد على مستواك وعدد الأيام لتحديد مقدار مناسب</div>
                </div>
                <button class="icon-btn" onclick="updateOnboarding('useAutoAmount', !app_onboardingData.useAutoAmount); render()" style="background:${d.useAutoAmount?'var(--primary)':'var(--muted)'};color:${d.useAutoAmount?'white':'var(--muted-fg)'};width:48px;height:28px;border-radius:999px;position:relative">
                  <span style="position:absolute;width:20px;height:20px;border-radius:999px;background:white;transition:all 0.2s;${d.useAutoAmount?'transform:translateX(-10px)':'transform:translateX(10px)'}"></span>
                </button>
              </div>
              ${!d.useAutoAmount ? `
                <div class="mb-3">
                  <div class="flex justify-between mb-2">
                    <label class="label" style="margin:0">المقدار اليومي يدويًا</label>
                    <span class="badge">${toAr(d.manualAmount)} آية / يوم</span>
                  </div>
                  <input type="range" min="3" max="50" value="${d.manualAmount}" oninput="updateOnboarding('manualAmount', +this.value); render()" />
                </div>
              ` : `
                <div style="background:rgba(26,107,84,0.05);border:1px solid var(--primary);border-radius:8px;padding:16px">
                  <div class="flex items-center gap-2 text-primary">${ICONS.sparkles}<span class="font-semibold">المقدار المقترح لك</span></div>
                  <div class="text-2xl font-bold mt-2">${toAr(recommended)} آية يوميًا</div>
                  <div class="text-xs text-muted mt-1">بناءً على مستواك (${d.level === 'beginner' ? 'مبتدئ' : d.level === 'intermediate' ? 'متوسط' : 'متقدم'}) وعدد الأيام (${toAr(d.totalDays)}) وعدد الآيات الكلي (${toAr(totalAyahs)})</div>
                </div>
              `}
              <div class="text-xs text-muted bg-muted" style="border-radius:8px;padding:12px;margin-top:16px">💡 يمكنك تعديل هذا لاحقًا من الإعدادات في أي وقت.</div>
            ` : ''}

            ${step === 6 ? `
              <div class="grid grid-2 mb-4">
                <div>
                  <label class="label">${ICONS.clock} الوقت المفضل للحفظ</label>
                  <input type="time" class="input" style="height:48px" value="${d.preferredMemorizeTime}" onchange="updateOnboarding('preferredMemorizeTime', this.value)" />
                </div>
                <div>
                  <label class="label">${ICONS.clock} الوقت المفضل للمراجعة</label>
                  <input type="time" class="input" style="height:48px" value="${d.preferredReviewTime}" onchange="updateOnboarding('preferredReviewTime', this.value)" />
                </div>
              </div>
              <div class="mb-4">
                <label class="label">أيام الراحة الأسبوعية</label>
                <div class="text-xs text-muted mb-2">اختر اليوم أو الأيام التي تريد أن تستريح فيها من الحفظ الجديد</div>
                <div class="grid grid-sm-2" style="grid-template-columns:repeat(7,1fr);gap:6px">
                  ${[{day:6,label:'السبت'},{day:0,label:'الأحد'},{day:1,label:'الإثنين'},{day:2,label:'الثلاثاء'},{day:3,label:'الأربعاء'},{day:4,label:'الخميس'},{day:5,label:'الجمعة'}].map(d2 => `
                    <button onclick="toggleRestDay(${d2.day})" style="padding:8px 4px;border-radius:8px;border:1px solid ${d.restDays.includes(d2.day)?'var(--primary)':'var(--border)'};background:${d.restDays.includes(d2.day)?'var(--primary)':'var(--card)'};color:${d.restDays.includes(d2.day)?'white':'inherit'};font-size:12px;font-weight:600;cursor:pointer">${d2.label}</button>
                  `).join('')}
                </div>
              </div>
              <div class="flex justify-between items-center p-3 mb-4" style="border:1px solid var(--border);border-radius:8px">
                <div class="flex items-center gap-2">
                  <button onclick="updateOnboarding('notificationsEnabled', !app_onboardingData.notificationsEnabled); render()" style="background:${d.notificationsEnabled?'var(--primary)':'var(--muted)'};color:white;width:44px;height:24px;border-radius:999px;position:relative;border:none;cursor:pointer">
                    <span style="position:absolute;width:18px;height:18px;border-radius:999px;background:white;top:3px;${d.notificationsEnabled?'left:3px':'right:3px'};transition:all 0.2s"></span>
                  </button>
                  <div>
                    <div class="text-sm font-semibold">تفعيل التذكيرات</div>
                    <div class="text-xs text-muted mt-1">تنبيهات وقت الحفظ والمراجعة والاختبار</div>
                  </div>
                </div>
              </div>
              <div style="background:rgba(22,163,74,0.1);border:1px solid rgba(22,163,74,0.3);border-radius:8px;padding:16px">
                <div class="flex items-start gap-3">
                  ${ICONS.check}
                  <div class="text-sm">
                    <div class="font-semibold text-success mb-1">كل شيء جاهز!</div>
                    <div class="text-muted text-xs">
                      <div>• ${toAr(d.totalDays)} يومًا، من ${toAr(totalAyahs)} آية</div>
                      <div>• ${toAr(recommended)} آية يوميًا تقريبًا</div>
                      <div>• ${d.restDays.length === 0 ? 'بدون أيام راحة' : toAr(d.restDays.length) + ' يوم راحة أسبوعيًا'}</div>
                      <div>• ${d.mode === 'memorize_review' ? 'حفظ ومراجعة' : 'حفظ فقط'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}

            <div class="flex justify-between items-center pt-4 mt-4 border-t">
              <button class="btn btn-ghost" onclick="prevStep()" ${step === 1 ? 'disabled' : ''}>${ICONS.arrow_right} السابق</button>
              ${step < 6 ? `<button class="btn btn-primary" onclick="nextStep()">التالي ${ICONS.arrow_left}</button>` : `<button class="btn btn-primary" onclick="finishOnboarding()">${ICONS.target} إنشاء الخطة وبدء الحفظ</button>`}
            </div>
          </div>
        </div>
        <p class="text-center text-xs text-muted mt-6">جميع البيانات تُحفظ محليًا على جهازك. لا يتم رفع أي بيانات.</p>
      </div>
    </div>
  `;
}

function attachOnboardingEvents() { /* events are inline */ }

function updateOnboarding(field, value) { if (app_onboardingData) { app_onboardingData[field] = value; } }
function nextStep() { if (app_onboardingStep < 6) { app_onboardingStep++; render(); } }
function prevStep() { if (app_onboardingStep > 1) { app_onboardingStep--; render(); } }
function toggleRestDay(day) {
  const d = app_onboardingData;
  if (d.restDays.includes(day)) d.restDays = d.restDays.filter(x => x !== day);
  else d.restDays = [...d.restDays, day].sort();
  render();
}
function finishOnboarding() {
  const d = app_onboardingData;
  if (!d.name.trim()) { toast('الرجاء إدخال اسم المستخدم', 'error'); app_onboardingStep = 1; render(); return; }
  setUser({
    name: d.name.trim(), level: d.level, mode: d.mode,
    preferredMemorizeTime: d.preferredMemorizeTime, preferredReviewTime: d.preferredReviewTime,
    restDayOfWeek: d.restDays, createdAt: new Date().toISOString(), notificationsEnabled: d.notificationsEnabled,
  });
  createPlan({
    startDate: d.startDate, totalDays: d.totalDays,
    fromSurah: d.fromSurah, fromAyah: d.fromAyah, toSurah: d.toSurah, toAyah: d.toAyah,
    dailyAmount: d.useAutoAmount ? 'auto' : d.manualAmount,
    includeReview: d.mode === 'memorize_review',
  });
  app_onboardingStep = 1; app_onboardingData = null;
  toast(`أهلًا بك يا ${d.name.trim()}! تم إنشاء خطتك بنجاح 🎉`, 'success');
  render();
}

// ================== DASHBOARD ==================
function renderDashboard() {
  const u = state.user; const plan = state.plan;
  const today = formatDate(new Date());
  const stats = calculatePlanStats(plan, today);
  const currentIdx = findCurrentDayIndex(plan, today);
  let activeIdx = currentIdx;
  if (plan.days[currentIdx]?.isRestDay) {
    for (let i = currentIdx + 1; i < plan.days.length; i++) {
      if (!plan.days[i].isRestDay) { activeIdx = i; break; }
    }
  }
  const todayDay = plan.days[currentIdx];
  const activeDay = plan.days[activeIdx];
  const isRest = todayDay?.isRestDay;
  let streak = 0;
  for (let i = currentIdx; i >= 0; i--) {
    const d = plan.days[i];
    if (d.isRestDay) continue;
    if (d.status === 'completed' || d.status === 'completed_needs_review') streak++;
    else if (d.status === 'pending' && i === currentIdx) continue;
    else break;
  }
  const unresolvedMistakes = state.mistakes.filter(m => !m.resolved);
  const overallScore = Math.round((stats.avgMemorizeScore * 0.4 + stats.avgReviewScore * 0.3 + stats.avgTestScore * 0.3) || 0);

  return `
    <div class="container-app py-4" style="padding-bottom:24px">
      <div class="flex items-center justify-between mb-2">
        <h1 class="text-xl font-bold">أهلًا يا ${esc(u.name)} 👋</h1>
        ${streak > 0 ? `<span class="streak-badge">${ICONS.flame} ${toAr(streak)} ${streak === 1 ? 'يوم' : 'أيام متتالية'}</span>` : ''}
      </div>
      <p class="text-sm text-muted mb-4">${isRest ? `يوم راحتك يا ${esc(u.name)} 🌿 استرح وستكون قادرًا على المتابعة غدًا.` : `اليوم هو اليوم ${toAr(stats.currentDay)} من خطتك.`}</p>

      ${(() => {
        const msg = getDailyMessage(new Date());
        return `
          <div class="card daily-message mb-4 fade-in">
            <div class="card-pad" style="position:relative">
              <div class="badge badge-primary mb-2">رسالة اليوم ✨</div>
              <div class="font-bold text-lg mb-1">${msg.title}</div>
              <div class="text-sm text-muted">${msg.text}</div>
            </div>
          </div>
        `;
      })()}

      ${!isRest && activeDay ? `
        <div class="card mb-4 fade-in" style="border-color:var(--primary);background:linear-gradient(135deg, rgba(26,107,84,0.05), var(--card))">
          <div class="card-pad">
            <div class="flex justify-between items-start mb-3">
              <div>
                <span class="badge badge-primary mb-2">مهمة اليوم</span>
                <h3 class="text-lg font-bold flex items-center gap-2">${ICONS.book} ${esc(activeDay.surahName)}</h3>
              </div>
              <div class="text-left">
                <div class="text-xs text-muted">${formatArabicDateWithDay(activeDay.date)}</div>
                <div class="text-xs text-muted mt-1">اليوم ${toAr(activeDay.dayNumber)}</div>
              </div>
            </div>
            <div class="grid grid-2 mb-3">
              <div class="bg-card" style="border:1px solid var(--border);border-radius:8px;padding:12px">
                <div class="text-xs text-muted flex items-center gap-1">${ICONS.book} الحفظ</div>
                <div class="font-semibold mt-1">من الآية ${toAr(activeDay.fromAyah)} إلى الآية ${toAr(activeDay.toAyah)}</div>
                <div class="text-xs text-muted mt-1">${toAr(activeDay.verseCount)} آية</div>
              </div>
              ${activeDay.reviewRange ? `
                <div class="bg-card" style="border:1px solid var(--border);border-radius:8px;padding:12px">
                  <div class="text-xs text-muted flex items-center gap-1">${ICONS.refresh} المراجعة</div>
                  <div class="font-semibold mt-1" style="font-size:13px">${esc(activeDay.reviewRange)}</div>
                </div>
              ` : ''}
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="btn btn-primary flex-1" style="min-width:140px" onclick="navigate('day', ${activeIdx})">${ICONS.book} ابدأ الحفظ</button>
              ${u.mode === 'memorize_review' ? `<button class="btn btn-outline flex-1" style="min-width:140px" onclick="navigate('day', ${activeIdx})">${ICONS.refresh} ابدأ المراجعة</button>` : ''}
              <button class="btn btn-outline flex-1" style="min-width:140px" onclick="navigate('test')">${ICONS.list} اختبر حفظي</button>
              <button class="btn btn-ghost" style="min-width:100px" onclick="navigate('day', ${activeIdx})">${ICONS.target} قيّم يومك</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="card mb-4">
        <div class="card-pad">
          <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.trend} تقدم خطتك</h3>
          ${renderProgressRow('تقدم الخطة', Math.round(((stats.totalDays - stats.daysRemaining) / stats.totalDays) * 100), 'var(--primary)')}
          ${renderProgressRow('الحفظ', stats.memorizationProgress, '#16a34a', `${toAr(stats.memorizedVerses)} / ${toAr(stats.totalVerses)} آية`)}
          ${renderProgressRow('المراجعة', stats.reviewProgress, '#0d9488')}
          <div class="grid grid-3 mt-3 pt-3 border-t">
            <div class="text-center"><div class="text-lg font-bold text-success">${toAr(stats.completedDays)}</div><div class="text-xs text-muted">مكتملة</div></div>
            <div class="text-center"><div class="text-lg font-bold text-primary">${toAr(stats.daysRemaining)}</div><div class="text-xs text-muted">متبقية</div></div>
            <div class="text-center"><div class="text-lg font-bold text-muted">${toAr(stats.restDays)}</div><div class="text-xs text-muted">أيام راحة</div></div>
          </div>
        </div>
      </div>

      <div class="grid grid-4 mb-4">
        ${renderStatCard(ICONS.book, 'الآيات المحفوظة', toAr(stats.memorizedVerses), 'success')}
        ${renderStatCard(ICONS.award, 'السور المكتملة', toAr(stats.completedSurahs), 'warning')}
        ${renderStatCard(ICONS.list, 'الاختبارات', toAr(stats.testCount), 'primary')}
        ${renderStatCard(ICONS.trend, 'نسبة الالتزام', `${toAr(stats.commitmentRate)}%`, stats.commitmentRate >= 70 ? 'success' : stats.commitmentRate >= 50 ? 'warning' : 'danger')}
      </div>

      ${(stats.avgMemorizeScore > 0 || stats.avgReviewScore > 0 || stats.avgTestScore > 0) ? `
        <div class="card mb-4">
          <div class="card-pad">
            <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.sparkles} متوسط تقييماتك</h3>
            ${stats.avgMemorizeScore > 0 ? renderScoreRow('متوسط الحفظ', stats.avgMemorizeScore) : ''}
            ${stats.avgReviewScore > 0 ? renderScoreRow('متوسط المراجعة', stats.avgReviewScore) : ''}
            ${stats.avgTestScore > 0 ? renderScoreRow('متوسط الاختبارات', stats.avgTestScore) : ''}
            <div class="pt-3 mt-3 border-t">
              <div class="flex justify-between mb-2">
                <span class="text-sm font-semibold">التقييم الشامل</span>
                <span class="text-2xl font-bold ${scoreColor(overallScore)}">${toAr(overallScore)}</span>
              </div>
              <div class="progress"><div class="progress-bar" style="width:${overallScore}%"></div></div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="card mb-4" style="background:linear-gradient(135deg, rgba(22,163,74,0.06), var(--card))">
        <div class="card-pad flex justify-between items-center">
          <div>
            <div class="text-sm text-muted mb-1">باقٍ على نهاية خطتك</div>
            <div class="text-2xl font-bold">${formatDuration(stats.daysRemaining)}</div>
          </div>
          <div style="color:var(--primary);opacity:0.4">${ICONS.calendar.replace('class="icon"', 'class="icon" style="width:40px;height:40px"')}</div>
        </div>
      </div>

      ${state.suggestions.length > 0 ? `
        <div class="card mb-4">
          <div class="card-pad">
            <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.sparkles} اقتراحات ذكية</h3>
            ${state.suggestions.slice(0, 3).map(s => `
              <div class="flex items-start gap-3 p-3 mb-2" style="border-radius:8px;border:1px solid ${s.severity === 'warning' ? 'rgba(217,119,6,0.3)' : s.severity === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(26,107,84,0.2)'};background:${s.severity === 'warning' ? 'rgba(217,119,6,0.08)' : s.severity === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(26,107,84,0.05)'}">
                <div class="flex-1 text-sm">${esc(s.message)}</div>
                <button class="btn btn-sm btn-ghost" onclick="clearSuggestion('${s.id}')">حسنًا</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${unresolvedMistakes.length > 0 ? `
        <div class="card mb-4">
          <div class="card-pad">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-base font-bold flex items-center gap-2">${ICONS.alert} آيات تحتاج إلى مراجعة</h3>
              <button class="btn btn-sm btn-ghost" onclick="navigate('mistakes')">عرض الكل ${ICONS.chevron_left}</button>
            </div>
            ${unresolvedMistakes.slice(0, 3).map(m => `
              <div class="flex justify-between items-center p-2 bg-muted" style="border-radius:8px;margin-bottom:8px;font-size:13px">
                <div><span class="font-semibold">${esc(m.surahName)}</span><span class="text-muted mr-2">الآية ${toAr(m.ayah)}</span></div>
                <span class="badge">${toAr(m.errorCount)} ${m.errorCount === 1 ? 'خطأ' : 'أخطاء'}</span>
              </div>
            `).join('')}
            ${unresolvedMistakes.length > 3 ? `<p class="text-xs text-muted text-center mt-2">و${toAr(unresolvedMistakes.length - 3)} آيات أخرى...</p>` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderProgressRow(label, value, color, detail) {
  return `<div style="margin-bottom:12px">
    <div class="flex justify-between text-sm mb-1">
      <span class="text-muted">${label}</span>
      <span class="font-semibold">${toAr(value)}%${detail ? `<span class="text-xs text-muted mr-2">(${detail})</span>` : ''}</span>
    </div>
    <div class="progress"><div class="progress-bar" style="width:${value}%;background:${color}"></div></div>
  </div>`;
}

function renderStatCard(icon, label, value, color) {
  const colors = { success: 'rgba(22,163,74,0.1)', warning: 'rgba(217,119,6,0.1)', primary: 'rgba(26,107,84,0.1)', danger: 'rgba(220,38,38,0.1)' };
  const textColors = { success: 'var(--success)', warning: 'var(--warning)', primary: 'var(--primary)', danger: 'var(--danger)' };
  return `<div class="card"><div class="card-pad" style="padding:12px;display:flex;align-items:center;gap:8px">
    <div style="width:32px;height:32px;border-radius:8px;background:${colors[color]};color:${textColors[color]};display:flex;align-items:center;justify-content:center;flex-shrink:0">${icon}</div>
    <div><div class="text-lg font-bold" style="line-height:1">${value}</div><div class="text-xs text-muted mt-1">${label}</div></div>
  </div></div>`;
}

function renderScoreRow(label, score) {
  return `<div class="flex justify-between items-center mb-2">
    <span class="text-sm text-muted">${label}</span>
    <div class="flex items-center gap-2">
      <div class="progress" style="width:96px"><div class="progress-bar ${score >= 80 ? 'progress-bar-success' : score >= 60 ? 'progress-bar-warning' : 'progress-bar-danger'}" style="width:${score}%"></div></div>
      <span class="text-sm font-bold ${scoreColor(score)}">${toAr(score)} / ${toAr(100)}</span>
    </div>
  </div>`;
}

// ================== DAY DETAIL ==================
function renderDayDetail() {
  const day = state.plan.days[app_dayIdx];
  if (!day) return `<div class="container-app py-8 text-center"><p class="text-muted">لا يوجد بيانات لهذا اليوم</p><button class="btn btn-primary mt-4" onclick="navigate('dashboard')">العودة</button></div>`;
  const status = statusInfo(day.status);

  if (app_dayMode === 'memorize') return renderMemorizeMode(day);
  if (app_dayMode === 'review') return renderReviewMode(day);
  if (app_dayMode === 'evaluate') return renderEvaluateMode(day);

  // Overview
  const verses = [];
  if (!day.isRestDay && day.surahNumber > 0) {
    for (let a = day.fromAyah; a <= day.toAyah; a++) {
      const text = getAyahText(day.surahNumber, a);
      if (text) verses.push({ ayah: a, text });
    }
  }

  return `
    <div class="container-app py-4" style="padding-bottom:24px">
      <button class="flex items-center gap-1 text-sm text-muted hover:font-semibold mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="navigate('dashboard')">${ICONS.arrow_right} رجوع</button>

      <div class="card mb-4 fade-in">
        <div class="card-pad">
          <div class="flex justify-between items-start gap-3 mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="badge ${status.color}">${status.emoji} ${status.label}</span>
                <span class="text-xs text-muted">اليوم ${toAr(day.dayNumber)}</span>
              </div>
              <h2 class="text-xl font-bold">${day.isRestDay ? 'يوم راحة 🌿' : esc(day.surahName)}</h2>
              <p class="text-sm text-muted mt-1">${formatArabicDateWithDay(day.date)}</p>
            </div>
            ${day.isRescheduled ? `<span class="badge badge-warning">${ICONS.refresh} أعيدت جدولته</span>` : ''}
          </div>
          ${!day.isRestDay && day.surahNumber > 0 ? `
            <div class="grid grid-4 mt-3" style="font-size:13px">
              <div class="bg-muted" style="border-radius:6px;padding:8px"><div class="text-xs text-muted">السورة</div><div class="font-semibold">${esc(day.surahName)}</div></div>
              <div class="bg-muted" style="border-radius:6px;padding:8px"><div class="text-xs text-muted">من الآية</div><div class="font-semibold">${toAr(day.fromAyah)}</div></div>
              <div class="bg-muted" style="border-radius:6px;padding:8px"><div class="text-xs text-muted">إلى الآية</div><div class="font-semibold">${toAr(day.toAyah)}</div></div>
              <div class="bg-muted" style="border-radius:6px;padding:8px"><div class="text-xs text-muted">عدد الآيات</div><div class="font-semibold">${toAr(day.verseCount)}</div></div>
            </div>
            ${day.reviewRange ? `<div class="bg-muted mt-3" style="border-radius:8px;padding:12px;font-size:13px"><div class="text-xs text-muted flex items-center gap-1 mb-1">${ICONS.refresh} مهمة المراجعة</div><div>${esc(day.reviewRange)}</div></div>` : ''}
            <div class="grid grid-2 mt-3 text-xs">
              ${day.memorizeTime ? `<div class="flex items-center gap-2 text-muted">${ICONS.clock} وقت الحفظ: <span class="text-foreground">${formatArabicTime(day.memorizeTime)}</span></div>` : ''}
              ${day.reviewTime ? `<div class="flex items-center gap-2 text-muted">${ICONS.clock} وقت المراجعة: <span class="text-foreground">${formatArabicTime(day.reviewTime)}</span></div>` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      ${!day.isRestDay && verses.length > 0 ? `
        <div class="card mb-4">
          <div class="card-pad">
            <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.book} آيات الحفظ</h3>
            <div class="verse-list font-quran text-right">
              ${verses.map(v => `<div class="verse-item"><span class="verse-num">${toAr(v.ayah)}</span><p class="verse-text">${esc(v.text)}</p></div>`).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      ${!day.isRestDay && day.surahNumber > 0 ? `
        <div class="grid grid-2 mb-4">
          <button class="btn btn-primary btn-lg" style="flex-direction:column;height:auto;padding:16px" onclick="app_dayMode='memorize';render()">
            ${ICONS.book}
            <span class="font-semibold">${day.memorizeSession ? 'تحديث جلسة الحفظ' : 'ابدأ الحفظ'}</span>
            ${day.memorizeSession ? `<span class="text-xs" style="opacity:0.8">${day.memorizeSession.completed ? '✓ تم الحفظ' : 'لم يكتمل'}</span>` : ''}
          </button>
          <button class="btn btn-outline btn-lg" style="flex-direction:column;height:auto;padding:16px" onclick="app_dayMode='review';render()">
            ${ICONS.refresh}
            <span class="font-semibold">${day.reviewSession ? 'تحديث جلسة المراجعة' : 'ابدأ المراجعة'}</span>
            ${day.reviewSession ? `<span class="text-xs" style="opacity:0.8">✓ تمت المراجعة</span>` : ''}
          </button>
          <button class="btn btn-outline btn-lg" style="flex-direction:column;height:auto;padding:16px" onclick="navigate('test')">
            ${ICONS.list}
            <span class="font-semibold">اختبر حفظي</span>
            ${day.testSession ? `<span class="text-xs" style="opacity:0.8">آخر نتيجة: ${toAr(day.testSession.score)}%</span>` : ''}
          </button>
          <button class="btn btn-outline btn-lg" style="flex-direction:column;height:auto;padding:16px" onclick="app_dayMode='evaluate';render()">
            ${ICONS.star}
            <span class="font-semibold">${day.dayEvaluation ? 'تحديث التقييم' : 'قيّم يومك'}</span>
            ${day.dayEvaluation ? `<span class="text-xs font-bold ${scoreColor(day.dayEvaluation.final)}">${toAr(day.dayEvaluation.final)} / ${toAr(100)}</span>` : ''}
          </button>
        </div>
      ` : ''}

      ${(day.memorizeSession || day.reviewSession || day.testSession) ? `
        <div class="card">
          <div class="card-pad">
            <h3 class="text-base font-bold mb-3">ملخص جلسات اليوم</h3>
            ${day.memorizeSession && day.memorizeSession.evaluation ? renderSessionSummary('جلسة الحفظ', ICONS.book, day.memorizeSession.evaluation, [`${toAr(day.memorizeSession.versesMemorized)} آية`, `${toAr(day.memorizeSession.repetitions)} تكرار`]) : ''}
            ${day.reviewSession && day.reviewSession.evaluation ? renderSessionSummary('جلسة المراجعة', ICONS.refresh, day.reviewSession.evaluation, [`${toAr(day.reviewSession.versesReviewed)} آية`, `${toAr(day.reviewSession.errors)} أخطاء`]) : ''}
            ${day.testSession ? renderSessionSummary('الاختبار', ICONS.list, { score: day.testSession.score, rating: day.testSession.rating }, [`${toAr(day.testSession.totalQuestions)} سؤال`, `${toAr(day.testSession.correctAnswers)} صحيح`, `${toAr(day.testSession.errors)} خطأ`]) : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderSessionSummary(title, icon, eval_, details) {
  return `<div class="flex justify-between items-center p-3 bg-muted" style="border-radius:8px;margin-bottom:8px">
    <div class="flex items-center gap-2">
      <div style="width:32px;height:32px;border-radius:8px;background:rgba(26,107,84,0.1);color:var(--primary);display:flex;align-items:center;justify-content:center">${icon}</div>
      <div><div class="font-semibold text-sm">${title}</div><div class="text-xs text-muted">${details.join(' • ')}</div></div>
    </div>
    <div class="text-left"><div class="text-lg font-bold ${scoreColor(eval_.score)}">${toAr(eval_.score)}</div><div class="text-xs text-muted">${eval_.rating}</div></div>
  </div>`;
}

// ================== MEMORIZE MODE ==================
function renderMemorizeMode(day) {
  const ex = day.memorizeSession || {};
  if (!window._memState) {
    window._memState = {
      versesMemorized: ex.versesMemorized ?? day.verseCount,
      completed: ex.completed ?? (day.verseCount > 0 ? true : false),
      repetitions: ex.repetitions ?? 1,
      difficulty: ex.difficulty ?? 'medium',
      errors: ex.errors ?? 0,
      ease: ex.evaluation?.ease ?? 3,
      focus: ex.evaluation?.focus ?? 3,
      stability: ex.evaluation?.stability ?? 3,
      recallSpeed: ex.evaluation?.recallSpeed ?? 3,
      notes: ex.notes ?? '',
      startTime: ex.startTime ?? new Date().toISOString(),
      endTime: ex.endTime ?? new Date().toISOString(),
    };
  }
  const m = window._memState;
  const calc = calculateMemorizeScore(m.ease, m.focus, m.stability, m.recallSpeed, m.errors, m.versesMemorized);

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="app_dayMode='overview';window._memState=null;render()">${ICONS.arrow_right} إلغاء</button>

    <div class="card mb-4">
      <div class="card-pad">
        <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.book} جلسة الحفظ</h3>
        <div class="mb-3">
          <div class="flex justify-between mb-2"><label class="label" style="margin:0">عدد الآيات التي حفظتها</label><span class="badge">${toAr(m.versesMemorized)} آية</span></div>
          <input type="range" min="0" max="${day.verseCount}" value="${m.versesMemorized}" oninput="window._memState.versesMemorized=+this.value;render()" />
          <div class="flex justify-between text-xs text-muted mt-1"><span>لم أحفظ أي شيء</span><span>من ${toAr(day.verseCount)} آية مطلوبة</span></div>
        </div>
        <div class="mb-3">
          <div class="flex justify-between mb-2"><label class="label" style="margin:0">عدد مرات التكرار</label><span class="badge">${toAr(m.repetitions)} مرة</span></div>
          <input type="range" min="0" max="20" value="${m.repetitions}" oninput="window._memState.repetitions=+this.value;render()" />
        </div>
        <div class="mb-3">
          <label class="label">مستوى صعوبة الحفظ</label>
          <div class="grid" style="grid-template-columns:repeat(5,1fr);gap:4px">
            ${[{v:'very_easy',l:'سهل جدًا',c:'#16a34a'},{v:'easy',l:'سهل',c:'#0d9488'},{v:'medium',l:'متوسط',c:'#d97706'},{v:'hard',l:'صعب',c:'#ea580c'},{v:'very_hard',l:'صعب جدًا',c:'#dc2626'}].map(o => `
              <label style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border-radius:8px;border:1px solid ${m.difficulty === o.v ? 'var(--primary)' : 'var(--border)'};background:${m.difficulty === o.v ? 'rgba(26,107,84,0.05)' : 'transparent'};cursor:pointer;font-size:11px;text-align:center">
                <input type="radio" name="difficulty" value="${o.v}" ${m.difficulty === o.v ? 'checked' : ''} onchange="window._memState.difficulty=this.value;render()" style="display:none" />
                <span style="color:${o.c};font-size:18px">●</span>
                <span>${o.l}</span>
              </label>
            `).join('')}
          </div>
        </div>
        <div class="mb-3">
          <div class="flex justify-between mb-2"><label class="label" style="margin:0">عدد الأخطاء أثناء التسميع</label><span class="badge">${toAr(m.errors)} خطأ</span></div>
          <input type="range" min="0" max="20" value="${m.errors}" oninput="window._memState.errors=+this.value;render()" />
        </div>
        <div class="flex justify-between items-center p-3" style="border:1px solid var(--border);border-radius:8px">
          <label class="text-sm font-semibold">هل أتممت الحفظ؟</label>
          <button onclick="window._memState.completed=!window._memState.completed;render()" style="background:${m.completed?'var(--primary)':'var(--muted)'};color:white;width:44px;height:24px;border-radius:999px;position:relative;border:none;cursor:pointer">
            <span style="position:absolute;width:18px;height:18px;border-radius:999px;background:white;top:3px;${m.completed?'left:3px':'right:3px'};transition:all 0.2s"></span>
          </button>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-pad">
        <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.star} تقييم الحفظ</h3>
        ${renderRatingSlider('مدى سهولة الحفظ', m.ease, v => { window._memState.ease = v; render(); })}
        ${renderRatingSlider('التركيز', m.focus, v => { window._memState.focus = v; render(); })}
        ${renderRatingSlider('ثبات الحفظ', m.stability, v => { window._memState.stability = v; render(); })}
        ${renderRatingSlider('سرعة استرجاع الآيات', m.recallSpeed, v => { window._memState.recallSpeed = v; render(); })}
        <div class="pt-3 mt-3 border-t">
          <div class="text-xs text-muted mb-2">تفاصيل التقييم:</div>
          ${calc.breakdown.map(b => `<div class="flex justify-between text-xs mb-1"><span class="text-muted">${b.label}</span><span class="font-semibold">${toAr(b.points)} / ${toAr(b.max)}</span></div>`).join('')}
          <div class="flex justify-between pt-2 mt-2 border-t">
            <span class="font-semibold">النتيجة النهائية</span>
            <div class="text-left"><div class="text-2xl font-bold ${scoreColor(calc.score)}">${toAr(calc.score)} / ${toAr(100)}</div><div class="text-xs text-muted">${ratingEmoji(calc.rating)} ${calc.rating}</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-pad">
        <label class="label">ملاحظات</label>
        <textarea class="textarea" placeholder="أي ملاحظات تريد تسجيلها عن جلسة الحفظ..." oninput="window._memState.notes=this.value">${esc(m.notes)}</textarea>
      </div>
    </div>

    <div class="flex gap-2">
      <button class="btn btn-ghost" onclick="app_dayMode='overview';window._memState=null;render()">${ICONS.arrow_right} إلغاء</button>
      <button class="btn btn-primary flex-1" onclick="saveMemorize()">${ICONS.check} حفظ الجلسة</button>
    </div>
  </div>`;
}

function saveMemorize() {
  const day = state.plan.days[app_dayIdx];
  const m = window._memState;
  const session = { startTime: m.startTime, endTime: new Date().toISOString(), versesMemorized: m.versesMemorized, completed: m.completed, repetitions: m.repetitions, difficulty: m.difficulty, errors: m.errors, notes: m.notes };
  saveMemorizeSession(day.id, session, { ease: m.ease, focus: m.focus, stability: m.stability, recallSpeed: m.recallSpeed, errors: m.errors });
  window._memState = null;
  app_dayMode = 'overview';
  toast('تم حفظ جلسة الحفظ بنجاح ✨', 'success');
  render();
}

function renderRatingSlider(label, value, onChange) {
  return `<div class="mb-3">
    <div class="flex justify-between mb-2"><label class="label" style="margin:0">${label}</label>
      <div class="rating-dots">
        ${[1,2,3,4,5].map(n => `<button class="rating-dot ${n <= value ? 'active' : ''}" onclick="(${onChange.toString()})( ${n} )">${toAr(n)}</button>`).join('')}
      </div>
    </div>
  </div>`;
}

// ================== REVIEW MODE ==================
function renderReviewMode(day) {
  const ex = day.reviewSession || {};
  if (!window._revState) {
    window._revState = {
      versesReviewed: ex.versesReviewed ?? day.verseCount,
      errors: ex.errors ?? 0,
      stability: ex.evaluation?.stability ?? 3,
      recallSpeed: ex.evaluation?.recallSpeed ?? 3,
      focus: ex.evaluation?.focus ?? 3,
      ease: ex.evaluation?.ease ?? 3,
      notes: ex.notes ?? '',
    };
  }
  const r = window._revState;
  const calc = calculateReviewScore(r.stability, r.recallSpeed, r.focus, r.ease, r.errors, r.versesReviewed);

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="app_dayMode='overview';window._revState=null;render()">${ICONS.arrow_right} إلغاء</button>

    <div class="card mb-4">
      <div class="card-pad">
        <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.refresh} جلسة المراجعة</h3>
        ${day.reviewRange ? `<div class="bg-muted mb-3" style="border-radius:8px;padding:12px;font-size:13px"><div class="text-xs text-muted mb-1">مهمة المراجعة</div><div>${esc(day.reviewRange)}</div></div>` : ''}
        <div class="mb-3">
          <div class="flex justify-between mb-2"><label class="label" style="margin:0">عدد الآيات التي راجعتها</label><span class="badge">${toAr(r.versesReviewed)} آية</span></div>
          <input type="range" min="0" max="${Math.max(day.verseCount * 3, 30)}" value="${r.versesReviewed}" oninput="window._revState.versesReviewed=+this.value;render()" />
        </div>
        <div>
          <div class="flex justify-between mb-2"><label class="label" style="margin:0">عدد الأخطاء</label><span class="badge">${toAr(r.errors)} خطأ</span></div>
          <input type="range" min="0" max="20" value="${r.errors}" oninput="window._revState.errors=+this.value;render()" />
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-pad">
        <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.star} تقييم المراجعة</h3>
        ${renderRatingSlider('ثبات الحفظ', r.stability, v => { window._revState.stability = v; render(); })}
        ${renderRatingSlider('سرعة التذكر', r.recallSpeed, v => { window._revState.recallSpeed = v; render(); })}
        ${renderRatingSlider('التركيز', r.focus, v => { window._revState.focus = v; render(); })}
        ${renderRatingSlider('سهولة المراجعة', r.ease, v => { window._revState.ease = v; render(); })}
        <div class="pt-3 mt-3 border-t">
          <div class="text-xs text-muted mb-2">تفاصيل التقييم:</div>
          ${calc.breakdown.map(b => `<div class="flex justify-between text-xs mb-1"><span class="text-muted">${b.label}</span><span class="font-semibold">${toAr(b.points)} / ${toAr(b.max)}</span></div>`).join('')}
          <div class="flex justify-between pt-2 mt-2 border-t">
            <span class="font-semibold">النتيجة النهائية</span>
            <div class="text-left"><div class="text-2xl font-bold ${scoreColor(calc.score)}">${toAr(calc.score)} / ${toAr(100)}</div><div class="text-xs text-muted">${ratingEmoji(calc.rating)} ${calc.rating}</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4"><div class="card-pad">
      <label class="label">ملاحظات</label>
      <textarea class="textarea" placeholder="أي ملاحظات تريد تسجيلها عن جلسة المراجعة..." oninput="window._revState.notes=this.value">${esc(r.notes)}</textarea>
    </div></div>

    <div class="flex gap-2">
      <button class="btn btn-ghost" onclick="app_dayMode='overview';window._revState=null;render()">${ICONS.arrow_right} إلغاء</button>
      <button class="btn btn-primary flex-1" onclick="saveReview()">${ICONS.check} حفظ المراجعة</button>
    </div>
  </div>`;
}

function saveReview() {
  const day = state.plan.days[app_dayIdx];
  const r = window._revState;
  const session = { startTime: new Date().toISOString(), endTime: new Date().toISOString(), range: day.reviewRange || '', versesReviewed: r.versesReviewed, errors: r.errors, notes: r.notes };
  saveReviewSession(day.id, session, { stability: r.stability, recallSpeed: r.recallSpeed, focus: r.focus, ease: r.ease, errors: r.errors });
  window._revState = null;
  app_dayMode = 'overview';
  toast('تم حفظ جلسة المراجعة بنجاح ✨', 'success');
  render();
}

// ================== EVALUATE MODE ==================
function renderEvaluateMode(day) {
  if (!window._evalState) {
    window._evalState = { commitment: day.dayEvaluation?.commitment ?? 80, notes: day.notes ?? '' };
  }
  const e = window._evalState;
  const memScore = day.memorizeSession?.evaluation?.score ?? null;
  const revScore = day.reviewSession?.evaluation?.score ?? null;
  const testScore = day.testSession?.score ?? null;
  const finalEval = calculateDayEvaluation(memScore, revScore, testScore, e.commitment);
  const rating = finalEval.final >= 90 ? 'ممتاز جدًا' : finalEval.final >= 80 ? 'ممتاز' : finalEval.final >= 70 ? 'جيد جدًا' : finalEval.final >= 60 ? 'جيد' : 'يحتاج تحسين';

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="app_dayMode='overview';window._evalState=null;render()">${ICONS.arrow_right} إلغاء</button>

    <div class="card mb-4">
      <div class="card-pad">
        <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.star} تقييم اليوم الشامل</h3>
        <div class="mb-3">
          ${renderEvalRow('الحفظ', memScore)}
          ${renderEvalRow('المراجعة', revScore)}
          ${renderEvalRow('الاختبار', testScore)}
        </div>
        <div class="pt-3 border-t">
          <div class="flex justify-between mb-2"><label class="label" style="margin:0">الالتزام بالمهمة</label><span class="badge">${toAr(e.commitment)} / ${toAr(100)}</span></div>
          <input type="range" min="0" max="100" step="5" value="${e.commitment}" oninput="window._evalState.commitment=+this.value;render()" />
        </div>
        <div style="background:rgba(26,107,84,0.05);border-radius:8px;padding:16px;margin-top:12px">
          <div class="flex justify-between">
            <span class="font-semibold">التقييم اليومي النهائي</span>
            <span class="text-3xl font-bold ${scoreColor(finalEval.final)}">${toAr(finalEval.final)} / ${toAr(100)}</span>
          </div>
          <div class="text-xs text-muted mt-1">${ratingEmoji(rating)} ${rating}</div>
        </div>
      </div>
    </div>

    <div class="card mb-4"><div class="card-pad">
      <label class="label">ملاحظات اليوم</label>
      <textarea class="textarea" placeholder="ملاحظاتك عن اليوم بشكل عام..." oninput="window._evalState.notes=this.value">${esc(e.notes)}</textarea>
    </div></div>

    <div class="flex gap-2">
      <button class="btn btn-ghost" onclick="app_dayMode='overview';window._evalState=null;render()">${ICONS.arrow_right} إلغاء</button>
      <button class="btn btn-primary flex-1" onclick="saveEval()">${ICONS.check} حفظ تقييم اليوم</button>
    </div>
  </div>`;
}

function renderEvalRow(label, score) {
  return `<div class="flex justify-between text-sm py-2">
    <span class="text-muted">${label}</span>
    ${score != null ? `<span class="font-bold ${scoreColor(score)}">${toAr(score)} / ${toAr(100)}</span>` : `<span class="text-muted text-xs">لم يُسجَّل</span>`}
  </div>`;
}

function saveEval() {
  const day = state.plan.days[app_dayIdx];
  const e = window._evalState;
  const memScore = day.memorizeSession?.evaluation?.score ?? null;
  const revScore = day.reviewSession?.evaluation?.score ?? null;
  const testScore = day.testSession?.score ?? null;
  const finalEval = calculateDayEvaluation(memScore, revScore, testScore, e.commitment);
  saveDayEvaluation(day.id, finalEval);
  setDayNotes(day.id, e.notes);
  window._evalState = null;
  app_dayMode = 'overview';
  const rating = finalEval.final >= 90 ? 'ممتاز جدًا' : finalEval.final >= 80 ? 'ممتاز' : 'جيد';
  toast(`أنجزت تقييم اليوم! النتيجة: ${finalEval.final} / 100 ${ratingEmoji(rating)}`, 'success');
  render();
}

// ================== TEST MODE ==================
function renderTestMode() {
  if (!app_testState) return renderTestMenu();
  if (app_testState.type === 'in_progress') return renderTestInProgress();
  if (app_testState.type === 'result') return renderTestResult();
  return renderTestMenu();
}

function renderTestMenu() {
  const plan = state.plan;
  const today = formatDate(new Date());
  const currentIdx = findCurrentDayIndex(plan, today);
  const todayDay = plan.days[currentIdx];
  const mistakesCount = state.mistakes.filter(m => !m.resolved).length;

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="navigate('dashboard')">${ICONS.arrow_right} رجوع</button>
    <div class="text-center mb-6">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:16px;background:rgba(124,58,237,0.1);color:#7c3aed;margin-bottom:12px">${ICONS.list.replace('class="icon"', 'class="icon icon-lg"')}</div>
      <h1 class="text-xl font-bold mb-1">اختبر حفظي 🧠</h1>
      <p class="text-sm text-muted">اختر نوع الاختبار الذي يناسبك</p>
    </div>
    <div class="grid grid-2">
      ${todayDay && !todayDay.isRestDay && todayDay.surahNumber > 0 ? `
        <button class="text-right p-4" style="border-radius:12px;background:rgba(22,163,74,0.08);color:var(--success);border:1px solid rgba(22,163,74,0.3);cursor:pointer;font-family:inherit" onclick="startTest('daily')">
          <div class="flex items-start gap-3">
            <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0">${ICONS.book}</div>
            <div><div class="font-semibold text-foreground">اختبار حفظ اليوم</div><div class="text-xs text-muted mt-1">اختبار سريع لما حفظته اليوم</div></div>
          </div>
        </button>
      ` : ''}
      <button class="text-right p-4" style="border-radius:12px;background:rgba(124,58,237,0.08);color:#7c3aed;border:1px solid rgba(124,58,237,0.3);cursor:pointer;font-family:inherit" onclick="app_testState={type:'surah_select'};render()">
        <div class="flex items-start gap-3">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0">${ICONS.book}</div>
          <div><div class="font-semibold text-foreground">اختبار سورة كاملة</div><div class="text-xs text-muted mt-1">اختبر سورة محددة بالكامل</div></div>
        </div>
      </button>
      <button class="text-right p-4" style="border-radius:12px;background:rgba(217,119,6,0.08);color:var(--warning);border:1px solid rgba(217,119,6,0.3);cursor:pointer;font-family:inherit" onclick="startTest('random')">
        <div class="flex items-start gap-3">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0">${ICONS.sparkles}</div>
          <div><div class="font-semibold text-foreground">اختبار عشوائي</div><div class="text-xs text-muted mt-1">آيات عشوائية من جميع ما حفظته</div></div>
        </div>
      </button>
      ${mistakesCount > 0 ? `
        <button class="text-right p-4" style="border-radius:12px;background:rgba(220,38,38,0.08);color:var(--danger);border:1px solid rgba(220,38,38,0.3);cursor:pointer;font-family:inherit" onclick="startTest('mistakes')">
          <div class="flex items-start gap-3">
            <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;flex-shrink:0">${ICONS.alert}</div>
            <div><div class="font-semibold text-foreground">اختبار الأخطاء السابقة</div><div class="text-xs text-muted mt-1">${mistakesCount} آية تحتاج مراجعة</div></div>
          </div>
        </button>
      ` : ''}
    </div>
    ${app_testState && app_testState.type === 'surah_select' ? renderSurahSelector() : ''}
  </div>`;
}

function renderSurahSelector() {
  const surahs = SURAH_META.filter(s => hasFullText(s.number));
  return `<div class="card mt-4"><div class="card-pad">
    <h3 class="text-base font-bold mb-3">اختر السورة</h3>
    <div class="grid grid-2">
      ${surahs.map(s => `<button onclick="startTest('surah', ${s.number})" class="flex justify-between items-center p-3 text-right" style="border:1px solid var(--border);border-radius:8px;cursor:pointer;background:var(--card);color:var(--fg);font-family:inherit">
        <div><div class="font-semibold">${s.name}</div><div class="text-xs text-muted">${toAr(s.ayahCount)} آية</div></div>
        ${ICONS.chevron_left}
      </button>`).join('')}
    </div>
  </div></div>`;
}

function startTest(type, surah) {
  const plan = state.plan;
  let ayahList = [];
  let rangeLabel = '';
  let dayId = null;

  if (type === 'daily') {
    const today = formatDate(new Date());
    const idx = findCurrentDayIndex(plan, today);
    const day = plan.days[idx];
    if (!day || day.isRestDay || day.surahNumber === 0) { toast('لا يوجد حفظ في هذا اليوم', 'error'); return; }
    ayahList = buildAyahList(day.surahNumber, day.fromAyah, day.surahNumber, day.toAyah).filter(a => hasFullText(a.surah));
    rangeLabel = `يوم ${day.dayNumber}: ${day.surahName} (${day.fromAyah}-${day.toAyah})`;
    dayId = day.id;
  } else if (type === 'surah') {
    const verses = QURAN_FULL_TEXT[surah] || {};
    ayahList = Object.entries(verses).map(([ayah, text]) => ({ surah, ayah: +ayah, text }));
    const meta = getSurahMeta(surah);
    rangeLabel = `سورة ${meta ? meta.name : ''} كاملة`;
  } else if (type === 'random') {
    const memDays = plan.days.filter(d => d.memorizeSession && d.memorizeSession.completed && !d.isRestDay);
    for (const d of memDays) {
      const verses = buildAyahList(d.surahNumber, d.fromAyah, d.surahNumber, d.toAyah).filter(a => hasFullText(a.surah));
      ayahList.push(...verses);
    }
    ayahList = [...ayahList].sort(() => Math.random() - 0.5).slice(0, 20);
    rangeLabel = 'اختبار عشوائي من المحفوظ';
  } else if (type === 'mistakes') {
    for (const m of state.mistakes.filter(m => !m.resolved)) {
      const text = getAyahText(m.surah, m.ayah);
      if (text) ayahList.push({ surah: m.surah, ayah: m.ayah, text });
    }
    rangeLabel = 'الآيات التي أخطأت فيها';
  }

  if (ayahList.length === 0) { toast('لا توجد آيات متاحة للاختبار. جرب سورة أخرى.', 'error'); return; }

  const shuffled = [...ayahList].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(15, shuffled.length));
  const questions = selected.map(a => {
    const words = a.text.split(' ');
    const promptLen = Math.max(1, Math.floor(words.length * 0.4));
    return { surah: a.surah, ayah: a.ayah, prompt: words.slice(0, promptLen).join(' '), correctAnswer: a.text };
  });
  app_testState = { type: 'in_progress', questions, currentQ: 0, userAnswer: '', dayId, rangeLabel };
  render();
}

function renderTestInProgress() {
  const ts = app_testState;
  const q = ts.questions[ts.currentQ];
  const meta = getSurahMeta(q.surah);
  return `<div class="container-app py-4" style="padding-bottom:24px">
    <div class="card">
      <div class="card-pad">
        <div class="flex justify-between mb-3">
          <span class="badge">سؤال ${toAr(ts.currentQ + 1)} من ${toAr(ts.questions.length)}</span>
          <span class="badge badge-primary">${meta ? meta.name : ''} - آية ${toAr(q.ayah)}</span>
        </div>
        <h3 class="text-base mb-3">أكمل الآية:</h3>
        <div class="test-prompt mb-3">${esc(q.prompt)}<span style="opacity:0.4">...</span></div>
        <div class="mb-3">
          <label class="label">اكتب تتمة الآية:</label>
          <textarea class="textarea font-quran" style="font-size:18px;min-height:100px;text-align:right" placeholder="اكتب باقي الآية هنا..." id="test-answer">${esc(ts.userAnswer)}</textarea>
        </div>
        <div class="flex justify-between gap-2">
          <button class="btn btn-ghost" onclick="document.getElementById('test-answer').value=''">مسح</button>
          <button class="btn btn-primary flex-1" onclick="submitAnswer()">${ts.currentQ + 1 < ts.questions.length ? `التالي ${ICONS.arrow_left}` : `${ICONS.check} إنهاء الاختبار`}</button>
        </div>
        <div class="progress mt-3"><div class="progress-bar" style="width:${(ts.currentQ / ts.questions.length) * 100}%"></div></div>
      </div>
    </div>
  </div>`;
}

function submitAnswer() {
  const ts = app_testState;
  const ans = document.getElementById('test-answer').value.trim();
  if (!ans) { toast('اكتب إجابتك أولًا', 'error'); return; }
  const q = ts.questions[ts.currentQ];
  q.userAnswer = ans;
  q.isCorrect = checkAnswer(ans, q.correctAnswer);
  if (ts.currentQ + 1 < ts.questions.length) {
    ts.currentQ++; ts.userAnswer = '';
    render();
  } else {
    finishTest();
  }
}

function checkAnswer(user, correct) {
  const normalize = s => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[^\u0621-\u064A\s]/g, '').replace(/\s+/g, ' ').trim();
  const u = normalize(user), c = normalize(correct);
  if (!u || !c) return false;
  if (u === c) return true;
  const uW = u.split(' ').filter(Boolean), cW = c.split(' ').filter(Boolean);
  if (!uW.length || !cW.length) return false;
  const minLen = Math.min(uW.length, cW.length);
  let direct = 0;
  for (let i = 0; i < minLen; i++) if (uW[i] === cW[i]) direct++;
  let suffix = 0;
  if (uW.length <= cW.length) {
    const off = cW.length - uW.length;
    for (let i = 0; i < uW.length; i++) if (uW[i] === cW[off + i]) suffix++;
  }
  let best = 0;
  for (let start = 0; start <= cW.length - uW.length; start++) {
    let m = 0;
    for (let i = 0; i < uW.length; i++) if (uW[i] === cW[start + i]) m++;
    if (m > best) best = m;
  }
  const bestMatches = Math.max(direct, suffix, best);
  return bestMatches / Math.max(uW.length, cW.length) >= 0.7;
}

function finishTest() {
  const ts = app_testState;
  const correct = ts.questions.filter(q => q.isCorrect).length;
  const errors = ts.questions.length - correct;
  const score = Math.round((correct / ts.questions.length) * 100);
  const wrongVerses = ts.questions.filter(q => !q.isCorrect).map(q => ({ surah: q.surah, ayah: q.ayah }));
  const session = { id: uid('test'), date: new Date().toISOString(), rangeLabel: ts.rangeLabel, questions: ts.questions, totalQuestions: ts.questions.length, correctAnswers: correct, errors, score, rating: testRating(score), wrongVerses };
  saveTestSession(ts.dayId, session);
  if (ts.dayId === null && ts.rangeLabel === 'الآيات التي أخطأت فيها') {
    for (const q of ts.questions) recordMistakeReview(q.surah, q.ayah, q.isCorrect ? 100 : 0);
  }
  app_testState = { type: 'result', session };
  render();
}

function renderTestResult() {
  const s = app_testState.session;
  return `<div class="container-app py-4 fade-in" style="padding-bottom:24px">
    <div class="card mb-4">
      <div class="card-pad text-center">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;margin:0 auto 12px;background:${s.score >= 80 ? 'rgba(22,163,74,0.1)' : s.score >= 60 ? 'rgba(217,119,6,0.1)' : 'rgba(220,38,38,0.1)'};color:${s.score >= 80 ? 'var(--success)' : s.score >= 60 ? 'var(--warning)' : 'var(--danger)'}">${ICONS.trophy.replace('class="icon"', 'class="icon icon-xl"')}</div>
        <h2 class="text-xl font-bold">نتيجة الاختبار</h2>
        <p class="text-sm text-muted">${esc(s.rangeLabel)}</p>
        <div class="text-3xl font-bold ${scoreColor(s.score)} mt-3">${toAr(s.score)}%</div>
        <div class="text-sm mt-1">${ratingEmoji(s.rating)} ${s.rating}</div>
        <div class="grid grid-3 mt-4">
          <div class="bg-muted" style="border-radius:8px;padding:12px"><div class="text-2xl font-bold text-primary">${toAr(s.totalQuestions)}</div><div class="text-xs text-muted mt-1">عدد الأسئلة</div></div>
          <div class="bg-muted" style="border-radius:8px;padding:12px"><div class="text-2xl font-bold text-success">${toAr(s.correctAnswers)}</div><div class="text-xs text-muted mt-1">إجابات صحيحة</div></div>
          <div class="bg-muted" style="border-radius:8px;padding:12px"><div class="text-2xl font-bold text-danger">${toAr(s.errors)}</div><div class="text-xs text-muted mt-1">أخطاء</div></div>
        </div>
        <div class="progress mt-4"><div class="progress-bar ${s.score >= 80 ? 'progress-bar-success' : s.score >= 60 ? 'progress-bar-warning' : 'progress-bar-danger'}" style="width:${s.score}%"></div></div>
      </div>
    </div>

    ${s.wrongVerses.length > 0 ? `
      <div class="card mb-4">
        <div class="card-pad">
          <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.alert} الآيات التي أخطأت فيها</h3>
          <div class="verse-list">
            ${s.questions.filter(q => !q.isCorrect).map((q, i) => {
              const m = getSurahMeta(q.surah);
              return `<div class="p-3 mb-3" style="border-radius:8px;background:rgba(220,38,38,0.05);border:1px solid rgba(220,38,38,0.2)">
                <div class="flex justify-between mb-2"><span class="badge">${m ? m.name : ''} - آية ${toAr(q.ayah)}</span>${ICONS.alert}</div>
                <div class="font-quran text-base mb-2"><span class="text-muted">الإجابة الصحيحة:</span><br>${esc(q.correctAnswer)}</div>
                <div class="font-quran text-base text-muted"><span class="text-xs">إجابتك:</span><br>${esc(q.userAnswer || '(لم تجب)')}</div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    ` : `
      <div class="card mb-4" style="background:rgba(22,163,74,0.08);border-color:rgba(22,163,74,0.3)">
        <div class="card-pad text-center py-6">
          ${ICONS.check.replace('class="icon"', 'class="icon icon-lg"')}
          <p class="font-semibold text-success mt-2">ما شاء الله! إجابات مثالية 🌟</p>
          <p class="text-sm text-muted mt-1">استمر في الحفظ والمراجعة المستمرة</p>
        </div>
      </div>
    `}

    <div class="flex gap-2">
      <button class="btn btn-outline flex-1" onclick="app_testState=null;render()">${ICONS.rotate} اختبار آخر</button>
      <button class="btn btn-primary flex-1" onclick="app_testState=null;navigate('dashboard')">${ICONS.check} تم</button>
    </div>
  </div>`;
}

// ================== MISTAKES ==================
function renderMistakes() {
  const unresolved = state.mistakes.filter(m => !m.resolved);
  const resolved = state.mistakes.filter(m => m.resolved);
  const bySurah = new Map();
  for (const m of unresolved) {
    if (!bySurah.has(m.surah)) bySurah.set(m.surah, []);
    bySurah.get(m.surah).push(m);
  }

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="navigate('dashboard')">${ICONS.arrow_right} رجوع</button>
    <div class="flex items-center gap-2 mb-1">${ICONS.alert}<h1 class="text-xl font-bold">أخطائي</h1></div>
    <p class="text-sm text-muted mb-4">الآيات التي تحتاج إلى مراجعة إضافية - مرتبة حسب الأولوية</p>

    ${unresolved.length === 0 && resolved.length === 0 ? `
      <div class="card" style="border-style:dashed"><div class="card-pad text-center py-12">
        ${ICONS.check.replace('class="icon"', 'class="icon icon-xl"')}
        <p class="font-semibold mt-3">ما شاء الله! لا توجد أخطاء مسجلة</p>
        <p class="text-sm text-muted mt-1">استمر في الحفظ والاختبار، وستظهر هنا الآيات التي تحتاج إلى مراجعة</p>
      </div></div>
    ` : ''}

    ${unresolved.length > 0 ? `
      <div class="card mb-4" style="background:rgba(217,119,6,0.06);border-color:rgba(217,119,6,0.3)">
        <div class="card-pad">
          <div class="flex items-start gap-2 text-sm">
            ${ICONS.sparkles}
            <p class="text-warning">لديك ${toAr(unresolved.length)} ${unresolved.length === 1 ? 'آية' : 'آيات'} تحتاج إلى مراجعة. ينصح بإجراء اختبار خاص بها.</p>
          </div>
          <button class="btn btn-outline btn-sm mt-3" onclick="navigate('test'); setTimeout(()=>startTest('mistakes'), 100)">اختبر الآيات الأخطأ فيها</button>
        </div>
      </div>

      ${Array.from(bySurah.entries()).map(([surahNum, surahMistakes]) => `
        <div class="card mb-4">
          <div class="card-pad">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-base font-bold flex items-center gap-2">${ICONS.book} ${esc(surahMistakes[0].surahName)}</h3>
              <span class="badge">${toAr(surahMistakes.length)} آيات</span>
            </div>
            ${[...surahMistakes].sort((a, b) => a.stability - b.stability || b.errorCount - a.errorCount).map(m => {
              const text = getAyahText(m.surah, m.ayah);
              return `<div class="flex items-start gap-3 p-3 mb-2" style="border:1px solid var(--border);border-radius:8px;background:var(--card)">
                <div style="flex-shrink:0;width:32px;height:32px;border-radius:999px;background:rgba(217,119,6,0.1);color:var(--warning);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px">${toAr(m.ayah)}</div>
                <div class="flex-1">
                  ${text ? `<p class="font-quran text-base mb-2">${esc(text)}</p>` : ''}
                  <div class="flex flex-wrap items-center gap-2 text-xs">
                    <span class="badge badge-danger">${toAr(m.errorCount)} ${m.errorCount === 1 ? 'خطأ' : 'أخطاء'}</span>
                    <span class="badge badge-warning">الثبات: ${toAr(m.stability)}/5</span>
                    ${m.lastResult > 0 ? `<span class="badge">آخر نتيجة: ${toAr(m.lastResult)}%</span>` : ''}
                    ${m.reviewCount > 0 ? `<span class="badge">راجعتها ${toAr(m.reviewCount)} مرات</span>` : ''}
                    <span class="text-muted" style="font-size:10px">آخر خطأ: ${formatArabicDate(m.lastErrorDate.slice(0, 10))}</span>
                  </div>
                </div>
                <button class="btn btn-sm" style="color:var(--success);flex-shrink:0" onclick="resolveMistake('${m.id}')">${ICONS.check} راجعتها</button>
              </div>`;
            }).join('')}
          </div>
        </div>
      `).join('')}
    ` : ''}

    ${resolved.length > 0 ? `
      <div class="card">
        <div class="card-pad">
          <h3 class="text-base font-bold flex items-center gap-2 text-success mb-3">${ICONS.check} آيات راجعتها بنجاح (${toAr(resolved.length)})</h3>
          ${resolved.slice(0, 10).map(m => `<div class="flex items-center gap-2 p-2 mb-1" style="background:rgba(22,163,74,0.06);border-radius:6px;font-size:13px">${ICONS.check}<span class="font-semibold">${esc(m.surahName)}</span><span class="text-muted">- آية ${toAr(m.ayah)}</span></div>`).join('')}
          ${resolved.length > 10 ? `<p class="text-xs text-muted text-center mt-2">و${toAr(resolved.length - 10)} آيات أخرى...</p>` : ''}
        </div>
      </div>
    ` : ''}
  </div>`;
}

// ================== CALENDAR ==================
let calPage = 0;
function renderCalendar() {
  const plan = state.plan;
  const today = formatDate(new Date());
  const perPage = 14;
  const totalPages = Math.ceil(plan.days.length / perPage);
  const startIdx = calPage * perPage;
  const visible = plan.days.slice(startIdx, startIdx + perPage);

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="navigate('dashboard')">${ICONS.arrow_right} رجوع</button>
    <div class="flex justify-between items-center">
      <div>
        <div class="flex items-center gap-2">${ICONS.calendar}<h1 class="text-xl font-bold">تقويم الخطة</h1></div>
        <p class="text-sm text-muted mt-1">خطتك الكاملة - ${toAr(plan.days.length)} يومًا</p>
      </div>
      <div class="flex gap-1">
        <button class="btn btn-outline btn-sm" onclick="redistributePlan()">${ICONS.refresh} إعادة توزيع</button>
      </div>
    </div>

    <div class="card mt-4 mb-4"><div class="card-pad">
      <div class="grid grid-4" style="font-size:11px">
        ${[{s:'completed',l:'مكتمل'},{s:'completed_needs_review',l:'يحتاج مراجعة'},{s:'memorized_not_reviewed',l:'لم تتم المراجعة'},{s:'needs_test',l:'يحتاج اختبار'},{s:'missed',l:'فائت'},{s:'rescheduled',l:'أعيدت جدولته'},{s:'rest',l:'راحة'},{s:'pending',l:'لم يبدأ'}].map(o => {
          const i = statusInfo(o.s);
          return `<div class="flex items-center gap-1"><span class="dot ${i.dot}"></span><span class="text-muted">${o.l}</span></div>`;
        }).join('')}
      </div>
    </div></div>

    <div>
      ${visible.map((day, i) => {
        const idx = startIdx + i;
        const info = statusInfo(day.status);
        const isToday = day.date === today;
        const isPast = day.date < today;
        return `<button class="day-card ${isToday ? 'today' : isPast ? 'past' : ''}" style="margin-bottom:8px" onclick="calPage=0;navigate('day', ${idx})">
          <div class="day-indicator ${info.dot}"></div>
          <div style="flex-shrink:0;width:80px">
            <div class="text-xs text-muted">${getShortDayName(day.date)}</div>
            <div class="text-lg font-bold ${isToday ? 'text-primary' : ''}">${toAr(day.dayNumber)}</div>
            <div class="text-xs text-muted">${formatArabicDate(day.date).split(' ').slice(0, 2).join(' ')}</div>
          </div>
          <div class="flex-1">
            ${day.isRestDay ? `<div class="flex items-center gap-2 text-muted"><span style="font-size:24px">🌿</span><span class="text-sm font-semibold">يوم راحة</span></div>` : `
              <div class="font-semibold text-sm">${esc(day.surahName)} - آيات ${toAr(day.fromAyah)}-${toAr(day.toAyah)}</div>
              <div class="text-xs text-muted mt-1">${toAr(day.verseCount)} آية${day.memorizeSession ? '<span class="text-success"> • ✓ حفظ</span>' : ''}${day.reviewSession ? '<span style="color:#0d9488"> • ✓ مراجعة</span>' : ''}${day.testSession ? `<span style="color:#7c3aed"> • ✓ اختبار (${toAr(day.testSession.score)}%)</span>` : ''}${day.dayEvaluation ? `<span class="text-warning"> • ⭐ ${toAr(day.dayEvaluation.final)}</span>` : ''}</div>
            `}
          </div>
          <span class="badge ${info.color}" style="font-size:10px">${info.emoji} ${info.label}</span>
          ${ICONS.chevron_left}
        </button>`;
      }).join('')}
    </div>

    ${totalPages > 1 ? `
      <div class="flex justify-between items-center mt-4">
        <button class="btn btn-outline btn-sm" ${calPage === 0 ? 'disabled' : ''} onclick="calPage=Math.max(0, calPage-1);render()">${ICONS.arrow_right} السابق</button>
        <span class="text-sm text-muted">صفحة ${toAr(calPage + 1)} من ${toAr(totalPages)}</span>
        <button class="btn btn-outline btn-sm" ${calPage >= totalPages - 1 ? 'disabled' : ''} onclick="calPage=Math.min(totalPages-1, calPage+1);render()">التالي ${ICONS.arrow_left}</button>
      </div>
    ` : ''}
  </div>`;
}

function redistributePlan() {
  const today = formatDate(new Date());
  const r = redistributeMissedDays(today);
  if (r && r.daysAffected > 0) toast(`تم إعادة توزيع ${r.daysAffected} يوم بنجاح 🔄`, 'success');
  else toast('لا توجد أيام فائتة بحاجة لإعادة التوزيع', 'info');
  render();
}

// ================== REPORTS ==================
let reportTab = 'overview';
function renderReports() {
  const plan = state.plan; const user = state.user;
  const today = formatDate(new Date());
  const stats = calculatePlanStats(plan, today);
  const isComplete = stats.daysRemaining === 0 && stats.completedDays > 0;

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="navigate('dashboard')">${ICONS.arrow_right} رجوع</button>
    <div class="flex items-center gap-2 mb-4">${ICONS.chart}<h1 class="text-xl font-bold">التقارير</h1></div>

    <div class="tabs mb-4">
      ${[{t:'overview',l:'نظرة عامة'},{t:'weekly',l:'أسبوعي'},{t:'monthly',l:'شهري'},{t:'final',l:'نهائي'}].map(o => `<button class="tab ${reportTab === o.t ? 'active' : ''}" onclick="reportTab='${o.t}';render()">${o.l}</button>`).join('')}
    </div>

    ${reportTab === 'overview' ? renderOverviewReport(stats) : ''}
    ${reportTab === 'weekly' ? renderWeeklyReport(plan) : ''}
    ${reportTab === 'monthly' ? renderMonthlyReport(plan) : ''}
    ${reportTab === 'final' ? (isComplete ? renderFinalReport(user, stats) : `<div class="card" style="border-style:dashed"><div class="card-pad text-center py-12">${ICONS.trophy.replace('class="icon"', 'class="icon icon-xl"')}<p class="font-semibold mt-3">التقرير النهائي غير متاح بعد</p><p class="text-sm text-muted mt-1">سيظهر التقرير النهائي عند اكتمال خطتك</p></div></div>`) : ''}
  </div>`;
}

function renderOverviewReport(stats) {
  return `<div class="fade-in">
    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.trend} ملخص الخطة</h3>
      <div class="grid grid-3">
        ${renderStatCard(ICONS.calendar, 'إجمالي الأيام', toAr(stats.totalDays), 'primary')}
        ${renderStatCard(ICONS.check, 'الأيام المنجزة', toAr(stats.completedDays), 'success')}
        ${renderStatCard(ICONS.alert, 'الأيام الفائتة', toAr(stats.missedDays), 'danger')}
        ${renderStatCard(ICONS.calendar, 'أيام الراحة', toAr(stats.restDays), 'primary')}
        ${renderStatCard(ICONS.book, 'الآيات المحفوظة', toAr(stats.memorizedVerses), 'success')}
        ${renderStatCard(ICONS.award, 'السور المكتملة', toAr(stats.completedSurahs), 'warning')}
        ${renderStatCard(ICONS.list, 'الاختبارات', toAr(stats.testCount), 'primary')}
        ${renderStatCard(ICONS.calendar, 'الأيام المتبقية', toAr(stats.daysRemaining), 'primary')}
        ${renderStatCard(ICONS.trend, 'نسبة الالتزام', `${toAr(stats.commitmentRate)}%`, stats.commitmentRate >= 70 ? 'success' : stats.commitmentRate >= 50 ? 'warning' : 'danger')}
      </div>
    </div></div>

    ${(stats.avgMemorizeScore > 0 || stats.avgReviewScore > 0 || stats.avgTestScore > 0) ? `
      <div class="card"><div class="card-pad">
        <h3 class="text-base font-bold mb-3">معدلات التقييم</h3>
        ${stats.avgMemorizeScore > 0 ? renderScoreRow('متوسط الحفظ', stats.avgMemorizeScore) : ''}
        ${stats.avgReviewScore > 0 ? renderScoreRow('متوسط المراجعة', stats.avgReviewScore) : ''}
        ${stats.avgTestScore > 0 ? renderScoreRow('متوسط الاختبارات', stats.avgTestScore) : ''}
        <div class="pt-3 mt-3 border-t">${renderScoreRow('ثبات الحفظ', stats.stability * 20)}</div>
      </div></div>
    ` : ''}
  </div>`;
}

function renderWeeklyReport(plan) {
  const today = formatDate(new Date());
  const todayIdx = findCurrentDayIndex(plan, today);
  const startIdx = Math.max(0, todayIdx - 6);
  const weekDays = plan.days.slice(startIdx, todayIdx + 1);
  let versesMem = 0, memScores = [], revScores = [], testScores = [];
  let completed = 0, rest = 0;
  for (const d of weekDays) {
    if (d.isRestDay) { rest++; continue; }
    if (d.memorizeSession?.evaluation) { memScores.push(d.memorizeSession.evaluation.score); versesMem += d.memorizeSession.versesMemorized; }
    if (d.reviewSession?.evaluation) revScores.push(d.reviewSession.evaluation.score);
    if (d.testSession) testScores.push(d.testSession.score);
    if (d.dayEvaluation) completed++;
  }
  const avgMem = memScores.length ? Math.round(memScores.reduce((a,b)=>a+b,0)/memScores.length) : 0;
  const avgRev = revScores.length ? Math.round(revScores.reduce((a,b)=>a+b,0)/revScores.length) : 0;
  const avgTest = testScores.length ? Math.round(testScores.reduce((a,b)=>a+b,0)/testScores.length) : 0;
  const commit = weekDays.filter(d => !d.isRestDay).length ? Math.round((completed / weekDays.filter(d => !d.isRestDay).length) * 100) : 0;

  return `<div class="fade-in">
    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold mb-3">تقرير الأسبوع الأخير</h3>
      <div class="grid grid-4">
        ${renderStatCard(ICONS.check, 'أيام الحفظ', toAr(completed), 'success')}
        ${renderStatCard(ICONS.calendar, 'أيام الراحة', toAr(rest), 'primary')}
        ${renderStatCard(ICONS.book, 'آيات محفوظة', toAr(versesMem), 'success')}
        ${renderStatCard(ICONS.trend, 'نسبة الالتزام', `${toAr(commit)}%`, commit >= 70 ? 'success' : 'warning')}
      </div>
      <div class="pt-3 mt-3 border-t">
        ${renderScoreRow('متوسط الحفظ', avgMem)}
        ${renderScoreRow('متوسط المراجعة', avgRev)}
        ${renderScoreRow('متوسط الاختبارات', avgTest)}
      </div>
    </div></div>
  </div>`;
}

function renderMonthlyReport(plan) {
  const today = formatDate(new Date());
  const todayIdx = findCurrentDayIndex(plan, today);
  const startIdx = Math.max(0, todayIdx - 29);
  const monthDays = plan.days.slice(startIdx, todayIdx + 1);
  let verses = 0, surahs = new Set(), tests = 0, passed = 0, completed = 0, missed = 0, rest = 0;
  const scores = [];
  for (const d of monthDays) {
    if (d.isRestDay) { rest++; continue; }
    if (d.memorizeSession?.completed) { verses += d.memorizeSession.versesMemorized; surahs.add(d.surahNumber); completed++; }
    if (d.status === 'missed') missed++;
    if (d.testSession) { tests++; if (d.testSession.score >= 60) passed++; scores.push(d.testSession.score); }
  }
  const avg = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  const successRate = tests ? Math.round((passed / tests) * 100) : 0;

  return `<div class="fade-in">
    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold mb-3">تقرير آخر 30 يومًا</h3>
      <div class="grid grid-3">
        ${renderStatCard(ICONS.book, 'الآيات المحفوظة', toAr(verses), 'success')}
        ${renderStatCard(ICONS.award, 'السور المكتملة', toAr(surahs.size), 'warning')}
        ${renderStatCard(ICONS.list, 'الاختبارات', toAr(tests), 'primary')}
        ${renderStatCard(ICONS.check, 'نسبة النجاح', `${toAr(successRate)}%`, successRate >= 70 ? 'success' : 'warning')}
        ${renderStatCard(ICONS.check, 'أيام مكتملة', toAr(completed), 'success')}
        ${renderStatCard(ICONS.alert, 'أيام فائتة', toAr(missed), 'danger')}
        ${renderStatCard(ICONS.calendar, 'أيام راحة', toAr(rest), 'primary')}
        ${renderStatCard(ICONS.list, 'متوسط الاختبارات', toAr(avg), 'primary')}
      </div>
    </div></div>
    <div class="card"><div class="card-pad">
      <h3 class="text-base font-bold mb-3">مستوى ثبات الحفظ</h3>
      <div class="flex justify-between mb-2"><span class="text-sm text-muted">مستوى الثبات</span>
        <div class="flex gap-1">${[1,2,3,4,5].map(n => `<span style="font-size:24px;color:${n <= Math.round(avg / 20) ? '#f59e0b' : 'rgba(148,163,184,0.3)'}">★</span>`).join('')}</div>
      </div>
      <p class="text-xs text-muted mt-2">${avg >= 80 ? 'ثبات ممتاز - استمر على هذا الأداء!' : avg >= 60 ? 'ثبات جيد - حافظ على المراجعة المستمرة' : 'يحتاج إلى تحسين - راجع المحفوظ بشكل مكثف'}</p>
    </div></div>
  </div>`;
}

function renderFinalReport(user, stats) {
  const overall = Math.round((stats.avgMemorizeScore + stats.avgReviewScore + stats.avgTestScore) / 3);
  return `<div class="fade-in">
    <div class="card" style="background:linear-gradient(135deg, rgba(245,158,11,0.06), var(--card));border-color:rgba(245,158,11,0.3)">
      <div class="card-pad text-center">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:16px;background:rgba(245,158,11,0.1);color:#f59e0b;margin:0 auto 12px">${ICONS.trophy.replace('class="icon"', 'class="icon icon-xl"')}</div>
        <h2 class="text-xl font-bold">تقرير إنجاز الخطة</h2>
        <p class="text-sm text-muted mt-1">ما شاء الله تبارك الله، أكملت ${esc(user.name)} خطة الحفظ!</p>
        <div class="grid grid-2 mt-4 text-right">
          ${renderStatCard(ICONS.user, 'اسم المستخدم', esc(user.name), 'primary')}
          ${renderStatCard(ICONS.calendar, 'مدة الخطة', `${toAr(stats.totalDays)} يوم`, 'primary')}
          ${renderStatCard(ICONS.check, 'الأيام المنجزة', toAr(stats.completedDays), 'success')}
          ${renderStatCard(ICONS.alert, 'الأيام الفائتة', toAr(stats.missedDays), 'danger')}
          ${renderStatCard(ICONS.book, 'إجمالي الآيات', toAr(stats.memorizedVerses), 'success')}
          ${renderStatCard(ICONS.award, 'السور المكتملة', toAr(stats.completedSurahs), 'warning')}
        </div>
        <div class="mt-4 pt-3 border-t">
          ${renderScoreRow('متوسط الحفظ', stats.avgMemorizeScore)}
          ${renderScoreRow('متوسط المراجعة', stats.avgReviewScore)}
          ${renderScoreRow('متوسط الاختبارات', stats.avgTestScore)}
        </div>
        <div class="pt-3 mt-3 border-t">
          <div class="flex justify-between"><span class="font-semibold">التقييم النهائي</span><span class="text-3xl font-bold ${scoreColor(overall)}">${toAr(overall)}</span></div>
        </div>
        <p class="text-lg font-semibold mt-4">${ratingEmoji(overall >= 90 ? 'ممتاز جدًا' : 'ممتاز')} بارك الله فيك يا ${esc(user.name)} 🎉</p>
        <p class="text-sm text-muted mt-2">حفظت ${toAr(stats.memorizedVerses)} آية في ${toAr(stats.completedDays)} يومًا.<br>هذا إنجاز عظيم، حافظ عليه بالمراجعة المستمرة.</p>
      </div>
    </div>
  </div>`;
}

// ================== ACHIEVEMENTS ==================
function renderAchievements() {
  const unlocked = state.achievements.filter(a => a.unlockedAt);
  const locked = state.achievements.filter(a => !a.unlockedAt);

  return `<div class="container-app py-4" style="padding-bottom:24px">
    <button class="flex items-center gap-1 text-sm text-muted mb-4" style="background:none;border:none;cursor:pointer;color:var(--muted-fg);font-family:inherit" onclick="navigate('dashboard')">${ICONS.arrow_right} رجوع</button>
    <div class="flex items-center gap-2 mb-1">${ICONS.award}<h1 class="text-xl font-bold">الإنجازات</h1></div>
    <p class="text-sm text-muted">حققت ${toAr(unlocked.length)} من ${toAr(state.achievements.length)} إنجاز</p>

    <div class="card mb-4 mt-4" style="background:linear-gradient(135deg, rgba(245,158,11,0.06), var(--card));border-color:rgba(245,158,11,0.3)">
      <div class="card-pad">
        <div class="flex justify-between mb-2">
          <div>
            <div class="text-sm text-muted">تقدم الإنجازات</div>
            <div class="text-2xl font-bold">${toAr(unlocked.length)} / ${toAr(state.achievements.length)}</div>
          </div>
          <div style="color:rgba(245,158,11,0.4)">${ICONS.award.replace('class="icon"', 'class="icon" style="width:40px;height:40px"')}</div>
        </div>
        <div class="progress"><div class="progress-bar progress-bar-warning" style="width:${(unlocked.length / state.achievements.length) * 100}%"></div></div>
      </div>
    </div>

    ${unlocked.length > 0 ? `
      <h2 class="text-sm font-semibold text-muted flex items-center gap-1 mb-3">${ICONS.check} الإنجازات المُنجزة</h2>
      <div class="grid grid-2 mb-4">
        ${unlocked.map(a => `<div class="card achievement-unlocked"><div class="card-pad flex items-center gap-3">
          <div style="width:48px;height:48px;border-radius:12px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">${a.icon}</div>
          <div class="flex-1">
            <div class="font-semibold">${a.title}</div>
            <div class="text-xs text-muted mt-1">${a.description}</div>
            ${a.unlockedAt ? `<div class="text-xs text-warning mt-1">تاريخ الإنجاز: ${formatArabicDate(a.unlockedAt.slice(0, 10))}</div>` : ''}
          </div>
        </div></div>`).join('')}
      </div>
    ` : ''}

    ${locked.length > 0 ? `
      <h2 class="text-sm font-semibold text-muted flex items-center gap-1 mb-3">${ICONS.target} إنجازات قادمة</h2>
      <div class="grid grid-2">
        ${locked.map(a => `<div class="card achievement-locked"><div class="card-pad flex items-center gap-3">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--muted);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;filter:grayscale(1);opacity:0.7">${a.icon}</div>
          <div class="flex-1">
            <div class="font-semibold">${a.title}</div>
            <div class="text-xs text-muted mt-1">${a.description}</div>
            ${a.progress != null ? `<div class="mt-2">
              <div class="flex justify-between text-xs text-muted mb-1"><span>التقدم</span><span>${toAr(a.progress)}%</span></div>
              <div class="progress" style="height:6px"><div class="progress-bar" style="width:${a.progress}%"></div></div>
            </div>` : ''}
          </div>
        </div></div>`).join('')}
      </div>
    ` : ''}
  </div>`;
}

// ================== SETTINGS ==================
let settingsTab = 'user';
function renderSettings() {
  const u = state.user; const plan = state.plan;
  return `
    <div class="drawer-overlay" onclick="closeSettings()"></div>
    <div class="drawer">
      <div class="sticky top-0" style="background:var(--bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;z-index:10">
        <div class="flex items-center gap-2">${ICONS.settings}<h1 class="text-lg font-bold">الإعدادات</h1></div>
        <button class="icon-btn" onclick="closeSettings()">${ICONS.close}</button>
      </div>
      <div style="padding:16px">
        <div class="tabs mb-4">
          <button class="tab ${settingsTab === 'user' ? 'active' : ''}" onclick="settingsTab='user';render()">المستخدم</button>
          <button class="tab ${settingsTab === 'plan' ? 'active' : ''}" onclick="settingsTab='plan';render()">الخطة</button>
          <button class="tab ${settingsTab === 'data' ? 'active' : ''}" onclick="settingsTab='data';render()">البيانات</button>
        </div>
        ${settingsTab === 'user' ? renderSettingsUser(u) : ''}
        ${settingsTab === 'plan' ? renderSettingsPlan(plan, u) : ''}
        ${settingsTab === 'data' ? renderSettingsData() : ''}
      </div>
    </div>
  `;
}

let _userEdit = null;
function renderSettingsUser(u) {
  if (!_userEdit) _userEdit = { name: u.name, level: u.level, mode: u.mode, memorizeTime: u.preferredMemorizeTime, reviewTime: u.preferredReviewTime, restDays: [...u.restDayOfWeek], notifications: u.notificationsEnabled };
  const e = _userEdit;
  return `<div>
    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.user} بيانات المستخدم</h3>
      <div class="mb-3"><label class="label">الاسم</label><input class="input" value="${esc(e.name)}" oninput="_userEdit.name=this.value" /></div>
      <div class="mb-3">
        <label class="label">المستوى</label>
        <div class="grid grid-3">
          ${[{v:'beginner',l:'مبتدئ'},{v:'intermediate',l:'متوسط'},{v:'advanced',l:'متقدم'}].map(o => `
            <label class="radio-card ${e.level === o.v ? 'checked' : ''}" style="padding:8px;justify-content:center">
              <input type="radio" name="set-level" value="${o.v}" ${e.level === o.v ? 'checked' : ''} onchange="_userEdit.level=this.value;render()" style="display:none" />
              <span class="text-sm">${o.l}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="mb-3">
        <label class="label">النمط</label>
        <div class="grid grid-2">
          ${[{v:'memorize_review',l:'حفظ + مراجعة'},{v:'memorize_only',l:'حفظ فقط'}].map(o => `
            <label class="radio-card ${e.mode === o.v ? 'checked' : ''}" style="padding:8px;justify-content:center">
              <input type="radio" name="set-mode" value="${o.v}" ${e.mode === o.v ? 'checked' : ''} onchange="_userEdit.mode=this.value;render()" style="display:none" />
              <span class="text-sm">${o.l}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="grid grid-2 mb-3">
        <div><label class="label">${ICONS.clock} وقت الحفظ</label><input type="time" class="input" value="${e.memorizeTime}" onchange="_userEdit.memorizeTime=this.value" /></div>
        <div><label class="label">${ICONS.clock} وقت المراجعة</label><input type="time" class="input" value="${e.reviewTime}" onchange="_userEdit.reviewTime=this.value" /></div>
      </div>
      <div class="mb-3">
        <label class="label">أيام الراحة</label>
        <div class="grid" style="grid-template-columns:repeat(7,1fr);gap:4px">
          ${[{day:6,l:'السبت'},{day:0,l:'الأحد'},{day:1,l:'الإثنين'},{day:2,l:'الثلاثاء'},{day:3,l:'الأربعاء'},{day:4,l:'الخميس'},{day:5,l:'الجمعة'}].map(d => `
            <button onclick="_userEdit.restDays.includes(${d.day}) ? _userEdit.restDays = _userEdit.restDays.filter(x => x !== ${d.day}) : _userEdit.restDays.push(${d.day}); render()" style="padding:8px 4px;border-radius:8px;border:1px solid ${e.restDays.includes(d.day) ? 'var(--primary)' : 'var(--border)'};background:${e.restDays.includes(d.day) ? 'var(--primary)' : 'var(--card)'};color:${e.restDays.includes(d.day) ? 'white' : 'inherit'};font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">${d.l}</button>
          `).join('')}
        </div>
      </div>
      <div class="flex justify-between items-center p-3 mb-3" style="border:1px solid var(--border);border-radius:8px">
        <span class="text-sm font-semibold">تفعيل التذكيرات</span>
        <button onclick="_userEdit.notifications=!_userEdit.notifications;render()" style="background:${e.notifications?'var(--primary)':'var(--muted)'};color:white;width:44px;height:24px;border-radius:999px;position:relative;border:none;cursor:pointer">
          <span style="position:absolute;width:18px;height:18px;border-radius:999px;background:white;top:3px;${e.notifications?'left:3px':'right:3px'};transition:all 0.2s"></span>
        </button>
      </div>
      <button class="btn btn-primary btn-block" onclick="saveUserSettings()">${ICONS.check} حفظ بياناتي</button>
    </div></div>

    <div class="card"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3">${document.documentElement.classList.contains('dark') ? ICONS.moon : ICONS.sun} المظهر</h3>
      <div class="grid grid-2">
        <button onclick="setTheme('light')" class="flex items-center gap-2 p-3" style="border-radius:8px;border:1px solid ${!document.documentElement.classList.contains('dark') ? 'var(--primary)' : 'var(--border)'};background:${!document.documentElement.classList.contains('dark') ? 'rgba(26,107,84,0.05)' : 'var(--card)'};cursor:pointer;font-family:inherit">${ICONS.sun}<span>فاتح</span></button>
        <button onclick="setTheme('dark')" class="flex items-center gap-2 p-3" style="border-radius:8px;border:1px solid ${document.documentElement.classList.contains('dark') ? 'var(--primary)' : 'var(--border)'};background:${document.documentElement.classList.contains('dark') ? 'rgba(26,107,84,0.05)' : 'var(--card)'};cursor:pointer;font-family:inherit">${ICONS.moon}<span>داكن</span></button>
      </div>
    </div></div>
  </div>`;
}

function saveUserSettings() {
  const e = _userEdit;
  updateUser({ name: e.name.trim() || 'مستخدم', level: e.level, mode: e.mode, preferredMemorizeTime: e.memorizeTime, preferredReviewTime: e.reviewTime, restDayOfWeek: e.restDays, notificationsEnabled: e.notifications });
  _userEdit = null;
  toast('تم حفظ بياناتك بنجاح ✨', 'success');
  render();
}

let _planEdit = null;
function renderSettingsPlan(plan, u) {
  if (!_planEdit) _planEdit = { totalDays: plan.config.totalDays, fromSurah: plan.config.fromSurah, fromAyah: plan.config.fromAyah, toSurah: plan.config.toSurah, toAyah: plan.config.toAyah };
  const e = _planEdit;
  return `<div>
    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.calendar} إعدادات الخطة</h3>
      <div class="mb-3">
        <div class="flex justify-between mb-2"><label class="label" style="margin:0">عدد الأيام</label><span class="badge">${toAr(e.totalDays)} يومًا</span></div>
        <input type="range" min="7" max="1825" value="${e.totalDays}" oninput="_planEdit.totalDays=+this.value;render()" />
        <div class="flex flex-wrap gap-2 mt-2">
          ${[{d: 30, l: 'شهر'},{d: 90, l: '٣ شهور'},{d: 180, l: '٦ شهور'},{d: 365, l: 'سنة'},{d: 730, l: 'سنتان'},{d: 1095, l: '٣ سنوات'},{d: 1460, l: '٤ سنوات'},{d: 1825, l: '٥ سنوات'}].map(o => `<button class="btn btn-sm ${e.totalDays === o.d ? 'btn-primary' : 'btn-outline'}" onclick="_planEdit.totalDays=${o.d};render()">${o.l}</button>`).join('')}
        </div>
        <p class="text-xs text-muted mt-2">تعديل عدد الأيام سيحافظ على ما تم حفظه</p>
      </div>
      <div class="grid grid-2 mb-3">
        <div><label class="label">من السورة</label>
          <select class="select" onchange="_planEdit.fromSurah=+this.value; _planEdit.fromAyah=1; render()">
            ${SURAH_META.map(s => `<option value="${s.number}" ${e.fromSurah === s.number ? 'selected' : ''}>${s.number}. ${s.name}</option>`).join('')}
          </select>
        </div>
        <div><label class="label">إلى السورة</label>
          <select class="select" onchange="_planEdit.toSurah=+this.value; render()">
            ${SURAH_META.filter(s => s.number >= e.fromSurah).map(s => `<option value="${s.number}" ${e.toSurah === s.number ? 'selected' : ''}>${s.number}. ${s.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid grid-2 mb-3">
        <div><label class="label">من آية</label>
          <input type="range" min="1" max="${getSurahMeta(e.fromSurah)?.ayahCount || 1}" value="${e.fromAyah}" oninput="_planEdit.fromAyah=+this.value; render()" />
          <div class="text-xs text-muted mt-1">${toAr(e.fromAyah)}</div>
        </div>
        <div><label class="label">إلى آية</label>
          <input type="range" min="1" max="${getSurahMeta(e.toSurah)?.ayahCount || 1}" value="${e.toAyah}" oninput="_planEdit.toAyah=+this.value; render()" />
          <div class="text-xs text-muted mt-1">${toAr(e.toAyah)}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-block" onclick="savePlanSettings()">${ICONS.check} تحديث الخطة</button>
      <button class="btn btn-outline btn-block mt-2" onclick="regeneratePlanFromSettings()">${ICONS.refresh} إعادة تنظيم الخطة</button>
    </div></div>
  </div>`;
}

function savePlanSettings() {
  const e = _planEdit;
  const newConfig = { ...state.plan.config, totalDays: e.totalDays, fromSurah: e.fromSurah, fromAyah: e.fromAyah, toSurah: e.toSurah, toAyah: e.toAyah };
  regeneratePlan(newConfig);
  _planEdit = null;
  toast('تم تحديث الخطة بنجاح ✨', 'success');
  render();
}

function regeneratePlanFromSettings() {
  regeneratePlan(state.plan.config);
  toast('تمت إعادة تنظيم الخطة بنجاح 🔄', 'success');
  render();
}

function renderSettingsData() {
  return `<div>
    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.download} البيانات</h3>
      <button class="btn btn-outline btn-block mb-2" onclick="exportJsonData()">${ICONS.download} تصدير البيانات</button>
      <label class="btn btn-outline btn-block" style="cursor:pointer">
        ${ICONS.upload} استيراد البيانات
        <input type="file" accept=".json" style="display:none" onchange="importJsonData(event)" />
      </label>
    </div></div>

    <div class="card mb-4"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3">${ICONS.refresh} إعادة توزيع الخطة</h3>
      <p class="text-xs text-muted mb-3">إذا فاتتك أيام، يمكنك إعادة توزيعها على الأيام المتبقية.</p>
      <button class="btn btn-outline btn-block" onclick="redistributePlan(); closeSettings()">${ICONS.refresh} إعادة توزيع الأيام الفائتة</button>
    </div></div>

    <div class="card"><div class="card-pad">
      <h3 class="text-base font-bold flex items-center gap-2 mb-3" style="color:var(--danger)">${ICONS.trash} إعادة ضبط</h3>
      <p class="text-xs text-muted mb-3">سيتم حذف جميع بياناتك نهائيًا: خطتك، إنجازاتك، أخطاؤك. لا يمكن التراجع.</p>
      <button class="btn btn-danger btn-block" onclick="if(confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات نهائيًا.')) resetAll()">${ICONS.trash} إعادة ضبط كل البيانات</button>
    </div></div>

    <div class="card mt-4" style="border-style:dashed"><div class="card-pad text-center text-xs text-muted">
      رفيق القرآن - مساعدك الذكي لحفظ القرآن الكريم<br>
      <span style="font-size:10px">جميع بياناتك محفوظة محليًا على جهازك</span>
    </div></div>
  </div>`;
}

function exportJsonData() {
  const data = exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rafiq-quran-backup-${formatDate(new Date())}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('تم تصدير البيانات بنجاح', 'success');
}

function importJsonData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (importData(e.target.result)) {
      toast('تم استيراد البيانات بنجاح', 'success');
      setTimeout(() => render(), 500);
    } else {
      toast('فشل استيراد الملف', 'error');
    }
  };
  reader.readAsText(file);
}

// ================== INIT ==================
loadState();
render();

(function startAppLoader() {
  const loader = document.getElementById('app-loader');
  const app = document.getElementById('app');
  if (!loader || !app) return;

  // Keep the splash screen for exactly 10 seconds, then fade it out smoothly.
  setTimeout(() => {
    app.classList.add('app-ready');
    loader.classList.add('is-hidden');
    setTimeout(() => loader.remove(), 950);
  }, 2000);
})();

// Auto-redistribute on first load
if (state.user && state.plan) {
  try {
    const today = formatDate(new Date());
    const r = redistributeMissedDays(today);
    if (r && r.daysAffected > 0) {
      addSuggestion({ type: 'rest', message: `فاتك ${r.daysAffected === 1 ? 'يوم' : r.daysAffected + ' أيام'}، أعدنا تنظيم خطة اليوم تلقائيًا حتى تستمر بدون ضغط 🌱`, severity: 'info' });
      render();
    }
  } catch (e) { console.warn('redistribute failed', e); }
}

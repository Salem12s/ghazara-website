/**
 * ============================================================================
 * محرك بوابة غزارة المتكامل (يعمل بنسبة 100% مباشرة من Google Sheets دون أي بيانات وهمية)
 * مرتبط بقاعدة بيانات Google Sheets: 1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0
 * يدعم الفئات الأربع للمستخدمين: (مدير تنفيذي، موارد بشرية، مدير قسم، موظف)
 * ============================================================================
 */

const GHAZARA_CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyJFrFKg1PdJfnXFBmYL-9NNbGNth-J1InmDJZgm2vOVHuj8LcHaEPgwSAWkz4PFLG_Fg/exec',
    SPREADSHEET_ID: '1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0',
    TIMEZONE: 'Asia/Aden',
    WHATSAPP_NUMBER: '967783334002',
    STORAGE_KEY_SESSION: 'ghazara_live_user_session_v4',
    STORAGE_KEY_PORTAL_BUNDLE: 'ghazara_live_portal_bundle_v4'
};

const USER_TIERS_META = {
    'مدير تنفيذي': {
        badge: 'bg-ghazara-purple text-white',
        label: 'مدير تنفيذي',
        title: 'بوابة المدير التنفيذي الشاملة',
        desc: 'صلاحية شاملة لمنح الصلاحيات للمديرين والموظفين، استخراج التقارير الشهرية لكافة الأقسام، واعتماد الإجازات والمهام والمالية والعملاء.',
        defaultPerms: [
            'all_access', 'manage_permissions', 'monthly_reports', 'manage_employees',
            'approve_leaves_hr', 'approve_leaves_exec', 'manage_all_tasks', 'manage_dept_tasks',
            'manage_customers', 'manage_finance', 'manage_leads', 'manage_suggestions', 'manage_backups'
        ]
    },
    'موارد بشرية': {
        badge: 'bg-ghazara-teal text-white',
        label: 'موارد بشرية',
        title: 'بوابة الموارد البشرية والشؤون الإدارية والمالية',
        desc: 'إضافة وحذف الموظفين، اعتماد طلبات الإجازات، إسناد ومتابعة المهام الشخصية أو عبر مديري الأقسام، وإدارة العملاء والقيود المالية.',
        defaultPerms: [
            'manage_employees', 'approve_leaves_hr', 'manage_all_tasks', 'manage_customers',
            'manage_finance', 'apply_leave', 'submit_suggestion'
        ]
    },
    'مدير قسم': {
        badge: 'bg-ghazara-orange text-white',
        label: 'مدير قسم',
        title: 'بوابة مدير القسم',
        desc: 'إسناد المهام لموظفي القسم، منح الصلاحيات لموظفي القسم، متابعة المهام الخاصة، وإدارة متطلبات العملاء وطلبات الموقع الخاصة بالقسم.',
        defaultPerms: [
            'manage_dept_tasks', 'manage_dept_permissions', 'manage_dept_customers',
            'manage_leads', 'apply_leave', 'submit_suggestion'
        ]
    },
    'موظف': {
        badge: 'bg-purple-100 text-ghazara-purpleDark border border-purple-200',
        label: 'موظف',
        title: 'بوابة الموظف التنفيذية',
        desc: 'إنجاز وتحديث المهام المكلف بها من الإدارة أو مدير القسم، تقديم طلبات الإجازات، وتقديم مقترحات تطوير العمل للإدارة.',
        defaultPerms: [
            'view_own_tasks', 'apply_leave', 'submit_suggestion'
        ]
    }
};

const PERMISSION_CATALOG = [
    { key: 'manage_all_tasks', label: 'إدارة وإسناد المهام لجميع الأقسام', scope: 'exec' },
    { key: 'manage_dept_tasks', label: 'إسناد ومتابعة مهام القسم', scope: 'dept' },
    { key: 'manage_employees', label: 'إضافة وتعديل وحذف الموظفين', scope: 'exec' },
    { key: 'approve_leaves_hr', label: 'اعتماد طلبات الإجازات (موارد بشرية)', scope: 'exec' },
    { key: 'approve_leaves_exec', label: 'الاعتماد النهائي للإجازات (إدارة تنفيذية)', scope: 'exec' },
    { key: 'manage_customers', label: 'إضافة وتعديل كافة العملاء والعقود والأقساط', scope: 'exec' },
    { key: 'manage_dept_customers', label: 'متابعة وتحديث خدمات عملاء القسم', scope: 'dept' },
    { key: 'manage_finance', label: 'إدارة القيود المالية (الإيرادات والمصروفات)', scope: 'exec' },
    { key: 'manage_leads', label: 'متابعة وتحديث طلبات الموقع الإلكتروني', scope: 'dept' },
    { key: 'monthly_reports', label: 'استخراج التقارير الشهرية للأقسام', scope: 'exec' },
    { key: 'manage_suggestions', label: 'مراجعة مقترحات الموظفين والرد عليها', scope: 'dept' },
    { key: 'manage_backups', label: 'إدارة النسخ الاحتياطي وسجل التعديلات', scope: 'exec' }
];

const TASK_CATEGORIES = [
    { id: 'CAT-01', name: 'مهام يجب رفعها إلى الإدارة التنفيذية', color: '#5B2C83' },
    { id: 'CAT-02', name: 'مهام وردت إليّ من الإدارة التنفيذية', color: '#7C46AD' },
    { id: 'CAT-03', name: 'مهام تُرفع إلى قسم التسويق والإعلام الرقمي', color: '#EC8232' },
    { id: 'CAT-04', name: 'مهام وردت إليّ من قسم التسويق والإعلام الرقمي', color: '#F59E56' },
    { id: 'CAT-05', name: 'مهام تُرفع إلى قسم التطوير المؤسسي والموارد البشرية', color: '#38A89D' },
    { id: 'CAT-06', name: 'مهام وردت إليّ من قسم التطوير المؤسسي والموارد البشرية', color: '#0D9488' },
    { id: 'CAT-07', name: 'مهام تُرفع إلى فريق المبيعات والمسوقين', color: '#4F46E5' },
    { id: 'CAT-08', name: 'مهام وردت إليّ من فريق المبيعات والمسوقين', color: '#E11D48' }
];

const DEPARTMENTS_LIST = [
    'الإدارة العليا',
    'الموارد البشرية',
    'المبيعات وتطوير الأعمال',
    'التسويق',
    'الإعلام والإنتاج',
    'التصميم والمونتاج',
    'المالية والحسابات'
];

/**
 * حالة البوابة: فارغة افتراضياً وتُعبأ حصرياً من Google Sheets (Code.gs)
 */
let PORTAL = {
    user: null,
    activeTab: 'tasks',
    activeTaskCategory: 'ALL',
    activeTaskStatFilter: 'ALL',
    users: [],
    employees: [],
    tasks: [],
    leaves: [],
    customers: [],
    finance: [],
    leads: [],
    suggestions: [],
    reminders: [],
    notifications: [],
    auditLogs: [],
    backups: [],
    editingTaskSubtasks: [],
    editingCustomerInstallments: [],
    pendingTempUser: null,
    pendingTempPass: null
};

/**
 * ============================================================================
 * 1. التهيئة ومسح أي كاش قديم يحتوي على بيانات افتراضية
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    purgeLegacyDefaultCache();
    loadPortalCache();
    startAdenClock();

    const savedUser = getSavedSessionUser();
    if (savedUser && savedUser.username) {
        PORTAL.user = savedUser;
        enterAuthenticatedPortal();
    } else {
        showLoginScreen();
    }
});

function purgeLegacyDefaultCache() {
    try {
        [
            'ghazara_users_sheet_v3',
            'ghazara_active_user_session_v3',
            'ghazara_portal_bundle_cache_v3',
            'ghazara_users_sheet_cache',
            'ghazara_active_user_session',
            'ghazara_tasks_dashboard_bundle'
        ].forEach(k => localStorage.removeItem(k));
    } catch (e) {}
}

function getTodayAden() {
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: GHAZARA_CONFIG.TIMEZONE,
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(new Date());
        const y = parts.find(p => p.type === 'year').value;
        const m = parts.find(p => p.type === 'month').value;
        const d = parts.find(p => p.type === 'day').value;
        return `${y}-${m}-${d}`;
    } catch (e) {
        return new Date().toISOString().slice(0, 10);
    }
}

function getCurrentMonthAden() {
    return getTodayAden().slice(0, 7);
}

function getNowTimestampAden() {
    try {
        return new Date().toLocaleString('sv-SE', { timeZone: GHAZARA_CONFIG.TIMEZONE });
    } catch (e) {
        return new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
}

function startAdenClock() {
    const tick = () => {
        const now = new Date();
        try {
            const dateStr = new Intl.DateTimeFormat('ar-YE', {
                timeZone: GHAZARA_CONFIG.TIMEZONE,
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            }).format(now);
            const timeStr = new Intl.DateTimeFormat('en-US', {
                timeZone: GHAZARA_CONFIG.TIMEZONE,
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            }).format(now);
            const el = document.getElementById('portal-live-clock');
            if (el) el.textContent = `${dateStr} • ${timeStr}`;
        } catch (e) {}
    };
    tick();
    setInterval(tick, 1000);
}

function loadPortalCache() {
    try {
        const raw = localStorage.getItem(GHAZARA_CONFIG.STORAGE_KEY_PORTAL_BUNDLE);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users)) PORTAL.users = parsed.users;
        if (Array.isArray(parsed.employees)) PORTAL.employees = parsed.employees;
        if (Array.isArray(parsed.tasks)) PORTAL.tasks = parsed.tasks;
        if (Array.isArray(parsed.leaves)) PORTAL.leaves = parsed.leaves;
        if (Array.isArray(parsed.customers)) PORTAL.customers = parsed.customers;
        if (Array.isArray(parsed.finance)) PORTAL.finance = parsed.finance;
        if (Array.isArray(parsed.leads)) PORTAL.leads = parsed.leads;
        if (Array.isArray(parsed.suggestions)) PORTAL.suggestions = parsed.suggestions;
        if (Array.isArray(parsed.reminders)) PORTAL.reminders = parsed.reminders;
        if (Array.isArray(parsed.notifications)) PORTAL.notifications = parsed.notifications;
        if (Array.isArray(parsed.auditLogs)) PORTAL.auditLogs = parsed.auditLogs;
        if (Array.isArray(parsed.backups)) PORTAL.backups = parsed.backups;
    } catch (e) {}
}

function savePortalCache() {
    try {
        localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_PORTAL_BUNDLE, JSON.stringify({
            users: PORTAL.users,
            employees: PORTAL.employees,
            tasks: PORTAL.tasks,
            leaves: PORTAL.leaves,
            customers: PORTAL.customers,
            finance: PORTAL.finance,
            leads: PORTAL.leads,
            suggestions: PORTAL.suggestions,
            reminders: PORTAL.reminders,
            notifications: PORTAL.notifications,
            auditLogs: PORTAL.auditLogs,
            backups: PORTAL.backups
        }));
    } catch (e) {}
}

function getSavedSessionUser() {
    try {
        const raw = localStorage.getItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function resolveTier(jobRole, department, customTier) {
    if (USER_TIERS_META[customTier]) return customTier;
    const r = String(jobRole || '');
    const d = String(department || '');
    if (r.includes('المدير التنفيذي') || r.includes('مدير تنفيذي') || r.toLowerCase() === 'ceo') return 'مدير تنفيذي';
    if (r.includes('موارد بشرية') || r.includes('الموارد البشرية') || d.includes('الموارد البشرية')) return 'موارد بشرية';
    if (r.includes('مدير') || r.includes('رئيس قسم')) return 'مدير قسم';
    return 'موظف';
}

function getEffectivePerms(u) {
    if (!u) return [];
    const tier = u.userTier || resolveTier(u.jobRole, u.department, u.specialty);
    const base = new Set(USER_TIERS_META[tier]?.defaultPerms || USER_TIERS_META['موظف'].defaultPerms);
    if (String(u.jobRole || '').includes('محاسب')) base.add('manage_finance');
    if (Array.isArray(u.permissions)) {
        u.permissions.forEach(p => base.add(p));
    }
    return Array.from(base);
}

function hasPerm(permKey) {
    const u = PORTAL.user;
    if (!u) return false;
    if (u.userTier === 'مدير تنفيذي') return true;
    const perms = getEffectivePerms(u);
    return perms.includes('all_access') || perms.includes(permKey);
}

async function callBackendAPI(payload) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 14000);
        const res = await fetch(GHAZARA_CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timer);
        return await res.json();
    } catch (err) {
        return { networkError: true, error: err.message };
    }
}

function showPortalToast(msg, type = 'success') {
    const el = document.getElementById('portal-toast');
    if (!el) return;
    let colors = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (type === 'error') colors = 'bg-red-50 text-red-700 border-red-200';
    if (type === 'warning') colors = 'bg-amber-50 text-amber-800 border-amber-200';
    el.className = `fixed bottom-5 left-5 z-50 max-w-md rounded-2xl px-4 py-3.5 shadow-2xl border text-xs sm:text-sm font-bold transition-all no-print ${colors}`;
    el.innerHTML = msg;
    el.classList.remove('hidden');
    clearTimeout(window._portalToastTimer);
    window._portalToastTimer = setTimeout(() => el.classList.add('hidden'), 4500);
}

/**
 * ============================================================================
 * 2. شاشة تسجيل الدخول المباشر من Google Sheets فقط (/portai/login)
 * ============================================================================
 */
function showLoginScreen() {
    document.getElementById('screen-login').classList.remove('hidden');
    document.getElementById('screen-portal').classList.add('hidden');
}

function switchLoginSubView(view) {
    document.getElementById('auth-alert').classList.add('hidden');
    ['login', 'forgot', 'change-password'].forEach(v => {
        document.getElementById('view-' + v)?.classList.add('hidden');
    });
    document.getElementById('view-' + view)?.classList.remove('hidden');
}

function showAuthAlert(msg, type = 'error') {
    const box = document.getElementById('auth-alert');
    if (!box) return;
    box.className = 'mb-5 p-4 rounded-2xl text-xs sm:text-sm font-bold border ' + (
        type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
        type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
        'bg-red-50 text-red-700 border-red-200'
    );
    box.innerHTML = msg;
    box.classList.remove('hidden');
}

async function handlePortalLoginSubmit(event) {
    event.preventDefault();
    const idInput = document.getElementById('loginIdentifier').value.trim();
    const passInput = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('login-submit-btn');
    const spinner = document.getElementById('login-spinner');
    const btnText = document.getElementById('login-btn-text');

    if (!idInput || !passInput) {
        showAuthAlert('يرجى إدخال اسم المستخدم وكلمة المرور.');
        return;
    }

    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'جاري التحقق من قاعدة البيانات...';

    const apiRes = await callBackendAPI({
        action: 'login',
        identifier: idInput,
        password: passInput
    });

    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'تسجيل الدخول';

    if (apiRes.networkError) {
        showAuthAlert('تعذر الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت.');
        return;
    }

    if (apiRes.status !== 'success' || !apiRes.user) {
        showAuthAlert(apiRes.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
        return;
    }

    const authenticated = apiRes.user;
    authenticated.userTier = authenticated.userTier || resolveTier(authenticated.jobRole, authenticated.department, authenticated.specialty);
    authenticated.permissions = getEffectivePerms(authenticated);

    if (authenticated.mustChangePassword) {
        PORTAL.pendingTempUser = authenticated;
        PORTAL.pendingTempPass = passInput;
        switchLoginSubView('change-password');
        showAuthAlert(`مرحباً <strong>${escapeHtml(authenticated.empName)}</strong>، يرجى تعيين كلمة مرور جديدة لحسابك الآن.`, 'warning');
        return;
    }

    PORTAL.user = authenticated;
    try {
        localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION, JSON.stringify(authenticated));
    } catch (e) {}

    enterAuthenticatedPortal();
}

async function handlePortalForgotSubmit(event) {
    event.preventDefault();
    const identifier = document.getElementById('forgotIdentifier').value.trim();
    if (!identifier) return;

    const btn = document.getElementById('forgot-submit-btn');
    btn.disabled = true;

    const res = await callBackendAPI({ action: 'forgotPassword', identifier: identifier });
    btn.disabled = false;

    if (res.networkError) {
        showAuthAlert('تعذر الاتصال بقاعدة البيانات. تأكد من اتصال الإنترنت.');
        return;
    }

    if (res.status === 'success') {
        switchLoginSubView('login');
        document.getElementById('loginIdentifier').value = identifier;
        showAuthAlert(res.message, 'success');
    } else {
        showAuthAlert(res.message || 'لم يتم العثور على حساب مطابق.');
    }
}

async function handlePortalChangePassSubmit(event) {
    event.preventDefault();
    const p1 = document.getElementById('newPassword').value.trim();
    const p2 = document.getElementById('confirmNewPassword').value.trim();
    if (p1 !== p2) {
        showAuthAlert('كلمتا المرور الجديدتان غير متطابقتين.');
        return;
    }
    if (!PORTAL.pendingTempUser) {
        switchLoginSubView('login');
        return;
    }

    const res = await callBackendAPI({
        action: 'changePassword',
        username: PORTAL.pendingTempUser.username,
        currentPassword: PORTAL.pendingTempPass,
        newPassword: p1
    });

    if (res.networkError || res.status !== 'success') {
        showAuthAlert(res.message || 'تعذر حفظ كلمة المرور الجديدة في قاعدة البيانات.');
        return;
    }

    PORTAL.pendingTempUser.mustChangePassword = false;
    PORTAL.user = PORTAL.pendingTempUser;
    try {
        localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION, JSON.stringify(PORTAL.user));
    } catch (e) {}
    enterAuthenticatedPortal();
}

function logoutPortalSession() {
    PORTAL.user = null;
    try {
        localStorage.removeItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION);
        localStorage.removeItem(GHAZARA_CONFIG.STORAGE_KEY_PORTAL_BUNDLE);
    } catch (e) {}
    document.getElementById('login-form')?.reset();
    switchLoginSubView('login');
    showLoginScreen();
}

/**
 * ============================================================================
 * 3. بناء واجهة البوابة ومزامنتها المباشرة مع Google Sheets
 * ============================================================================
 */
function enterAuthenticatedPortal() {
    document.getElementById('screen-login').classList.add('hidden');
    document.getElementById('screen-portal').classList.remove('hidden');

    const monthInput = document.getElementById('reportMonthFilter');
    if (monthInput && !monthInput.value) {
        monthInput.value = getCurrentMonthAden();
    }

    renderAuthenticatedPortalUI();
    syncPortalBundleInBackground();
}

async function syncPortalBundleInBackground() {
    const syncBadge = document.getElementById('sync-status-badge');
    if (syncBadge) {
        syncBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span><span>جاري الجلب من قاعدة البيانات...</span>`;
    }

    const res = await callBackendAPI({
        action: 'getPortalBundle',
        username: PORTAL.user?.username || '',
        userTier: PORTAL.user?.userTier || '',
        department: PORTAL.user?.department || '',
        empName: PORTAL.user?.empName || ''
    });

    if (!res.networkError && res.status === 'success') {
        PORTAL.users = Array.isArray(res.users) ? res.users : [];
        PORTAL.employees = Array.isArray(res.employees) ? res.employees : [];
        PORTAL.tasks = Array.isArray(res.tasks) ? res.tasks : [];
        PORTAL.leaves = Array.isArray(res.leaves) ? res.leaves : [];
        PORTAL.customers = Array.isArray(res.customers) ? res.customers : [];
        PORTAL.finance = Array.isArray(res.finance) ? res.finance : [];
        PORTAL.leads = Array.isArray(res.leads) ? res.leads : [];
        PORTAL.suggestions = Array.isArray(res.suggestions) ? res.suggestions : [];
        PORTAL.reminders = Array.isArray(res.reminders) ? res.reminders : [];
        PORTAL.notifications = Array.isArray(res.notifications) ? res.notifications : [];
        PORTAL.auditLogs = Array.isArray(res.auditLogs) ? res.auditLogs : [];
        PORTAL.backups = Array.isArray(res.backups) ? res.backups : [];

        if (res.currentUser) {
            PORTAL.user = {
                ...PORTAL.user,
                ...res.currentUser,
                userTier: res.currentUser.userTier || resolveTier(res.currentUser.jobRole, res.currentUser.department, ''),
                permissions: getEffectivePerms(res.currentUser)
            };
            try {
                localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION, JSON.stringify(PORTAL.user));
            } catch (e) {}
        }

        savePortalCache();

        if (syncBadge) {
            syncBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>متصل مباشرة بقاعدة البيانات</span>`;
        }
        renderAuthenticatedPortalUI();
    } else {
        if (syncBadge) {
            syncBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span><span>تعذر الاتصال بقاعدة البيانات</span>`;
        }
    }
}

function getAllowedTabsForCurrentUser() {
    const u = PORTAL.user;
    if (!u) return [];
    const tier = u.userTier;

    const allTabs = [
        { id: 'tasks', label: tier === 'موظف' ? 'مهامي المكلف بها' : (tier === 'مدير قسم' ? 'مهام القسم ومهامي' : 'لوحة المهام الشاملة'), icon: '📋', show: true },
        { id: 'leaves', label: (tier === 'موارد بشرية' || tier === 'مدير تنفيذي' || hasPerm('approve_leaves_hr') || hasPerm('approve_leaves_exec')) ? 'طلبات الإجازات والاعتماد' : 'طلب إجازة ومتابعتها', icon: '🌴', show: true },
        { id: 'suggestions', label: (tier === 'مدير تنفيذي' || tier === 'مدير قسم' || hasPerm('manage_suggestions')) ? 'مقترحات تطوير العمل' : 'تقديم مقترح للإدارة', icon: '💡', show: true },
        { id: 'customers', label: tier === 'مدير قسم' ? 'عملاء ومتطلبات القسم' : 'إدارة العملاء والعقود', icon: '🤝', show: tier === 'مدير تنفيذي' || tier === 'موارد بشرية' || tier === 'مدير قسم' || hasPerm('manage_customers') || hasPerm('manage_dept_customers') },
        { id: 'leads', label: 'طلبات الموقع الإلكتروني', icon: '🌐', show: tier === 'مدير تنفيذي' || tier === 'مدير قسم' || tier === 'موارد بشرية' || hasPerm('manage_leads') },
        { id: 'finance', label: 'المالية والحسابات', icon: '💰', show: tier === 'مدير تنفيذي' || tier === 'موارد بشرية' || hasPerm('manage_finance') },
        { id: 'employees', label: 'إدارة الموظفين والحسابات', icon: '👥', show: tier === 'مدير تنفيذي' || tier === 'موارد بشرية' || hasPerm('manage_employees') },
        { id: 'permissions', label: tier === 'مدير قسم' ? 'صلاحيات موظفي القسم' : 'إدارة الصلاحيات الشاملة', icon: '🔐', show: tier === 'مدير تنفيذي' || tier === 'مدير قسم' || hasPerm('manage_permissions') || hasPerm('manage_dept_permissions') },
        { id: 'monthly_reports', label: 'التقارير الشهرية للأقسام', icon: '📊', show: tier === 'مدير تنفيذي' || hasPerm('monthly_reports') },
        { id: 'backups', label: 'السجل والنسخ الاحتياطي', icon: '🛡️', show: tier === 'مدير تنفيذي' || hasPerm('manage_backups') }
    ];

    return allTabs.filter(t => t.show);
}

function renderAuthenticatedPortalUI() {
    const u = PORTAL.user;
    if (!u) return;

    const tierMeta = USER_TIERS_META[u.userTier] || USER_TIERS_META['موظف'];
    document.getElementById('header-user-name').textContent = u.empName || u.username;
    document.getElementById('header-user-role').textContent = `${u.jobRole || ''} • ${u.department || ''}`;
    const badgeEl = document.getElementById('header-user-tier-badge');
    badgeEl.textContent = tierMeta.label;
    badgeEl.className = `px-3 py-1 rounded-full text-xs font-bold ${tierMeta.badge}`;

    document.getElementById('banner-role-title').textContent = `${tierMeta.title} — ${u.empName || u.username}`;
    document.getElementById('banner-role-desc').textContent = tierMeta.desc;

    const allowedTabs = getAllowedTabsForCurrentUser();
    if (!allowedTabs.some(t => t.id === PORTAL.activeTab)) {
        PORTAL.activeTab = allowedTabs[0]?.id || 'tasks';
    }

    const navContainer = document.getElementById('portal-main-tabs');
    if (navContainer) {
        navContainer.innerHTML = allowedTabs.map(tab => {
            const active = PORTAL.activeTab === tab.id;
            return `
            <button type="button" onclick="switchPortalTab('${tab.id}')"
                class="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all ${active ? 'btn-purple-gradient shadow-md' : 'bg-white/85 text-slate-700 hover:bg-purple-50 border border-purple-100'}">
                <span>${tab.icon}</span>
                <span>${tab.label}</span>
            </button>
            `;
        }).join('');
    }

    ['tasks', 'leaves', 'suggestions', 'customers', 'leads', 'finance', 'employees', 'permissions', 'monthly_reports', 'backups'].forEach(id => {
        const sec = document.getElementById('tab-sec-' + id);
        if (sec) {
            if (id === PORTAL.activeTab) sec.classList.remove('hidden');
            else sec.classList.add('hidden');
        }
    });

    renderTasksSection();
    renderLeavesSection();
    renderSuggestionsSection();
    renderCustomersSection();
    renderLeadsSection();
    renderFinanceSection();
    renderEmployeesSection();
    renderPermissionsSection();
    renderMonthlyReportsSection();
    renderBackupsAndLogsSection();
}

function switchPortalTab(tabId) {
    PORTAL.activeTab = tabId;
    renderAuthenticatedPortalUI();
}

/**
 * ============================================================================
 * 4. قسم المهام (المهام)
 * ============================================================================
 */
function getScopedTasksForCurrentUser() {
    const u = PORTAL.user;
    if (!u) return [];
    if (u.userTier === 'مدير تنفيذي' || u.userTier === 'موارد بشرية' || hasPerm('manage_all_tasks')) {
        return PORTAL.tasks.filter(t => !t.isArchived);
    }
    if (u.userTier === 'مدير قسم' || hasPerm('manage_dept_tasks')) {
        const deptMembers = PORTAL.users.filter(x => x.department === u.department).map(x => x.empName);
        const deptFullNames = PORTAL.employees.filter(x => x.department === u.department).map(x => x.empName);
        return PORTAL.tasks.filter(t =>
            !t.isArchived && (
                t.assignee === u.empName ||
                t.createdBy === u.empName ||
                t.entityName === u.department ||
                deptMembers.includes(t.assignee) ||
                deptFullNames.includes(t.assignee)
            )
        );
    }
    return PORTAL.tasks.filter(t =>
        !t.isArchived && (
            t.assignee === u.empName ||
            t.assignee === u.username ||
            t.createdBy === u.empName
        )
    );
}

function renderTasksSection() {
    const u = PORTAL.user;
    if (!u) return;
    const today = getTodayAden();
    const scoped = getScopedTasksForCurrentUser();

    const canCreateTask = u.userTier === 'مدير تنفيذي' || u.userTier === 'موارد بشرية' || u.userTier === 'مدير قسم' || hasPerm('manage_all_tasks') || hasPerm('manage_dept_tasks');
    const newTaskBtn = document.getElementById('btn-open-new-task');
    if (newTaskBtn) {
        if (canCreateTask) newTaskBtn.classList.remove('hidden');
        else newTaskBtn.classList.add('hidden');
    }

    const kpis = {
        ALL: scoped.length,
        NEW: scoped.filter(t => t.status === 'جديدة').length,
        IN_PROGRESS: scoped.filter(t => t.status === 'قيد التنفيذ').length,
        COMPLETED: scoped.filter(t => t.status === 'مكتملة').length,
        OVERDUE: scoped.filter(t => t.status !== 'مكتملة' && t.status !== 'ملغاة' && t.dueDate && t.dueDate < today).length,
        DUE_TODAY: scoped.filter(t => t.status !== 'مكتملة' && t.status !== 'ملغاة' && t.dueDate === today).length,
        WAITING_RESPONSE: scoped.filter(t => t.status === 'بانتظار رد').length,
        WAITING_APPROVAL: scoped.filter(t => t.status === 'بانتظار اعتماد').length
    };

    Object.keys(kpis).forEach(k => {
        const el = document.getElementById('p-kpi-' + k);
        if (el) el.textContent = kpis[k];
    });

    const q = (document.getElementById('taskSearchInput')?.value || '').trim().toLowerCase();
    const stFilter = document.getElementById('taskStatusFilter')?.value || 'ALL';
    const deptFilter = document.getElementById('taskDeptFilter')?.value || 'ALL';

    const filtered = scoped.filter(t => {
        if (PORTAL.activeTaskStatFilter === 'NEW' && t.status !== 'جديدة') return false;
        if (PORTAL.activeTaskStatFilter === 'IN_PROGRESS' && t.status !== 'قيد التنفيذ') return false;
        if (PORTAL.activeTaskStatFilter === 'COMPLETED' && t.status !== 'مكتملة') return false;
        if (PORTAL.activeTaskStatFilter === 'OVERDUE' && !(t.status !== 'مكتملة' && t.status !== 'ملغاة' && t.dueDate && t.dueDate < today)) return false;
        if (PORTAL.activeTaskStatFilter === 'DUE_TODAY' && !(t.status !== 'مكتملة' && t.status !== 'ملغاة' && t.dueDate === today)) return false;
        if (PORTAL.activeTaskStatFilter === 'WAITING_RESPONSE' && t.status !== 'بانتظار رد') return false;
        if (PORTAL.activeTaskStatFilter === 'WAITING_APPROVAL' && t.status !== 'بانتظار اعتماد') return false;

        if (stFilter !== 'ALL' && t.status !== stFilter) return false;
        if (deptFilter !== 'ALL' && t.entityName !== deptFilter) return false;
        if (q) {
            const hay = `${t.taskId} ${t.title} ${t.description} ${t.assignee} ${t.entityName} ${t.source}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    const listEl = document.getElementById('portal-tasks-list');
    if (!listEl) return;

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="p-10 rounded-3xl bg-white/80 border border-dashed border-purple-200 text-center space-y-3">
                <p class="text-sm sm:text-base font-bold text-ghazara-purpleDark">لا توجد مهام مسجلة حالياً</p>
                <p class="text-xs text-slate-500">${canCreateTask ? 'يمكنك إسناد مهمة جديدة للموظفين أو الأقسام ليتم حفظها مباشرة في قاعدة البيانات.' : 'ستظهر هنا أي مهام تكلفك بها الإدارة أو مدير القسم فور إسنادها.'}</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = filtered.map(t => {
        const isOverdue = t.status !== 'مكتملة' && t.status !== 'ملغاة' && t.dueDate && t.dueDate < today;
        const respCount = Array.isArray(t.responses) ? t.responses.length : 0;
        return `
        <div class="p-4 sm:p-5 rounded-3xl bg-white/95 border ${isOverdue ? 'border-red-300' : 'border-purple-100'} shadow-sm space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-display text-xs font-extrabold text-ghazara-purple bg-ghazara-purpleSoft px-2.5 py-0.5 rounded-lg">${escapeHtml(t.taskId)}</span>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-ghazara-purpleDark">${escapeHtml(t.priority || 'متوسطة')}</span>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">${escapeHtml(t.status)}</span>
                        ${isOverdue ? `<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-600 text-white">⚠️ متأخرة</span>` : ''}
                    </div>
                    <h4 class="text-base font-bold text-ghazara-purpleDark">${escapeHtml(t.title)}</h4>
                    ${t.description ? `<p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(t.description)}</p>` : ''}
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <select onchange="quickUpdateTaskStatus('${t.taskId}', this.value)" class="text-xs font-bold rounded-xl border border-purple-200 bg-purple-50/60 px-2.5 py-1.5 text-ghazara-purpleDark outline-none">
                        <option value="جديدة" ${t.status === 'جديدة' ? 'selected' : ''}>جديدة</option>
                        <option value="قيد التنفيذ" ${t.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                        <option value="بانتظار رد" ${t.status === 'بانتظار رد' ? 'selected' : ''}>بانتظار رد</option>
                        <option value="بانتظار اعتماد" ${t.status === 'بانتظار اعتماد' ? 'selected' : ''}>بانتظار اعتماد</option>
                        <option value="مكتملة" ${t.status === 'مكتملة' ? 'selected' : ''}>مكتملة (100%)</option>
                        <option value="مؤجلة" ${t.status === 'مؤجلة' ? 'selected' : ''}>مؤجلة</option>
                    </select>
                    <button type="button" onclick="openTaskResponsePrompt('${t.taskId}')" class="px-3 py-1.5 rounded-xl bg-orange-50 text-ghazara-orange hover:bg-ghazara-orange hover:text-white text-xs font-bold transition-all">
                        الردود والملاحظات (${respCount})
                    </button>
                    ${canCreateTask ? `<button type="button" onclick="openTaskFormModal('${t.taskId}')" class="px-3 py-1.5 rounded-xl bg-ghazara-purpleSoft text-ghazara-purple text-xs font-bold">تعديل</button>` : ''}
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-purple-50 text-xs text-slate-600 items-center">
                <div class="md:col-span-8 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span><strong>القسم / الجهة:</strong> ${escapeHtml(t.entityName || '-')}</span>
                    <span><strong>المكلف بالتنفيذ:</strong> <span class="text-ghazara-purple font-bold">${escapeHtml(t.assignee || '-')}</span></span>
                    <span><strong>المسند:</strong> ${escapeHtml(t.createdBy || '-')}</span>
                    <span><strong>الموعد النهائي:</strong> <span dir="ltr" class="font-display font-bold">${escapeHtml(t.dueDate || '-')}</span></span>
                </div>
                <div class="md:col-span-4 flex items-center gap-2">
                    <span class="text-[11px] font-bold">الإنجاز:</span>
                    <input type="range" min="0" max="100" step="10" value="${t.progress || 0}" onchange="quickUpdateTaskProgress('${t.taskId}', this.value)" class="flex-grow accent-ghazara-purple cursor-pointer">
                    <span class="font-display font-bold text-ghazara-purpleDark w-9 text-left">${t.progress || 0}%</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function setTaskKpiFilter(key) {
    PORTAL.activeTaskStatFilter = key;
    renderTasksSection();
}

function openTaskFormModal(taskId = null) {
    const modal = document.getElementById('modal-task-form');
    const form = document.getElementById('form-portal-task');
    form.reset();

    const u = PORTAL.user;
    let assignable = PORTAL.users.length ? PORTAL.users : [u];
    if (u.userTier === 'مدير قسم' && !hasPerm('manage_all_tasks')) {
        assignable = assignable.filter(x => x.department === u.department);
    }

    const assigneeSelect = document.getElementById('tfAssignee');
    assigneeSelect.innerHTML = assignable.map(x => `<option value="${escapeHtml(x.empName)}">${escapeHtml(x.empName)} (${escapeHtml(x.jobRole || '')} - ${escapeHtml(x.department || '')})</option>`).join('');

    const deptSelect = document.getElementById('tfDepartment');
    if (u.userTier === 'مدير قسم' && !hasPerm('manage_all_tasks')) {
        deptSelect.innerHTML = `<option value="${escapeHtml(u.department)}">${escapeHtml(u.department)}</option>`;
    } else {
        deptSelect.innerHTML = DEPARTMENTS_LIST.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    }

    const catSelect = document.getElementById('tfCategory');
    catSelect.innerHTML = TASK_CATEGORIES.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');

    const today = getTodayAden();
    if (!taskId) {
        document.getElementById('tfTaskId').value = '';
        document.getElementById('tfStartDate').value = today;
        document.getElementById('tfDueDate').value = today;
        document.getElementById('tfPriority').value = 'متوسطة';
        document.getElementById('tfStatus').value = 'جديدة';
        document.getElementById('tfProgress').value = '0';
    } else {
        const t = PORTAL.tasks.find(x => x.taskId === taskId);
        if (!t) return;
        document.getElementById('tfTaskId').value = t.taskId;
        document.getElementById('tfTitle').value = t.title || '';
        document.getElementById('tfDescription').value = t.description || '';
        document.getElementById('tfDepartment').value = t.entityName || u.department;
        document.getElementById('tfCategory').value = t.source || TASK_CATEGORIES[0].name;
        document.getElementById('tfAssignee').value = t.assignee || '';
        document.getElementById('tfStartDate').value = t.startDate || today;
        document.getElementById('tfDueDate').value = t.dueDate || today;
        document.getElementById('tfPriority').value = t.priority || 'متوسطة';
        document.getElementById('tfStatus').value = t.status || 'جديدة';
        document.getElementById('tfProgress').value = t.progress || 0;
        document.getElementById('tfNotes').value = t.notes || '';
    }

    modal.classList.remove('hidden');
}

function closeTaskFormModal() {
    document.getElementById('modal-task-form').classList.add('hidden');
}

async function handleSavePortalTask(event) {
    event.preventDefault();
    const u = PORTAL.user;
    const now = getNowTimestampAden();
    let taskId = document.getElementById('tfTaskId').value.trim();
    const isEdit = Boolean(taskId);
    if (!taskId) {
        taskId = `TSK-2026-${String(PORTAL.tasks.length + 1).padStart(4, '0')}`;
    }

    const status = document.getElementById('tfStatus').value;
    const progress = status === 'مكتملة' ? 100 : Number(document.getElementById('tfProgress').value || 0);

    const existing = PORTAL.tasks.find(x => x.taskId === taskId);
    const taskObj = {
        taskId: taskId,
        title: document.getElementById('tfTitle').value.trim(),
        description: document.getElementById('tfDescription').value.trim(),
        entityName: document.getElementById('tfDepartment').value,
        source: document.getElementById('tfCategory').value,
        assignee: document.getElementById('tfAssignee').value,
        createdBy: existing ? existing.createdBy : u.empName,
        createdAt: existing ? existing.createdAt : now,
        startDate: document.getElementById('tfStartDate').value,
        dueDate: document.getElementById('tfDueDate').value,
        dueTime: '14:00',
        priority: document.getElementById('tfPriority').value,
        status: status,
        progress: progress,
        subtasks: existing ? existing.subtasks : [],
        relatedTasks: [],
        responses: existing ? existing.responses : [],
        notes: document.getElementById('tfNotes').value.trim(),
        attachments: [],
        completedAt: status === 'مكتملة' ? now : '',
        isArchived: false,
        updatedAt: now
    };

    closeTaskFormModal();
    const res = await callBackendAPI({
        action: 'saveTask',
        task: taskObj,
        byUser: u.empName
    });

    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ المهمة في قاعدة البيانات.', 'error');
        return;
    }

    if (isEdit) {
        const idx = PORTAL.tasks.findIndex(x => x.taskId === taskId);
        if (idx !== -1) PORTAL.tasks[idx] = taskObj;
    } else {
        PORTAL.tasks.unshift(taskObj);
    }
    savePortalCache();
    renderAuthenticatedPortalUI();
    showPortalToast(res.message || `تم حفظ المهمة (${taskId}) في قاعدة البيانات بنجاح.`);
}

async function quickUpdateTaskStatus(taskId, newStatus) {
    const t = PORTAL.tasks.find(x => x.taskId === taskId);
    if (!t) return;
    t.status = newStatus;
    if (newStatus === 'مكتملة') {
        t.progress = 100;
        t.completedAt = getNowTimestampAden();
    }
    t.updatedAt = getNowTimestampAden();
    renderAuthenticatedPortalUI();

    const res = await callBackendAPI({
        action: 'updateTaskStatus',
        taskId: taskId,
        status: newStatus,
        progress: t.progress,
        byUser: PORTAL.user?.empName || 'المستخدم'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر تحديث الحالة في قاعدة البيانات.', 'error');
        return;
    }
    savePortalCache();
    showPortalToast(`تم تحديث حالة المهمة (${taskId}) في قاعدة البيانات إلى "${newStatus}".`);
}

async function quickUpdateTaskProgress(taskId, newProg) {
    const t = PORTAL.tasks.find(x => x.taskId === taskId);
    if (!t) return;
    t.progress = Number(newProg);
    if (t.progress >= 100) {
        t.status = 'مكتملة';
        t.completedAt = getNowTimestampAden();
    } else if (t.status === 'جديدة' && t.progress > 0) {
        t.status = 'قيد التنفيذ';
    }
    t.updatedAt = getNowTimestampAden();
    renderAuthenticatedPortalUI();

    const res = await callBackendAPI({
        action: 'updateTaskStatus',
        taskId: taskId,
        status: t.status,
        progress: t.progress,
        byUser: PORTAL.user?.empName || 'المستخدم'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر تحديث نسبة الإنجاز في قاعدة البيانات.', 'error');
        return;
    }
    savePortalCache();
    showPortalToast(`تم تحديث نسبة إنجاز المهمة (${taskId}) إلى ${t.progress}%.`);
}

function openTaskResponsePrompt(taskId) {
    const t = PORTAL.tasks.find(x => x.taskId === taskId);
    if (!t) return;
    document.getElementById('respModalTaskId').value = taskId;
    document.getElementById('respModalTaskTitle').textContent = `${t.title} (${t.taskId})`;
    renderTaskResponsesModalList(t);
    document.getElementById('modal-task-responses').classList.remove('hidden');
}

function renderTaskResponsesModalList(t) {
    const box = document.getElementById('respModalList');
    const list = Array.isArray(t.responses) ? t.responses : [];
    if (!list.length) {
        box.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">لا توجد ردود أو ملاحظات مسجلة على هذه المهمة بعد.</p>`;
        return;
    }
    box.innerHTML = list.map(r => `
        <div class="p-3 rounded-2xl bg-white border border-purple-100 text-xs space-y-1">
            <div class="flex items-center justify-between">
                <span class="font-bold text-ghazara-purple">${escapeHtml(r.decisionType)} — ${escapeHtml(r.author)}</span>
                <span dir="ltr" class="font-display text-[10px] text-slate-400">${escapeHtml(r.createdAt)}</span>
            </div>
            <p class="text-slate-700">${escapeHtml(r.text)}</p>
        </div>
    `).join('');
}

async function handleSaveTaskResponse(event) {
    event.preventDefault();
    const taskId = document.getElementById('respModalTaskId').value;
    const type = document.getElementById('respModalType').value;
    const text = document.getElementById('respModalText').value.trim();
    if (!text) return;

    const t = PORTAL.tasks.find(x => x.taskId === taskId);
    if (!t) return;

    const res = await callBackendAPI({
        action: 'addTaskResponse',
        taskId: taskId,
        decisionType: type,
        responseText: text,
        byUser: PORTAL.user?.empName || 'المستخدم'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ الرد في قاعدة البيانات.', 'error');
        return;
    }

    if (!Array.isArray(t.responses)) t.responses = [];
    t.responses.push({
        id: 'RSP-' + Date.now(),
        author: PORTAL.user?.empName || 'المستخدم',
        decisionType: type,
        text: text,
        createdAt: getNowTimestampAden()
    });
    document.getElementById('respModalText').value = '';
    savePortalCache();
    renderTaskResponsesModalList(t);
    renderTasksSection();
    showPortalToast('تم حفظ الرد والملاحظة في Google Sheets.');
}

/**
 * ============================================================================
 * 5. قسم طلبات الإجازات (ورقة طلبات_الاجازات)
 * ============================================================================
 */
function calculateLeaveDaysInput() {
    const s = document.getElementById('lvStartDate')?.value;
    const e = document.getElementById('lvEndDate')?.value;
    const out = document.getElementById('lvDaysCount');
    if (s && e && out) {
        const d1 = new Date(s);
        const d2 = new Date(e);
        const diff = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
        out.value = diff;
    }
}

async function handleSubmitLeaveForm(event) {
    event.preventDefault();
    const u = PORTAL.user;
    if (!u) return;

    const now = getNowTimestampAden();
    const requestId = 'LVR-' + Date.now().toString().slice(-6);
    const leaveObj = {
        requestId: requestId,
        empId: u.empId || '',
        empName: u.empName,
        username: u.username,
        jobRole: u.jobRole,
        department: u.department,
        leaveType: document.getElementById('lvType').value,
        startDate: document.getElementById('lvStartDate').value,
        endDate: document.getElementById('lvEndDate').value,
        daysCount: Number(document.getElementById('lvDaysCount').value || 1),
        substitute: document.getElementById('lvSubstitute').value.trim(),
        reason: document.getElementById('lvReason').value.trim(),
        status: 'قيد المراجعة',
        hrApproval: 'قيد الانتظار',
        execApproval: 'قيد الانتظار',
        managementNotes: '',
        createdAt: now,
        updatedAt: now
    };

    const res = await callBackendAPI({
        action: 'submitLeaveRequest',
        leave: leaveObj
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ طلب الإجازة في قاعدة البيانات.', 'error');
        return;
    }

    PORTAL.leaves.unshift(leaveObj);
    savePortalCache();
    document.getElementById('form-leave-request').reset();
    renderLeavesSection();
    showPortalToast(res.message || `تم إرسال طلب الإجازة (${requestId}) وحفظه في قاعدة البيانات.`);
}

async function handleReviewLeave(requestId, stage, decision) {
    const lv = PORTAL.leaves.find(x => x.requestId === requestId);
    if (!lv) return;
    const byName = PORTAL.user?.empName || 'الإدارة';

    const res = await callBackendAPI({
        action: 'reviewLeaveRequest',
        requestId: requestId,
        stage: stage,
        decision: decision,
        byUser: byName
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر تحديث قرار الإجازة في قاعدة البيانات.', 'error');
        return;
    }

    if (stage === 'hr') {
        lv.hrApproval = `${decision} (${byName})`;
    } else if (stage === 'exec') {
        lv.execApproval = `${decision} (${byName})`;
        if (lv.hrApproval === 'قيد الانتظار' && decision === 'معتمد') {
            lv.hrApproval = 'معتمد مع الإدارة';
        }
    }
    lv.status = res.overallStatus || (decision === 'مرفوض' ? 'مرفوض' : 'معتمد');
    lv.updatedAt = getNowTimestampAden();

    savePortalCache();
    renderLeavesSection();
    renderMonthlyReportsSection();
    showPortalToast(`تم تحديث حالة طلب الإجازة (${requestId}) في قاعدة البيانات إلى: ${lv.status}`);
}

function renderLeavesSection() {
    const u = PORTAL.user;
    if (!u) return;
    const canApproveHR = u.userTier === 'موارد بشرية' || u.userTier === 'مدير تنفيذي' || hasPerm('approve_leaves_hr');
    const canApproveExec = u.userTier === 'مدير تنفيذي' || hasPerm('approve_leaves_exec');

    let list = PORTAL.leaves;
    if (!canApproveHR && !canApproveExec) {
        if (u.userTier === 'مدير قسم') {
            list = PORTAL.leaves.filter(l => l.department === u.department || l.username === u.username);
        } else {
            list = PORTAL.leaves.filter(l => l.username === u.username || l.empName === u.empName);
        }
    }

    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 text-xs">لا توجد طلبات إجازات مسجلة حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(l => {
        const badgeColor = l.status.includes('معتمد') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           l.status.includes('مرفوض') ? 'bg-red-50 text-red-700 border-red-200' :
                           'bg-amber-50 text-amber-800 border-amber-200';
        return `
        <tr class="border-b border-purple-50 hover:bg-purple-50/30 text-xs">
            <td class="p-3 font-display font-bold text-ghazara-purple">${escapeHtml(l.requestId)}</td>
            <td class="p-3">
                <div class="font-bold text-ghazara-purpleDark">${escapeHtml(l.empName)}</div>
                <div class="text-[11px] text-slate-500">${escapeHtml(l.department)} — ${escapeHtml(l.jobRole)}</div>
            </td>
            <td class="p-3 font-semibold">${escapeHtml(l.leaveType)}</td>
            <td class="p-3 font-display" dir="ltr">${escapeHtml(l.startDate)} → ${escapeHtml(l.endDate)} (${l.daysCount} يوم)</td>
            <td class="p-3">${escapeHtml(l.substitute || '-')}<div class="text-[11px] text-slate-500">${escapeHtml(l.reason || '')}</div></td>
            <td class="p-3">
                <div class="text-[11px]"><strong>الموارد البشرية:</strong> ${escapeHtml(l.hrApproval)}</div>
                <div class="text-[11px]"><strong>الإدارة التنفيذية:</strong> ${escapeHtml(l.execApproval)}</div>
            </td>
            <td class="p-3"><span class="px-2.5 py-1 rounded-full font-bold border ${badgeColor}">${escapeHtml(l.status)}</span></td>
            <td class="p-3">
                <div class="flex flex-wrap gap-1.5">
                    ${canApproveHR ? `
                        <button type="button" onclick="handleReviewLeave('${l.requestId}', 'hr', 'معتمد')" class="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold text-[11px]">موافقة HR</button>
                        <button type="button" onclick="handleReviewLeave('${l.requestId}', 'hr', 'مرفوض')" class="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold text-[11px]">رفض HR</button>
                    ` : ''}
                    ${canApproveExec ? `
                        <button type="button" onclick="handleReviewLeave('${l.requestId}', 'exec', 'معتمد')" class="px-2.5 py-1 rounded-lg bg-ghazara-purple text-white font-bold text-[11px]">اعتماد تنفيذي</button>
                    ` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * ============================================================================
 * 6. قسم مقترحات الموظفين لتطوير العمل (ورقة المقترحات)
 * ============================================================================
 */
async function handleSubmitSuggestionForm(event) {
    event.preventDefault();
    const u = PORTAL.user;
    if (!u) return;

    const now = getNowTimestampAden();
    const suggestionId = 'SUG-' + Date.now().toString().slice(-6);
    const sObj = {
        suggestionId: suggestionId,
        empName: u.empName,
        username: u.username,
        department: u.department,
        title: document.getElementById('sgTitle').value.trim(),
        details: document.getElementById('sgDetails').value.trim(),
        expectedImpact: document.getElementById('sgImpact').value.trim(),
        status: 'قيد الدراسة',
        managementReply: '',
        createdAt: now,
        updatedAt: now
    };

    const res = await callBackendAPI({
        action: 'submitSuggestion',
        suggestion: sObj
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ المقترح في قاعدة البيانات.', 'error');
        return;
    }

    PORTAL.suggestions.unshift(sObj);
    savePortalCache();
    document.getElementById('form-suggestion').reset();
    renderSuggestionsSection();
    showPortalToast('تم إرسال مقترحك لتطوير العمل وحفظه في قاعدة البيانات بنجاح.');
}

async function handleSaveSuggestionReply(suggestionId) {
    const s = PORTAL.suggestions.find(x => x.suggestionId === suggestionId);
    if (!s) return;
    const statusVal = document.getElementById('sg-status-' + suggestionId)?.value || s.status;
    const replyVal = (document.getElementById('sg-reply-' + suggestionId)?.value || '').trim();

    const res = await callBackendAPI({
        action: 'reviewSuggestion',
        suggestionId: suggestionId,
        status: statusVal,
        managementReply: replyVal,
        byUser: PORTAL.user?.empName || 'الإدارة'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ رد الإدارة في قاعدة البيانات.', 'error');
        return;
    }

    s.status = statusVal;
    s.managementReply = replyVal;
    s.updatedAt = getNowTimestampAden();
    savePortalCache();
    renderSuggestionsSection();
    showPortalToast('تم حفظ قرار ورد الإدارة على المقترح في قاعدة البيانات.');
}

function renderSuggestionsSection() {
    const u = PORTAL.user;
    if (!u) return;
    const canReview = u.userTier === 'مدير تنفيذي' || u.userTier === 'مدير قسم' || hasPerm('manage_suggestions');
    const box = document.getElementById('suggestions-list-box');
    if (!box) return;

    let list = PORTAL.suggestions;
    if (u.userTier === 'موظف' && !canReview) {
        list = PORTAL.suggestions.filter(s => s.username === u.username || s.empName === u.empName);
    }

    if (list.length === 0) {
        box.innerHTML = `<div class="p-8 rounded-3xl bg-white/80 border border-dashed border-purple-200 text-center text-xs text-slate-400">لا توجد مقترحات مسجلة بعد في قاعدة البيانات.</div>`;
        return;
    }

    box.innerHTML = list.map(s => `
        <div class="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="font-display text-xs font-bold text-ghazara-purple bg-ghazara-purpleSoft px-2.5 py-0.5 rounded-lg">${escapeHtml(s.suggestionId)}</span>
                    <h4 class="text-sm sm:text-base font-bold text-ghazara-purpleDark">${escapeHtml(s.title)}</h4>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-ghazara-orange border border-orange-200">${escapeHtml(s.status)}</span>
            </div>
            <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(s.details)}</p>
            ${s.expectedImpact ? `<p class="text-xs text-ghazara-teal font-semibold">🎯 الأثر المتوقع: ${escapeHtml(s.expectedImpact)}</p>` : ''}
            <div class="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-purple-50">
                <span>مقدم المقترح: <strong>${escapeHtml(s.empName)}</strong> (${escapeHtml(s.department)})</span>
                <span dir="ltr" class="font-display">${escapeHtml(s.createdAt)}</span>
            </div>
            ${s.managementReply ? `<div class="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-ghazara-purpleDark"><strong>رد الإدارة:</strong> ${escapeHtml(s.managementReply)}</div>` : ''}
            ${canReview ? `
                <div class="pt-2 border-t border-purple-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <select id="sg-status-${s.suggestionId}" class="sm:col-span-3 rounded-xl border border-purple-200 px-3 py-1.5 text-xs font-bold">
                        <option value="قيد الدراسة" ${s.status === 'قيد الدراسة' ? 'selected' : ''}>قيد الدراسة</option>
                        <option value="معتمد للتنفيذ" ${s.status === 'معتمد للتنفيذ' ? 'selected' : ''}>معتمد للتنفيذ</option>
                        <option value="مؤجل للمرحلة القادمة" ${s.status === 'مؤجل للمرحلة القادمة' ? 'selected' : ''}>مؤجل للمرحلة القادمة</option>
                    </select>
                    <input type="text" id="sg-reply-${s.suggestionId}" value="${escapeHtml(s.managementReply || '')}" placeholder="اكتب رد أو توجيه الإدارة على المقترح..." class="sm:col-span-7 rounded-xl border border-purple-200 px-3 py-1.5 text-xs">
                    <button type="button" onclick="handleSaveSuggestionReply('${s.suggestionId}')" class="sm:col-span-2 btn-purple-gradient py-1.5 px-3 rounded-xl text-xs font-bold">حفظ الرد</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

/**
 * ============================================================================
 * 7. قسم العملاء والعقود والأقساط (ورقة العملاء)
 * ============================================================================
 */
async function handleSaveCustomerForm(event) {
    event.preventDefault();
    const installmentsRaw = document.getElementById('custInstallments').value.trim();
    let parsedInstallments = [];
    if (installmentsRaw) {
        parsedInstallments = installmentsRaw.split(',').map((item, idx) => ({
            installmentNo: idx + 1,
            detail: item.trim()
        }));
    }

    const custObj = {
        customerName: document.getElementById('custName').value.trim(),
        phone: document.getElementById('custPhone').value.trim(),
        email: document.getElementById('custEmail').value.trim(),
        businessName: document.getElementById('custBusiness').value.trim(),
        location: document.getElementById('custLocation').value.trim(),
        contractType: document.getElementById('custContract').value.trim(),
        requiredServices: document.getElementById('custReqServices').value.trim(),
        installments: parsedInstallments,
        startDate: document.getElementById('custStartDate').value,
        endDate: document.getElementById('custEndDate').value,
        renewalCount: Number(document.getElementById('custRenewals').value || 0),
        remainingAmount: Number(document.getElementById('custRemaining').value || 0),
        socialPage: document.getElementById('custSocial').value.trim(),
        completedServices: document.getElementById('custCompServices').value.trim(),
        notes: document.getElementById('custNotes').value.trim()
    };

    const res = await callBackendAPI({
        action: 'saveCustomer',
        customer: custObj,
        byUser: PORTAL.user?.empName || 'الإدارة'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ بيانات العميل في قاعدة البيانات.', 'error');
        return;
    }

    const existingIdx = PORTAL.customers.findIndex(c => c.customerName === custObj.customerName && c.businessName === custObj.businessName);
    if (existingIdx !== -1) PORTAL.customers[existingIdx] = custObj;
    else PORTAL.customers.unshift(custObj);

    savePortalCache();
    document.getElementById('form-customer').reset();
    renderCustomersSection();
    renderMonthlyReportsSection();
    showPortalToast(`تم حفظ بيانات العميل (${custObj.businessName || custObj.customerName}) في قاعدة البيانات بنجاح.`);
}

function populateCustomerForEdit(index) {
    const c = PORTAL.customers[index];
    if (!c) return;
    document.getElementById('custName').value = c.customerName || '';
    document.getElementById('custPhone').value = c.phone || '';
    document.getElementById('custEmail').value = c.email || '';
    document.getElementById('custBusiness').value = c.businessName || '';
    document.getElementById('custLocation').value = c.location || '';
    document.getElementById('custContract').value = c.contractType || '';
    document.getElementById('custReqServices').value = c.requiredServices || '';
    document.getElementById('custInstallments').value = Array.isArray(c.installments) ? c.installments.map(i => i.detail || JSON.stringify(i)).join(', ') : '';
    document.getElementById('custStartDate').value = c.startDate || '';
    document.getElementById('custEndDate').value = c.endDate || '';
    document.getElementById('custRenewals').value = c.renewalCount || 0;
    document.getElementById('custRemaining').value = c.remainingAmount || 0;
    document.getElementById('custSocial').value = c.socialPage || '';
    document.getElementById('custCompServices').value = c.completedServices || '';
    document.getElementById('custNotes').value = c.notes || '';
}

function renderCustomersSection() {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    if (!PORTAL.customers.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 text-xs">لا توجد سجلات عملاء حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = PORTAL.customers.map((c, idx) => `
        <tr class="border-b border-purple-50 hover:bg-purple-50/30 text-xs">
            <td class="p-3">
                <div class="font-bold text-ghazara-purpleDark">${escapeHtml(c.customerName)}</div>
                <div class="text-[11px] text-ghazara-purple font-semibold">${escapeHtml(c.businessName)} (${escapeHtml(c.location || '-')})</div>
            </td>
            <td class="p-3 font-display" dir="ltr">${escapeHtml(c.phone || '-')}<div class="text-[10px] text-slate-400">${escapeHtml(c.email || '')}</div></td>
            <td class="p-3 font-semibold">${escapeHtml(c.contractType || '-')}</td>
            <td class="p-3 text-slate-700">${escapeHtml(c.requiredServices || '-')}</td>
            <td class="p-3 text-emerald-700 font-semibold">${escapeHtml(c.completedServices || 'قيد التنفيذ')}</td>
            <td class="p-3 font-display" dir="ltr">${escapeHtml(c.startDate || '-')} → ${escapeHtml(c.endDate || '-')}<div class="text-[10px] text-slate-500">تجديد: ${c.renewalCount || 0}</div></td>
            <td class="p-3 font-display font-bold text-ghazara-orange">${Number(c.remainingAmount || 0).toLocaleString()}</td>
            <td class="p-3">
                <button type="button" onclick="populateCustomerForEdit(${idx})" class="px-3 py-1 rounded-lg bg-ghazara-purpleSoft text-ghazara-purple font-bold">تعديل / تحديث</button>
            </td>
        </tr>
    `).join('');
}

/**
 * ============================================================================
 * 8. قسم طلبات الموقع الإلكتروني (ورقة طلبات الموقع)
 * ============================================================================
 */
async function updateWebsiteLeadStatus(leadId) {
    const st = document.getElementById('lead-st-' + leadId)?.value || 'قيد المتابعة';
    const asg = document.getElementById('lead-asg-' + leadId)?.value || '';

    const res = await callBackendAPI({
        action: 'updateLead',
        leadId: leadId,
        status: st,
        assignedTo: asg,
        byUser: PORTAL.user?.empName || 'الإدارة'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر تحديث طلب الموقع في قاعدة البيانات.', 'error');
        return;
    }

    const found = PORTAL.leads.find(l => l.leadId === leadId);
    if (found) {
        found.status = st;
        found.assignedTo = asg;
    }
    savePortalCache();
    renderLeadsSection();
    showPortalToast(`تم تحديث حالة طلب الموقع (${leadId}) في قاعدة البيانات بنجاح.`);
}

function renderLeadsSection() {
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;
    if (!PORTAL.leads.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400 text-xs">لا توجد طلبات واردة حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = PORTAL.leads.map(l => `
        <tr class="border-b border-purple-50 hover:bg-purple-50/30 text-xs">
            <td class="p-3 font-display font-bold text-ghazara-purple">${escapeHtml(l.leadId)}<div class="text-[10px] text-slate-400">${escapeHtml(l.timestamp)}</div></td>
            <td class="p-3"><div class="font-bold text-ghazara-purpleDark">${escapeHtml(l.fullName)}</div><div class="text-[11px] text-slate-500">${escapeHtml(l.organization)} (${escapeHtml(l.sector)})</div></td>
            <td class="p-3 font-display" dir="ltr">${escapeHtml(l.phone)}<div class="text-[10px] text-slate-400">${escapeHtml(l.email)}</div></td>
            <td class="p-3">${escapeHtml(l.supportArea)}</td>
            <td class="p-3">${escapeHtml(l.goalToAchieve)}<div class="text-[10px] text-ghazara-orange font-bold">البدء: ${escapeHtml(l.startTime)}</div></td>
            <td class="p-3">
                <select id="lead-st-${l.leadId}" class="rounded-lg border border-purple-200 px-2 py-1 text-xs font-bold">
                    <option value="جديد" ${l.status === 'جديد' ? 'selected' : ''}>جديد</option>
                    <option value="تم التواصل" ${l.status === 'تم التواصل' ? 'selected' : ''}>تم التواصل</option>
                    <option value="عرض سعر مرسل" ${l.status === 'عرض سعر مرسل' ? 'selected' : ''}>عرض سعر مرسل</option>
                    <option value="تم التعاقد" ${l.status === 'تم التعاقد' ? 'selected' : ''}>تم التعاقد</option>
                </select>
            </td>
            <td class="p-3 flex items-center gap-1.5">
                <input type="text" id="lead-asg-${l.leadId}" value="${escapeHtml(l.assignedTo || '')}" placeholder="المسؤول" class="w-28 rounded-lg border border-purple-200 px-2 py-1 text-xs">
                <button type="button" onclick="updateWebsiteLeadStatus('${l.leadId}')" class="px-2.5 py-1 rounded-lg bg-ghazara-purple text-white font-bold">حفظ</button>
            </td>
        </tr>
    `).join('');
}

/**
 * ============================================================================
 * 9. قسم المالية والحسابات (ورقة المالية)
 * ============================================================================
 */
async function handleSaveFinanceForm(event) {
    event.preventDefault();
    const u = PORTAL.user;
    const now = getNowTimestampAden();
    const itemId = 'FIN-' + Date.now().toString().slice(-6);
    const finObj = {
        itemId: itemId,
        itemName: document.getElementById('finName').value.trim(),
        itemType: document.getElementById('finType').value,
        amount: Number(document.getElementById('finAmount').value || 0),
        recordedBy: u?.empName || 'المالية',
        recordedAt: now
    };

    const res = await callBackendAPI({
        action: 'saveFinanceItem',
        item: finObj,
        byUser: finObj.recordedBy
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ القيد المالي.', 'error');
        return;
    }

    PORTAL.finance.unshift(finObj);
    savePortalCache();
    document.getElementById('form-finance').reset();
    renderFinanceSection();
    renderMonthlyReportsSection();
    showPortalToast(`تم تسجيل القيد المالي (${itemId}) في قاعدة البيانات بنجاح.`);
}

async function deleteFinanceEntry(itemId) {
    const res = await callBackendAPI({ action: 'deleteFinanceItem', itemId: itemId, byUser: PORTAL.user?.empName || 'المالية' });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حذف البند المالي.', 'error');
        return;
    }
    PORTAL.finance = PORTAL.finance.filter(f => f.itemId !== itemId);
    savePortalCache();
    renderFinanceSection();
    renderMonthlyReportsSection();
    showPortalToast(`تم حذف البند المالي (${itemId}) من قاعدة البيانات.`);
}

function renderFinanceSection() {
    const rev = PORTAL.finance.filter(f => f.itemType.includes('إيراد') || f.itemType.includes('دفعة')).reduce((s, x) => s + Number(x.amount || 0), 0);
    const exp = PORTAL.finance.filter(f => !f.itemType.includes('إيراد') && !f.itemType.includes('دفعة')).reduce((s, x) => s + Number(x.amount || 0), 0);
    const net = rev - exp;

    const revEl = document.getElementById('fin-total-rev');
    const expEl = document.getElementById('fin-total-exp');
    const netEl = document.getElementById('fin-total-net');
    if (revEl) revEl.textContent = rev.toLocaleString();
    if (expEl) expEl.textContent = exp.toLocaleString();
    if (netEl) netEl.textContent = net.toLocaleString();

    const tbody = document.getElementById('finance-table-body');
    if (!tbody) return;
    if (!PORTAL.finance.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 text-xs">لا توجد قيود مالية مسجلة حالياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = PORTAL.finance.map(f => {
        const isRev = f.itemType.includes('إيراد') || f.itemType.includes('دفعة');
        return `
        <tr class="border-b border-purple-50 hover:bg-purple-50/30 text-xs">
            <td class="p-3 font-display font-bold text-ghazara-purple">${escapeHtml(f.itemId)}</td>
            <td class="p-3 font-bold text-ghazara-purpleDark">${escapeHtml(f.itemName)}</td>
            <td class="p-3"><span class="px-2.5 py-0.5 rounded-full font-bold ${isRev ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">${escapeHtml(f.itemType)}</span></td>
            <td class="p-3 font-display font-extrabold ${isRev ? 'text-emerald-700' : 'text-rose-700'}">${Number(f.amount || 0).toLocaleString()}</td>
            <td class="p-3">${escapeHtml(f.recordedBy)}</td>
            <td class="p-3 flex items-center justify-between gap-2">
                <span dir="ltr" class="font-display text-[11px] text-slate-500">${escapeHtml(f.recordedAt)}</span>
                <button type="button" onclick="deleteFinanceEntry('${f.itemId}')" class="text-red-600 hover:underline font-bold">حذف</button>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * ============================================================================
 * 10. قسم إدارة الموظفين والحسابات (ورقتا الموظفين + المستخدمين)
 * ============================================================================
 */
async function handleSaveEmployeeForm(event) {
    event.preventDefault();
    const empId = document.getElementById('empFormId').value.trim();
    const empName = document.getElementById('empFormName').value.trim();
    const jobRole = document.getElementById('empFormRole').value.trim();
    const department = document.getElementById('empFormDept').value;
    const userTier = document.getElementById('empFormTier').value;
    const username = document.getElementById('empFormUsername').value.trim();
    const password = document.getElementById('empFormPassword').value.trim();
    const mobile = document.getElementById('empFormMobile').value.trim();
    const email = document.getElementById('empFormEmail').value.trim();

    const empObj = {
        empId: empId,
        empName: empName,
        jobRole: jobRole,
        department: department,
        directManager: document.getElementById('empFormManager').value.trim(),
        birthDate: document.getElementById('empFormBirth').value,
        qualification: document.getElementById('empFormQual').value.trim(),
        residence: document.getElementById('empFormResidence').value.trim(),
        startDate: document.getElementById('empFormStart').value,
        contractFile: '',
        photoFile: '',
        chronicDiseases: '',
        maritalStatus: '',
        mobile: mobile,
        email: email,
        phone: '',
        emergencyContact: document.getElementById('empFormEmergencyName').value.trim(),
        emergencyPhone: document.getElementById('empFormEmergencyPhone').value.trim(),
        emergencyRelation: ''
    };

    const res = await callBackendAPI({
        action: 'saveEmployeeAndUser',
        employee: empObj,
        account: { username: username, password: password, userTier: userTier },
        byUser: PORTAL.user?.empName || 'الموارد البشرية'
    });

    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ بيانات الموظف.', 'error');
        return;
    }

    document.getElementById('form-employee').reset();
    document.getElementById('empFormId').value = '';
    await syncPortalBundleInBackground();
    showPortalToast(res.message || `تم حفظ بيانات الموظف (${empName}) بنجاح.`);
}

function editEmployeeRecord(empId) {
    const e = PORTAL.employees.find(x => x.empId === empId);
    if (!e) return;
    const u = PORTAL.users.find(x => x.empId === empId || x.empName === e.empName);

    document.getElementById('empFormId').value = e.empId;
    document.getElementById('empFormName').value = e.empName || '';
    document.getElementById('empFormRole').value = e.jobRole || '';
    document.getElementById('empFormDept').value = e.department || DEPARTMENTS_LIST[0];
    document.getElementById('empFormTier').value = u ? u.userTier : resolveTier(e.jobRole, e.department, '');
    document.getElementById('empFormUsername').value = u ? u.username : '';
    document.getElementById('empFormPassword').value = '';
    document.getElementById('empFormMobile').value = e.mobile || '';
    document.getElementById('empFormEmail').value = e.email || '';
    document.getElementById('empFormManager').value = e.directManager || '';
    document.getElementById('empFormQual').value = e.qualification || '';
    document.getElementById('empFormResidence').value = e.residence || '';
    document.getElementById('empFormBirth').value = e.birthDate || '';
    document.getElementById('empFormStart').value = e.startDate || '';
    document.getElementById('empFormEmergencyName').value = e.emergencyContact || '';
    document.getElementById('empFormEmergencyPhone').value = e.emergencyPhone || '';
}

async function removeEmployeeRecord(empId) {
    const e = PORTAL.employees.find(x => x.empId === empId);
    if (!e) return;
    const u = PORTAL.users.find(x => x.empId === empId || x.empName === e.empName);

    const res = await callBackendAPI({
        action: 'deleteEmployeeAndUser',
        empId: empId,
        username: u ? u.username : '',
        empName: e.empName,
        byUser: PORTAL.user?.empName || 'الموارد البشرية'
    });

    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حذف الموظف.', 'error');
        return;
    }

    await syncPortalBundleInBackground();
    showPortalToast(`تم حذف سجل الموظف (${e.empName}) بنجاح.`);
}

function renderEmployeesSection() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;

    if (!PORTAL.employees.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 text-xs">جاري تحميل بيانات الموظفين...</td></tr>`;
        return;
    }

    tbody.innerHTML = PORTAL.employees.map(e => {
        const u = PORTAL.users.find(x => x.empId === e.empId || x.empName === e.empName);
        const tier = u ? u.userTier : resolveTier(e.jobRole, e.department, '');
        const badge = USER_TIERS_META[tier]?.badge || 'bg-slate-100 text-slate-700';
        return `
        <tr class="border-b border-purple-50 hover:bg-purple-50/30 text-xs">
            <td class="p-3 font-display font-bold text-ghazara-purple">${escapeHtml(e.empId)}</td>
            <td class="p-3 font-bold text-ghazara-purpleDark">${escapeHtml(e.empName)}</td>
            <td class="p-3">${escapeHtml(e.jobRole)}</td>
            <td class="p-3">${escapeHtml(e.department)}</td>
            <td class="p-3"><span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge}">${escapeHtml(tier)}</span></td>
            <td class="p-3 font-display">${u ? escapeHtml(u.username) : '-'}</td>
            <td class="p-3 font-display" dir="ltr">${escapeHtml(e.mobile || '-')}</td>
            <td class="p-3 flex items-center gap-1.5">
                <button type="button" onclick="editEmployeeRecord('${e.empId}')" class="px-2.5 py-1 rounded-lg bg-ghazara-purpleSoft text-ghazara-purple font-bold">تعديل</button>
                <button type="button" onclick="removeEmployeeRecord('${e.empId}')" class="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold">حذف</button>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * ============================================================================
 * 11. قسم إدارة الصلاحيات (عمود الصلاحيات في ورقة المستخدمين)
 * ============================================================================
 */
function renderPermissionsSection() {
    const u = PORTAL.user;
    if (!u) return;
    const box = document.getElementById('permissions-matrix-container');
    if (!box) return;

    const isCEO = u.userTier === 'مدير تنفيذي' || hasPerm('manage_permissions');
    let targetUsers = PORTAL.users;
    if (!isCEO) {
        targetUsers = PORTAL.users.filter(x => x.department === u.department && x.username !== u.username && x.userTier !== 'مدير تنفيذي');
    }

    const availablePerms = isCEO ? PERMISSION_CATALOG : PERMISSION_CATALOG.filter(p => p.scope === 'dept');

    if (targetUsers.length === 0) {
        box.innerHTML = `<div class="p-8 rounded-3xl bg-white/80 border border-dashed border-purple-200 text-center text-xs text-slate-400">لا يوجد مستخدمون حالياً ضمن هذا النطاق.</div>`;
        return;
    }

    box.innerHTML = targetUsers.map(target => {
        const effPerms = getEffectivePerms(target);
        return `
        <div class="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-purple-50 pb-3">
                <div>
                    <div class="flex items-center gap-2">
                        <h4 class="text-sm sm:text-base font-bold text-ghazara-purpleDark">${escapeHtml(target.empName)}</h4>
                        <span class="font-display text-xs text-slate-400">(@${escapeHtml(target.username)})</span>
                    </div>
                    <p class="text-xs text-slate-500">${escapeHtml(target.jobRole)} — قسم: ${escapeHtml(target.department)}</p>
                </div>
                <div class="flex items-center gap-2">
                    ${isCEO ? `
                        <select id="perm-tier-${target.username}" class="rounded-xl border border-purple-200 px-3 py-1.5 text-xs font-bold bg-purple-50/50 text-ghazara-purpleDark">
                            <option value="مدير تنفيذي" ${target.userTier === 'مدير تنفيذي' ? 'selected' : ''}>مدير تنفيذي</option>
                            <option value="موارد بشرية" ${target.userTier === 'موارد بشرية' ? 'selected' : ''}>موارد بشرية</option>
                            <option value="مدير قسم" ${target.userTier === 'مدير قسم' ? 'selected' : ''}>مدير قسم</option>
                            <option value="موظف" ${target.userTier === 'موظف' ? 'selected' : ''}>موظف</option>
                        </select>
                    ` : `<span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-ghazara-purple">${escapeHtml(target.userTier)}</span>`}
                    <button type="button" onclick="saveUserPermissionsMatrix('${target.username}')" class="btn-purple-gradient px-4 py-1.5 rounded-xl text-xs font-bold">
                        حفظ الصلاحيات
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                ${availablePerms.map(p => {
                    const checked = effPerms.includes('all_access') || effPerms.includes(p.key);
                    return `
                    <label class="flex items-center gap-2.5 p-2.5 rounded-2xl border ${checked ? 'bg-purple-50/60 border-purple-200' : 'bg-slate-50/60 border-slate-200'} cursor-pointer text-xs">
                        <input type="checkbox" name="perm-chk-${target.username}" value="${p.key}" ${checked ? 'checked' : ''} class="w-4 h-4 accent-ghazara-purple rounded">
                        <span class="font-semibold text-ghazara-purpleDark">${escapeHtml(p.label)}</span>
                    </label>
                    `;
                }).join('')}
            </div>
        </div>
        `;
    }).join('');
}

async function saveUserPermissionsMatrix(targetUsername) {
    const target = PORTAL.users.find(u => u.username === targetUsername);
    if (!target) return;

    const tierSelect = document.getElementById('perm-tier-' + targetUsername);
    const newTier = tierSelect ? tierSelect.value : target.userTier;

    const checkboxes = document.querySelectorAll(`input[name="perm-chk-${targetUsername}"]:checked`);
    const selectedPerms = Array.from(checkboxes).map(cb => cb.value);
    ['view_own_tasks', 'apply_leave', 'submit_suggestion'].forEach(baseP => {
        if (!selectedPerms.includes(baseP)) selectedPerms.push(baseP);
    });

    const res = await callBackendAPI({
        action: 'updatePermissions',
        targetUsername: targetUsername,
        userTier: newTier,
        permissions: selectedPerms,
        byUser: PORTAL.user?.empName || 'الإدارة'
    });

    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر حفظ الصلاحيات.', 'error');
        return;
    }

    target.userTier = newTier;
    target.permissions = selectedPerms;
    savePortalCache();
    renderAuthenticatedPortalUI();
    showPortalToast(res.message || `تم حفظ صلاحيات (${target.empName}) بنجاح.`);
}

/**
 * ============================================================================
 * 12. قسم التقارير الشهرية الشاملة للأقسام
 * ============================================================================
 */
function renderMonthlyReportsSection() {
    const monthVal = document.getElementById('reportMonthFilter')?.value || getCurrentMonthAden();
    const deptVal = document.getElementById('reportDeptFilter')?.value || 'ALL';
    const today = getTodayAden();

    const deptsToAnalyze = deptVal === 'ALL' ? DEPARTMENTS_LIST : [deptVal];

    const tasksInMonth = PORTAL.tasks.filter(t => !t.isArchived && (!monthVal || (t.dueDate && t.dueDate.startsWith(monthVal)) || (t.createdAt && t.createdAt.startsWith(monthVal))));
    const activeTasksPool = tasksInMonth.length > 0 ? tasksInMonth : PORTAL.tasks.filter(t => !t.isArchived);

    const leavesPool = PORTAL.leaves.filter(l => !monthVal || (l.startDate && l.startDate.startsWith(monthVal)) || (l.createdAt && l.createdAt.startsWith(monthVal)));
    const activeLeaves = leavesPool.length > 0 ? leavesPool : PORTAL.leaves;

    const finPool = PORTAL.finance.filter(f => !monthVal || (f.recordedAt && f.recordedAt.startsWith(monthVal)));
    const activeFin = finPool.length > 0 ? finPool : PORTAL.finance;

    const totalRev = activeFin.filter(f => f.itemType.includes('إيراد') || f.itemType.includes('دفعة')).reduce((s, x) => s + Number(x.amount || 0), 0);
    const totalExp = activeFin.filter(f => !f.itemType.includes('إيراد') && !f.itemType.includes('دفعة')).reduce((s, x) => s + Number(x.amount || 0), 0);

    const kpiBox = document.getElementById('monthly-report-kpis');
    if (kpiBox) {
        const compCount = activeTasksPool.filter(t => t.status === 'مكتملة').length;
        const rate = activeTasksPool.length ? Math.round((compCount / activeTasksPool.length) * 100) : 0;
        kpiBox.innerHTML = `
            <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <span class="text-xs font-bold text-slate-500">إجمالي المهام ونسبة الإنجاز</span>
                <p class="font-display text-2xl font-extrabold text-ghazara-purpleDark mt-1">${compCount} / ${activeTasksPool.length} (${rate}%)</p>
            </div>
            <div class="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                <span class="text-xs font-bold text-ghazara-teal">العملاء النشطون وطلبات الموقع</span>
                <p class="font-display text-2xl font-extrabold text-ghazara-teal mt-1">${PORTAL.customers.length} عميل • ${PORTAL.leads.length} طلب</p>
            </div>
            <div class="p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <span class="text-xs font-bold text-ghazara-orange">طلبات الإجازات والمقترحات</span>
                <p class="font-display text-2xl font-extrabold text-ghazara-orange mt-1">${activeLeaves.length} إجازة • ${PORTAL.suggestions.length} مقترح</p>
            </div>
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span class="text-xs font-bold text-emerald-700">صافي الأداء المالي (إيراد - مصروف)</span>
                <p class="font-display text-2xl font-extrabold text-emerald-700 mt-1">${(totalRev - totalExp).toLocaleString()}</p>
            </div>
        `;
    }

    const tbody = document.getElementById('monthly-dept-breakdown-body');
    if (!tbody) return;

    tbody.innerHTML = deptsToAnalyze.map(dept => {
        const staffCount = PORTAL.employees.filter(e => e.department === dept).length;
        const deptMemberNames = PORTAL.users.filter(u => u.department === dept).map(u => u.empName);
        const deptTasks = activeTasksPool.filter(t => t.entityName === dept || deptMemberNames.includes(t.assignee));
        const deptComp = deptTasks.filter(t => t.status === 'مكتملة').length;
        const deptOverdue = deptTasks.filter(t => t.status !== 'مكتملة' && t.status !== 'ملغاة' && t.dueDate && t.dueDate < today).length;
        const deptRate = deptTasks.length ? Math.round((deptComp / deptTasks.length) * 100) : 0;
        const deptLeaves = activeLeaves.filter(l => l.department === dept).length;
        const deptSugg = PORTAL.suggestions.filter(s => s.department === dept).length;

        return `
        <tr class="border-b border-purple-50 hover:bg-purple-50/30 text-xs">
            <td class="p-3 font-bold text-ghazara-purpleDark">${escapeHtml(dept)}</td>
            <td class="p-3 font-display font-bold">${staffCount}</td>
            <td class="p-3 font-display font-bold text-ghazara-purple">${deptTasks.length}</td>
            <td class="p-3 font-display font-bold text-emerald-700">${deptComp}</td>
            <td class="p-3 font-display font-bold text-red-600">${deptOverdue}</td>
            <td class="p-3">
                <div class="flex items-center gap-2">
                    <div class="w-20 h-2 rounded-full bg-purple-100 overflow-hidden">
                        <div class="h-full bg-ghazara-purple" style="width:${deptRate}%"></div>
                    </div>
                    <span class="font-display font-bold">${deptRate}%</span>
                </div>
            </td>
            <td class="p-3 font-display">${deptLeaves}</td>
            <td class="p-3 font-display">${deptSugg}</td>
        </tr>
        `;
    }).join('');
}

function exportMonthlyReportCSV() {
    const monthVal = document.getElementById('reportMonthFilter')?.value || getCurrentMonthAden();
    const lines = [
        ['القسم', 'عدد الموظفين', 'إجمالي المهام', 'المهام المكتملة', 'طلبات الإجازات', 'مقترحات التطوير'].join(',')
    ];
    DEPARTMENTS_LIST.forEach(dept => {
        const staffCount = PORTAL.employees.filter(e => e.department === dept).length;
        const deptMemberNames = PORTAL.users.filter(u => u.department === dept).map(u => u.empName);
        const deptTasks = PORTAL.tasks.filter(t => !t.isArchived && (t.entityName === dept || deptMemberNames.includes(t.assignee)));
        const deptComp = deptTasks.filter(t => t.status === 'مكتملة').length;
        const deptLeaves = PORTAL.leaves.filter(l => l.department === dept).length;
        const deptSugg = PORTAL.suggestions.filter(s => s.department === dept).length;
        lines.push([`"${dept}"`, staffCount, deptTasks.length, deptComp, deptLeaves, deptSugg].join(','));
    });

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghazara-monthly-report-${monthVal}.csv`;
    a.click();
    showPortalToast('تم تصدير التقرير الشهري لجميع الأقسام بنجاح.');
}

/**
 * ============================================================================
 * 13. قسم سجل التعديلات والنسخ الاحتياطي (مباشرة من Google Sheets)
 * ============================================================================
 */
async function createPortalBackupNow() {
    const res = await callBackendAPI({
        action: 'createBackup',
        byUser: PORTAL.user?.empName || 'المدير التنفيذي',
        backupType: 'يدوي'
    });
    if (res.networkError || res.status === 'error') {
        showPortalToast(res.message || 'تعذر إنشاء النسخة الاحتياطية.', 'error');
        return;
    }
    await syncPortalBundleInBackground();
    showPortalToast(res.message || 'تم إنشاء النسخة الاحتياطية وحفظها.');
}

function downloadPortalJSONBackup() {
    const blob = new Blob([JSON.stringify(PORTAL, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghazara-full-backup-${getTodayAden()}.json`;
    a.click();
    showPortalToast('تم تنزيل ملف النسخة الاحتياطية الكاملة.');
}

function renderBackupsAndLogsSection() {
    const logsBody = document.getElementById('audit-logs-table-body');
    if (logsBody) {
        if (!PORTAL.auditLogs.length) {
            logsBody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400 text-xs">لا توجد سجلات تعديلات محملة بعد.</td></tr>`;
        } else {
            logsBody.innerHTML = PORTAL.auditLogs.slice(0, 40).map(log => `
                <tr class="border-b border-purple-50 text-xs">
                    <td class="p-2.5 font-display text-[11px] text-ghazara-purple font-bold">${escapeHtml(log.id)}</td>
                    <td class="p-2.5 font-display text-[11px]" dir="ltr">${escapeHtml(log.timestamp)}</td>
                    <td class="p-2.5 font-bold text-ghazara-purpleDark">${escapeHtml(log.actionType)}</td>
                    <td class="p-2.5 font-display">${escapeHtml(log.user)}</td>
                    <td class="p-2.5">${escapeHtml(log.field)}</td>
                    <td class="p-2.5 text-slate-600">${escapeHtml(log.newValue)} ${log.details ? '— ' + escapeHtml(log.details) : ''}</td>
                </tr>
            `).join('');
        }
    }

    const bkpBox = document.getElementById('backups-history-list');
    if (bkpBox) {
        if (!PORTAL.backups.length) {
            bkpBox.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">لا توجد نسخ احتياطية مسجلة بعد.</p>`;
        } else {
            bkpBox.innerHTML = PORTAL.backups.map(b => `
                <div class="p-3 rounded-2xl bg-white border border-purple-100 flex items-center justify-between text-xs">
                    <div>
                        <span class="font-display font-bold text-ghazara-purple">${escapeHtml(b.backupId)}</span>
                        <span class="text-slate-400 mx-1">(${escapeHtml(b.createdAt)})</span>
                        <p class="text-slate-600 mt-0.5">${escapeHtml(b.summary)}</p>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">محفوظة</span>
                </div>
            `).join('');
        }
    }
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * ============================================================================
 * المنطق البرمجي الشامل لصفحة "لوحة مهام الشؤون الإدارية والتسويق" - غزارة
 * يحسب كافة المؤشرات من قاعدة البيانات الفعلية (Google Sheets) دون أي أرقام ثابتة
 * ============================================================================
 */

const DEFAULT_INDEPENDENT_CATEGORIES = [
    { id: 'CAT-01', name: 'مهام يجب رفعها إلى الإدارة التنفيذية', desc: 'المهام والتقارير والاعتمادات المطلوب رفعها للإدارة التنفيذية', color: '#5B2C83', order: 1, archived: false },
    { id: 'CAT-02', name: 'مهام وردت إليّ من الإدارة التنفيذية', desc: 'التوجيهات والتكليفات الصادرة من الإدارة التنفيذية', color: '#7C46AD', order: 2, archived: false },
    { id: 'CAT-03', name: 'مهام تُرفع إلى قسم التسويق والإعلام الرقمي', desc: 'المهام والطلبات الموجهة إلى قسم التسويق والإعلام الرقمي', color: '#EC8232', order: 3, archived: false },
    { id: 'CAT-04', name: 'مهام وردت إليّ من قسم التسويق والإعلام الرقمي', desc: 'المهام والمخرجات الواردة من قسم التسويق والإعلام الرقمي', color: '#F59E56', order: 4, archived: false },
    { id: 'CAT-05', name: 'مهام تُرفع إلى قسم التطوير المؤسسي', desc: 'المهام والمبادرات المرفوعة لقسم التطوير المؤسسي', color: '#38A89D', order: 5, archived: false },
    { id: 'CAT-06', name: 'مهام وردت إليّ من قسم التطوير المؤسسي', desc: 'المهام والخطط الواردة من قسم التطوير المؤسسي', color: '#0D9488', order: 6, archived: false },
    { id: 'CAT-07', name: 'مهام تُرفع إلى المسوقين', desc: 'التكليفات والمهام الميدانية والرقمية الموجهة للمسوقين', color: '#4F46E5', order: 7, archived: false },
    { id: 'CAT-08', name: 'مهام وردت إليّ من المسوقين', desc: 'التقارير والطلبات والمتابعات الواردة من فريق المسوقين', color: '#E11D48', order: 8, archived: false }
];

const DEFAULT_ENTITIES_LIST = [
    { id: 'ENT-01', name: 'الإدارة التنفيذية العليا', type: 'إدارة داخلية', contact: 'سالم باحارثة', email: 'ceo@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
    { id: 'ENT-02', name: 'قسم التسويق والإعلام الرقمي', type: 'قسم داخلي', contact: 'سارة بن سميط', email: 'marketing.mgr@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
    { id: 'ENT-03', name: 'قسم التطوير المؤسسي والموارد البشرية', type: 'قسم داخلي', contact: 'فاطمة السقاف', email: 'hr.mgr@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
    { id: 'ENT-04', name: 'فريق المسوقين والمبيعات', type: 'فريق عمل', contact: 'أحمد الكاف', email: 'sales.mgr@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
    { id: 'ENT-05', name: 'استوديو التصميم والإنتاج المرئي', type: 'قسم داخلي', contact: 'عمر باعباد', email: 'media@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
    { id: 'ENT-06', name: 'الإدارة المالية والحسابات', type: 'قسم داخلي', contact: 'عبدالرحمن باجابر', email: 'finance@ghazaraye.com', phone: '+967783334002', status: 'نشط' }
];

const PRIORITY_WEIGHT = {
    'عاجلة جدًا': 4,
    'عالية': 3,
    'متوسطة': 2,
    'منخفضة': 1
};

let STATE = {
    user: null,
    timezone: 'Asia/Aden',
    tasks: [],
    categories: [...DEFAULT_INDEPENDENT_CATEGORIES],
    entities: [...DEFAULT_ENTITIES_LIST],
    users: [],
    reminders: [],
    auditLogs: [],
    notifications: [],
    settings: {
        timezone: 'Asia/Aden',
        notifications_enabled: 'true',
        email_verified: 'false',
        default_reminder_Before_hours: '24',
        daily_summary_enabled: 'true',
        weekly_report_enabled: 'true',
        hide_sensitive_notifications: 'false'
    },
    backups: [],
    activeSidebarCategory: 'ALL', // 'ALL' | 'ARCHIVED' | categoryId
    activeStatCardFilter: 'ALL',  // 'ALL' | 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'DUE_TODAY' | 'DUE_7DAYS' | 'URGENT_HIGH' | 'WAITING_RESPONSE' | 'WAITING_APPROVAL'
    activeMainView: 'tasks',      // 'tasks' | 'calendar' | 'reminders' | 'reports' | 'settings'
    calendarMode: 'month',        // 'day' | 'week' | 'month'
    calendarCursorDate: new Date(),
    editingTaskSubtasks: [],
    editingTaskAttachments: [],
    editingTaskOriginalStatus: '',
    editingTaskOriginalDueDate: ''
};

/**
 * ============================================================================
 * 1. التهيئة، الساعة الحية بتوقيت Asia/Aden، والمزامنة مع قاعدة البيانات
 * ============================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    const activeUser = getActiveSessionUser();
    if (!activeUser) {
        window.location.href = 'login.html';
        return;
    }
    STATE.user = activeUser;

    initUserHeaderUI();
    loadCachedBundle();
    startLiveClock();
    initDefaultReportDates();
    renderAllDashboardComponents();
    syncDashboardWithServer();

    // إغلاق القوائم المنسدلة عند النقر خارجها
    document.addEventListener('click', (e) => {
        const notifMenu = document.getElementById('notifications-dropdown');
        const accMenu = document.getElementById('account-dropdown');
        if (notifMenu && !notifMenu.parentElement.contains(e.target)) notifMenu.classList.add('hidden');
        if (accMenu && !accMenu.parentElement.contains(e.target)) accMenu.classList.add('hidden');
    });
});

function initUserHeaderUI() {
    const u = STATE.user;
    if (!u) return;
    document.getElementById('account-user-name').textContent = u.empName || u.username;
    document.getElementById('account-user-role').textContent = u.jobRole || '';
    document.getElementById('dropdown-emp-name').textContent = `${u.empName} (${u.jobRole})`;
    document.getElementById('dropdown-emp-email').textContent = u.email || u.username;
    const initials = (u.empName || 'غ').trim().charAt(0);
    document.getElementById('account-avatar-initials').textContent = initials;

    // تعبئة الإعدادات الشخصية
    document.getElementById('setProfileName').value = u.empName || '';
    document.getElementById('setProfileUsername').value = u.username || '';
    document.getElementById('setProfileEmail').value = u.email || '';
    document.getElementById('testEmailRecipientInput').value = u.email || '';
}

function startLiveClock() {
    const updateClock = () => {
        const tz = STATE.settings.timezone || STATE.timezone || 'Asia/Aden';
        const now = new Date();
        try {
            const dateStr = new Intl.DateTimeFormat('ar-YE', {
                timeZone: tz,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(now);
            const timeStr = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }).format(now);

            const dEl = document.getElementById('live-current-date');
            const tEl = document.getElementById('live-current-time');
            const tzEl = document.getElementById('live-timezone-badge');
            const mdEl = document.getElementById('mobile-live-date');
            const mtEl = document.getElementById('mobile-live-time');

            if (dEl) dEl.textContent = dateStr;
            if (tEl) tEl.textContent = timeStr;
            if (tzEl) tzEl.textContent = `(${tz})`;
            if (mdEl) mdEl.textContent = dateStr;
            if (mtEl) mtEl.textContent = `${timeStr} (${tz})`;
        } catch (e) {}
    };
    updateClock();
    setInterval(updateClock, 1000);
}

function getTodayDateString() {
    const tz = STATE.settings.timezone || STATE.timezone || 'Asia/Aden';
    try {
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(new Date());
        const y = parts.find(p => p.type === 'year').value;
        const m = parts.find(p => p.type === 'month').value;
        const d = parts.find(p => p.type === 'day').value;
        return `${y}-${m}-${d}`;
    } catch (e) {
        return new Date().toISOString().slice(0, 10);
    }
}

function getNowTimestampString() {
    const tz = STATE.settings.timezone || STATE.timezone || 'Asia/Aden';
    try {
        return new Date().toLocaleString('sv-SE', { timeZone: tz });
    } catch (e) {
        return new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
}

function showTasksToast(message, type = 'success') {
    const toast = document.getElementById('tasks-toast');
    if (!toast) return;
    let colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (type === 'error') colorClass = 'bg-red-50 text-red-700 border-red-200';
    if (type === 'warning') colorClass = 'bg-amber-50 text-amber-800 border-amber-200';

    toast.className = `fixed bottom-5 left-5 z-50 max-w-md rounded-2xl p-4 shadow-2xl border text-sm font-bold transition-all no-print ${colorClass}`;
    toast.innerHTML = message;
    toast.classList.remove('hidden');
    clearTimeout(window._tasksToastTimer);
    window._tasksToastTimer = setTimeout(() => toast.classList.add('hidden'), 4800);
}

function loadCachedBundle() {
    try {
        const raw = localStorage.getItem(GHAZARA_CONFIG.STORAGE_KEY_TASKS_BUNDLE);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.tasks)) STATE.tasks = parsed.tasks;
            if (Array.isArray(parsed.categories) && parsed.categories.length) STATE.categories = parsed.categories;
            if (Array.isArray(parsed.entities) && parsed.entities.length) STATE.entities = parsed.entities;
            if (Array.isArray(parsed.reminders)) STATE.reminders = parsed.reminders;
            if (Array.isArray(parsed.auditLogs)) STATE.auditLogs = parsed.auditLogs;
            if (Array.isArray(parsed.notifications)) STATE.notifications = parsed.notifications;
            if (parsed.settings) STATE.settings = { ...STATE.settings, ...parsed.settings };
            if (Array.isArray(parsed.backups)) STATE.backups = parsed.backups;
        }
    } catch (e) {
        console.warn('Cache load warning:', e);
    }
}

function saveBundleToCache() {
    try {
        localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_TASKS_BUNDLE, JSON.stringify({
            tasks: STATE.tasks,
            categories: STATE.categories,
            entities: STATE.entities,
            reminders: STATE.reminders,
            auditLogs: STATE.auditLogs,
            notifications: STATE.notifications,
            settings: STATE.settings,
            backups: STATE.backups
        }));
    } catch (e) {}
}

async function syncDashboardWithServer() {
    const indicator = document.getElementById('db-connection-indicator');
    if (indicator) {
        indicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span><span>جاري المزامنة...</span>`;
    }

    const res = await callGoogleScriptAPI({
        action: 'getDashboardBundle',
        username: STATE.user?.username || ''
    });

    if (!res.fallbackToLocal && res.status === 'success') {
        STATE.tasks = Array.isArray(res.tasks) ? res.tasks : [];
        STATE.categories = (Array.isArray(res.categories) && res.categories.length) ? res.categories : [...DEFAULT_INDEPENDENT_CATEGORIES];
        STATE.entities = (Array.isArray(res.entities) && res.entities.length) ? res.entities : [...DEFAULT_ENTITIES_LIST];
        STATE.users = Array.isArray(res.users) ? res.users : [];
        STATE.reminders = Array.isArray(res.reminders) ? res.reminders : [];
        STATE.auditLogs = Array.isArray(res.auditLogs) ? res.auditLogs : [];
        STATE.notifications = Array.isArray(res.notifications) ? res.notifications : [];
        if (res.settings) STATE.settings = { ...STATE.settings, ...res.settings };
        if (Array.isArray(res.backups)) STATE.backups = res.backups;
        saveBundleToCache();
        if (indicator) {
            indicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>متزامن فعلياً مع قاعدة البيانات</span>`;
        }
    } else {
        if (indicator) {
            indicator.innerHTML = `<span class="w-2 h-2 rounded-full bg-ghazara-purple"></span><span>وضع قاعدة البيانات المحلية (بانتظار ربط رابط /exec)</span>`;
        }
    }

    evaluateLocalInternalNotifications();
    renderAllDashboardComponents();
}

function renderAllDashboardComponents() {
    populateSelectDropdowns();
    renderSidebarCategories();
    calculateAndRenderKPIs();
    renderTasksList();
    renderOperationalSummaryPanels();
    renderNotificationsUI();
    renderRemindersView();
    renderCalendarView();
    renderReportsView();
    renderSettingsView();
}

/**
 * ============================================================================
 * 2. حساب المؤشرات العشرة الفعلي من قاعدة البيانات (دون أي أرقام ثابتة)
 * ============================================================================
 */
function isTaskOverdue(task, todayStr) {
    if (!task || task.isArchived) return false;
    if (task.status === 'مكتملة' || task.status === 'ملغاة') return false;
    if (!task.dueDate) return false;
    return task.dueDate < (todayStr || getTodayDateString());
}

function isTaskDueToday(task, todayStr) {
    if (!task || task.isArchived) return false;
    if (task.status === 'مكتملة' || task.status === 'ملغاة') return false;
    return task.dueDate === (todayStr || getTodayDateString());
}

function isTaskDueNext7Days(task, todayStr) {
    if (!task || task.isArchived) return false;
    if (task.status === 'مكتملة' || task.status === 'ملغاة') return false;
    if (!task.dueDate) return false;
    const base = todayStr || getTodayDateString();
    const d1 = new Date(base + 'T00:00:00');
    const d2 = new Date(task.dueDate + 'T00:00:00');
    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
}

function doesTaskMatchStatFilter(task, statKey, todayStr) {
    const today = todayStr || getTodayDateString();
    switch (statKey) {
        case 'ALL':
            return !task.isArchived;
        case 'NEW':
            return !task.isArchived && task.status === 'جديدة';
        case 'IN_PROGRESS':
            return !task.isArchived && task.status === 'قيد التنفيذ';
        case 'COMPLETED':
            return !task.isArchived && task.status === 'مكتملة';
        case 'OVERDUE':
            return isTaskOverdue(task, today);
        case 'DUE_TODAY':
            return isTaskDueToday(task, today);
        case 'DUE_7DAYS':
            return isTaskDueNext7Days(task, today);
        case 'URGENT_HIGH':
            return !task.isArchived && task.status !== 'مكتملة' && task.status !== 'ملغاة' && (task.priority === 'عاجلة جدًا' || task.priority === 'عالية');
        case 'WAITING_RESPONSE':
            return !task.isArchived && task.status === 'بانتظار رد';
        case 'WAITING_APPROVAL':
            return !task.isArchived && task.status === 'بانتظار اعتماد';
        default:
            return !task.isArchived;
    }
}

function calculateAndRenderKPIs() {
    const today = getTodayDateString();
    // إذا كان هناك تصنيف محدد في القائمة الجانبية (غير جميع المهام والمؤرشفة)، نحسب المؤشرات ضمن السياق أو لكامل المهام النشطة
    const activeTasks = STATE.tasks.filter(t => !t.isArchived);

    const counts = {
        ALL: activeTasks.length,
        NEW: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'NEW', today)).length,
        IN_PROGRESS: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'IN_PROGRESS', today)).length,
        COMPLETED: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'COMPLETED', today)).length,
        OVERDUE: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'OVERDUE', today)).length,
        DUE_TODAY: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'DUE_TODAY', today)).length,
        DUE_7DAYS: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'DUE_7DAYS', today)).length,
        URGENT_HIGH: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'URGENT_HIGH', today)).length,
        WAITING_RESPONSE: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'WAITING_RESPONSE', today)).length,
        WAITING_APPROVAL: activeTasks.filter(t => doesTaskMatchStatFilter(t, 'WAITING_APPROVAL', today)).length
    };

    Object.keys(counts).forEach(k => {
        const el = document.getElementById('kpi-val-' + k);
        if (el) el.textContent = counts[k];
        const card = document.getElementById('stat-card-' + k);
        if (card) {
            if (STATE.activeStatCardFilter === k) {
                card.classList.add('kpi-card-active');
            } else {
                card.classList.remove('kpi-card-active');
            }
        }
    });
}

function applyStatCardFilter(statKey) {
    STATE.activeStatCardFilter = statKey;
    if (STATE.activeSidebarCategory === 'ARCHIVED') {
        STATE.activeSidebarCategory = 'ALL';
    }
    const labels = {
        ALL: 'جميع المهام النشطة',
        NEW: 'المهام الجديدة',
        IN_PROGRESS: 'المهام قيد التنفيذ',
        COMPLETED: 'المهام المكتملة',
        OVERDUE: 'المهام المتأخرة عن موعدها',
        DUE_TODAY: 'المهام المستحقة اليوم',
        DUE_7DAYS: 'المهام المستحقة خلال 7 أيام',
        URGENT_HIGH: 'المهام العاجلة وعالية الأولوية',
        WAITING_RESPONSE: 'المهام التي تنتظر رداً من جهة أخرى',
        WAITING_APPROVAL: 'المهام التي تنتظر اعتماد الإدارة التنفيذية'
    };
    const lbl = document.getElementById('active-stat-filter-label');
    if (lbl) lbl.textContent = 'الفلتر الإحصائي النشط: ' + (labels[statKey] || 'جميع المهام');

    calculateAndRenderKPIs();
    renderSidebarCategories();
    renderTasksList();
}

/**
 * ============================================================================
 * 3. القائمة الجانبية للتصنيفات الثمانية المستقلة + جميع المهام + المؤرشفة
 * ============================================================================
 */
function renderSidebarCategories() {
    const container = document.getElementById('sidebar-categories-list');
    if (!container) return;

    const nonArchivedTasks = STATE.tasks.filter(t => !t.isArchived);
    const archivedTasks = STATE.tasks.filter(t => t.isArchived);
    const activeCategories = STATE.categories.filter(c => !c.archived);

    let html = `
        <button type="button" onclick="selectSidebarCategory('ALL')" class="sidebar-cat-btn ${STATE.activeSidebarCategory === 'ALL' ? 'active' : 'bg-white/80 hover:bg-purple-50 text-ghazara-purpleDark'} w-full text-right px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between border border-purple-100 transition-all">
            <span>جميع المهام</span>
            <span class="cat-count-badge font-display text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-ghazara-purple">${nonArchivedTasks.length}</span>
        </button>
    `;

    activeCategories.forEach((cat, idx) => {
        const count = nonArchivedTasks.filter(t => t.categoryId === cat.id).length;
        const isActive = STATE.activeSidebarCategory === cat.id;
        html += `
            <button type="button" onclick="selectSidebarCategory('${cat.id}')" class="sidebar-cat-btn ${isActive ? 'active' : 'bg-white/80 hover:bg-purple-50 text-slate-700'} w-full text-right px-3 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 border border-purple-100/80 transition-all">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${cat.color || '#5B2C83'}"></span>
                    <span class="truncate" title="${cat.name}">${idx + 1}. ${cat.name}</span>
                </div>
                <span class="cat-count-badge font-display text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">${count}</span>
            </button>
        `;
    });

    html += `
        <div class="pt-2 border-t border-purple-100 mt-2">
            <button type="button" onclick="selectSidebarCategory('ARCHIVED')" class="sidebar-cat-btn ${STATE.activeSidebarCategory === 'ARCHIVED' ? 'active' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'} w-full text-right px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between border border-slate-200 transition-all">
                <span>🗄️ المهام المؤرشفة</span>
                <span class="cat-count-badge font-display text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">${archivedTasks.length}</span>
            </button>
        </div>
    `;

    container.innerHTML = html;
}

function selectSidebarCategory(catId) {
    STATE.activeSidebarCategory = catId;
    switchMainWorkspaceView('tasks');

    const catSelect = document.getElementById('filterCategorySelect');
    if (catSelect) {
        catSelect.value = (catId === 'ALL' || catId === 'ARCHIVED') ? 'ALL' : catId;
    }

    const heading = document.getElementById('current-category-heading');
    const sub = document.getElementById('current-category-subheading');
    if (catId === 'ALL') {
        heading.textContent = 'جميع المهام النشطة';
        sub.textContent = 'استعراض كافة المهام عبر جميع التصنيفات الإدارية الثمانية';
    } else if (catId === 'ARCHIVED') {
        heading.textContent = 'قسم المهام المؤرشفة';
        sub.textContent = 'المهام المحفوظة في الأرشيف (يمكن استعادتها في أي وقت)';
    } else {
        const found = STATE.categories.find(c => c.id === catId);
        heading.textContent = found ? found.name : 'تصنيف المهام';
        sub.textContent = found?.desc || 'المهام المصنفة ضمن هذا المسار الإداري';
    }

    renderSidebarCategories();
    renderTasksList();

    // إغلاق القائمة الجانبية في شاشات الجوال بعد الاختيار
    const sb = document.getElementById('tasks-sidebar');
    if (window.innerWidth < 1024 && sb && !sb.classList.contains('translate-x-full')) {
        toggleTasksSidebar();
    }
}

function handleDropdownCategoryChange(val) {
    STATE.activeSidebarCategory = val;
    renderSidebarCategories();
    renderTasksList();
}

/**
 * ============================================================================
 * 4. محرك البحث والتصفية المتعددة والفرز وعرض قائمة المهام
 * ============================================================================
 */
function getFilteredAndSortedTasks() {
    const today = getTodayDateString();
    const searchVal = (document.getElementById('filterSearchInput')?.value || '').trim().toLowerCase();
    const entityVal = document.getElementById('filterEntitySelect')?.value || 'ALL';
    const statusVal = document.getElementById('filterStatusSelect')?.value || 'ALL';
    const priorityVal = document.getElementById('filterPrioritySelect')?.value || 'ALL';
    const dateFrom = document.getElementById('filterDateFrom')?.value || '';
    const dateTo = document.getElementById('filterDateTo')?.value || '';
    const sortBy = document.getElementById('sortTasksBy')?.value || 'dueDate_asc';

    let list = STATE.tasks.filter(t => {
        // 1. فلتر الأرشفة والتصنيف الجانبي
        if (STATE.activeSidebarCategory === 'ARCHIVED') {
            if (!t.isArchived) return false;
        } else {
            if (t.isArchived) return false;
            if (STATE.activeSidebarCategory !== 'ALL' && t.categoryId !== STATE.activeSidebarCategory) {
                return false;
            }
        }

        // 2. فلتر البطاقة الإحصائية التفاعلية العلوية
        if (STATE.activeSidebarCategory !== 'ARCHIVED' && STATE.activeStatCardFilter !== 'ALL') {
            if (!doesTaskMatchStatFilter(t, STATE.activeStatCardFilter, today)) return false;
        }

        // 3. البحث النصي الفوري (العنوان، الرقم الفريد، الوصف، الملاحظات)
        if (searchVal) {
            const hay = `${t.taskId} ${t.title} ${t.description} ${t.categoryName} ${t.entityName} ${t.assignee} ${t.notes}`.toLowerCase();
            if (!hay.includes(searchVal)) return false;
        }

        // 4. الفلاتر المتعددة (الجهة، الحالة، الأولوية، الفترة الزمنية)
        if (entityVal !== 'ALL' && t.entityId !== entityVal && t.entityName !== entityVal) return false;
        if (statusVal !== 'ALL' && t.status !== statusVal) return false;
        if (priorityVal !== 'ALL' && t.priority !== priorityVal) return false;
        if (dateFrom && (!t.dueDate || t.dueDate < dateFrom)) return false;
        if (dateTo && (!t.dueDate || t.dueDate > dateTo)) return false;

        return true;
    });

    // الترتيب
    list.sort((a, b) => {
        if (sortBy === 'dueDate_asc') return String(a.dueDate || '9999-99-99').localeCompare(String(b.dueDate || '9999-99-99'));
        if (sortBy === 'dueDate_desc') return String(b.dueDate || '').localeCompare(String(a.dueDate || ''));
        if (sortBy === 'priority_desc') return (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
        if (sortBy === 'createdAt_desc') return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
        if (sortBy === 'updatedAt_desc') return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
        return 0;
    });

    return list;
}

function resetAllTaskFilters() {
    STATE.activeSidebarCategory = 'ALL';
    STATE.activeStatCardFilter = 'ALL';
    document.getElementById('filterSearchInput').value = '';
    document.getElementById('filterCategorySelect').value = 'ALL';
    document.getElementById('filterEntitySelect').value = 'ALL';
    document.getElementById('filterStatusSelect').value = 'ALL';
    document.getElementById('filterPrioritySelect').value = 'ALL';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('sortTasksBy').value = 'dueDate_asc';
    document.getElementById('active-stat-filter-label').textContent = 'الفلتر الإحصائي النشط: جميع المهام';

    calculateAndRenderKPIs();
    renderSidebarCategories();
    renderTasksList();
}

function getStatusBadgeStyle(status) {
    const map = {
        'جديدة': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'لم يبدأ التنفيذ': 'bg-slate-100 text-slate-700 border-slate-200',
        'قيد التنفيذ': 'bg-sky-50 text-sky-700 border-sky-200',
        'بانتظار رد': 'bg-amber-50 text-amber-800 border-amber-200',
        'بانتظار اعتماد': 'bg-purple-50 text-ghazara-purple border-purple-200',
        'مكتملة': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'مؤجلة': 'bg-orange-50 text-ghazara-orange border-orange-200',
        'ملغاة': 'bg-red-50 text-red-700 border-red-200'
    };
    return map[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

function getPriorityBadgeStyle(priority) {
    const map = {
        'عاجلة جدًا': 'bg-red-600 text-white',
        'عالية': 'bg-rose-100 text-rose-700 border border-rose-200',
        'متوسطة': 'bg-purple-100 text-ghazara-purple',
        'منخفضة': 'bg-slate-100 text-slate-600'
    };
    return map[priority] || 'bg-slate-100 text-slate-600';
}

function renderTasksList() {
    const container = document.getElementById('tasks-list-container');
    const counter = document.getElementById('tasks-results-counter');
    if (!container) return;

    const filtered = getFilteredAndSortedTasks();
    const today = getTodayDateString();

    if (counter) {
        counter.textContent = `عدد المهام المطابقة: ${filtered.length} مهمة`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 px-4 rounded-3xl bg-white/70 border border-dashed border-purple-200 space-y-3">
                <p class="text-base font-bold text-ghazara-purpleDark">لا توجد مهام مطابقة لمعايير العرض الحالية في قاعدة البيانات</p>
                <p class="text-xs text-slate-500">يمكنك إضافة مهمة جديدة الآن ليتم حفظها وحساب مؤشراتها تلقائياً.</p>
                <div class="pt-1">
                    <button type="button" onclick="openTaskModal()" class="btn-purple-gradient text-xs font-bold px-6 py-2.5 rounded-full">
                        + إضافة مهمة جديدة
                    </button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(task => {
        const overdue = isTaskOverdue(task, today);
        const subtasksCount = Array.isArray(task.subtasks) ? task.subtasks.length : 0;
        const subtasksDone = Array.isArray(task.subtasks) ? task.subtasks.filter(s => s.done).length : 0;
        const responsesCount = Array.isArray(task.responses) ? task.responses.length : 0;
        const attachmentsCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

        return `
        <div class="p-4 sm:p-5 rounded-3xl bg-white/95 border ${overdue ? 'border-red-300 shadow-[0_4px_20px_rgba(239,68,68,0.08)]' : 'border-purple-100'} hover:border-ghazara-purple/50 transition-all space-y-3">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1.5 min-w-0 flex-grow">
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="font-display text-xs font-extrabold text-ghazara-purple bg-ghazara-purpleSoft px-2.5 py-0.5 rounded-lg">${task.taskId}</span>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full ${getPriorityBadgeStyle(task.priority)}">${task.priority}</span>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(task.status)}">${task.status}</span>
                        <span class="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">${task.taskType || 'داخلية'}</span>
                        ${overdue ? `<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse">⚠️ متأخرة عن الموعد</span>` : ''}
                        ${task.recurrencePattern && task.recurrencePattern !== 'بدون' ? `<span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-ghazara-teal">🔄 تكرار ${task.recurrencePattern}</span>` : ''}
                    </div>
                    <h4 class="text-base sm:text-lg font-bold text-ghazara-purpleDark">${escapeHtml(task.title)}</h4>
                    ${task.description ? `<p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${escapeHtml(task.description)}</p>` : ''}
                </div>

                <!-- Quick Status & Progress Controls -->
                <div class="flex flex-wrap items-center gap-2 shrink-0">
                    <select onchange="handleQuickStatusChange('${task.taskId}', this.value)" class="text-xs font-bold rounded-xl border border-purple-200 bg-purple-50/50 px-2.5 py-1.5 text-ghazara-purpleDark outline-none">
                        <option value="جديدة" ${task.status === 'جديدة' ? 'selected' : ''}>جديدة</option>
                        <option value="لم يبدأ التنفيذ" ${task.status === 'لم يبدأ التنفيذ' ? 'selected' : ''}>لم يبدأ التنفيذ</option>
                        <option value="قيد التنفيذ" ${task.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
                        <option value="بانتظار رد" ${task.status === 'بانتظار رد' ? 'selected' : ''}>بانتظار رد</option>
                        <option value="بانتظار اعتماد" ${task.status === 'بانتظار اعتماد' ? 'selected' : ''}>بانتظار اعتماد</option>
                        <option value="مكتملة" ${task.status === 'مكتملة' ? 'selected' : ''}>مكتملة</option>
                        <option value="مؤجلة" ${task.status === 'مؤجلة' ? 'selected' : ''}>مؤجلة</option>
                        <option value="ملغاة" ${task.status === 'ملغاة' ? 'selected' : ''}>ملغاة</option>
                    </select>

                    <button type="button" onclick="openTaskModal('${task.taskId}')" class="px-3 py-1.5 rounded-xl bg-ghazara-purpleSoft text-ghazara-purple hover:bg-ghazara-purple hover:text-white text-xs font-bold transition-all">
                        تعديل / تفاصيل
                    </button>
                    <button type="button" onclick="openTaskResponsesModal('${task.taskId}')" class="px-3 py-1.5 rounded-xl bg-orange-50 text-ghazara-orange hover:bg-ghazara-orange hover:text-white text-xs font-bold transition-all">
                        الردود والقرارات (${responsesCount})
                    </button>
                    <button type="button" onclick="toggleArchiveTask('${task.taskId}', ${!task.isArchived})" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all" title="تفضيل الأرشفة على الحذف النهائي">
                        ${task.isArchived ? 'استعادة' : 'أرشفة'}
                    </button>
                    <button type="button" onclick="confirmDeleteTaskModal('${task.taskId}')" class="px-2.5 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all" title="حذف المهمة">
                        حذف
                    </button>
                </div>
            </div>

            <!-- Metadata & Progress Bar Row -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-purple-50 items-center text-xs text-slate-600">
                <div class="md:col-span-8 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <span><strong>التصنيف:</strong> <span class="text-ghazara-purple font-semibold">${escapeHtml(task.categoryName || 'غير مصنف')}</span></span>
                    ${task.entityName ? `<span><strong>الجهة:</strong> ${escapeHtml(task.entityName)}</span>` : ''}
                    ${task.assignee ? `<span><strong>المسؤول:</strong> ${escapeHtml(task.assignee)}</span>` : ''}
                    <span><strong>الاستحقاق:</strong> <span dir="ltr" class="font-display font-bold ${overdue ? 'text-red-600' : 'text-ghazara-purpleDark'}">${task.dueDate || '-'} ${task.dueTime || ''}</span></span>
                    ${subtasksCount > 0 ? `<span class="text-ghazara-teal font-bold">الخطوات الفرعية: ${subtasksDone}/${subtasksCount}</span>` : ''}
                    ${attachmentsCount > 0 ? `<span class="text-ghazara-orange font-bold">📎 ${attachmentsCount} مرفق</span>` : ''}
                    ${task.completedAt ? `<span class="text-emerald-700 font-semibold">✓ أُنجزت: ${task.completedAt}</span>` : ''}
                </div>
                <div class="md:col-span-4 flex items-center gap-2.5">
                    <span class="text-[11px] font-bold text-slate-500 shrink-0">الإنجاز:</span>
                    <div class="flex-grow h-2.5 rounded-full bg-purple-100 overflow-hidden">
                        <div class="h-full rounded-full ${task.progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-l from-ghazara-purple to-ghazara-orange'} transition-all" style="width:${Math.min(100, Math.max(0, Number(task.progress || 0)))}%"></div>
                    </div>
                    <span class="font-display text-xs font-extrabold text-ghazara-purpleDark w-9 text-left">${task.progress || 0}%</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

/**
 * ============================================================================
 * 5. الأقسام الأربعة التلخيصية: الأكثر إلحاحاً، القادمة، الملخص اليومي، وآخر التحديثات
 * ============================================================================
 */
function renderOperationalSummaryPanels() {
    const today = getTodayDateString();
    const activeTasks = STATE.tasks.filter(t => !t.isArchived);

    // 1. المهام الأكثر إلحاحاً (متأخرة أو عاجلة جداً/عالية ولم تكتمل)
    const urgentTasks = activeTasks
        .filter(t => t.status !== 'مكتملة' && t.status !== 'ملغاة' && (isTaskOverdue(t, today) || t.priority === 'عاجلة جدًا' || t.priority === 'عالية'))
        .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')));

    document.getElementById('urgent-panel-count').textContent = urgentTasks.length;
    const urgentBox = document.getElementById('most-urgent-tasks-list');
    if (urgentBox) {
        urgentBox.innerHTML = urgentTasks.length === 0
            ? `<p class="text-xs text-slate-400 py-4 text-center">لا توجد مهام متأخرة أو عاجلة حرجة حالياً.</p>`
            : urgentTasks.slice(0, 8).map(t => `
                <div onclick="openTaskModal('${t.taskId}')" class="p-3 rounded-2xl bg-rose-50/50 hover:bg-rose-50 border border-rose-100 cursor-pointer flex items-center justify-between gap-2 transition-all">
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="font-display text-[11px] font-bold text-rose-700">${t.taskId}</span>
                            <span class="text-xs font-bold text-ghazara-purpleDark truncate">${escapeHtml(t.title)}</span>
                        </div>
                        <span class="text-[11px] text-slate-500 block truncate">${escapeHtml(t.categoryName)} — المسؤول: ${escapeHtml(t.assignee || 'غير محدد')}</span>
                    </div>
                    <span dir="ltr" class="font-display text-xs font-bold ${isTaskOverdue(t, today) ? 'text-red-600' : 'text-rose-700'} shrink-0">${t.dueDate}</span>
                </div>
            `).join('');
    }

    // 2. المهام القادمة (خلال الأيام السبعة القادمة)
    const upcomingTasks = activeTasks
        .filter(t => isTaskDueNext7Days(t, today))
        .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')));

    document.getElementById('upcoming-panel-count').textContent = upcomingTasks.length;
    const upcomingBox = document.getElementById('upcoming-tasks-list');
    if (upcomingBox) {
        upcomingBox.innerHTML = upcomingTasks.length === 0
            ? `<p class="text-xs text-slate-400 py-4 text-center">لا توجد مهام مجدولة خلال الأيام السبعة القادمة.</p>`
            : upcomingTasks.slice(0, 8).map(t => `
                <div onclick="openTaskModal('${t.taskId}')" class="p-3 rounded-2xl bg-teal-50/40 hover:bg-teal-50 border border-teal-100 cursor-pointer flex items-center justify-between gap-2 transition-all">
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="font-display text-[11px] font-bold text-ghazara-teal">${t.taskId}</span>
                            <span class="text-xs font-bold text-ghazara-purpleDark truncate">${escapeHtml(t.title)}</span>
                        </div>
                        <span class="text-[11px] text-slate-500 block truncate">${escapeHtml(t.categoryName)} — الحالة: ${t.status}</span>
                    </div>
                    <span dir="ltr" class="font-display text-xs font-bold text-ghazara-teal shrink-0">${t.dueDate}</span>
                </div>
            `).join('');
    }

    // 3. الملخص اليومي لحالة العمل (محسوب فعلياً)
    const total = activeTasks.length;
    const completed = activeTasks.filter(t => t.status === 'مكتملة').length;
    const overdue = activeTasks.filter(t => isTaskOverdue(t, today)).length;
    const dueToday = activeTasks.filter(t => isTaskDueToday(t, today)).length;
    const waitingExec = activeTasks.filter(t => t.status === 'بانتظار اعتماد').length;
    const avgProgress = total > 0 ? Math.round(activeTasks.reduce((acc, t) => acc + Number(t.progress || 0), 0) / total) : 0;

    const summaryBox = document.getElementById('daily-work-summary-box');
    if (summaryBox) {
        summaryBox.innerHTML = `
            <div class="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                <span>متوسط نسبة الإنجاز العام للمهام النشطة:</span>
                <strong class="font-display text-base text-ghazara-purple">${avgProgress}%</strong>
            </div>
            <div class="grid grid-cols-2 gap-2.5 text-xs">
                <div class="p-3 rounded-xl bg-white border border-purple-100">
                    <span class="text-slate-500 block">مهام مستحقة اليوم</span>
                    <strong class="font-display text-lg text-ghazara-orange">${dueToday}</strong>
                </div>
                <div class="p-3 rounded-xl bg-white border border-purple-100">
                    <span class="text-slate-500 block">مهام متأخرة تتطلب تدخلاً</span>
                    <strong class="font-display text-lg text-red-600">${overdue}</strong>
                </div>
                <div class="p-3 rounded-xl bg-white border border-purple-100">
                    <span class="text-slate-500 block">بانتظار اعتماد التنفيذية</span>
                    <strong class="font-display text-lg text-ghazara-purple">${waitingExec}</strong>
                </div>
                <div class="p-3 rounded-xl bg-white border border-purple-100">
                    <span class="text-slate-500 block">مهام مكتملة بنجاح</span>
                    <strong class="font-display text-lg text-emerald-600">${completed} / ${total}</strong>
                </div>
            </div>
        `;
    }

    // 4. قائمة بآخر التحديثات من سجل التعديلات
    const updatesBox = document.getElementById('latest-updates-list');
    if (updatesBox) {
        if (!STATE.auditLogs.length) {
            updatesBox.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">لا توجد تحديثات مسجلة بعد في سجل التغييرات.</p>`;
        } else {
            updatesBox.innerHTML = STATE.auditLogs.slice(0, 15).map(log => `
                <div class="p-2.5 rounded-xl bg-white border border-purple-100/80 flex items-start justify-between gap-2">
                    <div>
                        <span class="font-bold text-ghazara-purpleDark">${escapeHtml(log.actionType)}</span>
                        <span class="font-display text-ghazara-purple font-semibold mx-1">(${escapeHtml(log.refId)})</span>
                        <span class="text-slate-500">بواسطة ${escapeHtml(log.user)}</span>
                        ${log.newValue ? `<div class="text-[11px] text-slate-600 mt-0.5">${escapeHtml(log.oldValue ? log.oldValue + ' ← ' : '')}${escapeHtml(log.newValue)} ${log.details ? '— ' + escapeHtml(log.details) : ''}</div>` : ''}
                    </div>
                    <span dir="ltr" class="font-display text-[10px] text-slate-400 shrink-0">${escapeHtml(log.timestamp)}</span>
                </div>
            `).join('');
        }
    }
}

/**
 * ============================================================================
 * 6. نموذج إضافة وتعديل المهمة وحفظها الفعلي في Google Sheets
 * ============================================================================
 */
function populateSelectDropdowns() {
    const activeCats = STATE.categories.filter(c => !c.archived);
    const catFilter = document.getElementById('filterCategorySelect');
    const formCat = document.getElementById('formCategoryId');

    if (catFilter) {
        const currentVal = catFilter.value;
        catFilter.innerHTML = `<option value="ALL">جميع التصنيفات الثمانية</option>` +
            activeCats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
        catFilter.value = currentVal || 'ALL';
    }

    if (formCat) {
        formCat.innerHTML = `<option value="" disabled selected>اختر التصنيف الإداري *</option>` +
            activeCats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }

    const entFilter = document.getElementById('filterEntitySelect');
    const formEnt = document.getElementById('formEntityId');
    if (entFilter) {
        const curEnt = entFilter.value;
        entFilter.innerHTML = `<option value="ALL">جميع الجهات</option>` +
            STATE.entities.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
        entFilter.value = curEnt || 'ALL';
    }
    if (formEnt) {
        formEnt.innerHTML = `<option value="">-- بدون جهة محددة --</option>` +
            STATE.entities.map(e => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
    }

    const datalist = document.getElementById('assignees-datalist');
    if (datalist) {
        const usersList = STATE.users.length ? STATE.users : getLocalUsersSheet();
        datalist.innerHTML = usersList.map(u => `<option value="${escapeHtml(u.empName)}">${escapeHtml(u.jobRole)}</option>`).join('');
    }
}

function generateNextLocalTaskId() {
    const year = new Date().getFullYear();
    const used = new Set(STATE.tasks.map(t => t.taskId));
    let seq = STATE.tasks.length + 1;
    let id = '';
    do {
        id = `TSK-${year}-${String(seq).padStart(4, '0')}`;
        seq++;
    } while (used.has(id));
    return id;
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-form-modal');
    const errBox = document.getElementById('task-form-error');
    const form = document.getElementById('task-main-form');
    errBox.classList.add('hidden');
    form.reset();

    populateSelectDropdowns();
    const today = getTodayDateString();
    const nowStr = getNowTimestampString();

    if (!taskId) {
        document.getElementById('task-modal-badge').textContent = 'إضافة مهمة جديدة';
        document.getElementById('task-modal-title').textContent = 'إنشاء مهمة إدارية / تسويقية جديدة';
        document.getElementById('formTaskId').value = generateNextLocalTaskId();
        document.getElementById('formCreatedAt').value = nowStr;
        document.getElementById('formUpdatedAt').value = nowStr;
        document.getElementById('formStartDate').value = today;
        document.getElementById('formDueDate').value = today;
        document.getElementById('formDueTime').value = '14:00';
        document.getElementById('formPriority').value = 'متوسطة';
        document.getElementById('formStatus').value = 'جديدة';
        document.getElementById('formProgress').value = 0;
        document.getElementById('formProgressLabel').textContent = '0%';
        document.getElementById('formAssignee').value = STATE.user?.empName || '';
        if (STATE.activeSidebarCategory !== 'ALL' && STATE.activeSidebarCategory !== 'ARCHIVED') {
            document.getElementById('formCategoryId').value = STATE.activeSidebarCategory;
        }
        STATE.editingTaskSubtasks = [];
        STATE.editingTaskAttachments = [];
        STATE.editingTaskOriginalStatus = '';
        STATE.editingTaskOriginalDueDate = '';
        document.getElementById('task-history-badges').innerHTML = '';
        document.getElementById('postpone-reason-wrap').classList.add('hidden');
    } else {
        const task = STATE.tasks.find(t => t.taskId === taskId);
        if (!task) return;

        document.getElementById('task-modal-badge').textContent = `تعديل المهمة (${task.taskId})`;
        document.getElementById('task-modal-title').textContent = task.title;
        document.getElementById('formTaskId').value = task.taskId;
        document.getElementById('formCreatedAt').value = task.createdAt || nowStr;
        document.getElementById('formUpdatedAt').value = task.updatedAt || nowStr;
        document.getElementById('formTitle').value = task.title || '';
        document.getElementById('formDescription').value = task.description || '';
        document.getElementById('formCategoryId').value = task.categoryId || '';
        document.getElementById('formEntityId').value = task.entityId || '';
        document.getElementById('formTaskType').value = task.taskType || 'داخلية';
        document.getElementById('formSource').value = task.source || '';
        document.getElementById('formAssignee').value = task.assignee || '';
        document.getElementById('formStartDate').value = task.startDate || '';
        document.getElementById('formDueDate').value = task.dueDate || '';
        document.getElementById('formDueTime').value = task.dueTime || '';
        document.getElementById('formPriority').value = task.priority || 'متوسطة';
        document.getElementById('formStatus').value = task.status || 'جديدة';
        document.getElementById('formProgress').value = Number(task.progress || 0);
        document.getElementById('formProgressLabel').textContent = `${task.progress || 0}%`;
        document.getElementById('formPostponeReason').value = task.postponeReason || '';
        document.getElementById('formRelatedTasks').value = Array.isArray(task.relatedTasks) ? task.relatedTasks.join(', ') : '';
        document.getElementById('formNotes').value = task.notes || '';
        document.getElementById('formReminderDateTime').value = task.reminderDateTime || '';
        document.getElementById('formReminderMethod').value = task.reminderMethod || 'كلاهما';
        document.getElementById('formRecurrencePattern').value = task.recurrencePattern || 'بدون';
        document.getElementById('formRecurrenceStart').value = task.recurrenceStart || '';
        document.getElementById('formRecurrenceEnd').value = task.recurrenceEnd || '';

        STATE.editingTaskSubtasks = Array.isArray(task.subtasks) ? JSON.parse(JSON.stringify(task.subtasks)) : [];
        STATE.editingTaskAttachments = Array.isArray(task.attachments) ? JSON.parse(JSON.stringify(task.attachments)) : [];
        STATE.editingTaskOriginalStatus = task.status;
        STATE.editingTaskOriginalDueDate = task.dueDate;

        handleFormStatusChange(task.status);

        // عرض سجل الإنجاز السابق وسجل المواعيد المؤجلة إن وجد
        const prevDatesCount = Array.isArray(task.previousDueDates) ? task.previousDueDates.length : 0;
        const compHistCount = Array.isArray(task.completionHistory) ? task.completionHistory.length : 0;
        document.getElementById('task-history-badges').innerHTML = `
            <span>سجل تغييرات الموعد: <strong>${prevDatesCount}</strong></span> |
            <span>سجل الإنجاز السابق المحفوظ: <strong>${compHistCount}</strong></span>
        `;
    }

    renderFormSubtasks();
    renderFormAttachments();
    modal.classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('task-form-modal').classList.add('hidden');
}

function handleFormStatusChange(statusVal) {
    const postponeWrap = document.getElementById('postpone-reason-wrap');
    if (statusVal === 'مؤجلة') {
        postponeWrap.classList.remove('hidden');
    } else {
        postponeWrap.classList.add('hidden');
    }
    if (statusVal === 'مكتملة') {
        document.getElementById('formProgress').value = 100;
        document.getElementById('formProgressLabel').textContent = '100%';
    }
}

function addSubtaskItem() {
    const inp = document.getElementById('newSubtaskInput');
    const title = inp.value.trim();
    if (!title) return;
    STATE.editingTaskSubtasks.push({ id: 'SUB-' + Date.now(), title: title, done: false });
    inp.value = '';
    renderFormSubtasks();
}

function toggleSubtaskDone(index) {
    if (STATE.editingTaskSubtasks[index]) {
        STATE.editingTaskSubtasks[index].done = !STATE.editingTaskSubtasks[index].done;
        renderFormSubtasks();
    }
}

function removeSubtaskItem(index) {
    STATE.editingTaskSubtasks.splice(index, 1);
    renderFormSubtasks();
}

function renderFormSubtasks() {
    const box = document.getElementById('form-subtasks-list');
    if (!box) return;
    if (!STATE.editingTaskSubtasks.length) {
        box.innerHTML = `<p class="text-[11px] text-slate-400">لا توجد خطوات فرعية مضافة.</p>`;
        return;
    }
    box.innerHTML = STATE.editingTaskSubtasks.map((st, idx) => `
        <div class="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-purple-100 text-xs">
            <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" ${st.done ? 'checked' : ''} onchange="toggleSubtaskDone(${idx})" class="accent-ghazara-purple">
                <span class="${st.done ? 'line-through text-slate-400' : 'text-ghazara-purpleDark font-medium'}">${escapeHtml(st.title)}</span>
            </label>
            <button type="button" onclick="removeSubtaskItem(${idx})" class="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
    `).join('');
}

function addAttachmentItem() {
    const titleInp = document.getElementById('newAttachmentTitle');
    const urlInp = document.getElementById('newAttachmentUrl');
    const name = titleInp.value.trim();
    const url = urlInp.value.trim();
    if (!name && !url) return;
    STATE.editingTaskAttachments.push({
        id: 'ATT-' + Date.now(),
        name: name || url,
        url: url || '#',
        type: 'رابط / مرفق'
    });
    titleInp.value = '';
    urlInp.value = '';
    renderFormAttachments();
}

function removeAttachmentItem(index) {
    STATE.editingTaskAttachments.splice(index, 1);
    renderFormAttachments();
}

function renderFormAttachments() {
    const box = document.getElementById('form-attachments-list');
    if (!box) return;
    if (!STATE.editingTaskAttachments.length) {
        box.innerHTML = `<p class="text-[11px] text-slate-400">لا توجد مرفقات أو روابط مضافة.</p>`;
        return;
    }
    box.innerHTML = STATE.editingTaskAttachments.map((att, idx) => `
        <div class="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-orange-100 text-xs">
            <a href="${escapeHtml(att.url)}" target="_blank" class="text-ghazara-purple font-semibold hover:underline truncate max-w-[220px]">📎 ${escapeHtml(att.name)}</a>
            <button type="button" onclick="removeAttachmentItem(${idx})" class="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
    `).join('');
}

async function handleSaveTaskForm(event) {
    event.preventDefault();
    const errBox = document.getElementById('task-form-error');
    errBox.classList.add('hidden');

    const taskId = document.getElementById('formTaskId').value.trim();
    const title = document.getElementById('formTitle').value.trim();
    const categoryId = document.getElementById('formCategoryId').value;
    const entityId = document.getElementById('formEntityId').value;
    const dueDate = document.getElementById('formDueDate').value;
    const priority = document.getElementById('formPriority').value;
    const status = document.getElementById('formStatus').value;
    const postponeReason = document.getElementById('formPostponeReason').value.trim();

    // التحقق من صحة البيانات قبل الحفظ مع رسالة مفهومة
    const missing = [];
    if (!title) missing.push('عنوان المهمة');
    if (!categoryId) missing.push('التصنيف الإداري');
    if (!priority) missing.push('الأولوية');
    if (!dueDate) missing.push('الموعد النهائي');
    if (status === 'مؤجلة' && !postponeReason) missing.push('سبب التأجيل (مطلوب عند اختيار حالة مؤجلة)');

    if (missing.length > 0) {
        errBox.textContent = 'يرجى استكمال الحقول الأساسية المطلوبة قبل الحفظ: ' + missing.join('، ') + '.';
        errBox.classList.remove('hidden');
        return;
    }

    const catObj = STATE.categories.find(c => c.id === categoryId);
    const entObj = STATE.entities.find(e => e.id === entityId);
    const existingIdx = STATE.tasks.findIndex(t => t.taskId === taskId);
    const existingTask = existingIdx !== -1 ? STATE.tasks[existingIdx] : null;
    const nowStr = getNowTimestampString();

    let prevDates = existingTask && Array.isArray(existingTask.previousDueDates) ? [...existingTask.previousDueDates] : [];
    if (existingTask && existingTask.dueDate && existingTask.dueDate !== dueDate) {
        prevDates.push({
            oldDueDate: existingTask.dueDate,
            newDueDate: dueDate,
            reason: postponeReason || 'تعديل موعد الاستحقاق',
            changedBy: STATE.user?.empName || 'المستخدم',
            changedAt: nowStr
        });
    }

    let completedAt = existingTask ? (existingTask.completedAt || '') : '';
    let compHistory = existingTask && Array.isArray(existingTask.completionHistory) ? [...existingTask.completionHistory] : [];
    let progress = Number(document.getElementById('formProgress').value || 0);

    if (status === 'مكتملة') {
        progress = 100;
        if (!completedAt || existingTask?.status !== 'مكتملة') {
            completedAt = nowStr;
            compHistory.push({ completedAt: nowStr, completedBy: STATE.user?.empName || 'المستخدم', note: 'إكمال المهمة' });
        }
    } else if (existingTask && existingTask.status === 'مكتملة' && status !== 'مكتملة') {
        compHistory.push({ reopenedAt: nowStr, reopenedBy: STATE.user?.empName || 'المستخدم', previousCompletedAt: completedAt, newStatus: status });
    }

    const relatedRaw = document.getElementById('formRelatedTasks').value.trim();
    const relatedTasks = relatedRaw ? relatedRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const taskRecord = {
        taskId: taskId,
        title: title,
        description: document.getElementById('formDescription').value.trim(),
        categoryId: categoryId,
        categoryName: catObj ? catObj.name : '',
        entityId: entityId,
        entityName: entObj ? entObj.name : '',
        taskType: document.getElementById('formTaskType').value,
        source: document.getElementById('formSource').value.trim(),
        assignee: document.getElementById('formAssignee').value.trim(),
        createdBy: existingTask ? existingTask.createdBy : (STATE.user?.empName || ''),
        createdAt: existingTask ? existingTask.createdAt : nowStr,
        startDate: document.getElementById('formStartDate').value,
        dueDate: dueDate,
        dueTime: document.getElementById('formDueTime').value,
        priority: priority,
        status: status,
        progress: progress,
        subtasks: STATE.editingTaskSubtasks,
        relatedTasks: relatedTasks,
        responses: existingTask && Array.isArray(existingTask.responses) ? existingTask.responses : [],
        notes: document.getElementById('formNotes').value.trim(),
        attachments: STATE.editingTaskAttachments,
        reminderDateTime: document.getElementById('formReminderDateTime').value,
        reminderMethod: document.getElementById('formReminderMethod').value,
        recurrencePattern: document.getElementById('formRecurrencePattern').value,
        recurrenceStart: document.getElementById('formRecurrenceStart').value,
        recurrenceEnd: document.getElementById('formRecurrenceEnd').value,
        postponeReason: postponeReason,
        previousDueDates: prevDates,
        completedAt: completedAt,
        completionHistory: compHistory,
        isArchived: existingTask ? Boolean(existingTask.isArchived) : false,
        updatedAt: nowStr
    };

    const btn = document.getElementById('save-task-submit-btn');
    const spinner = document.getElementById('save-task-spinner');
    const btnText = document.getElementById('save-task-btn-text');
    btn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'جاري الحفظ...';

    const apiRes = await callGoogleScriptAPI({
        action: 'saveTask',
        task: taskRecord,
        byUser: STATE.user?.empName || STATE.user?.username || 'المستخدم'
    });

    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'حفظ المهمة في قاعدة البيانات';

    if (!apiRes.fallbackToLocal && apiRes.status === 'error') {
        errBox.textContent = apiRes.message || 'تعذر حفظ المهمة في الخادم.';
        errBox.classList.remove('hidden');
        return;
    }

    if (existingIdx !== -1) {
        STATE.tasks[existingIdx] = taskRecord;
        recordLocalAuditLog(taskId, 'تعديل مهمة', 'بيانات المهمة', existingTask.status, taskRecord.status, taskRecord.title);
    } else {
        STATE.tasks.unshift(taskRecord);
        recordLocalAuditLog(taskId, 'إنشاء مهمة جديدة', 'سجل المهمة', '', taskRecord.title, `التصنيف: ${taskRecord.categoryName}`);
    }

    syncLocalRemindersForTask(taskRecord);
    saveBundleToCache();
    closeTaskModal();
    renderAllDashboardComponents();

    showTasksToast(apiRes.message || `تم حفظ المهمة (${taskId}) وتأكيد العملية بنجاح.`);
}

/**
 * ============================================================================
 * 7. تغيير الحالة السريع، التأجيل مع السبب، الردود والقرارات، والأرشفة والحذف
 * ============================================================================
 */
async function handleQuickStatusChange(taskId, newStatus) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;

    // إذا اختار "مؤجلة"، نطلب الموعد الجديد وسبب التأجيل مع الاحتفاظ بالموعد السابق
    if (newStatus === 'مؤجلة') {
        openPostponeModal(taskId);
        return;
    }

    const oldStatus = task.status;
    const nowStr = getNowTimestampString();
    task.status = newStatus;
    task.updatedAt = nowStr;

    if (newStatus === 'مكتملة') {
        task.progress = 100;
        task.completedAt = nowStr;
        if (!Array.isArray(task.completionHistory)) task.completionHistory = [];
        task.completionHistory.push({ completedAt: nowStr, completedBy: STATE.user?.empName || 'المستخدم', note: 'إكمال المهمة' });
        pushInternalNotification('إكمال مهمة', `تم إكمال المهمة (${taskId}): ${task.title}`, taskId);
    } else if (oldStatus === 'مكتملة' && newStatus !== 'مكتملة') {
        if (!Array.isArray(task.completionHistory)) task.completionHistory = [];
        task.completionHistory.push({ reopenedAt: nowStr, reopenedBy: STATE.user?.empName || 'المستخدم', previousCompletedAt: task.completedAt, newStatus: newStatus });
        pushInternalNotification('إعادة فتح مهمة', `تمت إعادة فتح المهمة (${taskId}) مع الاحتفاظ بسجل الإنجاز السابق.`, taskId);
    }

    recordLocalAuditLog(taskId, 'تغيير حالة المهمة', 'الحالة_الحالية', oldStatus, newStatus, task.title);
    syncLocalRemindersForTask(task);
    saveBundleToCache();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({
        action: 'updateTaskStatus',
        taskId: taskId,
        status: newStatus,
        progress: task.progress,
        byUser: STATE.user?.empName || 'المستخدم'
    });

    showTasksToast(`تم تحديث حالة المهمة (${taskId}) إلى "${newStatus}" وحفظ التعديل.`);
}

function openPostponeModal(taskId) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;
    document.getElementById('action-modal-title').textContent = `تأجيل المهمة (${task.taskId})`;
    document.getElementById('action-modal-body').innerHTML = `
        <p class="text-xs text-slate-600 bg-orange-50 p-3 rounded-2xl border border-orange-100">
            الموعد النهائي الحالي: <strong dir="ltr" class="font-display">${task.dueDate}</strong> (سيتم الاحتفاظ به في سجل المواعيد السابقة).
        </p>
        <div>
            <label class="block text-xs font-bold text-ghazara-purpleDark mb-1">الموعد النهائي الجديد *</label>
            <input type="date" id="modalPostponeDate" value="${task.dueDate}" class="w-full rounded-xl border border-purple-200 px-3.5 py-2">
        </div>
        <div>
            <label class="block text-xs font-bold text-ghazara-purpleDark mb-1">سبب التأجيل *</label>
            <textarea id="modalPostponeReason" rows="3" placeholder="اذكر سبب تأجيل المهمة ليتم توثيقه في سجل التغييرات والتقارير..." class="w-full rounded-xl border border-purple-200 px-3.5 py-2"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-2">
            <button type="button" onclick="closeActionModal(); renderTasksList();" class="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-600">إلغاء</button>
            <button type="button" onclick="submitPostponeTask('${task.taskId}')" class="btn-orange-gradient px-5 py-2 rounded-full text-xs font-bold">تأكيد التأجيل وحفظ السجل</button>
        </div>
    `;
    document.getElementById('task-action-modal').classList.remove('hidden');
}

async function submitPostponeTask(taskId) {
    const newDate = document.getElementById('modalPostponeDate').value;
    const reason = document.getElementById('modalPostponeReason').value.trim();
    if (!newDate || !reason) {
        showTasksToast('يرجى تحديد الموعد الجديد وكتابة سبب التأجيل.', 'error');
        return;
    }
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;

    const oldDate = task.dueDate;
    const nowStr = getNowTimestampString();
    if (!Array.isArray(task.previousDueDates)) task.previousDueDates = [];
    task.previousDueDates.push({
        oldDueDate: oldDate,
        newDueDate: newDate,
        reason: reason,
        changedBy: STATE.user?.empName || 'المستخدم',
        changedAt: nowStr
    });
    task.dueDate = newDate;
    task.status = 'مؤجلة';
    task.postponeReason = reason;
    task.updatedAt = nowStr;

    recordLocalAuditLog(taskId, 'تأجيل مهمة', 'الموعد_النهائي', oldDate, newDate, `السبب: ${reason}`);
    pushInternalNotification('تعديل موعد مهمة', `تم تأجيل المهمة (${taskId}) من ${oldDate} إلى ${newDate}.`, taskId);
    syncLocalRemindersForTask(task);
    saveBundleToCache();
    closeActionModal();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({
        action: 'updateTaskStatus',
        taskId: taskId,
        status: 'مؤجلة',
        newDueDate: newDate,
        postponeReason: reason,
        byUser: STATE.user?.empName || 'المستخدم'
    });

    showTasksToast(`تم تأجيل المهمة (${taskId}) إلى ${newDate} وحفظ الموعد السابق في السجل.`);
}

function openTaskResponsesModal(taskId) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;
    const responses = Array.isArray(task.responses) ? task.responses : [];

    document.getElementById('action-modal-title').textContent = `الردود والقرارات المرتبطة بالمهمة (${task.taskId})`;
    document.getElementById('action-modal-body').innerHTML = `
        <div class="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-2 bg-slate-50 rounded-2xl border border-purple-100">
            ${responses.length === 0 ? `<p class="text-xs text-slate-400 text-center py-4">لا توجد ردود أو قرارات مسجلة لهذه المهمة بعد.</p>` : responses.map(r => `
                <div class="p-3 rounded-xl bg-white border border-purple-100 text-xs space-y-1">
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-ghazara-purple">${escapeHtml(r.decisionType || 'رد')} — ${escapeHtml(r.author)}</span>
                        <span dir="ltr" class="font-display text-[10px] text-slate-400">${escapeHtml(r.createdAt)}</span>
                    </div>
                    <p class="text-slate-700">${escapeHtml(r.text)}</p>
                </div>
            `).join('')}
        </div>
        <div class="space-y-2.5 pt-2 border-t border-purple-100">
            <select id="newResponseDecisionType" class="w-full rounded-xl border border-purple-200 px-3 py-2 text-xs font-bold">
                <option value="رد تنفيذ ومتابعة">رد تنفيذ ومتابعة</option>
                <option value="قرار اعتماد من الإدارة التنفيذية">قرار اعتماد من الإدارة التنفيذية</option>
                <option value="توجيه من قسم التسويق والإعلام الرقمي">توجيه من قسم التسويق والإعلام الرقمي</option>
                <option value="توجيه من قسم التطوير المؤسسي">توجيه من قسم التطوير المؤسسي</option>
                <option value="ملاحظة استكمال نواقص">ملاحظة استكمال نواقص</option>
            </select>
            <textarea id="newResponseText" rows="2" placeholder="اكتب الرد أو القرار الإداري المرتبط بالمهمة..." class="w-full rounded-xl border border-purple-200 px-3 py-2 text-xs"></textarea>
            <div class="flex justify-end gap-2">
                <button type="button" onclick="closeActionModal()" class="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-600">إغلاق</button>
                <button type="button" onclick="submitTaskResponse('${task.taskId}')" class="btn-purple-gradient px-5 py-2 rounded-full text-xs font-bold">حفظ الرد / القرار</button>
            </div>
        </div>
    `;
    document.getElementById('task-action-modal').classList.remove('hidden');
}

async function submitTaskResponse(taskId) {
    const decisionType = document.getElementById('newResponseDecisionType').value;
    const text = document.getElementById('newResponseText').value.trim();
    if (!text) {
        showTasksToast('يرجى كتابة نص الرد أو القرار.', 'error');
        return;
    }
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;

    const nowStr = getNowTimestampString();
    if (!Array.isArray(task.responses)) task.responses = [];
    task.responses.push({
        id: 'RSP-' + Date.now(),
        author: STATE.user?.empName || 'المستخدم',
        decisionType: decisionType,
        text: text,
        createdAt: nowStr
    });
    task.updatedAt = nowStr;

    recordLocalAuditLog(taskId, 'تسجيل رد / قرار', 'الردود_والقرارات', '', decisionType, text);
    saveBundleToCache();
    openTaskResponsesModal(taskId);
    renderTasksList();
    renderOperationalSummaryPanels();

    await callGoogleScriptAPI({
        action: 'addTaskResponse',
        taskId: taskId,
        decisionType: decisionType,
        responseText: text,
        byUser: STATE.user?.empName || 'المستخدم'
    });

    showTasksToast('تم حفظ الرد / القرار في قاعدة البيانات.');
}

async function toggleArchiveTask(taskId, archiveBool) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;
    task.isArchived = Boolean(archiveBool);
    task.updatedAt = getNowTimestampString();

    recordLocalAuditLog(taskId, archiveBool ? 'أرشفة مهمة' : 'استعادة مهمة من الأرشيف', 'مؤرشفة', String(!archiveBool), String(archiveBool), task.title);
    saveBundleToCache();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({
        action: 'archiveTask',
        taskId: taskId,
        isArchived: archiveBool,
        byUser: STATE.user?.empName || 'المستخدم'
    });

    showTasksToast(archiveBool ? `تم نقل المهمة (${taskId}) إلى قسم المهام المؤرشفة.` : `تمت استعادة المهمة (${taskId}) من الأرشيف.`);
}

function confirmDeleteTaskModal(taskId) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;
    document.getElementById('action-modal-title').textContent = `تأكيد حذف أو أرشفة المهمة (${task.taskId})`;
    document.getElementById('action-modal-body').innerHTML = `
        <div class="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5">
            <p class="font-bold">هل أنت متأكد من رغبتك في حذف المهمة: "${escapeHtml(task.title)}"؟</p>
            <p>يفضل النظام <strong>أرشفة المهمة</strong> بدلاً من الحذف النهائي للحفاظ على سجل الإنجاز والتقارير.</p>
        </div>
        <div class="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" onclick="closeActionModal()" class="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-600">إلغاء</button>
            <button type="button" onclick="closeActionModal(); toggleArchiveTask('${task.taskId}', true);" class="btn-teal-gradient px-5 py-2 rounded-full text-xs font-bold">نقل إلى الأرشيف (موصى به)</button>
            <button type="button" onclick="executePermanentDeleteTask('${task.taskId}')" class="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-full text-xs font-bold">حذف نهائي</button>
        </div>
    `;
    document.getElementById('task-action-modal').classList.remove('hidden');
}

async function executePermanentDeleteTask(taskId) {
    const idx = STATE.tasks.findIndex(t => t.taskId === taskId);
    if (idx === -1) return;
    const removed = STATE.tasks.splice(idx, 1)[0];
    recordLocalAuditLog(taskId, 'حذف مهمة نهائياً', 'سجل المهمة', removed.title, 'محذوف', '');
    saveBundleToCache();
    closeActionModal();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({
        action: 'deleteTask',
        taskId: taskId,
        byUser: STATE.user?.empName || 'المستخدم'
    });

    showTasksToast(`تم حذف المهمة (${taskId}) نهائياً.`);
}

function closeActionModal() {
    document.getElementById('task-action-modal').classList.add('hidden');
}

/**
 * ============================================================================
 * 8. التقويم التفاعلي (يومي، أسبوعي، شهري) مع نقل المهام وإعادة جدولة التذكيرات
 * ============================================================================
 */
function setCalendarViewMode(mode) {
    STATE.calendarMode = mode;
    ['day', 'week', 'month'].forEach(m => {
        const btn = document.getElementById('cal-mode-' + m);
        if (btn) {
            btn.className = (m === mode)
                ? 'px-4 py-1.5 rounded-full text-xs font-bold bg-ghazara-purple text-white transition-all'
                : 'px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:bg-purple-100 transition-all';
        }
    });
    renderCalendarView();
}

function navigateCalendar(direction) {
    if (direction === 0) {
        STATE.calendarCursorDate = new Date();
    } else {
        const d = new Date(STATE.calendarCursorDate);
        if (STATE.calendarMode === 'day') d.setDate(d.getDate() + direction);
        else if (STATE.calendarMode === 'week') d.setDate(d.getDate() + direction * 7);
        else d.setMonth(d.getMonth() + direction);
        STATE.calendarCursorDate = d;
    }
    renderCalendarView();
}

function formatDateYMD(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTasksForCalendarDate(dateStr) {
    return STATE.tasks.filter(t => {
        if (t.isArchived) return false;
        if (t.dueDate === dateStr) return true;
        // دعم عرض المهام الدورية المتكررة ضمن نطاق التكرار
        if (t.recurrencePattern && t.recurrencePattern !== 'بدون' && t.status !== 'مكتملة' && t.status !== 'ملغاة') {
            const start = t.recurrenceStart || t.dueDate;
            const end = t.recurrenceEnd || '9999-12-31';
            if (dateStr >= start && dateStr <= end && dateStr !== t.dueDate) {
                if (t.recurrencePattern === 'يومي') return true;
                const dTarget = new Date(dateStr + 'T00:00:00');
                const dBase = new Date((t.dueDate || start) + 'T00:00:00');
                if (t.recurrencePattern === 'أسبوعي' && dTarget.getDay() === dBase.getDay()) return true;
                if (t.recurrencePattern === 'شهري' && dTarget.getDate() === dBase.getDate()) return true;
            }
        }
        return false;
    });
}

function getCalendarTaskChipColor(task, todayStr) {
    if (task.status === 'مكتملة') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (isTaskOverdue(task, todayStr)) return 'bg-red-100 text-red-800 border-red-300 font-bold';
    if (task.priority === 'عاجلة جدًا' || task.priority === 'عالية') return 'bg-rose-100 text-rose-800 border-rose-300';
    if (task.status === 'قيد التنفيذ') return 'bg-sky-100 text-sky-800 border-sky-300';
    return 'bg-purple-100 text-ghazara-purpleDark border-purple-200';
}

function renderCalendarView() {
    const box = document.getElementById('calendar-render-box');
    const titleEl = document.getElementById('calendar-period-title');
    if (!box || !titleEl) return;

    const todayStr = getTodayDateString();
    const cursor = new Date(STATE.calendarCursorDate);

    if (STATE.calendarMode === 'day') {
        const dayStr = formatDateYMD(cursor);
        titleEl.textContent = new Intl.DateTimeFormat('ar-YE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(cursor);
        const dayTasks = getTasksForCalendarDate(dayStr);

        box.innerHTML = `
            <div class="p-5 rounded-3xl bg-white border border-purple-200 space-y-4">
                <div class="flex items-center justify-between border-b border-purple-100 pb-3">
                    <span class="font-bold text-ghazara-purpleDark">المهام المجدولة ليوم (<span dir="ltr" class="font-display">${dayStr}</span>): ${dayTasks.length} مهمة</span>
                    <button type="button" onclick="openTaskModalWithDate('${dayStr}')" class="text-xs font-bold text-ghazara-purple bg-ghazara-purpleSoft px-3.5 py-1.5 rounded-full">+ إضافة مهمة في هذا اليوم</button>
                </div>
                ${dayTasks.length === 0 ? `<p class="text-sm text-slate-400 py-10 text-center">لا توجد مهام مستحقة في هذا اليوم.</p>` : `
                    <div class="space-y-3">
                        ${dayTasks.map(t => `
                            <div class="p-4 rounded-2xl border ${getCalendarTaskChipColor(t, todayStr)} flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <span class="font-display text-xs font-extrabold">${t.taskId}</span>
                                    <h4 class="text-sm font-bold mt-0.5">${escapeHtml(t.title)}</h4>
                                    <p class="text-xs opacity-80">${escapeHtml(t.categoryName)} | الأولوية: ${t.priority} | الحالة: ${t.status}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button type="button" onclick="openCalendarMoveDateModal('${t.taskId}')" class="px-3 py-1.5 rounded-xl bg-white/90 text-ghazara-purple text-xs font-bold shadow-sm">📅 نقل لتاريخ جديد</button>
                                    <button type="button" onclick="openTaskModal('${t.taskId}')" class="px-3 py-1.5 rounded-xl bg-white/90 text-slate-700 text-xs font-bold shadow-sm">فتح</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
        return;
    }

    if (STATE.calendarMode === 'week') {
        const startOfWeek = new Date(cursor);
        startOfWeek.setDate(cursor.getDate() - cursor.getDay()); // الأحد بداية الأسبوع
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d);
        }
        titleEl.textContent = `الأسبوع: ${formatDateYMD(days[0])} إلى ${formatDateYMD(days[6])}`;
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        box.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-7 gap-3">
                ${days.map((d, idx) => {
                    const ds = formatDateYMD(d);
                    const isToday = ds === todayStr;
                    const dTasks = getTasksForCalendarDate(ds);
                    return `
                    <div class="p-3 rounded-2xl bg-white border ${isToday ? 'border-ghazara-purple ring-2 ring-ghazara-purple/20' : 'border-purple-100'} min-h-[220px] flex flex-col justify-between space-y-2"
                         ondragover="event.preventDefault()" ondrop="handleCalendarDrop(event, '${ds}')">
                        <div>
                            <div class="flex items-center justify-between border-b border-purple-50 pb-1.5 mb-2">
                                <span class="text-xs font-bold ${isToday ? 'text-ghazara-purple' : 'text-slate-700'}">${dayNames[idx]}</span>
                                <span dir="ltr" class="font-display text-xs font-bold ${isToday ? 'bg-ghazara-purple text-white px-2 py-0.5 rounded-full' : 'text-slate-400'}">${d.getDate()}/${d.getMonth() + 1}</span>
                            </div>
                            <div class="space-y-1.5">
                                ${dTasks.map(t => `
                                    <div draggable="true" ondragstart="handleCalendarDragStart(event, '${t.taskId}')"
                                         class="p-2 rounded-xl border text-[11px] cursor-pointer ${getCalendarTaskChipColor(t, todayStr)}"
                                         onclick="openCalendarMoveDateModal('${t.taskId}')" title="اضغط لنقل الموعد أو اسحب لليوم المطلوب">
                                        <div class="font-bold truncate">${escapeHtml(t.title)}</div>
                                        <div class="flex items-center justify-between text-[10px] opacity-80 mt-0.5">
                                            <span>${t.priority}</span>
                                            <span>⇄ نقل</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <button type="button" onclick="openTaskModalWithDate('${ds}')" class="text-[10px] font-bold text-ghazara-purple hover:underline text-center pt-1">+ مهمة</button>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
        return;
    }

    // العرض الشهري (Month View)
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    titleEl.textContent = new Intl.DateTimeFormat('ar-YE', { year: 'numeric', month: 'long' }).format(cursor);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    let cellsHtml = dayNames.map(dn => `<div class="p-2 text-center text-xs font-bold text-ghazara-purple bg-ghazara-purpleSoft/60 rounded-xl">${dn}</div>`).join('');

    for (let i = 0; i < startOffset; i++) {
        cellsHtml += `<div class="p-2 rounded-2xl bg-slate-50/50 border border-slate-100 min-h-[110px]"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const dObj = new Date(year, month, day);
        const ds = formatDateYMD(dObj);
        const isToday = ds === todayStr;
        const dTasks = getTasksForCalendarDate(ds);

        cellsHtml += `
            <div class="p-2 rounded-2xl bg-white border ${isToday ? 'border-ghazara-purple ring-2 ring-ghazara-purple/20' : 'border-purple-100/80'} min-h-[115px] flex flex-col justify-between transition-all hover:border-ghazara-purple/50"
                 ondragover="event.preventDefault()" ondrop="handleCalendarDrop(event, '${ds}')">
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-display text-xs font-bold ${isToday ? 'bg-ghazara-purple text-white px-2 py-0.5 rounded-full' : 'text-slate-600'}">${day}</span>
                        <button type="button" onclick="openTaskModalWithDate('${ds}')" class="text-[11px] font-bold text-purple-400 hover:text-ghazara-purple" title="إضافة مهمة في هذا التاريخ">+</button>
                    </div>
                    <div class="space-y-1">
                        ${dTasks.slice(0, 3).map(t => `
                            <div draggable="true" ondragstart="handleCalendarDragStart(event, '${t.taskId}')"
                                 onclick="openCalendarMoveDateModal('${t.taskId}')"
                                 class="px-2 py-1 rounded-lg border text-[10px] truncate cursor-pointer ${getCalendarTaskChipColor(t, todayStr)}"
                                 title="${escapeHtml(t.title)} — اضغط لنقل التاريخ">
                                ${escapeHtml(t.title)}
                            </div>
                        `).join('')}
                        ${dTasks.length > 3 ? `<div class="text-[10px] font-bold text-ghazara-purple text-center">+${dTasks.length - 3} مهام أخرى</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    box.innerHTML = `<div class="calendar-grid-month gap-2">${cellsHtml}</div>`;
}

function handleCalendarDragStart(event, taskId) {
    event.dataTransfer.setData('text/plain', taskId);
}

async function handleCalendarDrop(event, targetDateStr) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/plain');
    if (taskId && targetDateStr) {
        await executeRescheduleTaskFromCalendar(taskId, targetDateStr, 'نقل المهمة بالسحب والإفلات في التقويم');
    }
}

function openCalendarMoveDateModal(taskId) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task) return;
    document.getElementById('action-modal-title').textContent = `نقل موعد المهمة عبر التقويم (${task.taskId})`;
    document.getElementById('action-modal-body').innerHTML = `
        <p class="text-xs font-bold text-ghazara-purpleDark">${escapeHtml(task.title)}</p>
        <p class="text-xs text-slate-500">الموعد الحالي: <span dir="ltr" class="font-display font-bold">${task.dueDate}</span></p>
        <div>
            <label class="block text-xs font-bold text-ghazara-purpleDark mb-1">اختر التاريخ الجديد للمهمة *</label>
            <input type="date" id="calMoveNewDate" value="${task.dueDate}" class="w-full rounded-xl border border-purple-200 px-3.5 py-2">
        </div>
        <div class="flex justify-between items-center pt-2">
            <button type="button" onclick="closeActionModal(); openTaskModal('${task.taskId}');" class="text-xs font-bold text-ghazara-purple hover:underline">فتح كامل تفاصيل المهمة</button>
            <div class="flex gap-2">
                <button type="button" onclick="closeActionModal()" class="px-4 py-2 rounded-full text-xs font-bold bg-slate-100 text-slate-600">إلغاء</button>
                <button type="button" onclick="confirmCalendarMoveDate('${task.taskId}')" class="btn-purple-gradient px-5 py-2 rounded-full text-xs font-bold">نقل وحفظ وإعادة جدولة التذكير</button>
            </div>
        </div>
    `;
    document.getElementById('task-action-modal').classList.remove('hidden');
}

async function confirmCalendarMoveDate(taskId) {
    const newDate = document.getElementById('calMoveNewDate').value;
    if (!newDate) return;
    closeActionModal();
    await executeRescheduleTaskFromCalendar(taskId, newDate, 'نقل الموعد من التقويم التفاعلي');
}

async function executeRescheduleTaskFromCalendar(taskId, newDate, reason) {
    const task = STATE.tasks.find(t => t.taskId === taskId);
    if (!task || task.dueDate === newDate) return;

    const oldDate = task.dueDate;
    const nowStr = getNowTimestampString();
    if (!Array.isArray(task.previousDueDates)) task.previousDueDates = [];
    task.previousDueDates.push({
        oldDueDate: oldDate,
        newDueDate: newDate,
        reason: reason,
        changedBy: STATE.user?.empName || 'المستخدم',
        changedAt: nowStr
    });
    task.dueDate = newDate;
    task.updatedAt = nowStr;

    recordLocalAuditLog(taskId, 'نقل موعد من التقويم', 'الموعد_النهائي', oldDate, newDate, reason);
    pushInternalNotification('تعديل موعد مهمة', `تم نقل موعد المهمة (${taskId}) إلى ${newDate} وإعادة جدولة تذكيراتها.`, taskId);
    syncLocalRemindersForTask(task);
    saveBundleToCache();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({
        action: 'rescheduleTask',
        taskId: taskId,
        newDueDate: newDate,
        reason: reason,
        byUser: STATE.user?.empName || 'المستخدم'
    });

    showTasksToast(`تم نقل المهمة (${taskId}) إلى تاريخ ${newDate} وإعادة جدولة تذكيراتها تلقائياً.`);
}

function openTaskModalWithDate(dateStr) {
    openTaskModal(null);
    document.getElementById('formDueDate').value = dateStr;
}

/**
 * ============================================================================
 * 9. الإشعارات والتذكيرات واختبار البريد الإلكتروني الفعلي
 * ============================================================================
 */
function syncLocalRemindersForTask(task) {
    // إلغاء التذكيرات القديمة المجدولة لنفس المهمة
    STATE.reminders.forEach(r => {
        if (r.taskId === task.taskId && r.status === 'مجدول') {
            r.status = 'أُلغي';
            r.result = 'تم إلغاء التذكير القديم وإعادة الجدولة بعد تحديث المهمة';
        }
    });

    if (task.isArchived || task.status === 'مكتملة' || task.status === 'ملغاة') return;

    const schedTime = task.reminderDateTime ? task.reminderDateTime.replace('T', ' ') : `${task.dueDate} ${task.dueTime || '09:00'}`;
    STATE.reminders.unshift({
        id: 'REM-' + Date.now().toString().slice(-6),
        taskId: task.taskId,
        title: task.title,
        recipientUser: task.assignee || STATE.user?.empName || '',
        recipientEmail: STATE.user?.email || '',
        type: task.reminderDateTime ? 'تذكير مخصص قبل الاستحقاق' : 'تنبيه يوم الاستحقاق',
        scheduledAt: schedTime,
        method: task.reminderMethod || 'كلاهما',
        status: 'مجدول',
        attempts: 0,
        sentAt: '',
        result: 'مجدول في الخلفية'
    });
}

function evaluateLocalInternalNotifications() {
    if (String(STATE.settings.notifications_enabled) === 'false') return;
    const today = getTodayDateString();
    const existingKeys = new Set(STATE.notifications.map(n => `${n.refId}_${n.type}_${today}`));

    STATE.tasks.forEach(t => {
        if (t.isArchived || t.status === 'مكتملة' || t.status === 'ملغاة') return;
        if (isTaskOverdue(t, today)) {
            const key = `${t.taskId}_متأخرة_${today}`;
            if (!existingKeys.has(key)) {
                pushInternalNotification('متأخرة', `المهمة (${t.taskId}): "${t.title}" متأخرة عن موعد استحقاقها (${t.dueDate}).`, t.taskId);
                existingKeys.add(key);
            }
        } else if (isTaskDueToday(t, today)) {
            const key = `${t.taskId}_مستحقة اليوم_${today}`;
            if (!existingKeys.has(key)) {
                pushInternalNotification('مستحقة اليوم', `حلّ اليوم موعد استحقاق المهمة (${t.taskId}): "${t.title}".`, t.taskId);
                existingKeys.add(key);
            }
        }
    });
}

function pushInternalNotification(type, message, refId = '') {
    if (String(STATE.settings.notifications_enabled) === 'false') return;
    STATE.notifications.unshift({
        id: 'NTF-' + Date.now() + '-' + Math.floor(Math.random() * 90),
        targetUser: STATE.user?.username || 'ALL',
        refId: refId,
        type: type,
        title: type,
        message: message,
        isRead: false,
        createdAt: getNowTimestampString()
    });
    renderNotificationsUI();
}

function renderNotificationsUI() {
    const unread = STATE.notifications.filter(n => !n.isRead);
    const badge = document.getElementById('unread-notifications-badge');
    if (badge) {
        if (unread.length > 0) {
            badge.textContent = unread.length > 99 ? '99+' : unread.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    const listEl = document.getElementById('notifications-dropdown-list');
    if (!listEl) return;

    const hideSensitive = String(STATE.settings.hide_sensitive_notifications) === 'true';

    if (STATE.notifications.length === 0) {
        listEl.innerHTML = `<p class="p-6 text-center text-xs text-slate-400">لا توجد إشعارات حالياً.</p>`;
        return;
    }

    listEl.innerHTML = STATE.notifications.slice(0, 25).map(n => `
        <div onclick="markSingleNotificationRead('${n.id}', '${n.refId}')" class="p-3.5 hover:bg-purple-50/60 cursor-pointer transition-colors ${n.isRead ? 'opacity-65' : 'bg-purple-50/30'}">
            <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-ghazara-purple">${escapeHtml(n.type || n.title)}</span>
                <span dir="ltr" class="font-display text-[10px] text-slate-400">${escapeHtml(n.createdAt)}</span>
            </div>
            <p class="text-xs text-slate-700 mt-1">
                ${hideSensitive ? `لديك إشعار مرتبط بالمرجع (${escapeHtml(n.refId || 'عام')}) — تم إخفاء التفاصيل وفق إعدادات الخصوصية.` : escapeHtml(n.message)}
            </p>
        </div>
    `).join('');
}

async function markSingleNotificationRead(notifId, refId) {
    const found = STATE.notifications.find(n => n.id === notifId);
    if (found) found.isRead = true;
    saveBundleToCache();
    renderNotificationsUI();
    if (refId && refId.startsWith('TSK-')) {
        openTaskModal(refId);
    }
    await callGoogleScriptAPI({ action: 'markNotificationRead', notificationId: notifId });
}

async function markAllNotificationsAsRead() {
    STATE.notifications.forEach(n => { n.isRead = true; });
    saveBundleToCache();
    renderNotificationsUI();
    await callGoogleScriptAPI({ action: 'markNotificationRead', markAll: true });
}

function renderRemindersView() {
    // تحديث مؤشر التحقق من البريد الإلكتروني
    const verified = String(STATE.settings.email_verified) === 'true';
    const dot = document.getElementById('email-service-status-dot');
    const title = document.getElementById('email-service-status-title');
    if (dot && title) {
        dot.className = `w-2.5 h-2.5 rounded-full ${verified ? 'bg-emerald-500' : 'bg-amber-500'}`;
        title.textContent = verified
            ? `حالة خدمة البريد الإلكتروني: متصلة وتم التحقق الفعلي من الإرسال بنجاح`
            : `حالة خدمة البريد الإلكتروني: بانتظار إجراء اختبار اتصال وإرسال فعلي`;
    }

    const tbody = document.getElementById('reminders-table-body');
    if (!tbody) return;
    if (!STATE.reminders.length) {
        tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400">لا توجد تذكيرات مسجلة بعد. عند إضافة مهمة جديدة يتم جدولة تذكيراتها تلقائياً.</td></tr>`;
        return;
    }

    tbody.innerHTML = STATE.reminders.map(r => {
        let statusBadge = 'bg-sky-50 text-sky-700 border-sky-200';
        if (r.status === 'أُرسل') statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (r.status === 'فشل') statusBadge = 'bg-red-50 text-red-700 border-red-200';
        if (r.status === 'أُلغي') statusBadge = 'bg-slate-100 text-slate-500 border-slate-200';

        return `
        <tr class="hover:bg-purple-50/40">
            <td class="p-3 font-display text-xs font-bold text-ghazara-purple">${escapeHtml(r.id)}</td>
            <td class="p-3">
                <div class="font-bold text-ghazara-purpleDark">${escapeHtml(r.title)}</div>
                <div class="font-display text-[11px] text-slate-500">${escapeHtml(r.taskId)}</div>
            </td>
            <td class="p-3 text-xs">
                <div>${escapeHtml(r.recipientUser || '-')}</div>
                <div class="font-display text-[11px] text-slate-400">${escapeHtml(r.recipientEmail || '')}</div>
            </td>
            <td class="p-3 text-xs font-semibold">${escapeHtml(r.type)}</td>
            <td class="p-3 font-display text-xs" dir="ltr">${escapeHtml(r.scheduledAt)}</td>
            <td class="p-3 text-xs">${escapeHtml(r.method)}</td>
            <td class="p-3"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge}">${escapeHtml(r.status)}</span></td>
            <td class="p-3 font-display text-xs font-bold">${r.attempts || 0} / 3</td>
            <td class="p-3 text-xs text-slate-600">
                ${r.sentAt ? `<div dir="ltr" class="font-display text-[11px] text-emerald-700">${escapeHtml(r.sentAt)}</div>` : ''}
                <div>${escapeHtml(r.result || '')}</div>
            </td>
        </tr>
        `;
    }).join('');
}

async function runRealEmailConnectionTest() {
    const email = document.getElementById('testEmailRecipientInput').value.trim();
    if (!email) {
        showTasksToast('يرجى إدخال البريد الإلكتروني لإجراء الاختبار الفعلي.', 'error');
        return;
    }
    const btn = document.getElementById('test-email-btn');
    btn.disabled = true;
    btn.textContent = 'جاري الاختبار...';

    const res = await callGoogleScriptAPI({
        action: 'testEmailConnection',
        email: email,
        byUser: STATE.user?.empName || 'الإدارة'
    });

    btn.disabled = false;
    btn.textContent = 'اختبار إرسال فعلي';

    if (!res.fallbackToLocal && res.status === 'success') {
        STATE.settings.email_verified = 'true';
        saveBundleToCache();
        renderRemindersView();
        showTasksToast(res.message);
    } else if (res.fallbackToLocal) {
        STATE.settings.email_verified = 'false';
        renderRemindersView();
        showTasksToast('تنبيه: لم يتم ربط قاعدة البيانات (/exec) بعد؛ لا ندّعي عمل البريد الإلكتروني قبل إتمام الربط الفعلي.', 'warning');
    } else {
        STATE.settings.email_verified = 'false';
        renderRemindersView();
        showTasksToast(res.message || 'فشل إرسال رسالة الاختبار.', 'error');
    }
}

async function triggerBackgroundSchedulerNow() {
    const btn = document.getElementById('run-scheduler-btn');
    btn.disabled = true;
    btn.textContent = 'جاري فحص وإرسال التذكيرات المستحقة...';

    const res = await callGoogleScriptAPI({ action: 'runSchedulerNow' });
    btn.disabled = false;
    btn.textContent = 'تشغيل فحص التذكيرات والمجدول الآن ⚡';

    if (!res.fallbackToLocal && res.status === 'success') {
        await syncDashboardWithServer();
        showTasksToast(`اكتمل تشغيل المجدول: أُرسل (${res.sentCount}) تذكير، ورُصدت (${res.overdueCreated}) مهام متأخرة.`);
    } else {
        evaluateLocalInternalNotifications();
        showTasksToast('تم فحص التذكيرات الداخلية وتحديث التنبيهات.', 'success');
    }
}

/**
 * ============================================================================
 * 10. التقارير الشاملة ومقارنة الفترات والتصدير (Excel / CSV / PDF)
 * ============================================================================
 */
function initDefaultReportDates() {
    setReportPresetDays(365);
}

function setReportPresetDays(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const sEl = document.getElementById('reportStartDate');
    const eEl = document.getElementById('reportEndDate');
    if (sEl) sEl.value = formatDateYMD(start);
    if (eEl) eEl.value = formatDateYMD(end);
    renderReportsView();
}

function renderReportsView() {
    const startStr = document.getElementById('reportStartDate')?.value || '2020-01-01';
    const endStr = document.getElementById('reportEndDate')?.value || '2099-12-31';
    const today = getTodayDateString();

    const activeTasks = STATE.tasks.filter(t => !t.isArchived);
    const periodTasks = activeTasks.filter(t => {
        const d = t.dueDate || (t.createdAt ? t.createdAt.slice(0, 10) : today);
        return d >= startStr && d <= endStr;
    });

    const total = periodTasks.length;
    const completed = periodTasks.filter(t => t.status === 'مكتملة').length;
    const overdue = periodTasks.filter(t => isTaskOverdue(t, today)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // حساب معدل الالتزام بالمواعيد (المهام المكتملة التي لم يسبق تأجيلها أو أُكملت في موعدها)
    const completedOnTime = periodTasks.filter(t => {
        if (t.status !== 'مكتملة') return false;
        const compDate = t.completedAt ? t.completedAt.slice(0, 10) : today;
        return !t.dueDate || compDate <= t.dueDate;
    }).length;
    const onTimeRate = completed > 0 ? Math.round((completedOnTime / completed) * 100) : (total === 0 ? 0 : 100);

    const summaryCards = document.getElementById('reports-summary-cards');
    if (summaryCards) {
        summaryCards.innerHTML = `
            <div class="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                <span class="text-xs font-bold text-slate-500">إجمالي المهام في الفترة</span>
                <p class="font-display text-2xl font-extrabold text-ghazara-purpleDark mt-1">${total}</p>
            </div>
            <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span class="text-xs font-bold text-emerald-700">المكتملة ونسبة الإنجاز</span>
                <p class="font-display text-2xl font-extrabold text-emerald-600 mt-1">${completed} (${completionRate}%)</p>
            </div>
            <div class="p-4 rounded-2xl bg-red-50/70 border border-red-200">
                <span class="text-xs font-bold text-red-700">المهام المتأخرة</span>
                <p class="font-display text-2xl font-extrabold text-red-600 mt-1">${overdue}</p>
            </div>
            <div class="p-4 rounded-2xl bg-teal-50/70 border border-teal-200">
                <span class="text-xs font-bold text-ghazara-teal">معدل الالتزام بالمواعيد</span>
                <p class="font-display text-2xl font-extrabold text-ghazara-teal mt-1">${onTimeRate}%</p>
            </div>
        `;
    }

    // 1. حسب التصنيف الإداري
    const catBox = document.getElementById('report-by-category-box');
    if (catBox) {
        catBox.innerHTML = STATE.categories.filter(c => !c.archived).map(cat => {
            const cTasks = periodTasks.filter(t => t.categoryId === cat.id);
            const cComp = cTasks.filter(t => t.status === 'مكتملة').length;
            const pct = cTasks.length > 0 ? Math.round((cComp / cTasks.length) * 100) : 0;
            return `
                <div class="p-2.5 rounded-xl bg-slate-50 border border-purple-100 flex items-center justify-between gap-2">
                    <span class="font-semibold text-ghazara-purpleDark truncate">${escapeHtml(cat.name)}</span>
                    <span class="font-display font-bold text-ghazara-purple shrink-0">${cComp}/${cTasks.length} (${pct}%)</span>
                </div>
            `;
        }).join('');
    }

    // 2. حسب الجهة ونوع المهمة (الواردة والصادرة والداخلية)
    const entBox = document.getElementById('report-by-entity-type-box');
    if (entBox) {
        const incoming = periodTasks.filter(t => t.taskType === 'واردة').length;
        const outgoing = periodTasks.filter(t => t.taskType === 'صادرة').length;
        const internal = periodTasks.filter(t => t.taskType === 'داخلية').length;
        const followUp = periodTasks.filter(t => t.taskType === 'متابعة' || t.taskType === 'دورية').length;

        let entHtml = `
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                <div class="p-2 rounded-xl bg-purple-50 border border-purple-100"><strong>واردة:</strong> ${incoming}</div>
                <div class="p-2 rounded-xl bg-orange-50 border border-orange-100"><strong>صادرة:</strong> ${outgoing}</div>
                <div class="p-2 rounded-xl bg-teal-50 border border-teal-100"><strong>داخلية:</strong> ${internal}</div>
                <div class="p-2 rounded-xl bg-indigo-50 border border-indigo-100"><strong>متابعة/دورية:</strong> ${followUp}</div>
            </div>
        `;
        entHtml += STATE.entities.map(ent => {
            const cnt = periodTasks.filter(t => t.entityId === ent.id || t.entityName === ent.name).length;
            return `
                <div class="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span>${escapeHtml(ent.name)}</span>
                    <strong class="font-display text-ghazara-purple">${cnt} مهمة</strong>
                </div>
            `;
        }).join('');
        entBox.innerHTML = entHtml;
    }

    // 3. المهام التي تنتظر اعتماداً أو رداً
    const waitBox = document.getElementById('report-waiting-box');
    if (waitBox) {
        const waitingTasks = periodTasks.filter(t => t.status === 'بانتظار اعتماد' || t.status === 'بانتظار رد');
        waitBox.innerHTML = waitingTasks.length === 0
            ? `<p class="text-slate-400 py-4 text-center">لا توجد مهام معلقة بانتظار اعتماد أو رد في هذه الفترة.</p>`
            : waitingTasks.map(t => `
                <div class="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between">
                    <div>
                        <span class="font-bold text-ghazara-purpleDark">${escapeHtml(t.title)}</span>
                        <span class="block text-[11px] text-slate-500">${escapeHtml(t.categoryName)} — ${escapeHtml(t.entityName || '')}</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-white border border-amber-300 font-bold text-amber-800">${t.status}</span>
                </div>
            `).join('');
    }

    // 4. أسباب التأخير المسجلة ومقارنة الإنجاز بين الفترات الزمنية
    const delayBox = document.getElementById('report-delays-comparison-box');
    if (delayBox) {
        const delayedWithReasons = periodTasks.filter(t => t.postponeReason || (Array.isArray(t.previousDueDates) && t.previousDueDates.length > 0));
        // حساب الفترة السابقة المماثلة للمقارنة
        const dStart = new Date(startStr);
        const dEnd = new Date(endStr);
        const spanMs = Math.max(86400000, dEnd - dStart);
        const prevStartStr = formatDateYMD(new Date(dStart.getTime() - spanMs));
        const prevEndStr = formatDateYMD(new Date(dStart.getTime() - 86400000));
        const prevTasks = activeTasks.filter(t => t.dueDate >= prevStartStr && t.dueDate <= prevEndStr);
        const prevComp = prevTasks.filter(t => t.status === 'مكتملة').length;

        delayBox.innerHTML = `
            <div class="p-3 rounded-xl bg-purple-50/60 border border-purple-100 mb-2">
                <strong>مقارنة الإنجاز مع الفترة السابقة (${prevStartStr} إلى ${prevEndStr}):</strong>
                <div class="mt-1 text-slate-600">الفترة الحالية: <strong>${completed} مكتملة</strong> من ${total} | الفترة السابقة: <strong>${prevComp} مكتملة</strong> من ${prevTasks.length}</div>
            </div>
            <div class="space-y-1.5">
                <strong class="block text-slate-700">أسباب التأجيل والتأخير المسجلة:</strong>
                ${delayedWithReasons.length === 0 ? `<p class="text-slate-400">لا توجد أسباب تأجيل مسجلة في هذه الفترة.</p>` : delayedWithReasons.map(t => `
                    <div class="p-2 rounded-lg bg-orange-50/60 border border-orange-200">
                        <span class="font-bold text-ghazara-purpleDark">${escapeHtml(t.title)} (${t.taskId}):</span>
                        <span class="text-slate-700">${escapeHtml(t.postponeReason || (t.previousDueDates[t.previousDueDates.length - 1]?.reason) || 'تعديل موعد')}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

function getExportRowsData() {
    const tasks = getFilteredAndSortedTasks();
    return tasks.map(t => ({
        'رقم المهمة': t.taskId,
        'عنوان المهمة': t.title,
        'الوصف': t.description,
        'التصنيف الإداري': t.categoryName,
        'الجهة المرتبطة': t.entityName,
        'نوع المهمة': t.taskType,
        'المصدر': t.source,
        'المسؤول عن التنفيذ': t.assignee,
        'تاريخ الإنشاء': t.createdAt,
        'تاريخ البدء': t.startDate,
        'الموعد النهائي': t.dueDate,
        'وقت الاستحقاق': t.dueTime,
        'الأولوية': t.priority,
        'الحالة الحالية': t.status,
        'نسبة الإنجاز (%)': t.progress,
        'سبب التأجيل': t.postponeReason,
        'وقت الإكمال': t.completedAt,
        'تاريخ آخر تحديث': t.updatedAt
    }));
}

function exportTasksToExcel() {
    const rows = getExportRowsData();
    if (!rows.length) {
        showTasksToast('لا توجد مهام حالية لتصديرها إلى Excel.', 'warning');
        return;
    }
    if (typeof XLSX !== 'undefined') {
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'المهام الإدارية والتسويق');
        XLSX.writeFile(wb, `ghazara-tasks-${getTodayDateString()}.xlsx`);
        showTasksToast('تم تصدير ملف Excel (.xlsx) بنجاح.');
    } else {
        exportTasksToCSV();
    }
}

function exportTasksToCSV() {
    const rows = getExportRowsData();
    if (!rows.length) {
        showTasksToast('لا توجد مهام حالية لتصديرها إلى CSV.', 'warning');
        return;
    }
    const headers = Object.keys(rows[0]);
    const csvLines = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghazara-tasks-${getTodayDateString()}.csv`;
    a.click();
    showTasksToast('تم تصدير ملف CSV بنجاح.');
}

/**
 * ============================================================================
 * 11. الإعدادات الشخصية والإدارية، التصنيفات، الجهات، والنسخ الاحتياطي
 * ============================================================================
 */
function renderSettingsView() {
    document.getElementById('sysTimezone').value = STATE.settings.timezone || 'Asia/Aden';
    document.getElementById('sysReminderHours').value = STATE.settings.default_reminder_Before_hours || '24';
    document.getElementById('sysNotifEnabled').checked = String(STATE.settings.notifications_enabled) !== 'false';
    document.getElementById('sysDailySummary').checked = String(STATE.settings.daily_summary_enabled) !== 'false';
    document.getElementById('sysWeeklyReport').checked = String(STATE.settings.weekly_report_enabled) !== 'false';
    document.getElementById('setPrefHideSensitive').checked = String(STATE.settings.hide_sensitive_notifications) === 'true';

    // عرض التصنيفات في الإعدادات
    const catList = document.getElementById('settings-categories-list');
    if (catList) {
        catList.innerHTML = STATE.categories.map(c => {
            const count = STATE.tasks.filter(t => t.categoryId === c.id).length;
            return `
            <div class="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="w-3 h-3 rounded-full shrink-0" style="background:${c.color || '#5B2C83'}"></span>
                    <span class="font-bold text-ghazara-purpleDark truncate">${escapeHtml(c.name)}</span>
                    <span class="text-[10px] text-slate-400">(${count} مهمة)</span>
                    ${c.archived ? `<span class="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full">مؤرشف</span>` : ''}
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button type="button" onclick="populateCategoryEdit('${c.id}')" class="px-2.5 py-1 rounded-lg bg-purple-50 text-ghazara-purple font-bold">تعديل الاسم</button>
                    <button type="button" onclick="toggleArchiveCategory('${c.id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">${c.archived ? 'تفعيل' : 'أرشفة'}</button>
                    <button type="button" onclick="safeDeleteCategory('${c.id}')" class="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold">حذف</button>
                </div>
            </div>
            `;
        }).join('');
    }

    // عرض الجهات في الإعدادات
    const entList = document.getElementById('settings-entities-list');
    if (entList) {
        entList.innerHTML = STATE.entities.map(e => `
            <div class="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between gap-2">
                <div>
                    <span class="font-bold text-ghazara-purpleDark">${escapeHtml(e.name)}</span>
                    ${e.contact ? `<span class="text-slate-500 mx-1">— ${escapeHtml(e.contact)}</span>` : ''}
                </div>
                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="populateEntityEdit('${e.id}')" class="px-2.5 py-1 rounded-lg bg-orange-50 text-ghazara-orange font-bold">تعديل</button>
                    <button type="button" onclick="safeDeleteEntity('${e.id}')" class="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 font-bold">حذف</button>
                </div>
            </div>
        `).join('');
    }

    // عرض سجل النسخ الاحتياطية
    const bkpBox = document.getElementById('backups-list-box');
    if (bkpBox) {
        bkpBox.innerHTML = STATE.backups.length === 0
            ? `<p class="text-slate-400 py-2">لا توجد نسخ احتياطية مسجلة بعد.</p>`
            : STATE.backups.map(b => `
                <div class="p-2.5 rounded-xl bg-white border border-purple-100 flex items-center justify-between">
                    <div>
                        <span class="font-display font-bold text-ghazara-purple">${escapeHtml(b.backupId)}</span>
                        <span class="text-slate-500 mx-1">(${escapeHtml(b.createdAt)})</span>
                        <div class="text-[11px] text-slate-600">${escapeHtml(b.summary || '')}</div>
                    </div>
                    <button type="button" onclick="restoreBackupById('${b.backupId}')" class="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100">
                        استعادة
                    </button>
                </div>
            `).join('');
    }
}

async function handleSaveProfileSettings(event) {
    event.preventDefault();
    const verifyPassword = document.getElementById('setProfileVerifyPass').value.trim();
    if (!verifyPassword) {
        showTasksToast('يرجى إدخال كلمة المرور الحالية لتأكيد تعديل بيانات الحساب.', 'error');
        return;
    }

    const empName = document.getElementById('setProfileName').value.trim();
    const newUsername = document.getElementById('setProfileUsername').value.trim();
    const email = document.getElementById('setProfileEmail').value.trim();
    const hideSensitive = document.getElementById('setPrefHideSensitive').checked;

    STATE.settings.hide_sensitive_notifications = hideSensitive ? 'true' : 'false';

    const res = await callGoogleScriptAPI({
        action: 'updateProfile',
        currentUsername: STATE.user?.username,
        verifyPassword: verifyPassword,
        empName: empName,
        newUsername: newUsername,
        email: email,
        notifPrefs: {
            internal: document.getElementById('setPrefInternal').checked,
            email: document.getElementById('setPrefEmail').checked,
            hideSensitive: hideSensitive
        }
    });

    if (!res.fallbackToLocal && res.status === 'error') {
        showTasksToast(res.message, 'error');
        return;
    }

    // في الوضع المحلي نتحقق أيضاً من كلمة المرور الحالية
    if (res.fallbackToLocal) {
        const localUsers = getLocalUsersSheet();
        const idx = localUsers.findIndex(u => u.username.toLowerCase() === STATE.user.username.toLowerCase());
        if (idx !== -1 && String(localUsers[idx].password) !== String(verifyPassword)) {
            showTasksToast('كلمة المرور الحالية غير صحيحة. لا يُسمح بتعديل بيانات الحساب الحساسة دون التحقق.', 'error');
            return;
        }
        if (idx !== -1) {
            localUsers[idx].empName = empName;
            localUsers[idx].username = newUsername;
            localUsers[idx].email = email;
            localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_USERS, JSON.stringify(localUsers));
        }
    }

    STATE.user.empName = empName;
    STATE.user.username = newUsername;
    STATE.user.email = email;
    localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION, JSON.stringify(STATE.user));
    document.getElementById('setProfileVerifyPass').value = '';
    initUserHeaderUI();
    saveBundleToCache();
    renderNotificationsUI();
    showTasksToast('تم التحقق وحفظ إعدادات الحساب الشخصي بنجاح.');
}

async function handleUpdatePasswordFromSettings(event) {
    event.preventDefault();
    const oldPass = document.getElementById('setOldPass').value.trim();
    const newPass = document.getElementById('setNewPass').value.trim();
    const confirmPass = document.getElementById('setConfirmPass').value.trim();

    if (newPass !== confirmPass) {
        showTasksToast('كلمتا المرور الجديدتان غير متطابقتين.', 'error');
        return;
    }

    const res = await callGoogleScriptAPI({
        action: 'changePassword',
        username: STATE.user?.username,
        currentPassword: oldPass,
        newPassword: newPass
    });

    if (!res.fallbackToLocal && res.status === 'error') {
        showTasksToast(res.message, 'error');
        return;
    }

    if (res.fallbackToLocal) {
        const localUsers = getLocalUsersSheet();
        const idx = localUsers.findIndex(u => u.username.toLowerCase() === STATE.user.username.toLowerCase());
        if (idx !== -1 && String(localUsers[idx].password) !== String(oldPass)) {
            showTasksToast('كلمة المرور الحالية غير صحيحة.', 'error');
            return;
        }
        if (idx !== -1) {
            localUsers[idx].password = newPass;
            localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_USERS, JSON.stringify(localUsers));
        }
    }

    document.getElementById('settings-password-form').reset();
    showTasksToast('تم تغيير كلمة المرور بنجاح.');
}

async function handleSaveSystemSettings(event) {
    event.preventDefault();
    STATE.settings.timezone = document.getElementById('sysTimezone').value;
    STATE.settings.default_reminder_Before_hours = document.getElementById('sysReminderHours').value;
    STATE.settings.notifications_enabled = document.getElementById('sysNotifEnabled').checked ? 'true' : 'false';
    STATE.settings.daily_summary_enabled = document.getElementById('sysDailySummary').checked ? 'true' : 'false';
    STATE.settings.weekly_report_enabled = document.getElementById('sysWeeklyReport').checked ? 'true' : 'false';

    saveBundleToCache();
    await callGoogleScriptAPI({
        action: 'saveSettings',
        settings: STATE.settings,
        byUser: STATE.user?.empName || 'الإدارة'
    });
    showTasksToast('تم حفظ إعدادات التذكيرات والمنطقة الزمنية بنجاح.');
}

function populateCategoryEdit(catId) {
    const c = STATE.categories.find(x => x.id === catId);
    if (!c) return;
    document.getElementById('editCategoryId').value = c.id;
    document.getElementById('editCategoryName').value = c.name;
    document.getElementById('editCategoryColor').value = c.color || '#5B2C83';
}

async function handleSaveCategoryForm(event) {
    event.preventDefault();
    const id = document.getElementById('editCategoryId').value.trim();
    const name = document.getElementById('editCategoryName').value.trim();
    const color = document.getElementById('editCategoryColor').value;
    if (!name) return;

    let catObj = null;
    if (id) {
        catObj = STATE.categories.find(c => c.id === id);
        if (catObj) {
            catObj.name = name;
            catObj.color = color;
            // تحديث اسم التصنيف في المهام المرتبطة دون حذف أي مهمة
            STATE.tasks.forEach(t => {
                if (t.categoryId === id) t.categoryName = name;
            });
        }
    } else {
        catObj = {
            id: 'CAT-' + (STATE.categories.length + 1) + '-' + Date.now().toString().slice(-3),
            name: name,
            desc: '',
            color: color,
            order: STATE.categories.length + 1,
            archived: false
        };
        STATE.categories.push(catObj);
    }

    document.getElementById('editCategoryId').value = '';
    document.getElementById('editCategoryName').value = '';
    saveBundleToCache();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({
        action: 'saveCategory',
        category: catObj,
        byUser: STATE.user?.empName || 'الإدارة'
    });
    showTasksToast('تم حفظ التصنيف بنجاح مع الحفاظ الكامل على المهام المرتبطة.');
}

async function toggleArchiveCategory(catId) {
    const catObj = STATE.categories.find(c => c.id === catId);
    if (!catObj) return;
    catObj.archived = !catObj.archived;
    saveBundleToCache();
    renderAllDashboardComponents();
    await callGoogleScriptAPI({
        action: 'saveCategory',
        category: catObj,
        byUser: STATE.user?.empName || 'الإدارة'
    });
    showTasksToast(catObj.archived ? 'تمت أرشفة التصنيف دون حذف مهامه.' : 'تمت استعادة التصنيف.');
}

async function safeDeleteCategory(catId) {
    const linked = STATE.tasks.filter(t => t.categoryId === catId);
    if (linked.length > 0) {
        showTasksToast(`لا يُسمح بحذف هذا التصنيف لأنه مستخدم في (${linked.length}) مهمة قائمة. يمكنك تعديل اسمه أو أرشفته بأمان.`, 'error');
        return;
    }
    STATE.categories = STATE.categories.filter(c => c.id !== catId);
    saveBundleToCache();
    renderAllDashboardComponents();
    await callGoogleScriptAPI({ action: 'deleteCategory', categoryId: catId, byUser: STATE.user?.empName || 'الإدارة' });
    showTasksToast('تم حذف التصنيف الفارغ بنجاح.');
}

function populateEntityEdit(entId) {
    const e = STATE.entities.find(x => x.id === entId);
    if (!e) return;
    document.getElementById('editEntityId').value = e.id;
    document.getElementById('editEntityName').value = e.name;
    document.getElementById('editEntityContact').value = e.contact || '';
}

async function handleSaveEntityForm(event) {
    event.preventDefault();
    const id = document.getElementById('editEntityId').value.trim();
    const name = document.getElementById('editEntityName').value.trim();
    const contact = document.getElementById('editEntityContact').value.trim();
    if (!name) return;

    let entObj = null;
    if (id) {
        entObj = STATE.entities.find(e => e.id === id);
        if (entObj) {
            entObj.name = name;
            entObj.contact = contact;
            STATE.tasks.forEach(t => {
                if (t.entityId === id) t.entityName = name;
            });
        }
    } else {
        entObj = {
            id: 'ENT-' + (STATE.entities.length + 1) + '-' + Date.now().toString().slice(-3),
            name: name,
            type: 'جهة مرتبطة',
            contact: contact,
            status: 'نشط'
        };
        STATE.entities.push(entObj);
    }

    document.getElementById('editEntityId').value = '';
    document.getElementById('editEntityName').value = '';
    document.getElementById('editEntityContact').value = '';
    saveBundleToCache();
    renderAllDashboardComponents();

    await callGoogleScriptAPI({ action: 'saveEntity', entity: entObj, byUser: STATE.user?.empName || 'الإدارة' });
    showTasksToast('تم حفظ بيانات الجهة بنجاح.');
}

async function safeDeleteEntity(entId) {
    const linked = STATE.tasks.filter(t => t.entityId === entId);
    if (linked.length > 0) {
        showTasksToast(`لا يمكن حذف هذه الجهة لارتباطها بـ (${linked.length}) مهمة قائمة.`, 'error');
        return;
    }
    STATE.entities = STATE.entities.filter(e => e.id !== entId);
    saveBundleToCache();
    renderAllDashboardComponents();
    await callGoogleScriptAPI({ action: 'deleteEntity', entityId: entId });
    showTasksToast('تم حذف الجهة.');
}

async function createSystemBackupNow() {
    const nowStr = getNowTimestampString();
    const backupId = 'BKP-' + Date.now().toString().slice(-6);
    const summary = `المهام: ${STATE.tasks.length} | التصنيفات: ${STATE.categories.length} | الجهات: ${STATE.entities.length}`;

    const res = await callGoogleScriptAPI({
        action: 'createBackup',
        byUser: STATE.user?.empName || 'الإدارة',
        backupType: 'يدوي'
    });

    STATE.backups.unshift({
        backupId: res.backupId || backupId,
        createdAt: nowStr,
        createdBy: STATE.user?.empName || 'الإدارة',
        type: 'يدوي',
        summary: summary,
        snapshot: {
            tasks: JSON.parse(JSON.stringify(STATE.tasks)),
            categories: JSON.parse(JSON.stringify(STATE.categories)),
            entities: JSON.parse(JSON.stringify(STATE.entities))
        }
    });
    saveBundleToCache();
    renderSettingsView();
    showTasksToast('تم إنشاء نسخة احتياطية كاملة وحفظها بنجاح.');
}

async function restoreBackupById(backupId) {
    const res = await callGoogleScriptAPI({
        action: 'restoreBackup',
        backupId: backupId,
        byUser: STATE.user?.empName || 'الإدارة'
    });

    const localBkp = STATE.backups.find(b => b.backupId === backupId);
    if (localBkp && localBkp.snapshot) {
        const existingIds = new Set(STATE.tasks.map(t => t.taskId));
        localBkp.snapshot.tasks.forEach(t => {
            if (!existingIds.has(t.taskId)) STATE.tasks.push(t);
        });
        saveBundleToCache();
    }
    renderAllDashboardComponents();
    showTasksToast(res.message || `تمت استعادة النسخة الاحتياطية (${backupId}) بنجاح.`);
}

function downloadFullJSONBackup() {
    const data = {
        exportedAt: getNowTimestampString(),
        version: '2.5.0',
        tasks: STATE.tasks,
        categories: STATE.categories,
        entities: STATE.entities,
        reminders: STATE.reminders,
        auditLogs: STATE.auditLogs,
        settings: STATE.settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghazara-tasks-backup-${getTodayDateString()}.json`;
    a.click();
    showTasksToast('تم تنزيل ملف النسخة الاحتياطية (JSON) بنجاح.');
}

/**
 * ============================================================================
 * 12. دوال مساعدة للتنقل والأمان وسجل التعديلات المحلي
 * ============================================================================
 */
function switchMainWorkspaceView(viewName) {
    STATE.activeMainView = viewName;
    const views = ['tasks', 'calendar', 'reminders', 'reports', 'settings'];
    views.forEach(v => {
        const sec = document.getElementById('workspace-view-' + v);
        const btn = document.getElementById('nav-view-' + v);
        if (sec) {
            if (v === viewName) sec.classList.remove('hidden');
            else sec.classList.add('hidden');
        }
        if (btn) {
            btn.className = (v === viewName)
                ? 'w-full text-right px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between bg-ghazara-purple text-white shadow-sm transition-all'
                : 'w-full text-right px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between text-slate-700 hover:bg-purple-50 transition-all';
        }
    });

    if (viewName === 'calendar') renderCalendarView();
    if (viewName === 'reminders') renderRemindersView();
    if (viewName === 'reports') renderReportsView();
    if (viewName === 'settings') renderSettingsView();
}

function toggleTasksSidebar() {
    const sb = document.getElementById('tasks-sidebar');
    if (sb) sb.classList.toggle('translate-x-full');
}

function toggleNotificationsMenu() {
    document.getElementById('notifications-dropdown')?.classList.toggle('hidden');
    document.getElementById('account-dropdown')?.classList.add('hidden');
}

function toggleAccountMenu() {
    document.getElementById('account-dropdown')?.classList.toggle('hidden');
    document.getElementById('notifications-dropdown')?.classList.add('hidden');
}

function logoutFromTasksPortal() {
    localStorage.removeItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION);
    window.location.href = 'login.html';
}

function recordLocalAuditLog(refId, actionType, field, oldVal, newVal, details) {
    STATE.auditLogs.unshift({
        id: 'LOG-' + Date.now(),
        timestamp: getNowTimestampString(),
        refId: refId,
        actionType: actionType,
        user: STATE.user?.empName || STATE.user?.username || 'المستخدم',
        field: field,
        oldValue: String(oldVal ?? ''),
        newValue: String(newVal ?? ''),
        details: details || ''
    });
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

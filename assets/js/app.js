/**
 * المنطق البرمجي الرئيسي لموقع وبوابة غزارة للتجارة والتسويق
 * يتضمن:
 * 1. الربط مع قاعدة بيانات Google Sheets (1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0) عبر Google Apps Script Web App
 * 2. نظام المصادقة الصارم من صفحة (المستخدمين) وتفويض الصلاحيات للمسميات الوظيفية العشرة المعتمدة (10 Roles RBAC)
 * 3. التأسيس الشامل للأقسام الأربعة: الإدارة العامة والمالية، الموارد البشرية والإجازات، المبيعات، والتسويق (الرقمي، الميداني، التصميم، المونتاج)
 * 4. الربط مع لوحة مهام الشؤون الإدارية والتسويق
 */

const GHAZARA_CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyJFrFKg1PdJfnXFBmYL-9NNbGNth-J1InmDJZgm2vOVHuj8LcHaEPgwSAWkz4PFLG_Fg/exec',
    SPREADSHEET_ID: '1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0',
    TIMEZONE: 'Asia/Aden',
    WHATSAPP_NUMBER: '967783334002',
    STORAGE_KEY_LEADS: 'ghazara_crm_leads',
    STORAGE_KEY_HR: 'ghazara_hr_employees',
    STORAGE_KEY_LEAVES: 'ghazara_hr_annual_leaves',
    STORAGE_KEY_USERS: 'ghazara_users_sheet_cache',
    STORAGE_KEY_SESSION: 'ghazara_active_user_session',
    STORAGE_KEY_TASKS_BUNDLE: 'ghazara_tasks_dashboard_bundle',
    STORAGE_KEY_FIELD_VISITS: 'ghazara_field_marketing_visits',
    STORAGE_KEY_CAMPAIGNS: 'ghazara_marketing_campaigns',
    STORAGE_KEY_CREATIVE_JOBS: 'ghazara_creative_studio_jobs',
    STORAGE_KEY_FINANCE: 'ghazara_finance_transactions'
};

/**
 * الصلاحيات والأقسام المسموحة لكل مسمى من المسميات الوظيفية العشرة المعتمدة في غزارة
 */
const GHAZARA_ROLES_PERMISSIONS = {
    'المدير التنفيذي': {
        badgeColor: 'bg-ghazara-purple text-white',
        defaultTab: 'executive',
        allowedTabs: ['executive', 'hr', 'leaves', 'sales', 'marketing', 'field_marketing', 'design', 'montage', 'finance'],
        canApproveLeaves: true,
        canApproveExecutiveTasks: true,
        canAssignSalesLeads: true,
        canManageAllDepartments: true,
        title: 'لوحة القيادة التنفيذية الشاملة (CEO)',
        description: 'صلاحية كاملة للإشراف على الإدارة العامة، الموارد البشرية، المبيعات، التسويق الرقمي والميداني، التصميم والمونتاج، والمالية.'
    },
    'مدير الموارد البشرية': {
        badgeColor: 'bg-ghazara-teal text-white',
        defaultTab: 'hr',
        allowedTabs: ['hr', 'leaves', 'executive'],
        canApproveLeaves: true,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'إدارة الموارد البشرية والشؤون الإدارية (HR Manager)',
        description: 'إدارة كاملة لملفات الموظفين، الهيكل التنظيمي، صلاحيات الحسابات، مراجعة واعتماد طلبات الإجازات السنوية، ولوحة المهام الإدارية.'
    },
    'مدير المبيعات': {
        badgeColor: 'bg-ghazara-orange text-white',
        defaultTab: 'sales',
        allowedTabs: ['sales', 'field_marketing', 'executive', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: true,
        title: 'إدارة المبيعات وتطوير الأعمال (Sales Manager)',
        description: 'إدارة كاملة لطلبات العملاء، توزيع الفرص البيعية على موظفي المبيعات، متابعة مخرجات التسويق الميداني، وطلبات الإجازات.'
    },
    'موظف مبيعات': {
        badgeColor: 'bg-orange-100 text-ghazara-orange',
        defaultTab: 'sales',
        allowedTabs: ['sales', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'بوابة موظف المبيعات (Sales Representative)',
        description: 'متابعة العملاء والفرص البيعية المسندة، تسجيل العملاء الجدد، تحديث حالات التفاوض وعروض الأسعار، وطلب الإجازة السنوية.'
    },
    'مدير التسويق': {
        badgeColor: 'bg-purple-700 text-white',
        defaultTab: 'marketing',
        allowedTabs: ['marketing', 'field_marketing', 'design', 'montage', 'sales', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'إدارة التسويق والاستراتيجيات (Marketing Manager)',
        description: 'الإشراف الشامل على الحملات التسويقية، فريق التسويق الرقمي والميداني، استوديو التصميم ووحدة المونتاج، ولوحة المهام.'
    },
    'موظف تسويق': {
        badgeColor: 'bg-purple-100 text-ghazara-purple',
        defaultTab: 'marketing',
        allowedTabs: ['marketing', 'design', 'montage', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'بوابة أخصائي التسويق الرقمي (Marketing Specialist)',
        description: 'إدارة الحملات التسويقية الرقمية، خطط المحتوى، التنسيق مع التصميم والمونتاج، ومتابعة المهام وطلب الإجازة السنوية.'
    },
    'موظف تسويق ميداني': {
        badgeColor: 'bg-indigo-600 text-white',
        defaultTab: 'field_marketing',
        allowedTabs: ['field_marketing', 'sales', 'marketing', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'بوابة التسويق الميداني واستقطاب العملاء (Field Marketer)',
        description: 'توثيق الزيارات الميدانية للمنشآت، حصر احتياجات العملاء في السوق، وتحويل الفرص الميدانية إلى قسم المبيعات.'
    },
    'مصمم': {
        badgeColor: 'bg-pink-100 text-pink-700',
        defaultTab: 'design',
        allowedTabs: ['design', 'marketing', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'استوديو التصميم الجرافيكي والهوية البصرية (Graphic Designer)',
        description: 'استلام وتنفيذ طلبات التصميم الجرافيكي، الهويات البصرية، منشورات التواصل الاجتماعي، ورفع روابط التسليم للاعتماد.'
    },
    'موظف مونتاج': {
        badgeColor: 'bg-violet-600 text-white',
        defaultTab: 'montage',
        allowedTabs: ['montage', 'design', 'marketing', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'وحدة المونتاج والإنتاج المرئي (Video Editor)',
        description: 'إدارة مشاريع مونتاج الفيديو، الريلز الإعلانية، والموشن جرافيك، ورفع روابط المعاينة النهائية لاعتماد التسويق والإدارة.'
    },
    'محاسب': {
        badgeColor: 'bg-emerald-600 text-white',
        defaultTab: 'finance',
        allowedTabs: ['finance', 'sales', 'leaves'],
        canApproveLeaves: false,
        canApproveExecutiveTasks: false,
        canAssignSalesLeads: false,
        title: 'الإدارة المالية والحسابات (Accountant)',
        description: 'إدارة الفواتير، التحصيلات المالية للعقود والمبيعات، قيد المصروفات التشغيلية، وطلبات الإجازة السنوية.'
    }
};

/**
 * سجل المستخدمين العشرة المطابق لصفحة (المستخدمين) في Google Sheets
 */
function getLocalUsersSheet() {
    try {
        let users = JSON.parse(localStorage.getItem(GHAZARA_CONFIG.STORAGE_KEY_USERS) || 'null');
        const requiredRoles = Object.keys(GHAZARA_ROLES_PERMISSIONS);
        const hasOutdatedRoles = Array.isArray(users) && users.some(u => !requiredRoles.includes(u.jobRole));

        if (!users || !Array.isArray(users) || users.length === 0 || hasOutdatedRoles) {
            users = [
                { userId: 'USR-01', empName: 'سالم باحارثة', username: 'ceo', password: '123456', department: 'الإدارة العامة والتنفيذية', jobRole: 'المدير التنفيذي', email: 'ceo@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-02', empName: 'أحمد الكاف', username: 'sales_mgr', password: '123456', department: 'المبيعات وتطوير الأعمال', jobRole: 'مدير المبيعات', email: 'sales.mgr@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-03', empName: 'فاطمة السقاف', username: 'hr_mgr', password: '123456', department: 'الموارد البشرية', jobRole: 'مدير الموارد البشرية', email: 'hr.mgr@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-04', empName: 'خالد باوزير', username: 'sales_rep', password: '123456', department: 'المبيعات وتطوير الأعمال', jobRole: 'موظف مبيعات', email: 'sales@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-05', empName: 'سارة بن سميط', username: 'mkt_mgr', password: '123456', department: 'التسويق', jobRole: 'مدير التسويق', email: 'marketing.mgr@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-06', empName: 'محمد العطاس', username: 'mkt_specialist', password: '123456', department: 'التسويق الرقمي', jobRole: 'موظف تسويق', email: 'marketing@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-07', empName: 'ياسر الكثيري', username: 'designer', password: '123456', department: 'استوديو التصميم والمونتاج', jobRole: 'مصمم', email: 'design@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-08', empName: 'عبدالرحمن باجابر', username: 'accountant', password: '123456', department: 'المالية والحسابات', jobRole: 'محاسب', email: 'finance@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-09', empName: 'عمر باعباد', username: 'video_editor', password: '123456', department: 'استوديو التصميم والمونتاج', jobRole: 'موظف مونتاج', email: 'montage@ghazaraye.com', mustChangePassword: false },
                { userId: 'USR-10', empName: 'طارق النهدي', username: 'field_mkt', password: '123456', department: 'التسويق الميداني', jobRole: 'موظف تسويق ميداني', email: 'field@ghazaraye.com', mustChangePassword: false }
            ];
            localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_USERS, JSON.stringify(users));
        }
        return users;
    } catch (e) {
        return [];
    }
}

/**
 * التحقق مما إذا كان رابط Google Apps Script قد تم ضبطه
 */
function isGoogleScriptConfigured() {
    const url = GHAZARA_CONFIG.GOOGLE_SCRIPT_URL || '';
    return Boolean(url && url !== 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE' && url.startsWith('https://script.google.com/'));
}

/**
 * دالة موحدة للاتصال بـ Google Apps Script وقراءة الرد بصيغة JSON
 */
async function callGoogleScriptAPI(payload) {
    const url = GHAZARA_CONFIG.GOOGLE_SCRIPT_URL;
    if (!isGoogleScriptConfigured()) {
        return { fallbackToLocal: true };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('Google Script API network warning:', error);
        return { fallbackToLocal: true, error: error.message };
    }
}

/**
 * قراءة جلسة الموظف النشط
 */
function getActiveSessionUser() {
    try {
        const raw = localStorage.getItem(GHAZARA_CONFIG.STORAGE_KEY_SESSION);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

/**
 * فتح وإغلاق قائمة الجوال
 */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const openIcon = document.getElementById('menu-icon-open');
    const closeIcon = document.getElementById('menu-icon-close');

    if (mobileMenu && openIcon && closeIcon) {
        mobileMenu.classList.toggle('hidden');
        openIcon.classList.toggle('hidden');
        closeIcon.classList.toggle('hidden');
    }
}

/**
 * اختيار خدمة من صفحة خدماتنا والانتقال إلى صفحة التواصل مع تعبئة مسبقة
 */
function selectServiceAndContact(serviceName) {
    const encodedService = encodeURIComponent(serviceName);
    window.location.href = `contact.html?service=${encodedService}`;
}

/**
 * قراءة باراميتر الخدمة من الرابط في صفحة تواصل معنا وتعبئة الحقل تلقائياً
 */
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const selectedService = params.get('service');
    const supportField = document.getElementById('supportArea');

    if (selectedService && supportField) {
        supportField.value = `أرغب في الاستفسار وطلب الدعم في مسار: ${selectedService}\n`;
        setTimeout(() => {
            supportField.focus();
        }, 300);
    }
});

/**
 * إرسال بيانات نموذج التواصل إلى Google Sheets + LocalStorage
 */
async function handleContactSubmit(event) {
    event.preventDefault();

    const form = document.getElementById('ghazarah-contact-form');
    const successMsg = document.getElementById('form-success-message');
    const submitBtn = document.getElementById('contact-submit-btn');
    const submitBtnText = document.getElementById('contact-submit-text');
    const submitSpinner = document.getElementById('contact-submit-spinner');
    const sendWhatsappCheckbox = document.getElementById('alsoSendWhatsapp');

    const leadData = {
        action: 'addLead',
        leadId: 'GHZ-' + Date.now().toString().slice(-6),
        timestamp: new Date().toLocaleString('ar-YE'),
        fullName: document.getElementById('fullName')?.value.trim() || '',
        organization: document.getElementById('organization')?.value.trim() || '',
        phone: document.getElementById('phone')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        sector: document.getElementById('sector')?.value || '',
        supportArea: document.getElementById('supportArea')?.value.trim() || '',
        goalToAchieve: document.getElementById('goalToAchieve')?.value.trim() || '',
        startTime: document.querySelector('input[name="startTime"]:checked')?.value || 'غير محدد',
        status: 'جديد',
        assignedTo: 'غير معين',
        source: 'الموقع الإلكتروني'
    };

    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.textContent = 'جاري حفظ وإرسال الطلب...';
    if (submitSpinner) submitSpinner.classList.remove('hidden');

    try {
        const existingLeads = JSON.parse(localStorage.getItem(GHAZARA_CONFIG.STORAGE_KEY_LEADS) || '[]');
        existingLeads.unshift(leadData);
        localStorage.setItem(GHAZARA_CONFIG.STORAGE_KEY_LEADS, JSON.stringify(existingLeads));
    } catch (e) {
        console.warn('LocalStorage save warning:', e);
    }

    await callGoogleScriptAPI(leadData);

    if (sendWhatsappCheckbox && sendWhatsappCheckbox.checked) {
        const waText =
            `*طلب جديد عبر موقع غزارة (${leadData.leadId})*%0A` +
            `--------------------------------%0A` +
            `*الاسم:* ${leadData.fullName}%0A` +
            `*الجهة:* ${leadData.organization}%0A` +
            `*الهاتف:* ${leadData.phone}%0A` +
            `*البريد:* ${leadData.email}%0A` +
            `*مجال العمل:* ${leadData.sector}%0A` +
            `*موعد البدء:* ${leadData.startTime}%0A` +
            `--------------------------------%0A` +
            `*المجال المطلوب:*%0A${leadData.supportArea}%0A%0A` +
            `*الهدف المراد تحقيقه:*%0A${leadData.goalToAchieve}`;

        window.open(`https://wa.me/${GHAZARA_CONFIG.WHATSAPP_NUMBER}?text=${waText}`, '_blank');
    }

    if (submitBtn) submitBtn.disabled = false;
    if (submitBtnText) submitBtnText.textContent = 'إرسال الطلب';
    if (submitSpinner) submitSpinner.classList.add('hidden');

    if (form && successMsg) {
        form.classList.add('hidden');
        successMsg.classList.remove('hidden');
        const refSpan = document.getElementById('lead-reference-id');
        if (refSpan) refSpan.textContent = leadData.leadId;
    }
}

/**
 * إعادة تعيين نموذج التواصل لإرسال طلب جديد
 */
function resetContactForm() {
    const form = document.getElementById('ghazarah-contact-form');
    const successMsg = document.getElementById('form-success-message');

    if (form && successMsg) {
        form.reset();
        successMsg.classList.add('hidden');
        form.classList.remove('hidden');
    }
}
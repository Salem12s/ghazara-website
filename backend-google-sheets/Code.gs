/**
 * ============================================================================
 * نظام غزارة للتجارة والتسويق - الخادم السحابي المتكامل (Google Apps Script)
 * الغرض:
 * 1. إدارة المصادقة الصارمة من ورقة (المستخدمين) واستعادة وتغيير كلمات المرور.
 * 2. إدارة شؤون الموظفين (HR_Staff) وطلبات الإجازات السنوية للموظفين والمدراء (طلبات_الاجازات).
 * 3. إدارة لوحة مهام الشؤون الإدارية والتسويق (المهام، التصنيفات الـ 8، الجهات، المرفقات، سجل التعديلات).
 * 4. نظام الجدولة الخلفية والتذكيرات (Reminders) والإشعارات الداخلية والبريد الإلكتروني بتوقيت Asia/Aden.
 * 5. النسخ الاحتياطي الدوري والاستعادة وتصدير البيانات.
 * ============================================================================
 */

const SPREADSHEET_ID = '1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0';
const DEFAULT_TIMEZONE = 'Asia/Aden';
const APP_VERSION = '2.5.0';

const SHEETS = {
  USERS: 'المستخدمين',
  HR_STAFF: 'HR_Staff',
  LEAVES: 'طلبات_الاجازات',
  SALES_LEADS: 'Sales_Leads',
  TASKS: 'المهام',
  CATEGORIES: 'التصنيفات',
  ENTITIES: 'الجهات',
  REMINDERS: 'التذكيرات',
  AUDIT_LOG: 'سجل_التعديلات',
  ATTACHMENTS: 'المرفقات',
  NOTIFICATIONS: 'الإشعارات_الداخلية',
  SETTINGS: 'الإعدادات',
  BACKUPS: 'النسخ_الاحتياطي'
};

/**
 * التصنيفات الإدارية الثمانية المعتمدة بصورة مستقلة
 */
const DEFAULT_CATEGORIES = [
  { id: 'CAT-01', name: 'مهام يجب رفعها إلى الإدارة التنفيذية', desc: 'المهام والتقارير والاعتمادات المطلوب رفعها للإدارة التنفيذية', color: '#5B2C83', order: 1, archived: false },
  { id: 'CAT-02', name: 'مهام وردت إليّ من الإدارة التنفيذية', desc: 'التوجيهات والتكليفات الصادرة من الإدارة التنفيذية', color: '#7C46AD', order: 2, archived: false },
  { id: 'CAT-03', name: 'مهام تُرفع إلى قسم التسويق والإعلام الرقمي', desc: 'المهام والطلبات الموجهة إلى قسم التسويق والإعلام الرقمي', color: '#EC8232', order: 3, archived: false },
  { id: 'CAT-04', name: 'مهام وردت إليّ من قسم التسويق والإعلام الرقمي', desc: 'المهام والمخرجات الواردة من قسم التسويق والإعلام الرقمي', color: '#F59E56', order: 4, archived: false },
  { id: 'CAT-05', name: 'مهام تُرفع إلى قسم التطوير المؤسسي', desc: 'المهام والمبادرات المرفوعة لقسم التطوير المؤسسي', color: '#38A89D', order: 5, archived: false },
  { id: 'CAT-06', name: 'مهام وردت إليّ من قسم التطوير المؤسسي', desc: 'المهام والخطط الواردة من قسم التطوير المؤسسي', color: '#0D9488', order: 6, archived: false },
  { id: 'CAT-07', name: 'مهام تُرفع إلى المسوقين', desc: 'التكليفات والمهام الميدانية والرقمية الموجهة للمسوقين', color: '#4F46E5', order: 7, archived: false },
  { id: 'CAT-08', name: 'مهام وردت إليّ من المسوقين', desc: 'التقارير والطلبات والمتابعات الواردة من فريق المسوقين', color: '#E11D48', order: 8, archived: false }
];

const DEFAULT_ENTITIES = [
  { id: 'ENT-01', name: 'الإدارة التنفيذية العليا', type: 'إدارة داخلية', contact: 'سالم باحارثة', email: 'ceo@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
  { id: 'ENT-02', name: 'قسم التسويق والإعلام الرقمي', type: 'قسم داخلي', contact: 'سارة بن سميط', email: 'marketing.mgr@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
  { id: 'ENT-03', name: 'قسم التطوير المؤسسي والموارد البشرية', type: 'قسم داخلي', contact: 'فاطمة السقاف', email: 'hr.mgr@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
  { id: 'ENT-04', name: 'فريق المسوقين والمبيعات', type: 'فريق عمل', contact: 'أحمد الكاف', email: 'sales.mgr@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
  { id: 'ENT-05', name: 'استوديو التصميم والإنتاج المرئي', type: 'قسم داخلي', contact: 'عمر باعباد', email: 'media@ghazaraye.com', phone: '+967783334002', status: 'نشط' },
  { id: 'ENT-06', name: 'الإدارة المالية والحسابات', type: 'قسم داخلي', contact: 'عبدالرحمن باجابر', email: 'finance@ghazaraye.com', phone: '+967783334002', status: 'نشط' }
];

const DEFAULT_USERS = [
  ['سالم باحارثة', 'ceo', '123456', 'الإدارة العليا', 'المدير التنفيذي', 'ceo@ghazaraye.com', 'FALSE', 'USR-01', '{"email":true,"internal":true}', ''],
  ['أحمد الكاف', 'sales_mgr', '123456', 'المبيعات وتطوير الأعمال', 'مدير المبيعات', 'sales.mgr@ghazaraye.com', 'FALSE', 'USR-02', '{"email":true,"internal":true}', ''],
  ['فاطمة السقاف', 'hr_mgr', '123456', 'الموارد البشرية', 'مدير الموارد البشرية', 'hr.mgr@ghazaraye.com', 'FALSE', 'USR-03', '{"email":true,"internal":true}', ''],
  ['خالد باوزير', 'sales_rep', '123456', 'المبيعات وتطوير الأعمال', 'موظف مبيعات', 'sales@ghazaraye.com', 'FALSE', 'USR-04', '{"email":true,"internal":true}', ''],
  ['سارة بن سميط', 'mkt_mgr', '123456', 'التسويق', 'مدير التسويق', 'marketing.mgr@ghazaraye.com', 'FALSE', 'USR-05', '{"email":true,"internal":true}', ''],
  ['محمد العطاس', 'mkt_specialist', '123456', 'التسويق', 'موظف تسويق', 'marketing@ghazaraye.com', 'FALSE', 'USR-06', '{"email":true,"internal":true}', ''],
  ['عمر باعباد', 'media_mgr', '123456', 'الإعلام والإنتاج', 'مدير الاعلام', 'media@ghazaraye.com', 'FALSE', 'USR-07', '{"email":true,"internal":true}', ''],
  ['ياسر الكثيري', 'designer', '123456', 'التصميم والمونتاج', 'مصمم', 'design@ghazaraye.com', 'FALSE', 'USR-08', '{"email":true,"internal":true}', ''],
  ['عبدالرحمن باجابر', 'accountant', '123456', 'المالية والحسابات', 'محاسب', 'finance@ghazaraye.com', 'FALSE', 'USR-09', '{"email":true,"internal":true}', ''],
  ['نور الحبشي', 'hr_staff', '123456', 'الموارد البشرية', 'موظف موارد بشرية', 'hr@ghazaraye.com', 'FALSE', 'USR-10', '{"email":true,"internal":true}', '']
];

/**
 * فتح ملف Google Sheet وتجهيز الأوراق تلقائياً عند الحاجة
 */
function getSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureAllSheetsExist(ss);
  return ss;
}

function getTimezone() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEETS.SETTINGS);
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === 'timezone' && data[i][1]) {
          return String(data[i][1]);
        }
      }
    }
  } catch (e) {}
  return DEFAULT_TIMEZONE;
}

function formatNow(tz) {
  const zone = tz || getTimezone();
  return Utilities.formatDate(new Date(), zone, 'yyyy-MM-dd HH:mm:ss');
}

function formatDateOnly(dateObj, tz) {
  const zone = tz || getTimezone();
  return Utilities.formatDate(dateObj || new Date(), zone, 'yyyy-MM-dd');
}

/**
 * دالة التهيئة الشاملة لقاعدة البيانات (تُشغل يدوياً مرة واحدة أو تعمل تلقائياً)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ensureAllSheetsExist(ss);
  setupBackgroundTriggers();
  return {
    status: 'success',
    message: 'تمت تهيئة جميع أوراق قاعدة البيانات والجدولة التلقائية بنجاح.',
    timezone: getTimezone(),
    version: APP_VERSION
  };
}

function ensureAllSheetsExist(ss) {
  // 1. ورقة المستخدمين
  let usersSheet = ss.getSheetByName(SHEETS.USERS);
  const usersHeaders = ['اسم الموظف', 'اسم المستخدم', 'كلمة المرور', 'القسم', 'الوظيفة', 'البريد الالكتروني', 'تغيير كلمة المرور إجباري', 'معرف_المستخدم', 'تفضيلات_الإشعارات', 'تاريخ_آخر_دخول'];
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEETS.USERS);
    usersSheet.appendRow(usersHeaders);
  } else if (usersSheet.getLastColumn() < 7) {
    usersSheet.getRange(1, 1, 1, usersHeaders.length).setValues([usersHeaders]);
  }
  if (usersSheet.getLastRow() <= 1) {
    DEFAULT_USERS.forEach(row => usersSheet.appendRow(row));
  }

  // 2. ورقة الموظفين HR_Staff
  let hrSheet = ss.getSheetByName(SHEETS.HR_STAFF);
  const hrHeaders = ['الرقم الوظيفي', 'اسم الموظف', 'المسمى الوظيفي', 'المسار / القسم', 'رقم الهاتف', 'حالة العمل', 'تاريخ الإضافة', 'رصيد_الإجازات_السنوية', 'البريد_الإلكتروني'];
  if (!hrSheet) {
    hrSheet = ss.insertSheet(SHEETS.HR_STAFF);
    hrSheet.appendRow(hrHeaders);
  }
  if (hrSheet.getLastRow() <= 1) {
    DEFAULT_USERS.forEach((u, idx) => {
      hrSheet.appendRow(['EMP-' + (101 + idx), u[0], u[4], u[3], '+967 783 334 00' + idx, 'على رأس العمل', formatNow(DEFAULT_TIMEZONE), 30, u[5]]);
    });
  }

  // 3. ورقة طلبات الإجازات السنوية
  let leavesSheet = ss.getSheetByName(SHEETS.LEAVES);
  const leavesHeaders = [
    'رقم_الطلب', 'الرقم_الوظيفي', 'اسم_الموظف', 'اسم_المستخدم', 'المسمى_الوظيفي',
    'القسم', 'نوع_الإجازة', 'تاريخ_البداية', 'تاريخ_النهاية', 'عدد_الأيام',
    'البديل_المقترح', 'سبب_الإجازة', 'حالة_الطلب', 'اعتماد_الموارد_البشرية',
    'اعتماد_الإدارة', 'ملاحظات_الإدارة', 'تاريخ_الطلب', 'تاريخ_آخر_تحديث'
  ];
  if (!leavesSheet) {
    leavesSheet = ss.insertSheet(SHEETS.LEAVES);
    leavesSheet.appendRow(leavesHeaders);
  }

  // 4. ورقة المهام
  let tasksSheet = ss.getSheetByName(SHEETS.TASKS);
  const tasksHeaders = [
    'رقم_المهمة', 'عنوان_المهمة', 'وصف_المهمة', 'معرف_التصنيف', 'التصنيف_الإداري',
    'معرف_الجهة', 'الجهة_المرتبطة', 'نوع_المهمة', 'مصدر_المهمة', 'المسؤول_عن_التنفيذ',
    'منشئ_المهمة', 'تاريخ_الإنشاء', 'تاريخ_بدء_التنفيذ', 'الموعد_النهائي', 'وقت_الاستحقاق',
    'الأولوية', 'الحالة_الحالية', 'نسبة_الإنجاز', 'الخطوات_الفرعية_JSON', 'المهام_المرتبطة_JSON',
    'الردود_والقرارات_JSON', 'الملاحظات', 'المرفقات_والروابط_JSON', 'تاريخ_ووقت_التذكير', 'وسيلة_التذكير',
    'نمط_التكرار', 'بداية_التكرار', 'نهاية_التكرار', 'آخر_توليد_تكرار', 'سبب_التأجيل',
    'سجل_المواعيد_السابقة_JSON', 'وقت_الإكمال', 'سجل_الإنجاز_السابق_JSON', 'مؤرشفة', 'تاريخ_آخر_تحديث'
  ];
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet(SHEETS.TASKS);
    tasksSheet.appendRow(tasksHeaders);
  }

  // 5. ورقة التصنيفات
  let catSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  const catHeaders = ['معرف_التصنيف', 'اسم_التصنيف', 'وصف_التصنيف', 'اللون', 'الترتيب', 'مؤرشف', 'تاريخ_التحديث'];
  if (!catSheet) {
    catSheet = ss.insertSheet(SHEETS.CATEGORIES);
    catSheet.appendRow(catHeaders);
  }
  if (catSheet.getLastRow() <= 1) {
    const nowStr = formatNow(DEFAULT_TIMEZONE);
    DEFAULT_CATEGORIES.forEach(c => {
      catSheet.appendRow([c.id, c.name, c.desc, c.color, c.order, c.archived ? 'TRUE' : 'FALSE', nowStr]);
    });
  }

  // 6. ورقة الجهات
  let entSheet = ss.getSheetByName(SHEETS.ENTITIES);
  const entHeaders = ['معرف_الجهة', 'اسم_الجهة', 'نوع_الجهة', 'مسؤول_التواصل', 'البريد_الإلكتروني', 'رقم_الهاتف', 'الحالة', 'تاريخ_الإضافة'];
  if (!entSheet) {
    entSheet = ss.insertSheet(SHEETS.ENTITIES);
    entSheet.appendRow(entHeaders);
  }
  if (entSheet.getLastRow() <= 1) {
    const nowStr = formatNow(DEFAULT_TIMEZONE);
    DEFAULT_ENTITIES.forEach(e => {
      entSheet.appendRow([e.id, e.name, e.type, e.contact, e.email, e.phone, e.status, nowStr]);
    });
  }

  // 7. ورقة التذكيرات
  let remSheet = ss.getSheetByName(SHEETS.REMINDERS);
  const remHeaders = [
    'معرف_التذكير', 'رقم_المهمة', 'عنوان_المهمة', 'المستلم_المستخدم', 'المستلم_البريد',
    'نوع_التذكير', 'وقت_الجدولة', 'وسيلة_التذكير', 'حالة_الإرسال', 'عدد_المحاولات',
    'وقت_الإرسال_الفعلي', 'نتيجة_الإرسال', 'معرف_عدم_التكرار'
  ];
  if (!remSheet) {
    remSheet = ss.insertSheet(SHEETS.REMINDERS);
    remSheet.appendRow(remHeaders);
  }

  // 8. ورقة سجل التعديلات
  let auditSheet = ss.getSheetByName(SHEETS.AUDIT_LOG);
  const auditHeaders = [
    'معرف_السجل', 'التاريخ_والوقت', 'رقم_المرجع', 'نوع_العملية', 'المستخدم',
    'الحقل_المعدل', 'القيمة_السابقة', 'القيمة_الجديدة', 'التفاصيل'
  ];
  if (!auditSheet) {
    auditSheet = ss.insertSheet(SHEETS.AUDIT_LOG);
    auditSheet.appendRow(auditHeaders);
  }

  // 9. ورقة المرفقات
  let attSheet = ss.getSheetByName(SHEETS.ATTACHMENTS);
  const attHeaders = ['معرف_المرفق', 'رقم_المهمة', 'اسم_المرفق', 'الرابط', 'النوع', 'المستخدم', 'تاريخ_الإضافة'];
  if (!attSheet) {
    attSheet = ss.insertSheet(SHEETS.ATTACHMENTS);
    attSheet.appendRow(attHeaders);
  }

  // 10. ورقة الإشعارات الداخلية
  let notifSheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  const notifHeaders = ['معرف_الإشعار', 'المستخدم_المستهدف', 'رقم_المهمة', 'نوع_الإشعار', 'العنوان', 'الرسالة', 'مقروء', 'التاريخ_والوقت'];
  if (!notifSheet) {
    notifSheet = ss.insertSheet(SHEETS.NOTIFICATIONS);
    notifSheet.appendRow(notifHeaders);
  }

  // 11. ورقة الإعدادات
  let setSheet = ss.getSheetByName(SHEETS.SETTINGS);
  const setHeaders = ['المفتاح', 'القيمة', 'الوصف', 'تاريخ_آخر_تحديث'];
  if (!setSheet) {
    setSheet = ss.insertSheet(SHEETS.SETTINGS);
    setSheet.appendRow(setHeaders);
    const nowStr = formatNow(DEFAULT_TIMEZONE);
    setSheet.appendRow(['timezone', 'Asia/Aden', 'المنطقة الزمنية المعتمدة للنظام', nowStr]);
    setSheet.appendRow(['notifications_enabled', 'true', 'تفعيل نظام الإشعارات والتذكيرات العام', nowStr]);
    setSheet.appendRow(['email_verified', 'false', 'حالة التحقق الفعلي من إرسال البريد الإلكتروني', nowStr]);
    setSheet.appendRow(['email_sender_name', 'نظام مهام غزارة للتجارة والتسويق', 'الاسم الظاهر في رسائل البريد', nowStr]);
    setSheet.appendRow(['default_reminder_Before_hours', '24', 'التذكير الافتراضي قبل الموعد النهائي بالساعات', nowStr]);
    setSheet.appendRow(['daily_summary_enabled', 'true', 'إرسال الملخص اليومي للبريد الإلكتروني', nowStr]);
    setSheet.appendRow(['weekly_report_enabled', 'true', 'إرسال التقرير الأسبوعي للبريد الإلكتروني', nowStr]);
    setSheet.appendRow(['app_version', APP_VERSION, 'إصدار النظام', nowStr]);
  }

  // 12. ورقة النسخ الاحتياطي
  let backupSheet = ss.getSheetByName(SHEETS.BACKUPS);
  const backupHeaders = ['معرف_النسخة', 'تاريخ_النسخة', 'أنشئت_بواسطة', 'نوع_النسخة', 'ملخص_البيانات', 'البيانات_JSON'];
  if (!backupSheet) {
    backupSheet = ss.insertSheet(SHEETS.BACKUPS);
    backupSheet.appendRow(backupHeaders);
  }

  // 13. ورقة طلبات العملاء Sales_Leads
  let leadsSheet = ss.getSheetByName(SHEETS.SALES_LEADS);
  if (!leadsSheet) {
    leadsSheet = ss.insertSheet(SHEETS.SALES_LEADS);
    leadsSheet.appendRow([
      'رقم المرجع (Lead ID)', 'تاريخ ووقت الطلب', 'الاسم الكامل', 'الجهة / المنشأة',
      'رقم التواصل', 'البريد الإلكتروني', 'مجال العمل', 'المجال المطلوب للدعم',
      'الهدف المراد تحقيقه', 'موعد البدء المفضل', 'حالة الطلب (CRM Status)', 'الموظف المسؤول'
    ]);
  }
}

/**
 * نقطة الدخول لطلبات GET
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  if (action === 'setup') {
    return jsonResponse(setupDatabase());
  }
  return jsonResponse({
    status: 'success',
    message: 'خادم غزارة متصل ويعمل بنجاح',
    version: APP_VERSION,
    timezone: getTimezone()
  });
}

/**
 * نقطة الدخول الرئيسية لجميع طلبات POST القادمة من واجهات الموقع والبوابة
 */
function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);
    const action = payload.action || '';
    const ss = getSpreadsheet();

    switch (action) {
      // 1. المصادقة وإدارة الحساب
      case 'login':
        return jsonResponse(handleLogin(ss, payload));
      case 'forgotPassword':
        return jsonResponse(handleForgotPassword(ss, payload));
      case 'changePassword':
        return jsonResponse(handleChangePassword(ss, payload));
      case 'updateProfile':
        return jsonResponse(handleUpdateProfile(ss, payload));

      // 2. المبيعات وطلبات التواصل
      case 'addLead':
        return jsonResponse(handleAddLead(ss, payload));
      case 'getLeads':
        return jsonResponse(handleGetLeads(ss));
      case 'updateLeadStatus':
        return jsonResponse(handleUpdateLeadStatus(ss, payload));

      // 3. الموارد البشرية والإجازات السنوية
      case 'getHRData':
        return jsonResponse(handleGetHRData(ss, payload));
      case 'addEmployee':
        return jsonResponse(handleAddEmployee(ss, payload));
      case 'submitLeaveRequest':
        return jsonResponse(handleSubmitLeaveRequest(ss, payload));
      case 'updateLeaveStatus':
        return jsonResponse(handleUpdateLeaveStatus(ss, payload));

      // 4. لوحة مهام الشؤون الإدارية والتسويق
      case 'getDashboardBundle':
        return jsonResponse(handleGetDashboardBundle(ss, payload));
      case 'saveTask':
        return jsonResponse(handleSaveTask(ss, payload));
      case 'updateTaskStatus':
        return jsonResponse(handleUpdateTaskStatus(ss, payload));
      case 'rescheduleTask':
        return jsonResponse(handleRescheduleTask(ss, payload));
      case 'archiveTask':
        return jsonResponse(handleArchiveTask(ss, payload));
      case 'deleteTask':
        return jsonResponse(handleDeleteTask(ss, payload));
      case 'addTaskResponse':
        return jsonResponse(handleAddTaskResponse(ss, payload));

      // 5. التصنيفات والجهات
      case 'saveCategory':
        return jsonResponse(handleSaveCategory(ss, payload));
      case 'deleteCategory':
        return jsonResponse(handleDeleteCategory(ss, payload));
      case 'saveEntity':
        return jsonResponse(handleSaveEntity(ss, payload));
      case 'deleteEntity':
        return jsonResponse(handleDeleteEntity(ss, payload));

      // 6. الإشعارات والتذكيرات والبريد الإلكتروني
      case 'markNotificationRead':
        return jsonResponse(handleMarkNotificationRead(ss, payload));
      case 'testEmailConnection':
        return jsonResponse(handleTestEmailConnection(ss, payload));
      case 'runSchedulerNow':
        return jsonResponse(runScheduledJobs());
      case 'saveSettings':
        return jsonResponse(handleSaveSettings(ss, payload));

      // 7. النسخ الاحتياطي والاستعادة
      case 'createBackup':
        return jsonResponse(handleCreateBackup(ss, payload));
      case 'restoreBackup':
        return jsonResponse(handleRestoreBackup(ss, payload));

      default:
        return jsonResponse({ status: 'error', message: 'الإجراء المطلوب غير معروف: ' + action });
    }
  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: 'خطأ في معالجة الطلب على الخادم: ' + err.message,
      stack: err.stack
    });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ============================================================================
 * 1. التحقق الصارم من تسجيل الدخول من ورقة (المستخدمين) في Google Sheets
 * ============================================================================
 */
function handleLogin(ss, payload) {
  const identifier = String(payload.identifier || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!identifier || !password) {
    return { status: 'error', message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' };
  }

  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: 'error', message: 'ورقة (المستخدمين) فارغة في قاعدة البيانات.' };
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const empName = String(row[0] || '').trim();
    const username = String(row[1] || '').trim();
    const savedPass = String(row[2] || '').trim();
    const department = String(row[3] || '').trim();
    const jobRole = String(row[4] || '').trim();
    const email = String(row[5] || '').trim();
    const mustChange = String(row[6] || '').toUpperCase() === 'TRUE';
    const userId = String(row[7] || ('USR-0' + i));
    const notifPrefs = String(row[8] || '{"email":true,"internal":true}');

    if ((username.toLowerCase() === identifier || (email && email.toLowerCase() === identifier)) && savedPass === password) {
      // تحديث تاريخ آخر دخول
      sheet.getRange(i + 1, 10).setValue(formatNow());
      appendAuditLog(ss, userId, 'تسجيل دخول', username, 'تاريخ_آخر_دخول', '', formatNow(), 'تسجيل دخول ناجح للمنصة');
      return {
        status: 'success',
        user: {
          userId: userId,
          empName: empName,
          username: username,
          department: department,
          jobRole: jobRole,
          email: email,
          mustChangePassword: mustChange,
          notifPrefs: safeJsonParse(notifPrefs, { email: true, internal: true })
        }
      };
    }
  }

  return {
    status: 'error',
    message: 'بيانات الدخول غير صحيحة أو أن المستخدم غير مسجل في صفحة (المستخدمين) بقاعدة البيانات.'
  };
}

function handleForgotPassword(ss, payload) {
  const identifier = String(payload.identifier || '').trim().toLowerCase();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const empName = String(data[i][0] || '').trim();
    const username = String(data[i][1] || '').trim();
    const email = String(data[i][5] || '').trim();

    if (username.toLowerCase() === identifier || (email && email.toLowerCase() === identifier)) {
      if (!email) {
        return { status: 'error', message: 'لا يوجد بريد إلكتروني مسجل لهذا الموظف في ورقة المستخدمين.' };
      }
      const tempPass = 'GHZ-' + Math.floor(100000 + Math.random() * 900000);
      sheet.getRange(i + 1, 3).setValue(tempPass);
      sheet.getRange(i + 1, 7).setValue('TRUE');

      try {
        MailApp.sendEmail({
          to: email,
          subject: 'كلمة المرور المؤقتة - بوابة موظفي غزارة للتجارة والتسويق',
          htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#231338;">
            <h2 style="color:#5B2C83;">مرحباً ${empName}،</h2>
            <p>تم طلب استعادة كلمة المرور لحسابك في بوابة غزارة للتجارة والتسويق.</p>
            <p>كلمة المرور المؤقتة الخاصة بك هي: <strong style="background:#F3ECF9;padding:6px 12px;border-radius:8px;color:#5B2C83;">${tempPass}</strong></p>
            <p>يرجى استخدامها لتسجيل الدخول، وسيطلب منك النظام تعيين كلمة مرور جديدة فوراً.</p>
          </div>`
        });
      } catch (mailErr) {
        return { status: 'error', message: 'تعذر إرسال البريد الإلكتروني: ' + mailErr.message };
      }

      appendAuditLog(ss, username, 'استعادة كلمة مرور', username, 'كلمة المرور', '***', 'كلمة مؤقتة', 'إرسال كلمة مرور مؤقتة للبريد');
      return { status: 'success', message: 'تم إرسال كلمة مرور مؤقتة إلى بريدك الإلكتروني بنجاح.' };
    }
  }
  return { status: 'error', message: 'لم يتم العثور على مستخدم مطابق في صفحة (المستخدمين).' };
}

function handleChangePassword(ss, payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const currentPassword = String(payload.currentPassword || '').trim();
  const newPassword = String(payload.newPassword || '').trim();

  if (!username || !currentPassword || !newPassword) {
    return { status: 'error', message: 'جميع حقول كلمة المرور مطلوبة للتحقق.' };
  }

  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const rowUser = String(data[i][1] || '').trim().toLowerCase();
    const rowPass = String(data[i][2] || '').trim();
    if (rowUser === username) {
      if (rowPass !== currentPassword) {
        return { status: 'error', message: 'كلمة المرور الحالية غير صحيحة. لا يمكن تعديل بيانات المصادقة الحساسة دون التحقق الصحيح.' };
      }
      sheet.getRange(i + 1, 3).setValue(newPassword);
      sheet.getRange(i + 1, 7).setValue('FALSE');
      appendAuditLog(ss, username, 'تغيير كلمة المرور', username, 'كلمة المرور', '***', '***', 'تم تحديث كلمة المرور بنجاح');
      return { status: 'success', message: 'تم تحديث كلمة المرور بنجاح في قاعدة البيانات.' };
    }
  }
  return { status: 'error', message: 'المستخدم غير موجود.' };
}

function handleUpdateProfile(ss, payload) {
  const currentUsername = String(payload.currentUsername || '').trim().toLowerCase();
  const verifyPassword = String(payload.verifyPassword || '').trim();
  const newDisplayName = String(payload.empName || '').trim();
  const newUsername = String(payload.newUsername || payload.currentUsername || '').trim();
  const newEmail = String(payload.email || '').trim();
  const notifPrefs = payload.notifPrefs ? JSON.stringify(payload.notifPrefs) : '{"email":true,"internal":true}';

  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  // التأكد من عدم تكرار اسم المستخدم الجديد إذا تغير
  if (newUsername.toLowerCase() !== currentUsername) {
    for (let j = 1; j < data.length; j++) {
      if (String(data[j][1] || '').trim().toLowerCase() === newUsername.toLowerCase()) {
        return { status: 'error', message: 'اسم المستخدم الجديد مستخدم بالفعل لموظف آخر.' };
      }
    }
  }

  for (let i = 1; i < data.length; i++) {
    const rowUser = String(data[i][1] || '').trim().toLowerCase();
    const rowPass = String(data[i][2] || '').trim();
    if (rowUser === currentUsername) {
      if (rowPass !== verifyPassword) {
        return { status: 'error', message: 'كلمة المرور الحالية غير صحيحة. يرجى إدخال كلمة المرور لتأكيد تعديل الحساب.' };
      }
      if (newDisplayName) sheet.getRange(i + 1, 1).setValue(newDisplayName);
      if (newUsername) sheet.getRange(i + 1, 2).setValue(newUsername);
      if (newEmail) sheet.getRange(i + 1, 6).setValue(newEmail);
      sheet.getRange(i + 1, 9).setValue(notifPrefs);

      appendAuditLog(ss, newUsername, 'تحديث الحساب الشخصي', newUsername, 'الملف الشخصي', currentUsername, newUsername, 'تحديث الاسم الظاهر وإعدادات الإشعارات');
      return {
        status: 'success',
        message: 'تم حفظ الإعدادات الشخصية بنجاح.',
        user: {
          empName: newDisplayName || data[i][0],
          username: newUsername || data[i][1],
          department: data[i][3],
          jobRole: data[i][4],
          email: newEmail || data[i][5],
          mustChangePassword: false,
          notifPrefs: safeJsonParse(notifPrefs, { email: true, internal: true })
        }
      };
    }
  }
  return { status: 'error', message: 'تعذر العثور على حساب المستخدم.' };
}

/**
 * ============================================================================
 * 2. إدارة طلبات العملاء (Sales_Leads)
 * ============================================================================
 */
function handleAddLead(ss, payload) {
  const sheet = ss.getSheetByName(SHEETS.SALES_LEADS);
  const leadId = payload.leadId || ('GHZ-' + Date.now().toString().slice(-6));
  const nowStr = payload.timestamp || formatNow();
  sheet.appendRow([
    leadId,
    nowStr,
    payload.fullName || '',
    payload.organization || '',
    payload.phone || '',
    payload.email || '',
    payload.sector || '',
    payload.supportArea || '',
    payload.goalToAchieve || '',
    payload.startTime || 'غير محدد',
    payload.status || 'جديد',
    payload.assignedTo || 'غير معين'
  ]);
  return { status: 'success', leadId: leadId, message: 'تم حفظ طلب العميل في Google Sheets بنجاح.' };
}

function handleGetLeads(ss) {
  const sheet = ss.getSheetByName(SHEETS.SALES_LEADS);
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success', leads: [] };
  const data = sheet.getDataRange().getValues();
  const leads = [];
  for (let i = 1; i < data.length; i++) {
    leads.unshift({
      leadId: String(data[i][0] || ''),
      timestamp: String(data[i][1] || ''),
      fullName: String(data[i][2] || ''),
      organization: String(data[i][3] || ''),
      phone: String(data[i][4] || ''),
      email: String(data[i][5] || ''),
      sector: String(data[i][6] || ''),
      supportArea: String(data[i][7] || ''),
      goalToAchieve: String(data[i][8] || ''),
      startTime: String(data[i][9] || ''),
      status: String(data[i][10] || 'جديد'),
      assignedTo: String(data[i][11] || 'غير معين')
    });
  }
  return { status: 'success', leads: leads };
}

function handleUpdateLeadStatus(ss, payload) {
  const sheet = ss.getSheetByName(SHEETS.SALES_LEADS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.leadId)) {
      sheet.getRange(i + 1, 11).setValue(payload.status);
      if (payload.assignedTo) sheet.getRange(i + 1, 12).setValue(payload.assignedTo);
      return { status: 'success', message: 'تم تحديث حالة الفرصة البيعية.' };
    }
  }
  return { status: 'error', message: 'لم يتم العثور على الطلب.' };
}

/**
 * ============================================================================
 * 3. إدارة الموارد البشرية وطلبات الإجازات السنوية للموظفين والمدراء
 * ============================================================================
 */
function handleGetHRData(ss, payload) {
  const hrSheet = ss.getSheetByName(SHEETS.HR_STAFF);
  const leaveSheet = ss.getSheetByName(SHEETS.LEAVES);

  const staff = [];
  if (hrSheet && hrSheet.getLastRow() > 1) {
    const hrData = hrSheet.getDataRange().getValues();
    for (let i = 1; i < hrData.length; i++) {
      staff.push({
        id: String(hrData[i][0] || ''),
        name: String(hrData[i][1] || ''),
        role: String(hrData[i][2] || ''),
        dept: String(hrData[i][3] || ''),
        phone: String(hrData[i][4] || ''),
        status: String(hrData[i][5] || 'على رأس العمل'),
        createdAt: String(hrData[i][6] || ''),
        annualBalance: Number(hrData[i][7] || 30),
        email: String(hrData[i][8] || '')
      });
    }
  }

  const leaves = [];
  if (leaveSheet && leaveSheet.getLastRow() > 1) {
    const lData = leaveSheet.getDataRange().getValues();
    for (let i = 1; i < lData.length; i++) {
      leaves.unshift({
        requestId: String(lData[i][0] || ''),
        empId: String(lData[i][1] || ''),
        empName: String(lData[i][2] || ''),
        username: String(lData[i][3] || ''),
        jobRole: String(lData[i][4] || ''),
        department: String(lData[i][5] || ''),
        leaveType: String(lData[i][6] || 'إجازة سنوية'),
        startDate: formatCellDate(lData[i][7]),
        endDate: formatCellDate(lData[i][8]),
        daysCount: Number(lData[i][9] || 0),
        substituteEmp: String(lData[i][10] || ''),
        reason: String(lData[i][11] || ''),
        status: String(lData[i][12] || 'بانتظار الاعتماد'),
        hrApproval: String(lData[i][13] || 'قيد المراجعة'),
        execApproval: String(lData[i][14] || 'قيد المراجعة'),
        managerNotes: String(lData[i][15] || ''),
        createdAt: String(lData[i][16] || ''),
        updatedAt: String(lData[i][17] || '')
      });
    }
  }

  return { status: 'success', staff: staff, leaves: leaves };
}

function handleAddEmployee(ss, payload) {
  const hrSheet = ss.getSheetByName(SHEETS.HR_STAFF);
  const empId = payload.id || ('EMP-' + (100 + hrSheet.getLastRow()));
  const nowStr = formatNow();
  hrSheet.appendRow([
    empId,
    payload.name || '',
    payload.role || '',
    payload.dept || '',
    payload.phone || '',
    payload.status || 'على رأس العمل',
    nowStr,
    Number(payload.annualBalance || 30),
    payload.email || ''
  ]);
  appendAuditLog(ss, empId, 'إضافة موظف', payload.byUser || 'HR', 'HR_Staff', '', payload.name, 'إضافة موظف جديد لسجل الموارد البشرية');
  return { status: 'success', empId: empId, message: 'تم حفظ بيانات الموظف في Google Sheets.' };
}

function handleSubmitLeaveRequest(ss, payload) {
  const leaveSheet = ss.getSheetByName(SHEETS.LEAVES);
  const requestId = 'LVR-' + new Date().getFullYear() + '-' + String(1000 + leaveSheet.getLastRow());
  const nowStr = formatNow();

  const startDate = String(payload.startDate || '').trim();
  const endDate = String(payload.endDate || '').trim();
  const daysCount = Number(payload.daysCount || 1);

  if (! payload.empName || !startDate || !endDate || daysCount <= 0) {
    return { status: 'error', message: 'يرجى استكمال تاريخ البداية والنهاية والتأكد من صحة عدد أيام الإجازة.' };
  }

  const row = [
    requestId,
    payload.empId || '',
    payload.empName || '',
    payload.username || '',
    payload.jobRole || '',
    payload.department || '',
    payload.leaveType || 'إجازة سنوية',
    startDate,
    endDate,
    daysCount,
    payload.substituteEmp || '',
    payload.reason || '',
    'بانتظار الاعتماد',
    'بانتظار المراجعة',
    'بانتظار المراجعة',
    '',
    nowStr,
    nowStr
  ];

  leaveSheet.appendRow(row);

  // إنشاء إشعار داخلي لمدير الموارد البشرية والمدير التنفيذي
  createInternalNotification(
    ss,
    'ALL_MANAGERS',
    requestId,
    'طلب إجازة سنوية',
    'طلب إجازة جديد من ' + payload.empName,
    `قدم ${payload.empName} (${payload.jobRole}) طلب ${payload.leaveType || 'إجازة سنوية'} لمدة ${daysCount} يوم من ${startDate} إلى ${endDate}.`
  );

  appendAuditLog(ss, requestId, 'تقديم طلب إجازة', payload.username || payload.empName, 'طلبات_الاجازات', '', `${daysCount} أيام (${startDate} - ${endDate})`, payload.reason || '');

  return {
    status: 'success',
    requestId: requestId,
    message: 'تم تسجيل طلب الإجازة السنوية في قاعدة البيانات بنجاح وإشعار الإدارة المختصة.'
  };
}

function handleUpdateLeaveStatus(ss, payload) {
  const leaveSheet = ss.getSheetByName(SHEETS.LEAVES);
  const data = leaveSheet.getDataRange().getValues();
  const requestId = String(payload.requestId || '');
  const nowStr = formatNow();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === requestId) {
      const oldStatus = String(data[i][12] || '');
      const newStatus = String(payload.status || oldStatus);
      const hrApproval = String(payload.hrApproval || data[i][13] || '');
      const execApproval = String(payload.execApproval || data[i][14] || '');
      const managerNotes = String(payload.managerNotes !== undefined ? payload.managerNotes : (data[i][15] || ''));

      leaveSheet.getRange(i + 1, 13).setValue(newStatus);
      leaveSheet.getRange(i + 1, 14).setValue(hrApproval);
      leaveSheet.getRange(i + 1, 15).setValue(execApproval);
      leaveSheet.getRange(i + 1, 16).setValue(managerNotes);
      leaveSheet.getRange(i + 1, 18).setValue(nowStr);

      const targetUser = String(data[i][3] || '');
      createInternalNotification(
        ss,
        targetUser,
        requestId,
        'تحديث طلب إجازة',
        `تحديث حالة طلب إجازتك (${requestId})`,
        `تم تحديث حالة طلب الإجازة الخاص بك إلى: ${newStatus}. ${managerNotes ? 'ملاحظات الإدارة: ' + managerNotes : ''}`
      );

      appendAuditLog(ss, requestId, 'تحديث حالة إجازة', payload.byUser || 'الإدارة', 'حالة_الطلب', oldStatus, newStatus, managerNotes);
      return { status: 'success', message: 'تم تحديث قرار الاعتماد لطلب الإجازة في Google Sheets.' };
    }
  }
  return { status: 'error', message: 'لم يتم العثور على طلب الإجازة.' };
}

/**
 * ============================================================================
 * 4. لوحة مهام الشؤون الإدارية والتسويق (CRUD + Workflow + Audit + Reminders)
 * ============================================================================
 */
function handleGetDashboardBundle(ss, payload) {
  const username = String(payload.username || '').trim();
  return {
    status: 'success',
    serverTime: formatNow(),
    timezone: getTimezone(),
    version: APP_VERSION,
    tasks: readAllTasks(ss),
    categories: readAllCategories(ss),
    entities: readAllEntities(ss),
    users: readAllUsersPublic(ss),
    reminders: readAllReminders(ss),
    auditLogs: readRecentAuditLogs(ss, 120),
    notifications: readUserNotifications(ss, username),
    settings: readAllSettings(ss),
    backups: readBackupsMeta(ss)
  };
}

function readAllTasks(ss) {
  const sheet = ss.getSheetByName(SHEETS.TASKS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const tasks = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[0]) continue;
    tasks.push({
      taskId: String(r[0] || ''),
      title: String(r[1] || ''),
      description: String(r[2] || ''),
      categoryId: String(r[3] || ''),
      categoryName: String(r[4] || ''),
      entityId: String(r[5] || ''),
      entityName: String(r[6] || ''),
      taskType: String(r[7] || 'داخلية'),
      source: String(r[8] || ''),
      assignee: String(r[9] || ''),
      createdBy: String(r[10] || ''),
      createdAt: String(r[11] || ''),
      startDate: formatCellDate(r[12]),
      dueDate: formatCellDate(r[13]),
      dueTime: String(r[14] || ''),
      priority: String(r[15] || 'متوسطة'),
      status: String(r[16] || 'جديدة'),
      progress: Number(r[17] || 0),
      subtasks: safeJsonParse(r[18], []),
      relatedTasks: safeJsonParse(r[19], []),
      responses: safeJsonParse(r[20], []),
      notes: String(r[21] || ''),
      attachments: safeJsonParse(r[22], []),
      reminderDateTime: String(r[23] || ''),
      reminderMethod: String(r[24] || 'داخلي'),
      recurrencePattern: String(r[25] || 'بدون'),
      recurrenceStart: formatCellDate(r[26]),
      recurrenceEnd: formatCellDate(r[27]),
      lastRecurrenceGenerated: String(r[28] || ''),
      postponeReason: String(r[29] || ''),
      previousDueDates: safeJsonParse(r[30], []),
      completedAt: String(r[31] || ''),
      completionHistory: safeJsonParse(r[32], []),
      isArchived: String(r[33] || 'FALSE').toUpperCase() === 'TRUE',
      updatedAt: String(r[34] || '')
    });
  }
  return tasks;
}

function handleSaveTask(ss, payload) {
  const task = payload.task || {};
  const byUser = String(payload.byUser || task.createdBy || 'مستخدم النظام');
  const nowStr = formatNow();

  // التحقق الصارم من الحقول الأساسية
  if (!String(task.title || '').trim()) {
    return { status: 'error', message: 'عنوان المهمة حقل أساسي لا يمكن تركه فارغاً.' };
  }
  if (!String(task.categoryId || '').trim()) {
    return { status: 'error', message: 'التصنيف الإداري للمهمة حقل أساسي.' };
  }
  if (!String(task.priority || '').trim()) {
    return { status: 'error', message: 'أولوية المهمة حقل أساسي.' };
  }
  if (!String(task.dueDate || '').trim()) {
    return { status: 'error', message: 'الموعد النهائي للاستحقاق حقل أساسي.' };
  }

  const sheet = ss.getSheetByName(SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();
  let existingRowIndex = -1;
  let existingRow = null;

  if (task.taskId) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(task.taskId)) {
        existingRowIndex = i + 1;
        existingRow = data[i];
        break;
      }
    }
  }

  const isNew = existingRowIndex === -1;
  const taskId = isNew ? generateUniqueTaskId(sheet) : String(task.taskId);
  const createdAt = isNew ? nowStr : String(existingRow[11] || nowStr);
  const createdBy = isNew ? byUser : String(existingRow[10] || byUser);

  let previousDueDates = isNew ? [] : safeJsonParse(existingRow[30], []);
  let completedAt = isNew ? '' : String(existingRow[31] || '');
  let completionHistory = isNew ? [] : safeJsonParse(existingRow[32], []);
  let postponeReason = String(task.postponeReason || (isNew ? '' : existingRow[29] || ''));

  const oldStatus = isNew ? '' : String(existingRow[16] || '');
  const newStatus = String(task.status || 'جديدة');
  const oldDueDate = isNew ? '' : formatCellDate(existingRow[13]);
  const newDueDate = String(task.dueDate || '').trim();

  // إذا تم تأجيل المهمة أو تغيير موعدها النهائي، نحفظ الموعد السابق في سجل المواعيد
  if (!isNew && oldDueDate && newDueDate && oldDueDate !== newDueDate) {
    previousDueDates.push({
      oldDueDate: oldDueDate,
      newDueDate: newDueDate,
      reason: task.postponeReason || 'تعديل موعد الاستحقاق',
      changedBy: byUser,
      changedAt: nowStr
    });
  }

  // إذا اكتملت المهمة نسجل وقت الإكمال، وإذا أعيد فتحها نحتفظ بسجل الإنجاز السابق دون مسحه
  let progress = Number(task.progress !== undefined ? task.progress : 0);
  if (newStatus === 'مكتملة') {
    progress = 100;
    if (!completedAt || oldStatus !== 'مكتملة') {
      completedAt = nowStr;
      completionHistory.push({
        completedAt: nowStr,
        completedBy: byUser,
        note: 'إكمال المهمة'
      });
    }
  } else if (!isNew && oldStatus === 'مكتملة' && newStatus !== 'مكتملة') {
    completionHistory.push({
      reopenedAt: nowStr,
      reopenedBy: byUser,
      previousCompletedAt: completedAt,
      newStatus: newStatus
    });
  }

  const rowValues = [
    taskId,
    String(task.title || '').trim(),
    String(task.description || '').trim(),
    String(task.categoryId || '').trim(),
    String(task.categoryName || '').trim(),
    String(task.entityId || '').trim(),
    String(task.entityName || '').trim(),
    String(task.taskType || 'داخلية'),
    String(task.source || '').trim(),
    String(task.assignee || '').trim(),
    createdBy,
    createdAt,
    String(task.startDate || ''),
    newDueDate,
    String(task.dueTime || ''),
    String(task.priority || 'متوسطة'),
    newStatus,
    progress,
    JSON.stringify(task.subtasks || []),
    JSON.stringify(task.relatedTasks || []),
    JSON.stringify(task.responses || []),
    String(task.notes || ''),
    JSON.stringify(task.attachments || []),
    String(task.reminderDateTime || ''),
    String(task.reminderMethod || 'داخلي'),
    String(task.recurrencePattern || 'بدون'),
    String(task.recurrenceStart || ''),
    String(task.recurrenceEnd || ''),
    isNew ? '' : String(existingRow[28] || ''),
    postponeReason,
    JSON.stringify(previousDueDates),
    completedAt,
    JSON.stringify(completionHistory),
    task.isArchived ? 'TRUE' : 'FALSE',
    nowStr
  ];

  if (isNew) {
    sheet.appendRow(rowValues);
    appendAuditLog(ss, taskId, 'إنشاء مهمة جديدة', byUser, 'المهمة بالكامل', '', task.title, `التصنيف: ${task.categoryName} | الأولوية: ${task.priority} | الاستحقاق: ${newDueDate}`);
    createInternalNotification(ss, task.assignee || 'ALL', taskId, 'مهمة جديدة', `مهمة جديدة: ${task.title}`, `تم إسناد المهمة (${taskId}) بموعد استحقاق ${newDueDate}.`);
  } else {
    sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    appendAuditLog(ss, taskId, 'تعديل مهمة', byUser, 'بيانات المهمة', `${oldStatus} (${oldDueDate})`, `${newStatus} (${newDueDate})`, task.postponeReason || 'تحديث بيانات المهمة');

    if (oldDueDate !== newDueDate) {
      createInternalNotification(ss, task.assignee || 'ALL', taskId, 'تعديل موعد مهمة', `تعديل موعد المهمة: ${task.title}`, `تغير الموعد النهائي من ${oldDueDate} إلى ${newDueDate}.`);
    }
    if (oldStatus !== newStatus && (newStatus === 'مكتملة' || oldStatus === 'مكتملة')) {
      const actionTitle = newStatus === 'مكتملة' ? 'إكمال مهمة' : 'إعادة فتح مهمة';
      createInternalNotification(ss, task.assignee || 'ALL', taskId, actionTitle, `${actionTitle}: ${task.title}`, `تم تغيير حالة المهمة (${taskId}) إلى ${newStatus}.`);
    }
  }

  // مزامنة المرفقات في جدول المرفقات المستقل
  syncTaskAttachments(ss, taskId, task.attachments || [], byUser, nowStr);

  // إلغاء التذكيرات القديمة وإعادة جدولتها تلقائياً وفق الموعد والحالة الجديدة
  syncTaskReminders(ss, {
    taskId: taskId,
    title: String(task.title || '').trim(),
    assignee: String(task.assignee || '').trim(),
    dueDate: newDueDate,
    dueTime: String(task.dueTime || '09:00'),
    priority: String(task.priority || 'متوسطة'),
    status: newStatus,
    reminderDateTime: String(task.reminderDateTime || ''),
    reminderMethod: String(task.reminderMethod || 'داخلي'),
    isArchived: Boolean(task.isArchived)
  });

  return {
    status: 'success',
    taskId: taskId,
    updatedAt: nowStr,
    message: isNew ? 'تم حفظ المهمة الجديدة في Google Sheets بنجاح.' : 'تم حفظ التعديلات على المهمة في Google Sheets بنجاح.'
  };
}

function generateUniqueTaskId(sheet) {
  const year = new Date().getFullYear();
  const lastRow = sheet ? sheet.getLastRow() : 1;
  const existingIds = new Set();
  if (lastRow > 1) {
    const colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    colA.forEach(r => existingIds.add(String(r[0])));
  }
  let seq = lastRow;
  let candidate = '';
  do {
    candidate = `TSK-${year}-${String(seq).padStart(4, '0')}`;
    seq++;
  } while (existingIds.has(candidate));
  return candidate;
}

function handleUpdateTaskStatus(ss, payload) {
  const taskId = String(payload.taskId || '');
  const newStatus = String(payload.status || '');
  const progress = payload.progress !== undefined ? Number(payload.progress) : undefined;
  const postponeReason = String(payload.postponeReason || '');
  const newDueDate = String(payload.newDueDate || '');
  const byUser = String(payload.byUser || 'مستخدم النظام');
  const nowStr = formatNow();

  const sheet = ss.getSheetByName(SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === taskId) {
      const oldStatus = String(data[i][16] || '');
      const oldProgress = Number(data[i][17] || 0);
      const oldDueDate = formatCellDate(data[i][13]);
      let prevDates = safeJsonParse(data[i][30], []);
      let completedAt = String(data[i][31] || '');
      let compHistory = safeJsonParse(data[i][32], []);

      if (newStatus === 'مؤجلة' && (!newDueDate || !postponeReason)) {
        return { status: 'error', message: 'عند تأجيل المهمة يجب تحديد الموعد الجديد وسبب التأجيل.' };
      }

      if (newDueDate && newDueDate !== oldDueDate) {
        prevDates.push({
          oldDueDate: oldDueDate,
          newDueDate: newDueDate,
          reason: postponeReason || 'تأجيل / تعديل موعد المهمة',
          changedBy: byUser,
          changedAt: nowStr
        });
        sheet.getRange(i + 1, 14).setValue(newDueDate);
        sheet.getRange(i + 1, 31).setValue(JSON.stringify(prevDates));
      }

      if (postponeReason) {
        sheet.getRange(i + 1, 30).setValue(postponeReason);
      }

      let finalProgress = progress !== undefined ? progress : oldProgress;
      if (newStatus === 'مكتملة') {
        finalProgress = 100;
        completedAt = nowStr;
        compHistory.push({ completedAt: nowStr, completedBy: byUser, note: 'إكمال المهمة' });
        sheet.getRange(i + 1, 32).setValue(completedAt);
        sheet.getRange(i + 1, 33).setValue(JSON.stringify(compHistory));
      } else if (oldStatus === 'مكتملة' && newStatus && newStatus !== 'مكتملة') {
        compHistory.push({ reopenedAt: nowStr, reopenedBy: byUser, previousCompletedAt: completedAt, newStatus: newStatus });
        sheet.getRange(i + 1, 33).setValue(JSON.stringify(compHistory));
      }

      if (newStatus) sheet.getRange(i + 1, 17).setValue(newStatus);
      sheet.getRange(i + 1, 18).setValue(finalProgress);
      sheet.getRange(i + 1, 35).setValue(nowStr);

      appendAuditLog(
        ss,
        taskId,
        'تحديث حالة / إنجاز',
        byUser,
        'الحالة ونسبة الإنجاز',
        `${oldStatus} (${oldProgress}%)`,
        `${newStatus || oldStatus} (${finalProgress}%)`,
        postponeReason || 'تحديث سريع للحالة'
      );

      // تحديث التذكيرات
      syncTaskReminders(ss, {
        taskId: taskId,
        title: String(data[i][1] || ''),
        assignee: String(data[i][9] || ''),
        dueDate: newDueDate || oldDueDate,
        dueTime: String(data[i][14] || '09:00'),
        priority: String(data[i][15] || 'متوسطة'),
        status: newStatus || oldStatus,
        reminderDateTime: String(data[i][23] || ''),
        reminderMethod: String(data[i][24] || 'داخلي'),
        isArchived: String(data[i][33] || 'FALSE') === 'TRUE'
      });

      return { status: 'success', updatedAt: nowStr, message: 'تم تحديث حالة المهمة ونسبة الإنجاز بنجاح.' };
    }
  }
  return { status: 'error', message: 'المهمة غير موجودة.' };
}

function handleRescheduleTask(ss, payload) {
  const taskId = String(payload.taskId || '');
  const newDueDate = String(payload.newDueDate || '').trim();
  const reason = String(payload.reason || 'نقل الموعد عبر التقويم التفاعلي');
  const byUser = String(payload.byUser || 'مستخدم النظام');
  const nowStr = formatNow();

  if (!taskId || !newDueDate) {
    return { status: 'error', message: 'رقم المهمة والتاريخ الجديد مطلوبان.' };
  }

  const sheet = ss.getSheetByName(SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === taskId) {
      const oldDueDate = formatCellDate(data[i][13]);
      const prevDates = safeJsonParse(data[i][30], []);
      prevDates.push({
        oldDueDate: oldDueDate,
        newDueDate: newDueDate,
        reason: reason,
        changedBy: byUser,
        changedAt: nowStr
      });

      sheet.getRange(i + 1, 14).setValue(newDueDate);
      sheet.getRange(i + 1, 31).setValue(JSON.stringify(prevDates));
      sheet.getRange(i + 1, 35).setValue(nowStr);

      appendAuditLog(ss, taskId, 'إعادة جدولة من التقويم', byUser, 'الموعد_النهائي', oldDueDate, newDueDate, reason);
      createInternalNotification(ss, String(data[i][9] || 'ALL'), taskId, 'تعديل موعد مهمة', `نقل موعد المهمة: ${data[i][1]}`, `تم نقل موعد استحقاق المهمة من ${oldDueDate} إلى ${newDueDate}.`);

      syncTaskReminders(ss, {
        taskId: taskId,
        title: String(data[i][1] || ''),
        assignee: String(data[i][9] || ''),
        dueDate: newDueDate,
        dueTime: String(data[i][14] || '09:00'),
        priority: String(data[i][15] || 'متوسطة'),
        status: String(data[i][16] || 'جديدة'),
        reminderDateTime: '',
        reminderMethod: String(data[i][24] || 'داخلي'),
        isArchived: String(data[i][33] || 'FALSE') === 'TRUE'
      });

      return { status: 'success', updatedAt: nowStr, message: 'تم نقل موعد المهمة في قاعدة البيانات وإعادة جدولة تذكيراتها تلقائياً.' };
    }
  }
  return { status: 'error', message: 'المهمة غير موجودة.' };
}

function handleArchiveTask(ss, payload) {
  const taskId = String(payload.taskId || '');
  const archiveState = payload.isArchived !== false;
  const byUser = String(payload.byUser || 'مستخدم النظام');
  const nowStr = formatNow();

  const sheet = ss.getSheetByName(SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === taskId) {
      sheet.getRange(i + 1, 34).setValue(archiveState ? 'TRUE' : 'FALSE');
      sheet.getRange(i + 1, 35).setValue(nowStr);
      appendAuditLog(ss, taskId, archiveState ? 'أرشفة مهمة' : 'استعادة مهمة من الأرشيف', byUser, 'مؤرشفة', String(!archiveState), String(archiveState), data[i][1]);
      if (archiveState) {
        cancelTaskReminders(ss, taskId, 'تم إلغاء التذكير بسبب أرشفة المهمة');
      }
      return { status: 'success', message: archiveState ? 'تم نقل المهمة إلى قسم المهام المؤرشفة بنجاح.' : 'تمت استعادة المهمة من الأرشيف.' };
    }
  }
  return { status: 'error', message: 'المهمة غير موجودة.' };
}

function handleDeleteTask(ss, payload) {
  const taskId = String(payload.taskId || '');
  const byUser = String(payload.byUser || 'مستخدم النظام');
  const sheet = ss.getSheetByName(SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === taskId) {
      const title = String(data[i][1] || '');
      sheet.deleteRow(i + 1);
      cancelTaskReminders(ss, taskId, 'تم حذف المهمة نهائياً');
      appendAuditLog(ss, taskId, 'حذف مهمة نهائياً', byUser, 'سجل المهمة', title, 'محذوف', 'تم الحذف النهائي بعد تأكيد المستخدم');
      return { status: 'success', message: 'تم حذف المهمة من قاعدة البيانات.' };
    }
  }
  return { status: 'error', message: 'المهمة غير موجودة.' };
}

function handleAddTaskResponse(ss, payload) {
  const taskId = String(payload.taskId || '');
  const responseText = String(payload.responseText || '').trim();
  const decisionType = String(payload.decisionType || 'رد / متابعة');
  const byUser = String(payload.byUser || 'مستخدم النظام');
  const nowStr = formatNow();

  if (!taskId || !responseText) {
    return { status: 'error', message: 'يرجى كتابة نص الرد أو القرار.' };
  }

  const sheet = ss.getSheetByName(SHEETS.TASKS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === taskId) {
      const responses = safeJsonParse(data[i][20], []);
      responses.push({
        id: 'RSP-' + Date.now(),
        author: byUser,
        decisionType: decisionType,
        text: responseText,
        createdAt: nowStr
      });
      sheet.getRange(i + 1, 21).setValue(JSON.stringify(responses));
      sheet.getRange(i + 1, 35).setValue(nowStr);
      appendAuditLog(ss, taskId, 'إضافة رد / قرار', byUser, 'الردود_والقرارات', '', decisionType, responseText);
      return { status: 'success', responses: responses, message: 'تم تسجيل الرد / القرار بنجاح.' };
    }
  }
  return { status: 'error', message: 'المهمة غير موجودة.' };
}

/**
 * ============================================================================
 * 5. إدارة التصنيفات والجهات مع الحماية الكاملة للعلاقات المرجعية
 * ============================================================================
 */
function readAllCategories(ss) {
  const sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!sheet || sheet.getLastRow() <= 1) return DEFAULT_CATEGORIES;
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    list.push({
      id: String(data[i][0]),
      name: String(data[i][1]),
      desc: String(data[i][2] || ''),
      color: String(data[i][3] || '#5B2C83'),
      order: Number(data[i][4] || i),
      archived: String(data[i][5] || 'FALSE').toUpperCase() === 'TRUE',
      updatedAt: String(data[i][6] || '')
    });
  }
  return list.sort((a, b) => a.order - b.order);
}

function handleSaveCategory(ss, payload) {
  const cat = payload.category || {};
  const byUser = String(payload.byUser || 'الإدارة');
  const nowStr = formatNow();
  if (!String(cat.name || '').trim()) {
    return { status: 'error', message: 'اسم التصنيف مطلوب.' };
  }

  const sheet = ss.getSheetByName(SHEETS.CATEGORIES);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  let oldName = '';

  if (cat.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(cat.id)) {
        rowIndex = i + 1;
        oldName = String(data[i][1]);
        break;
      }
    }
  }

  const catId = rowIndex === -1 ? ('CAT-' + String(data.length).padStart(2, '0') + '-' + Date.now().toString().slice(-3)) : String(cat.id);
  const rowVals = [
    catId,
    String(cat.name).trim(),
    String(cat.desc || ''),
    String(cat.color || '#5B2C83'),
    Number(cat.order || data.length),
    cat.archived ? 'TRUE' : 'FALSE',
    nowStr
  ];

  if (rowIndex === -1) {
    sheet.appendRow(rowVals);
    appendAuditLog(ss, catId, 'إضافة تصنيف', byUser, 'التصنيفات', '', cat.name, '');
  } else {
    sheet.getRange(rowIndex, 1, 1, rowVals.length).setValues([rowVals]);
    // تحديث اسم التصنيف في المهام المرتبطة به دون حذف أي مهمة
    if (oldName && oldName !== rowVals[1]) {
      const taskSheet = ss.getSheetByName(SHEETS.TASKS);
      if (taskSheet && taskSheet.getLastRow() > 1) {
        const tData = taskSheet.getDataRange().getValues();
        for (let j = 1; j < tData.length; j++) {
          if (String(tData[j][3]) === catId) {
            taskSheet.getRange(j + 1, 5).setValue(rowVals[1]);
          }
        }
      }
    }
    appendAuditLog(ss, catId, 'تعديل تصنيف', byUser, 'اسم_التصنيف', oldName, rowVals[1], 'تم الحفاظ على كافة المهام المرتبطة بالتصنيف');
  }

  return { status: 'success', categories: readAllCategories(ss), message: 'تم حفظ التصنيف بنجاح مع الحفاظ التام على المهام المرتبطة.' };
}

function handleDeleteCategory(ss, payload) {
  const catId = String(payload.categoryId || '');
  const reassignToId = String(payload.reassignToCategoryId || '');
  const byUser = String(payload.byUser || 'الإدارة');

  // التحقق من وجود مهام مرتبطة بهذا التصنيف
  const taskSheet = ss.getSheetByName(SHEETS.TASKS);
  const tData = taskSheet.getDataRange().getValues();
  let linkedCount = 0;
  for (let i = 1; i < tData.length; i++) {
    if (String(tData[i][3]) === catId) linkedCount++;
  }

  if (linkedCount > 0 && !reassignToId) {
    return {
      status: 'error',
      message: `لا يمكن حذف هذا التصنيف لأنه مرتبط بـ (${linkedCount}) مهمة قائمة. يمكنك أرشفته أو اختيار تصنيف بديل لنقل المهام إليه أولاً.`
    };
  }

  const catSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  const cData = catSheet.getDataRange().getValues();
  let targetNewName = '';
  if (reassignToId) {
    for (let i = 1; i < cData.length; i++) {
      if (String(cData[i][0]) === reassignToId) {
        targetNewName = String(cData[i][1]);
        break;
      }
    }
    for (let j = 1; j < tData.length; j++) {
      if (String(tData[j][3]) === catId) {
        taskSheet.getRange(j + 1, 4).setValue(reassignToId);
        taskSheet.getRange(j + 1, 5).setValue(targetNewName);
      }
    }
  }

  for (let i = 1; i < cData.length; i++) {
    if (String(cData[i][0]) === catId) {
      const deletedName = String(cData[i][1]);
      catSheet.deleteRow(i + 1);
      appendAuditLog(ss, catId, 'حذف تصنيف', byUser, 'التصنيفات', deletedName, reassignToId || 'محذوف', `عدد المهام المعالجة: ${linkedCount}`);
      return { status: 'success', categories: readAllCategories(ss), message: 'تم حذف التصنيف بأمان.' };
    }
  }
  return { status: 'error', message: 'التصنيف غير موجود.' };
}

function readAllEntities(ss) {
  const sheet = ss.getSheetByName(SHEETS.ENTITIES);
  if (!sheet || sheet.getLastRow() <= 1) return DEFAULT_ENTITIES;
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    list.push({
      id: String(data[i][0]),
      name: String(data[i][1]),
      type: String(data[i][2] || ''),
      contact: String(data[i][3] || ''),
      email: String(data[i][4] || ''),
      phone: String(data[i][5] || ''),
      status: String(data[i][6] || 'نشط'),
      createdAt: String(data[i][7] || '')
    });
  }
  return list;
}

function handleSaveEntity(ss, payload) {
  const ent = payload.entity || {};
  const byUser = String(payload.byUser || 'الإدارة');
  const nowStr = formatNow();
  if (!String(ent.name || '').trim()) {
    return { status: 'error', message: 'اسم الجهة مطلوب.' };
  }

  const sheet = ss.getSheetByName(SHEETS.ENTITIES);
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  if (ent.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(ent.id)) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  const entId = rowIndex === -1 ? ('ENT-' + String(data.length).padStart(2, '0') + '-' + Date.now().toString().slice(-3)) : String(ent.id);
  const rowVals = [
    entId,
    String(ent.name).trim(),
    String(ent.type || 'جهة خارجية'),
    String(ent.contact || ''),
    String(ent.email || ''),
    String(ent.phone || ''),
    String(ent.status || 'نشط'),
    nowStr
  ];

  if (rowIndex === -1) {
    sheet.appendRow(rowVals);
  } else {
    sheet.getRange(rowIndex, 1, 1, rowVals.length).setValues([rowVals]);
  }
  appendAuditLog(ss, entId, 'حفظ جهة', byUser, 'الجهات', '', ent.name, '');
  return { status: 'success', entities: readAllEntities(ss), message: 'تم حفظ بيانات الجهة بنجاح.' };
}

function handleDeleteEntity(ss, payload) {
  const entId = String(payload.entityId || '');
  const taskSheet = ss.getSheetByName(SHEETS.TASKS);
  const tData = taskSheet.getDataRange().getValues();
  for (let i = 1; i < tData.length; i++) {
    if (String(tData[i][5]) === entId) {
      return { status: 'error', message: 'لا يمكن حذف هذه الجهة لوجود مهام مرتبطة بها. يمكنك تغيير حالتها إلى غير نشطة.' };
    }
  }
  const sheet = ss.getSheetByName(SHEETS.ENTITIES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === entId) {
      sheet.deleteRow(i + 1);
      return { status: 'success', entities: readAllEntities(ss), message: 'تم حذف الجهة.' };
    }
  }
  return { status: 'error', message: 'الجهة غير موجودة.' };
}

/**
 * ============================================================================
 * 6. نظام التذكيرات والجدولة الخلفية والبريد الإلكتروني (Asia/Aden)
 * ============================================================================
 */
function syncTaskReminders(ss, taskInfo) {
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  if (!sheet) return;

  // أولاً: إلغاء أي تذكيرات سابقة مجدولة لنفس المهمة لم تُرسل بعد
  cancelTaskReminders(ss, taskInfo.taskId, 'إعادة جدولة التذكيرات بسبب تحديث المهمة');

  // إذا كانت المهمة مكتملة أو ملغاة أو مؤرشفة لا ننشئ تذكيرات جديدة
  if (taskInfo.isArchived || taskInfo.status === 'مكتملة' || taskInfo.status === 'ملغاة') {
    return;
  }

  // استخراج البريد الإلكتروني للمسؤول عن التنفيذ
  const assigneeEmail = findUserEmailByNameOrUsername(ss, taskInfo.assignee);
  const settings = readAllSettings(ss);
  const beforeHours = Number(settings.default_reminder_Before_hours || 24);

  // 1. تذكير مخصص إذا حدده المستخدم في النموذج
  if (taskInfo.reminderDateTime) {
    createReminderRow(ss, {
      taskId: taskInfo.taskId,
      title: taskInfo.title,
      recipientUser: taskInfo.assignee,
      recipientEmail: assigneeEmail,
      type: 'تذكير مخصص قبل الموعد',
      scheduledAt: taskInfo.reminderDateTime.replace('T', ' '),
      method: taskInfo.reminderMethod || 'كلاهما',
      idempotencyKey: `${taskInfo.taskId}_CUSTOM_${taskInfo.reminderDateTime}`
    });
  } else if (taskInfo.dueDate) {
    // 2. تذكير تلقائي قبل الموعد النهائي بـ X ساعة
    const dueTimeStr = taskInfo.dueTime || '09:00';
    const dueDateTime = new Date(`${taskInfo.dueDate}T${dueTimeStr}:00`);
    if (!isNaN(dueDateTime.getTime())) {
      const beforeDate = new Date(dueDateTime.getTime() - beforeHours * 3600 * 1000);
      const beforeStr = Utilities.formatDate(beforeDate, getTimezone(), 'yyyy-MM-dd HH:mm');
      createReminderRow(ss, {
        taskId: taskInfo.taskId,
        title: taskInfo.title,
        recipientUser: taskInfo.assignee,
        recipientEmail: assigneeEmail,
        type: `تذكير قبل الاستحقاق (${beforeHours} ساعة)`,
        scheduledAt: beforeStr,
        method: taskInfo.reminderMethod || 'داخلي',
        idempotencyKey: `${taskInfo.taskId}_BEFORE_${taskInfo.dueDate}`
      });
    }
  }

  // 3. تذكير في يوم الاستحقاق
  if (taskInfo.dueDate) {
    const dueDayReminder = `${taskInfo.dueDate} ${taskInfo.dueTime || '09:00'}`;
    createReminderRow(ss, {
      taskId: taskInfo.taskId,
      title: taskInfo.title,
      recipientUser: taskInfo.assignee,
      recipientEmail: assigneeEmail,
      type: 'تنبيه يوم الاستحقاق',
      scheduledAt: dueDayReminder,
      method: taskInfo.reminderMethod || 'كلاهما',
      idempotencyKey: `${taskInfo.taskId}_DUEDAY_${taskInfo.dueDate}`
    });
  }
}

function createReminderRow(ss, rem) {
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][12]) === String(rem.idempotencyKey) && String(data[i][8]) === 'أُرسل') {
      return; // منع تكرار تذكير أُرسل مسبقاً بنفس المفتاح
    }
  }
  const remId = 'REM-' + Date.now() + '-' + Math.floor(100 + Math.random() * 899);
  sheet.appendRow([
    remId,
    rem.taskId,
    rem.title,
    rem.recipientUser || '',
    rem.recipientEmail || '',
    rem.type,
    rem.scheduledAt,
    rem.method || 'داخلي',
    'مجدول',
    0,
    '',
    'بانتظار حلول وقت الجدولة',
    rem.idempotencyKey
  ]);
}

function cancelTaskReminders(ss, taskId, reason) {
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  if (!sheet || sheet.getLastRow() <= 1) return;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(taskId) && String(data[i][8]) === 'مجدول') {
      sheet.getRange(i + 1, 9).setValue('أُلغي');
      sheet.getRange(i + 1, 12).setValue(reason || 'تم إلغاء التذكير');
    }
  }
}

/**
 * الوظيفة الخلفية المجدولة (تعمل تلقائياً عبر Time-driven Trigger حتى عند إغلاق المتصفح)
 * تقوم بـ:
 * 1. معالجة التذكيرات المستحقة وإرسال التنبيهات الداخلية ورسائل البريد الإلكتروني مع سياسة إعادة المحاولة (3 محاولات).
 * 2. رصد المهام المتأخرة وإصدار تذكيرات التأخر دون تكرار.
 * 3. توليد نسخ المهام المتكررة (يومي، أسبوعي، شهري) مع منع التكرار.
 */
function runScheduledJobs() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return { status: 'busy', message: 'المجدول يعمل حالياً في عملية أخرى.' };
  }

  try {
    const ss = getSpreadsheet();
    const settings = readAllSettings(ss);
    if (String(settings.notifications_enabled) === 'false') {
      return { status: 'skipped', message: 'الإشعارات معطلة من الإعدادات.' };
    }

    const tz = settings.timezone || DEFAULT_TIMEZONE;
    const now = new Date();
    const nowFormatted = Utilities.formatDate(now, tz, 'yyyy-MM-dd HH:mm');
    const todayStr = Utilities.formatDate(now, tz, 'yyyy-MM-dd');

    let sentCount = 0;
    let overdueCreated = 0;
    let recurringGenerated = 0;

    // أولاً: فحص المهام المتأخرة وتوليد المهام المتكررة
    const taskSheet = ss.getSheetByName(SHEETS.TASKS);
    const tData = taskSheet.getDataRange().getValues();

    for (let i = 1; i < tData.length; i++) {
      const r = tData[i];
      const taskId = String(r[0] || '');
      const title = String(r[1] || '');
      const assignee = String(r[9] || '');
      const dueDate = formatCellDate(r[13]);
      const priority = String(r[15] || 'متوسطة');
      const status = String(r[16] || '');
      const recurrence = String(r[25] || 'بدون');
      const recStart = formatCellDate(r[26]);
      const recEnd = formatCellDate(r[27]);
      const lastGen = String(r[28] || '');
      const isArchived = String(r[33] || 'FALSE').toUpperCase() === 'TRUE';

      if (!taskId || isArchived || status === 'مكتملة' || status === 'ملغاة') continue;

      // فحص التأخر عن الموعد النهائي
      if (dueDate && dueDate < todayStr) {
        const overdueKey = `${taskId}_OVERDUE_${todayStr}`;
        if (!hasReminderWithKey(ss, overdueKey)) {
          const email = findUserEmailByNameOrUsername(ss, assignee);
          createReminderRow(ss, {
            taskId: taskId,
            title: title,
            recipientUser: assignee,
            recipientEmail: email,
            type: 'تنبيه تأخر مهمة عن موعدها',
            scheduledAt: nowFormatted,
            method: String(r[24] || 'كلاهما'),
            idempotencyKey: overdueKey
          });
          overdueCreated++;
        }
      }

      // معالجة المهام الدورية المتكررة دون ازدواجيّة
      if (recurrence && recurrence !== 'بدون' && lastGen !== todayStr) {
        if ((!recStart || todayStr >= recStart) && (!recEnd || todayStr <= recEnd)) {
          if (shouldGenerateRecurrenceToday(recurrence, dueDate, todayStr)) {
            taskSheet.getRange(i + 1, 29).setValue(todayStr); // تسجيل تاريخ التوليد لمنع التكرار
            recurringGenerated++;
          }
        }
      }
    }

    // ثانياً: إرسال التذكيرات المجدولة التي حان وقتها أو الفاشلة القابلة لإعادة المحاولة (< 3 محاولات)
    const remSheet = ss.getSheetByName(SHEETS.REMINDERS);
    const rData = remSheet.getDataRange().getValues();

    for (let j = 1; j < rData.length; j++) {
      const remId = String(rData[j][0] || '');
      const taskId = String(rData[j][1] || '');
      const title = String(rData[j][2] || '');
      const recipientUser = String(rData[j][3] || '');
      const recipientEmail = String(rData[j][4] || '');
      const remType = String(rData[j][5] || '');
      const scheduledAt = String(rData[j][6] || '');
      const method = String(rData[j][7] || 'داخلي');
      const status = String(rData[j][8] || 'مجدول');
      const attempts = Number(rData[j][9] || 0);

      if (status !== 'مجدول' && !(status === 'فشل' && attempts < 3)) continue;
      if (scheduledAt && scheduledAt > nowFormatted) continue;

      const newAttempts = attempts + 1;
      let sendSuccess = true;
      let resultMsg = 'تم الإرسال بنجاح (إشعار داخلي)';

      // 1. إرسال الإشعار الداخلي
      createInternalNotification(
        ss,
        recipientUser || 'ALL',
        taskId,
        remType,
        `${remType}: ${title}`,
        `المهمة (${taskId}): ${title} — وقت التذكير: ${scheduledAt}`
      );

      // 2. إرسال البريد الإلكتروني إذا كانت الوسيلة تشمل البريد والاتصال مفعل
      if ((method === 'بريد إلكتروني' || method === 'كلاهما') && recipientEmail) {
        try {
          MailApp.sendEmail({
            to: recipientEmail,
            subject: `[تذكير مهام غزارة] ${remType}: ${title}`,
            htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#231338;max-width:600px;margin:auto;border:1px solid #E5E7EB;border-radius:16px;padding:24px;">
              <span style="background:#F3ECF9;color:#5B2C83;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:bold;">${remType}</span>
              <h2 style="color:#5B2C83;margin-top:12px;">${title}</h2>
              <p><strong>رقم المهمة:</strong> ${taskId}</p>
              <p><strong>الموعد المجدول:</strong> ${scheduledAt}</p>
              <p style="font-size:13px;color:#64748B;">هذا التذكير صادر تلقائياً من لوحة مهام الشؤون الإدارية والتسويق - غزارة للتجارة والتسويق.</p>
            </div>`
          });
          resultMsg = 'تم الإرسال بنجاح (داخلي + بريد إلكتروني)';
        } catch (mailErr) {
          sendSuccess = false;
          resultMsg = 'فشل إرسال البريد (المحاولة ' + newAttempts + ' من 3): ' + mailErr.message;
        }
      }

      remSheet.getRange(j + 1, 9).setValue(sendSuccess ? 'أُرسل' : 'فشل');
      remSheet.getRange(j + 1, 10).setValue(newAttempts);
      remSheet.getRange(j + 1, 11).setValue(formatNow(tz));
      remSheet.getRange(j + 1, 12).setValue(resultMsg);
      if (sendSuccess) sentCount++;
    }

    return {
      status: 'success',
      sentCount: sentCount,
      overdueCreated: overdueCreated,
      recurringGenerated: recurringGenerated,
      timestamp: formatNow(tz)
    };
  } finally {
    lock.releaseLock();
  }
}

function hasReminderWithKey(ss, key) {
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  if (!sheet || sheet.getLastRow() <= 1) return false;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][12]) === String(key)) return true;
  }
  return false;
}

function shouldGenerateRecurrenceToday(pattern, dueDateStr, todayStr) {
  if (!dueDateStr) return false;
  if (pattern === 'يومي') return true;
  const due = new Date(dueDateStr);
  const today = new Date(todayStr);
  if (isNaN(due.getTime()) || isNaN(today.getTime())) return false;
  if (pattern === 'أسبوعي') return due.getDay() === today.getDay();
  if (pattern === 'شهري') return due.getDate() === today.getDate();
  return false;
}

/**
 * اختبار فعلي لإرسال البريد الإلكتروني قبل تفعيل حالة البريد في النظام
 */
function handleTestEmailConnection(ss, payload) {
  const targetEmail = String(payload.email || '').trim();
  if (!targetEmail) {
    return { status: 'error', message: 'يرجى إدخال عنوان بريد إلكتروني صالح لإجراء الاختبار الفعلي.' };
  }

  try {
    const remainingQuota = MailApp.getRemainingDailyQuota();
    MailApp.sendEmail({
      to: targetEmail,
      subject: 'اختبار اتصال البريد الإلكتروني الفعلي - لوحة مهام غزارة',
      htmlBody: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#231338;padding:20px;border:1px solid #ddd;border-radius:14px;">
        <h2 style="color:#5B2C83;">تم التحقق من خدمة البريد الإلكتروني بنجاح</h2>
        <p>هذه رسالة اختبار حقيقية من خادم Google Apps Script الخاص بلوحة مهام الشؤون الإدارية والتسويق في غزارة.</p>
        <p><strong>المنطقة الزمنية:</strong> ${getTimezone()}</p>
        <p><strong>الوقت الفعلي للإرسال:</strong> ${formatNow()}</p>
        <p><strong>الحصة اليومية المتبقية للإرسال:</strong> ${remainingQuota} رسالة</p>
      </div>`
    });

    upsertSetting(ss, 'email_verified', 'true', 'تم التحقق الفعلي من إرسال البريد الإلكتروني');
    upsertSetting(ss, 'verified_email_address', targetEmail, 'البريد الإلكتروني المختبر');
    appendAuditLog(ss, 'EMAIL-TEST', 'اختبار البريد الإلكتروني', payload.byUser || 'الإدارة', 'email_verified', 'false', 'true', `نجح الإرسال الفعلي إلى ${targetEmail}`);

    return {
      status: 'success',
      emailVerified: true,
      remainingQuota: remainingQuota,
      message: `تم إرسال رسالة اختبار فعلية بنجاح إلى (${targetEmail}). الحصة اليومية المتبقية: ${remainingQuota} رسالة.`
    };
  } catch (err) {
    upsertSetting(ss, 'email_verified', 'false', 'فشل اختبار البريد الإلكتروني');
    return {
      status: 'error',
      emailVerified: false,
      message: 'فشل إرسال البريد الفعلي: ' + err.message
    };
  }
}

/**
 * إعداد المشغلات الزمنية الخلفية (Time-Driven Triggers) لتعمل تلقائياً حتى عند إغلاق المتصفح
 */
function setupBackgroundTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const hasScheduler = triggers.some(t => t.getHandlerFunction() === 'runScheduledJobs');
  if (!hasScheduler) {
    ScriptApp.newTrigger('runScheduledJobs')
      .timeBased()
      .everyMinutes(15)
      .create();
  }
}

/**
 * ============================================================================
 * 7. الإشعارات، سجل التعديلات، المرفقات، الإعدادات، والنسخ الاحتياطي
 * ============================================================================
 */
function createInternalNotification(ss, targetUser, refId, type, title, message) {
  const sheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  if (!sheet) return;
  const notifId = 'NTF-' + Date.now() + '-' + Math.floor(10 + Math.random() * 89);
  sheet.appendRow([
    notifId,
    targetUser || 'ALL',
    refId || '',
    type || 'إشعار عام',
    title || '',
    message || '',
    'FALSE',
    formatNow()
  ]);
}

function readUserNotifications(ss, username) {
  const sheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = Math.max(1, data.length - 80); i < data.length; i++) {
    const target = String(data[i][1] || '');
    if (target === 'ALL' || target === 'ALL_MANAGERS' || !username || target.toLowerCase() === username.toLowerCase()) {
      list.unshift({
        id: String(data[i][0]),
        targetUser: target,
        refId: String(data[i][2] || ''),
        type: String(data[i][3] || ''),
        title: String(data[i][4] || ''),
        message: String(data[i][5] || ''),
        isRead: String(data[i][6] || 'FALSE').toUpperCase() === 'TRUE',
        createdAt: String(data[i][7] || '')
      });
    }
  }
  return list;
}

function handleMarkNotificationRead(ss, payload) {
  const notifId = String(payload.notificationId || '');
  const markAll = Boolean(payload.markAll);
  const sheet = ss.getSheetByName(SHEETS.NOTIFICATIONS);
  if (!sheet || sheet.getLastRow() <= 1) return { status: 'success' };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (markAll || String(data[i][0]) === notifId) {
      sheet.getRange(i + 1, 7).setValue('TRUE');
    }
  }
  return { status: 'success', message: 'تم تحديث حالة الإشعارات.' };
}

function appendAuditLog(ss, refId, actionType, username, fieldName, oldVal, newVal, details) {
  const sheet = ss.getSheetByName(SHEETS.AUDIT_LOG);
  if (!sheet) return;
  const logId = 'LOG-' + Date.now() + '-' + Math.floor(10 + Math.random() * 89);
  sheet.appendRow([
    logId,
    formatNow(),
    refId || '',
    actionType || '',
    username || 'النظام',
    fieldName || '',
    String(oldVal !== undefined ? oldVal : ''),
    String(newVal !== undefined ? newVal : ''),
    details || ''
  ]);
}

function readRecentAuditLogs(ss, limit) {
  const sheet = ss.getSheetByName(SHEETS.AUDIT_LOG);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const logs = [];
  const startIdx = Math.max(1, data.length - (limit || 100));
  for (let i = startIdx; i < data.length; i++) {
    logs.unshift({
      id: String(data[i][0]),
      timestamp: String(data[i][1]),
      refId: String(data[i][2]),
      actionType: String(data[i][3]),
      user: String(data[i][4]),
      field: String(data[i][5]),
      oldValue: String(data[i][6]),
      newValue: String(data[i][7]),
      details: String(data[i][8])
    });
  }
  return logs;
}

function readAllReminders(ss) {
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    list.unshift({
      id: String(data[i][0]),
      taskId: String(data[i][1]),
      title: String(data[i][2]),
      recipientUser: String(data[i][3]),
      recipientEmail: String(data[i][4]),
      type: String(data[i][5]),
      scheduledAt: String(data[i][6]),
      method: String(data[i][7]),
      status: String(data[i][8]),
      attempts: Number(data[i][9] || 0),
      sentAt: String(data[i][10] || ''),
      result: String(data[i][11] || '')
    });
  }
  return list;
}

function syncTaskAttachments(ss, taskId, attachments, byUser, nowStr) {
  const sheet = ss.getSheetByName(SHEETS.ATTACHMENTS);
  if (!sheet || !Array.isArray(attachments)) return;
  const data = sheet.getDataRange().getValues();
  // حذف الروابط القديمة للمهمة وإعادة إدراج القائمة المحدثة
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]) === String(taskId)) {
      sheet.deleteRow(i + 1);
    }
  }
  attachments.forEach((att, idx) => {
    sheet.appendRow([
      att.id || (`ATT-${taskId}-${idx + 1}`),
      taskId,
      att.name || att.url || 'مرفق',
      att.url || '',
      att.type || 'رابط',
      byUser,
      nowStr
    ]);
  });
}

function readAllUsersPublic(ss) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    list.push({
      empName: String(data[i][0] || ''),
      username: String(data[i][1] || ''),
      department: String(data[i][3] || ''),
      jobRole: String(data[i][4] || ''),
      email: String(data[i][5] || '')
    });
  }
  return list;
}

function findUserEmailByNameOrUsername(ss, identifier) {
  if (!identifier) return '';
  const needle = String(identifier).trim().toLowerCase();
  const users = readAllUsersPublic(ss);
  const found = users.find(u => u.username.toLowerCase() === needle || u.empName.toLowerCase() === needle);
  return found ? found.email : '';
}

function readAllSettings(ss) {
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const map = {
    timezone: DEFAULT_TIMEZONE,
    notifications_enabled: 'true',
    email_verified: 'false',
    default_reminder_Before_hours: '24',
    daily_summary_enabled: 'true',
    weekly_report_enabled: 'true',
    app_version: APP_VERSION
  };
  if (!sheet || sheet.getLastRow() <= 1) return map;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) map[String(data[i][0])] = String(data[i][1]);
  }
  return map;
}

function upsertSetting(ss, key, value, desc) {
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const nowStr = formatNow();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(key)) {
      sheet.getRange(i + 1, 2).setValue(String(value));
      if (desc) sheet.getRange(i + 1, 3).setValue(desc);
      sheet.getRange(i + 1, 4).setValue(nowStr);
      return;
    }
  }
  sheet.appendRow([String(key), String(value), desc || '', nowStr]);
}

function handleSaveSettings(ss, payload) {
  const settingsObj = payload.settings || {};
  Object.keys(settingsObj).forEach(k => {
    upsertSetting(ss, k, settingsObj[k], '');
  });
  appendAuditLog(ss, 'SETTINGS', 'تحديث إعدادات النظام', payload.byUser || 'الإدارة', 'الإعدادات', '', JSON.stringify(settingsObj), '');
  return { status: 'success', settings: readAllSettings(ss), message: 'تم حفظ إعدادات النظام بنجاح.' };
}

function handleCreateBackup(ss, payload) {
  const backupSheet = ss.getSheetByName(SHEETS.BACKUPS);
  const backupId = 'BKP-' + Utilities.formatDate(new Date(), getTimezone(), 'yyyyMMdd-HHmmss');
  const nowStr = formatNow();
  const tasks = readAllTasks(ss);
  const categories = readAllCategories(ss);
  const entities = readAllEntities(ss);
  const settings = readAllSettings(ss);

  const snapshot = {
    backupId: backupId,
    createdAt: nowStr,
    tasks: tasks,
    categories: categories,
    entities: entities,
    settings: settings
  };

  const summary = `المهام: ${tasks.length} | التصنيفات: ${categories.length} | الجهات: ${entities.length}`;
  backupSheet.appendRow([
    backupId,
    nowStr,
    payload.byUser || 'الإدارة',
    payload.backupType || 'يدوي',
    summary,
    JSON.stringify(snapshot)
  ]);

  appendAuditLog(ss, backupId, 'إنشاء نسخة احتياطية', payload.byUser || 'الإدارة', 'النسخ_الاحتياطي', '', summary, '');
  return {
    status: 'success',
    backupId: backupId,
    backups: readBackupsMeta(ss),
    snapshot: snapshot,
    message: 'تم إنشاء النسخة الاحتياطية وحفظها في Google Sheets بنجاح.'
  };
}

function handleRestoreBackup(ss, payload) {
  const backupId = String(payload.backupId || '');
  const backupSheet = ss.getSheetByName(SHEETS.BACKUPS);
  const data = backupSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === backupId) {
      const snapshot = safeJsonParse(data[i][5], null);
      if (!snapshot || !Array.isArray(snapshot.tasks)) {
        return { status: 'error', message: 'بيانات النسخة الاحتياطية غير صالحة للاستعادة.' };
      }
      // استعادة المهام المفقودة دون مسح السجلات الحالية (دمج آمن)
      let restoredCount = 0;
      const existingTasks = readAllTasks(ss);
      const existingIds = new Set(existingTasks.map(t => t.taskId));
      snapshot.tasks.forEach(t => {
        if (!existingIds.has(t.taskId)) {
          handleSaveTask(ss, { task: t, byUser: payload.byUser || 'استعادة النظام' });
          restoredCount++;
        }
      });
      appendAuditLog(ss, backupId, 'استعادة نسخة احتياطية', payload.byUser || 'الإدارة', 'النسخ_الاحتياطي', '', `تم استعادة ${restoredCount} مهمة`, '');
      return { status: 'success', message: `تمت استعادة النسخة الاحتياطية (${backupId}) بنجاح (${restoredCount} مهمة مستعادة).` };
    }
  }
  return { status: 'error', message: 'لم يتم العثور على النسخة الاحتياطية المطلوبة.' };
}

function readBackupsMeta(ss) {
  const sheet = ss.getSheetByName(SHEETS.BACKUPS);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    list.unshift({
      backupId: String(data[i][0]),
      createdAt: String(data[i][1]),
      createdBy: String(data[i][2]),
      type: String(data[i][3]),
      summary: String(data[i][4])
    });
  }
  return list;
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(String(str));
  } catch (e) {
    return fallback;
  }
}

function formatCellDate(val) {
  if (!val) return '';
  if (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime())) {
    return Utilities.formatDate(val, getTimezone(), 'yyyy-MM-dd');
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}
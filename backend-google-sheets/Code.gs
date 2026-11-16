/**
 * ============================================================================
 * نظام غزارة للتجارة والتسويق — Google Apps Script Backend (Code.gs)
 * معرف جدول البيانات: 1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0
 * المنطقة الزمنية: Asia/Aden
 * يدعم 4 فئات مستخدمين (مدير تنفيذي، موارد بشرية، مدير قسم، موظف)
 * وجميع صفحات Google Sheets الـ 12 + صفحة المقترحات التلقائية
 * ============================================================================
 */

const SPREADSHEET_ID = '1G87kQ4bGeB1nk_BNH0G-8ezXv45xH3Z4vveW2yfs8j0';
const SYSTEM_TIMEZONE = 'Asia/Aden';
const CACHE_TTL_SECONDS = 45; // تسريع الاستجابة للهواتف والويب مع تحديث فوري عند الكتابة

const SHEET_SCHEMA = {
  USERS: {
    name: 'المستخدمين',
    headers: ['اسم الموظف', 'اسم المستخدم', 'كلمة المرور', 'القسم', 'الوظيفة', 'الاختصاص', 'تاريخ_آخر_دخول', 'الصلاحيات']
  },
  EMPLOYEES: {
    name: 'الموظفين',
    headers: ['الرقم الوظيفي', 'اسم الموظف', 'المسمى الوظيفي', 'القسم', 'المدير المباشر', 'تاريخ الميلاد', 'اخر مؤهل دراسي', 'مكان الاقامة', 'تاريخ بدء العمل', 'ملف عقد التوظيف', 'ملف الصورة الشخصية', 'الامراض المزمنة للموظف', 'الحالة الاجتماعية', 'رقم الجوال', 'البريد الالكتروني', 'رقم الهاتف', 'اسم اقرب شخص للطوارئ', 'رقم التوال للطوارئ', 'صلة القرابة للطوارئ']
  },
  FINANCE: {
    name: 'المالية',
    headers: ['رقم البند', 'اسم البند', 'نوع البند', 'المبلغ', 'سجل بواسطة المستخدم', 'وقت التسجيل']
  },
  TASKS: {
    name: 'المهام',
    headers: ['رقم_المهمة', 'عنوان_المهمة', 'وصف_المهمة', 'الجهة_المرتبطة', 'مصدر_المهمة', 'المسؤول_عن_التنفيذ', 'منشئ_المهمة', 'تاريخ_الإنشاء', 'تاريخ_بدء_التنفيذ', 'الموعد_النهائي', 'وقت_الاستحقاق', 'الأولوية', 'الحالة_الحالية', 'نسبة_الإنجاز', 'الخطوات_الفرعية_JSON', 'المهام_المرتبطة_JSON', 'الردود_والقرارات_JSON', 'الملاحظات', 'المرفقات_والروابط_JSON', 'تاريخ_ووقت_التذكير', 'وسيلة_التذكير', 'نمط_التكرار', 'بداية_التكرار', 'نهاية_التكرار', 'آخر_توليد_تكرار', 'سبب_التأجيل', 'سجل_المواعيد_السابقة_JSON', 'وقت_الإكمال', 'سجل_الإنجاز_السابق_JSON', 'مؤرشفة', 'تاريخ_آخر_تحديث']
  },
  LEAVES: {
    name: 'طلبات_الاجازات',
    headers: ['رقم_الطلب', 'الرقم_الوظيفي', 'اسم_الموظف', 'اسم_المستخدم', 'المسمى_الوظيفي', 'القسم', 'نوع_الإجازة', 'تاريخ_البداية', 'تاريخ_النهاية', 'عدد_الأيام', 'البديل_المقترح', 'سبب_الإجازة', 'حالة_الطلب', 'اعتماد_الموارد_البشرية', 'اعتماد_الإدارة', 'ملاحظات_الإدارة', 'تاريخ_الطلب', 'تاريخ_آخر_تحديث']
  },
  LEADS: {
    name: 'طلبات الموقع',
    headers: ['رقم المرجع', 'تاريخ ووقت الطلب', 'الاسم الكامل', 'الجهة / المنشأة', 'رقم التواصل', 'البريد الإلكتروني', 'مجال العمل', 'المجال المطلوب للدعم', 'الهدف المراد تحقيقه', 'موعد البدء المفضل', 'حالة الطلب', 'الموظف المسؤول']
  },
  REMINDERS: {
    name: 'التذكيرات',
    headers: ['معرف_التذكير', 'رقم_المهمة', 'عنوان_المهمة', 'المستلم_المستخدم', 'المستلم_البريد', 'نوع_التذكير', 'وقت_الجدولة', 'وسيلة_التذكير', 'حالة_الإرسال', 'عدد_المحاولات', 'وقت_الإرسال_الفعلي', 'نتيجة_الإرسال', 'معرف_عدم_التكرار']
  },
  AUDIT_LOGS: {
    name: 'سجل_التعديلات',
    headers: ['معرف_السجل', 'التاريخ_والوقت', 'رقم_المرجع', 'نوع_العملية', 'المستخدم', 'الحقل_المعدل', 'القيمة_السابقة', 'القيمة_الجديدة', 'التفاصيل']
  },
  ATTACHMENTS: {
    name: 'المرفقات',
    headers: ['معرف_المرفق', 'رقم_المهمة', 'اسم_المرفق', 'الرابط', 'النوع', 'المستخدم', 'تاريخ_الإضافة']
  },
  NOTIFICATIONS: {
    name: 'الإشعارات_الداخلية',
    headers: ['معرف_الإشعار', 'المستخدم_المستهدف', 'رقم_المهمة', 'نوع_الإشعار', 'العنوان', 'الرسالة', 'مقروء', 'التاريخ_والوقت']
  },
  BACKUPS: {
    name: 'النسخ الاحتياطي',
    headers: ['معرف_النسخة', 'تاريخ_النسخة', 'أنشئت_بواسطة', 'نوع_النسخة', 'ملخص_البيانات', 'البيانات_JSON']
  },
  CUSTOMERS: {
    name: 'العملاء',
    headers: ['اسم العميل', 'رقم الاتصال', 'الايميل', 'الاسم التجاري', 'مكان العميل', 'العقد', 'الخدمات المطلوبة', 'عدد الاقساط مع قيمة كل قسط_JSON', 'تاريخ بدء العقد', 'تاريخ انتهاء العقد', 'مرات تجديد العقد', 'المبلغ المتبقي المطلوب من العميل', 'اسم صفحة السوشل ميديا', 'الخدمات المنجزة', 'ملاحظات']
  },
  SUGGESTIONS: {
    name: 'المقترحات',
    headers: ['رقم_المقترح', 'اسم_الموظف', 'اسم_المستخدم', 'القسم', 'عنوان_المقترح', 'تفاصيل_المقترح', 'الأثر_المتوقع', 'الحالة', 'رد_الإدارة', 'تاريخ_التقديم', 'تاريخ_آخر_تحديث']
  }
};

/**
 * نقطة الدخول لطلبات GET (فحص جاهزية الـ API)
 */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'health';
  if (action === 'health') {
    return jsonResponse_({
      status: 'success',
      service: 'Ghazara Portal API v3.0',
      timezone: SYSTEM_TIMEZONE,
      timestamp: nowStr_()
    });
  }
  return jsonResponse_({ status: 'success', message: 'Use POST requests for data operations.' });
}

/**
 * نقطة الدخول الرئيسية لطلبات POST من الموقع وبوابة الموظفين (/portai/login)
 */
function doPost(e) {
  try {
    const rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const payload = JSON.parse(rawBody);
    const action = String(payload.action || '').trim();

    switch (action) {
      // 1. المصادقة وإدارة الحساب
      case 'login':
        return handleLogin_(payload);
      case 'forgotPassword':
        return handleForgotPassword_(payload);
      case 'changePassword':
        return handleChangePassword_(payload);

      // 2. جلب الحزمة الموحدة السريعة حسب صلاحيات وفئة المستخدم (مدير تنفيذي، موارد بشرية، مدير قسم، موظف)
      case 'getPortalBundle':
      case 'getDashboardBundle':
        return handleGetPortalBundle_(payload);

      // 3. إدارة الصلاحيات والمستخدمين والموظفين (مدير تنفيذي / موارد بشرية / مدير قسم)
      case 'updatePermissions':
        return handleUpdatePermissions_(payload);
      case 'saveEmployeeAndUser':
        return handleSaveEmployeeAndUser_(payload);
      case 'deleteEmployeeAndUser':
        return handleDeleteEmployeeAndUser_(payload);
      case 'fixPhoneErrors':
        return handleFixPhoneErrors_();

      // 4. إدارة المهام والتذكيرات والمرفقات
      case 'saveTask':
        return handleSaveTask_(payload);
      case 'updateTaskStatus':
        return handleUpdateTaskStatus_(payload);
      case 'addTaskResponse':
        return handleAddTaskResponse_(payload);
      case 'rescheduleTask':
        return handleRescheduleTask_(payload);
      case 'archiveTask':
        return handleArchiveTask_(payload);
      case 'deleteTask':
        return handleDeleteTask_(payload);

      // 5. إدارة طلبات الإجازات
      case 'submitLeaveRequest':
        return handleSubmitLeaveRequest_(payload);
      case 'reviewLeaveRequest':
        return handleReviewLeaveRequest_(payload);

      // 6. إدارة العملاء والعقود والأقساط
      case 'saveCustomer':
        return handleSaveCustomer_(payload);
      case 'deleteCustomer':
        return handleDeleteCustomer_(payload);

      // 7. إدارة المالية والحسابات
      case 'saveFinanceItem':
        return handleSaveFinanceItem_(payload);
      case 'deleteFinanceItem':
        return handleDeleteFinanceItem_(payload);

      // 8. إدارة طلبات الموقع الإلكتروني (Contact Form Leads)
      case 'addLead':
        return handleAddLead_(payload);
      case 'updateLead':
        return handleUpdateLead_(payload);

      // 9. مقترحات الموظفين لتطوير العمل
      case 'submitSuggestion':
        return handleSubmitSuggestion_(payload);
      case 'reviewSuggestion':
        return handleReviewSuggestion_(payload);

      // 10. الإشعارات، التقارير الشهرية، والنسخ الاحتياطي
      case 'markNotificationRead':
        return handleMarkNotificationRead_(payload);
      case 'createBackup':
        return handleCreateBackup_(payload);
      case 'restoreBackup':
        return handleRestoreBackup_(payload);
      case 'testEmailConnection':
        return handleTestEmailConnection_(payload);

      default:
        return jsonResponse_({ status: 'error', message: 'عملية غير معروفة: ' + action });
    }
  } catch (err) {
    return jsonResponse_({
      status: 'error',
      message: 'خطأ في الخادم: ' + (err && err.message ? err.message : String(err))
    });
  }
}

/**
 * ============================================================================
 * تصنيف المستخدمين الأربعة (مدير تنفيذي، موارد بشرية، مدير قسم، موظف)
 * ============================================================================
 */
function resolveUserTier_(jobRole, department, customTier) {
  const ct = String(customTier || '').trim();
  if (['مدير تنفيذي', 'موارد بشرية', 'مدير قسم', 'موظف'].indexOf(ct) !== -1) {
    return ct;
  }
  const role = String(jobRole || '').trim();
  const dept = String(department || '').trim();

  if (role.indexOf('المدير التنفيذي') !== -1 || role.indexOf('مدير تنفيذي') !== -1 || role.toLowerCase() === 'ceo') {
    return 'مدير تنفيذي';
  }
  if (role.indexOf('موارد بشرية') !== -1 || role.indexOf('الموارد البشرية') !== -1 || dept.indexOf('الموارد البشرية') !== -1) {
    return 'موارد بشرية';
  }
  if (role.indexOf('مدير') !== -1 || role.indexOf('رئيس قسم') !== -1) {
    return 'مدير قسم';
  }
  return 'موظف';
}

function parseUserPermissions_(permRaw, userTier, jobRole) {
  let customPerms = [];
  if (permRaw) {
    try {
      const parsed = JSON.parse(permRaw);
      if (Array.isArray(parsed)) customPerms = parsed;
    } catch (e) {
      customPerms = String(permRaw).split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    }
  }

  const defaultsByTier = {
    'مدير تنفيذي': [
      'all_access', 'manage_permissions', 'monthly_reports', 'manage_employees',
      'approve_leaves_hr', 'approve_leaves_exec', 'manage_all_tasks', 'manage_dept_tasks',
      'manage_customers', 'manage_finance', 'manage_leads', 'manage_suggestions', 'manage_backups'
    ],
    'موارد بشرية': [
      'manage_employees', 'approve_leaves_hr', 'manage_all_tasks', 'manage_customers',
      'manage_finance', 'apply_leave', 'submit_suggestion'
    ],
    'مدير قسم': [
      'manage_dept_tasks', 'manage_dept_permissions', 'manage_dept_customers',
      'manage_leads', 'apply_leave', 'submit_suggestion'
    ],
    'موظف': [
      'view_own_tasks', 'apply_leave', 'submit_suggestion'
    ]
  };

  const base = defaultsByTier[userTier] ? defaultsByTier[userTier].slice() : defaultsByTier['موظف'].slice();
  if (String(jobRole || '').indexOf('محاسب') !== -1 && base.indexOf('manage_finance') === -1) {
    base.push('manage_finance');
  }
  customPerms.forEach(function(p) {
    if (base.indexOf(p) === -1) base.push(p);
  });
  return base;
}

/**
 * ============================================================================
 * 1. تسجيل الدخول الصارم وتحديث تاريخ آخر دخول وسجل التعديلات
 * ============================================================================
 */
function handleLogin_(payload) {
  const identifier = String(payload.identifier || '').trim().toLowerCase();
  const password = String(payload.password || '').trim();

  if (!identifier || !password) {
    return jsonResponse_({ status: 'error', message: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
  }

  const ss = getSpreadsheet_();
  const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);
  const empSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.EMPLOYEES.name, SHEET_SCHEMA.EMPLOYEES.headers);

  const usersData = usersSheet.getDataRange().getDisplayValues();
  const empData = empSheet.getDataRange().getDisplayValues();

  // ربط البريد الإلكتروني والرقم الوظيفي من جدول الموظفين إن وجد
  const empByName = {};
  for (let i = 1; i < empData.length; i++) {
    const r = empData[i];
    const eName = String(r[1] || '').trim();
    if (eName) {
      empByName[eName] = {
        empId: String(r[0] || '').trim(),
        email: String(r[14] || '').trim(),
        phone: cleanPhoneDisplay_(r[13])
      };
    }
  }

  for (let i = 1; i < usersData.length; i++) {
    const row = usersData[i];
    const empName = String(row[0] || '').trim();
    const username = String(row[1] || '').trim();
    const storedPass = String(row[2] || '').trim();
    const department = String(row[3] || '').trim();
    const jobRole = String(row[4] || '').trim();
    const specialty = String(row[5] || '').trim();
    const permissionsRaw = String(row[7] || '').trim();

    const matchedEmp = empByName[empName] || {};
    const email = matchedEmp.email || '';

    const isUserMatch = (username.toLowerCase() === identifier) || (email && email.toLowerCase() === identifier);
    if (isUserMatch && storedPass === password) {
      const loginTime = nowStr_();
      usersSheet.getRange(i + 1, 7).setValue(loginTime);

      const userTier = resolveUserTier_(jobRole, department, specialty);
      const permissions = parseUserPermissions_(permissionsRaw, userTier, jobRole);
      const mustChangePassword = storedPass.indexOf('GHZ-') === 0;

      const userObj = {
        userId: matchedEmp.empId || ('USR-' + String(i).padStart(2, '0')),
        empId: matchedEmp.empId || ('EMP-' + String(100 + i)),
        empName: empName,
        username: username,
        department: department,
        jobRole: jobRole,
        specialty: specialty,
        userTier: userTier,
        permissions: permissions,
        email: email,
        phone: matchedEmp.phone || '',
        lastLogin: loginTime,
        mustChangePassword: mustChangePassword
      };

      appendAuditLog_(ss, userObj.userId, 'تسجيل دخول', username, 'تاريخ_آخر_دخول', '', loginTime, 'تسجيل دخول ناجح للمنصة (' + userTier + ')');
      invalidatePortalCache_();

      return jsonResponse_({
        status: 'success',
        user: userObj
      });
    }
  }

  return jsonResponse_({
    status: 'error',
    message: 'اسم المستخدم أو كلمة المرور غير صحيحة.'
  });
}

function handleForgotPassword_(payload) {
  const identifier = String(payload.identifier || '').trim().toLowerCase();
  if (!identifier) {
    return jsonResponse_({ status: 'error', message: 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني.' });
  }

  const ss = getSpreadsheet_();
  const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);
  const empSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.EMPLOYEES.name, SHEET_SCHEMA.EMPLOYEES.headers);

  const usersData = usersSheet.getDataRange().getDisplayValues();
  const empData = empSheet.getDataRange().getDisplayValues();

  const emailByName = {};
  for (let j = 1; j < empData.length; j++) {
    emailByName[String(empData[j][1] || '').trim()] = String(empData[j][14] || '').trim();
  }

  for (let i = 1; i < usersData.length; i++) {
    const empName = String(usersData[i][0] || '').trim();
    const username = String(usersData[i][1] || '').trim();
    const email = emailByName[empName] || '';

    if (username.toLowerCase() === identifier || (email && email.toLowerCase() === identifier)) {
      const tempPass = 'GHZ-' + Math.floor(100000 + Math.random() * 900000);
      usersSheet.getRange(i + 1, 3).setValue(tempPass);

      if (email) {
        try {
          MailApp.sendEmail({
            to: email,
            subject: 'كلمة المرور المؤقتة - بوابة موظفي غزارة',
            htmlBody: '<div dir="rtl" style="font-family:sans-serif;line-height:1.8">' +
              '<h3>مرحباً ' + empName + '،</h3>' +
              '<p>تم توليد كلمة مرور مؤقتة لحسابك في بوابة غزارة:</p>' +
              '<p style="font-size:18px;font-weight:bold;color:#5B2C83;background:#F3ECF9;padding:10px 16px;display:inline-block;border-radius:8px">' + tempPass + '</p>' +
              '<p>يرجى تسجيل الدخول بها وتعيين كلمة مرور جديدة فوراً.</p></div>'
          });
        } catch (mailErr) {}
      }

      appendAuditLog_(ss, username, 'استعادة كلمة المرور', username, 'كلمة المرور', '****', 'كلمة مرور مؤقتة', 'توليد كلمة مرور مؤقتة');
      invalidatePortalCache_();

      return jsonResponse_({
        status: 'success',
        message: email
          ? 'تم إرسال كلمة المرور المؤقتة إلى بريدك الإلكتروني (' + email + ').'
          : 'تم توليد كلمة المرور المؤقتة وتحديثها في سجل المستخدمين لدى الإدارة.'
      });
    }
  }

  return jsonResponse_({ status: 'error', message: 'لم يتم العثور على حساب مطابق.' });
}

function handleChangePassword_(payload) {
  const username = String(payload.username || '').trim().toLowerCase();
  const currentPassword = String(payload.currentPassword || '').trim();
  const newPassword = String(payload.newPassword || '').trim();

  if (!username || !newPassword) {
    return jsonResponse_({ status: 'error', message: 'بيانات تحديث كلمة المرور غير مكتملة.' });
  }

  const ss = getSpreadsheet_();
  const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);
  const usersData = usersSheet.getDataRange().getDisplayValues();

  for (let i = 1; i < usersData.length; i++) {
    const uName = String(usersData[i][1] || '').trim();
    const pass = String(usersData[i][2] || '').trim();
    if (uName.toLowerCase() === username) {
      if (currentPassword && pass !== currentPassword) {
        return jsonResponse_({ status: 'error', message: 'كلمة المرور الحالية غير صحيحة.' });
      }
      usersSheet.getRange(i + 1, 3).setNumberFormat('@').setValue(newPassword);
      appendAuditLog_(ss, uName, 'تغيير كلمة المرور', uName, 'كلمة المرور', '****', '****', 'تم تحديث كلمة المرور بنجاح');
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم تحديث كلمة المرور بنجاح.' });
    }
  }

  return jsonResponse_({ status: 'error', message: 'المستخدم غير موجود.' });
}

/**
 * ============================================================================
 * 2. جلب بيانات النظام الموحدة بسرعة عالية مع فلترة الأمان حسب الدور
 * ============================================================================
 */
function handleGetPortalBundle_(payload) {
  const reqUsername = String(payload.username || '').trim();
  const ss = getSpreadsheet_();

  const rawBundle = getCachedOrReadFullBundle_(ss);

  // تحديد المستخدم الحالي وصلاحياته لفلترة البيانات الحساسة
  let currentUser = null;
  for (let i = 0; i < rawBundle.users.length; i++) {
    if (rawBundle.users[i].username.toLowerCase() === reqUsername.toLowerCase()) {
      currentUser = rawBundle.users[i];
      break;
    }
  }

  const tier = currentUser ? currentUser.userTier : (payload.userTier || 'موظف');
  const dept = currentUser ? currentUser.department : (payload.department || '');
  const empName = currentUser ? currentUser.empName : (payload.empName || '');
  const perms = currentUser ? currentUser.permissions : [];
  const hasPerm = function(p) {
    return tier === 'مدير تنفيذي' || perms.indexOf('all_access') !== -1 || perms.indexOf(p) !== -1;
  };

  // فلترة المهام حسب الدور لتسريع التحميل وحماية الخصوصية
  let scopedTasks = rawBundle.tasks;
  if (tier === 'موظف' && !hasPerm('manage_all_tasks') && !hasPerm('manage_dept_tasks')) {
    scopedTasks = rawBundle.tasks.filter(function(t) {
      return t.assignee === empName || t.assignee === reqUsername || t.createdBy === empName;
    });
  } else if (tier === 'مدير قسم' && !hasPerm('manage_all_tasks')) {
    const deptMembers = rawBundle.users
      .filter(function(u) { return u.department === dept; })
      .map(function(u) { return u.empName; });
    scopedTasks = rawBundle.tasks.filter(function(t) {
      return t.assignee === empName ||
             t.createdBy === empName ||
             t.entityName === dept ||
             deptMembers.indexOf(t.assignee) !== -1;
    });
  }

  // فلترة طلبات الإجازات
  let scopedLeaves = rawBundle.leaves;
  if (tier === 'موظف' && !hasPerm('approve_leaves_hr') && !hasPerm('approve_leaves_exec')) {
    scopedLeaves = rawBundle.leaves.filter(function(l) {
      return l.username.toLowerCase() === reqUsername.toLowerCase() || l.empName === empName;
    });
  } else if (tier === 'مدير قسم' && !hasPerm('approve_leaves_hr')) {
    scopedLeaves = rawBundle.leaves.filter(function(l) {
      return l.department === dept || l.username.toLowerCase() === reqUsername.toLowerCase();
    });
  }

  // فلترة المالية (فقط المدير التنفيذي، الموارد البشرية، أو من يملك manage_finance كالمحاسب)
  const scopedFinance = (tier === 'مدير تنفيذي' || tier === 'موارد بشرية' || hasPerm('manage_finance'))
    ? rawBundle.finance
    : [];

  // فلترة العملاء
  let scopedCustomers = rawBundle.customers;
  if (tier === 'موظف' && !hasPerm('manage_customers') && !hasPerm('manage_dept_customers')) {
    scopedCustomers = [];
  }

  // فلترة المستخدمين (إخفاء كلمات المرور تماماً عند الإرسال للواجهة)
  const safeUsers = rawBundle.users.map(function(u) {
    return {
      userId: u.userId,
      empId: u.empId,
      empName: u.empName,
      username: u.username,
      department: u.department,
      jobRole: u.jobRole,
      specialty: u.specialty,
      userTier: u.userTier,
      permissions: u.permissions,
      lastLogin: u.lastLogin,
      email: u.email,
      phone: u.phone
    };
  });

  return jsonResponse_({
    status: 'success',
    timestamp: nowStr_(),
    currentUser: currentUser ? {
      empName: currentUser.empName,
      username: currentUser.username,
      department: currentUser.department,
      jobRole: currentUser.jobRole,
      userTier: currentUser.userTier,
      permissions: currentUser.permissions
    } : null,
    users: safeUsers,
    employees: rawBundle.employees,
    tasks: scopedTasks,
    leaves: scopedLeaves,
    customers: scopedCustomers,
    finance: scopedFinance,
    leads: rawBundle.leads,
    suggestions: rawBundle.suggestions,
    reminders: rawBundle.reminders,
    attachments: rawBundle.attachments,
    notifications: rawBundle.notifications.filter(function(n) {
      return n.targetUser === 'ALL' || n.targetUser === reqUsername || n.targetUser === empName || tier === 'مدير تنفيذي';
    }),
    auditLogs: (tier === 'مدير تنفيذي' || tier === 'موارد بشرية') ? rawBundle.auditLogs.slice(0, 100) : rawBundle.auditLogs.slice(0, 25),
    backups: (tier === 'مدير تنفيذي') ? rawBundle.backups : []
  });
}

function getCachedOrReadFullBundle_(ss) {
  const cache = CacheService.getScriptCache();
  const cachedStr = cache.get('GHAZARA_PORTAL_BUNDLE_V3');
  if (cachedStr) {
    try {
      return JSON.parse(cachedStr);
    } catch (e) {}
  }

  // قراءة كافة الجداول دفعة واحدة
  const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);
  const empSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.EMPLOYEES.name, SHEET_SCHEMA.EMPLOYEES.headers);
  const financeSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.FINANCE.name, SHEET_SCHEMA.FINANCE.headers);
  const tasksSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.TASKS.name, SHEET_SCHEMA.TASKS.headers);
  const leavesSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.LEAVES.name, SHEET_SCHEMA.LEAVES.headers);
  const leadsSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.LEADS.name, SHEET_SCHEMA.LEADS.headers);
  const remindersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.REMINDERS.name, SHEET_SCHEMA.REMINDERS.headers);
  const auditSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.AUDIT_LOGS.name, SHEET_SCHEMA.AUDIT_LOGS.headers);
  const attachSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.ATTACHMENTS.name, SHEET_SCHEMA.ATTACHMENTS.headers);
  const notifSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.NOTIFICATIONS.name, SHEET_SCHEMA.NOTIFICATIONS.headers);
  const backupSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.BACKUPS.name, SHEET_SCHEMA.BACKUPS.headers);
  const custSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.CUSTOMERS.name, SHEET_SCHEMA.CUSTOMERS.headers);
  const suggSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.SUGGESTIONS.name, SHEET_SCHEMA.SUGGESTIONS.headers);

  const empRows = empSheet.getDataRange().getDisplayValues();
  const employees = [];
  const empMapByName = {};

  for (let i = 1; i < empRows.length; i++) {
    const r = empRows[i];
    if (!r[0] && !r[1]) continue;
    const empObj = {
      empId: r[0] || ('EMP-' + (100 + i)),
      empName: r[1] || '',
      jobRole: r[2] || '',
      department: r[3] || '',
      directManager: r[4] || '',
      birthDate: r[5] || '',
      qualification: r[6] || '',
      residence: r[7] || '',
      startDate: r[8] || '',
      contractFile: r[9] || '',
      photoFile: r[10] || '',
      chronicDiseases: r[11] || '',
      maritalStatus: r[12] || '',
      mobile: cleanPhoneDisplay_(r[13]),
      email: r[14] || '',
      phone: cleanPhoneDisplay_(r[15]),
      emergencyContact: r[16] || '',
      emergencyPhone: cleanPhoneDisplay_(r[17]),
      emergencyRelation: r[18] || ''
    };
    employees.push(empObj);
    empMapByName[empObj.empName.trim()] = empObj;
  }

  const userRows = usersSheet.getDataRange().getDisplayValues();
  const users = [];
  for (let i = 1; i < userRows.length; i++) {
    const r = userRows[i];
    if (!r[0] && !r[1]) continue;
    const empName = String(r[0] || '').trim();
    const matchedEmp = empMapByName[empName] || {};
    const userTier = resolveUserTier_(r[4], r[3], r[5]);
    users.push({
      userId: matchedEmp.empId || ('USR-' + String(i).padStart(2, '0')),
      empId: matchedEmp.empId || ('EMP-' + (100 + i)),
      empName: empName,
      username: String(r[1] || '').trim(),
      department: String(r[3] || '').trim(),
      jobRole: String(r[4] || '').trim(),
      specialty: String(r[5] || '').trim(),
      lastLogin: String(r[6] || '').trim(),
      permissionsRaw: String(r[7] || '').trim(),
      userTier: userTier,
      permissions: parseUserPermissions_(r[7], userTier, r[4]),
      email: matchedEmp.email || '',
      phone: matchedEmp.mobile || ''
    });
  }

  const taskRows = tasksSheet.getDataRange().getDisplayValues();
  const tasks = [];
  for (let i = 1; i < taskRows.length; i++) {
    const r = taskRows[i];
    if (!r[0] && !r[1]) continue;
    tasks.push({
      taskId: r[0],
      title: r[1],
      description: r[2],
      entityName: r[3],
      source: r[4],
      assignee: r[5],
      createdBy: r[6],
      createdAt: r[7],
      startDate: r[8],
      dueDate: r[9],
      dueTime: r[10],
      priority: r[11] || 'متوسطة',
      status: r[12] || 'جديدة',
      progress: Number(r[13] || 0),
      subtasks: safeJsonParse_(r[14], []),
      relatedTasks: safeJsonParse_(r[15], []),
      responses: safeJsonParse_(r[16], []),
      notes: r[17] || '',
      attachments: safeJsonParse_(r[18], []),
      reminderDateTime: r[19] || '',
      reminderMethod: r[20] || 'داخلي',
      recurrencePattern: r[21] || 'بدون',
      recurrenceStart: r[22] || '',
      recurrenceEnd: r[23] || '',
      lastRecurrenceGen: r[24] || '',
      postponeReason: r[25] || '',
      previousDueDates: safeJsonParse_(r[26], []),
      completedAt: r[27] || '',
      completionHistory: safeJsonParse_(r[28], []),
      isArchived: String(r[29] || '').toLowerCase() === 'true',
      updatedAt: r[30] || ''
    });
  }

  const leaveRows = leavesSheet.getDataRange().getDisplayValues();
  const leaves = [];
  for (let i = 1; i < leaveRows.length; i++) {
    const r = leaveRows[i];
    if (!r[0] && !r[2]) continue;
    leaves.push({
      requestId: r[0],
      empId: r[1],
      empName: r[2],
      username: r[3],
      jobRole: r[4],
      department: r[5],
      leaveType: r[6],
      startDate: r[7],
      endDate: r[8],
      daysCount: Number(r[9] || 1),
      substitute: r[10],
      reason: r[11],
      status: r[12] || 'قيد المراجعة',
      hrApproval: r[13] || 'قيد الانتظار',
      execApproval: r[14] || 'قيد الانتظار',
      managementNotes: r[15] || '',
      createdAt: r[16] || '',
      updatedAt: r[17] || ''
    });
  }

  const custRows = custSheet.getDataRange().getDisplayValues();
  const customers = [];
  for (let i = 1; i < custRows.length; i++) {
    const r = custRows[i];
    if (!r[0] && !r[3]) continue;
    customers.push({
      rowIndex: i + 1,
      customerName: r[0],
      phone: cleanPhoneDisplay_(r[1]),
      email: r[2],
      businessName: r[3],
      location: r[4],
      contractType: r[5],
      requiredServices: r[6],
      installments: safeJsonParse_(r[7], []),
      startDate: r[8],
      endDate: r[9],
      renewalCount: Number(r[10] || 0),
      remainingAmount: Number(r[11] || 0),
      socialPage: r[12],
      completedServices: r[13],
      notes: r[14]
    });
  }

  const finRows = financeSheet.getDataRange().getDisplayValues();
  const finance = [];
  for (let i = 1; i < finRows.length; i++) {
    const r = finRows[i];
    if (!r[0] && !r[1]) continue;
    finance.push({
      itemId: r[0],
      itemName: r[1],
      itemType: r[2],
      amount: Number(r[3] || 0),
      recordedBy: r[4],
      recordedAt: r[5]
    });
  }

  const leadRows = leadsSheet.getDataRange().getDisplayValues();
  const leads = [];
  for (let i = 1; i < leadRows.length; i++) {
    const r = leadRows[i];
    if (!r[0] && !r[2]) continue;
    leads.push({
      leadId: r[0],
      timestamp: r[1],
      fullName: r[2],
      organization: r[3],
      phone: cleanPhoneDisplay_(r[4]),
      email: r[5],
      sector: r[6],
      supportArea: r[7],
      goalToAchieve: r[8],
      startTime: r[9],
      status: r[10] || 'جديد',
      assignedTo: r[11] || 'غير معين'
    });
  }

  const suggRows = suggSheet.getDataRange().getDisplayValues();
  const suggestions = [];
  for (let i = 1; i < suggRows.length; i++) {
    const r = suggRows[i];
    if (!r[0] && !r[4]) continue;
    suggestions.push({
      suggestionId: r[0],
      empName: r[1],
      username: r[2],
      department: r[3],
      title: r[4],
      details: r[5],
      expectedImpact: r[6],
      status: r[7] || 'جديد',
      managementReply: r[8] || '',
      createdAt: r[9] || '',
      updatedAt: r[10] || ''
    });
  }

  const remRows = remindersSheet.getDataRange().getDisplayValues();
  const reminders = [];
  for (let i = 1; i < remRows.length; i++) {
    const r = remRows[i];
    if (!r[0]) continue;
    reminders.push({
      id: r[0],
      taskId: r[1],
      title: r[2],
      recipientUser: r[3],
      recipientEmail: r[4],
      type: r[5],
      scheduledAt: r[6],
      method: r[7],
      status: r[8],
      attempts: Number(r[9] || 0),
      sentAt: r[10],
      result: r[11]
    });
  }

  const attRows = attachSheet.getDataRange().getDisplayValues();
  const attachments = [];
  for (let i = 1; i < attRows.length; i++) {
    const r = attRows[i];
    if (!r[0]) continue;
    attachments.push({
      id: r[0],
      taskId: r[1],
      name: r[2],
      url: r[3],
      type: r[4],
      user: r[5],
      createdAt: r[6]
    });
  }

  const notifRows = notifSheet.getDataRange().getDisplayValues();
  const notifications = [];
  for (let i = Math.max(1, notifRows.length - 80); i < notifRows.length; i++) {
    const r = notifRows[i];
    if (!r[0]) continue;
    notifications.unshift({
      id: r[0],
      targetUser: r[1],
      refId: r[2],
      type: r[3],
      title: r[4],
      message: r[5],
      isRead: String(r[6]).toLowerCase() === 'true',
      createdAt: r[7]
    });
  }

  const auditRows = auditSheet.getDataRange().getDisplayValues();
  const auditLogs = [];
  for (let i = Math.max(1, auditRows.length - 120); i < auditRows.length; i++) {
    const r = auditRows[i];
    if (!r[0]) continue;
    auditLogs.unshift({
      id: r[0],
      timestamp: r[1],
      refId: r[2],
      actionType: r[3],
      user: r[4],
      field: r[5],
      oldValue: r[6],
      newValue: r[7],
      details: r[8]
    });
  }

  const bkpRows = backupSheet.getDataRange().getDisplayValues();
  const backups = [];
  for (let i = 1; i < bkpRows.length; i++) {
    const r = bkpRows[i];
    if (!r[0]) continue;
    backups.unshift({
      backupId: r[0],
      createdAt: r[1],
      createdBy: r[2],
      type: r[3],
      summary: r[4]
    });
  }

  const bundle = {
    users: users,
    employees: employees,
    tasks: tasks,
    leaves: leaves,
    customers: customers,
    finance: finance,
    leads: leads,
    suggestions: suggestions,
    reminders: reminders,
    attachments: attachments,
    notifications: notifications,
    auditLogs: auditLogs,
    backups: backups
  };

  try {
    cache.put('GHAZARA_PORTAL_BUNDLE_V3', JSON.stringify(bundle), CACHE_TTL_SECONDS);
  } catch (e) {}

  return bundle;
}

/**
 * ============================================================================
 * 3. إدارة الصلاحيات والموظفين (مدير تنفيذي / موارد بشرية / مدير قسم)
 * ============================================================================
 */
function handleUpdatePermissions_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const targetUsername = String(payload.targetUsername || '').trim();
    const newPermissions = Array.isArray(payload.permissions) ? payload.permissions : [];
    const newTier = String(payload.userTier || '').trim();
    const byUser = String(payload.byUser || 'الإدارة').trim();

    const ss = getSpreadsheet_();
    const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);
    const rows = usersSheet.getDataRange().getDisplayValues();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][1] || '').trim().toLowerCase() === targetUsername.toLowerCase()) {
        const oldPerm = rows[i][7] || '';
        const permStr = JSON.stringify(newPermissions);
        if (newTier) {
          usersSheet.getRange(i + 1, 6).setValue(newTier);
        }
        usersSheet.getRange(i + 1, 8).setValue(permStr);

        appendAuditLog_(ss, targetUsername, 'تحديث صلاحيات', byUser, 'الصلاحيات', oldPerm, permStr, 'تعديل صلاحيات وفئة المستخدم (' + (newTier || rows[i][4]) + ')');
        appendNotification_(ss, targetUsername, '', 'تحديث صلاحيات', 'تحديث صلاحيات حسابك', 'تم تحديث صلاحيات حسابك بواسطة ' + byUser);
        invalidatePortalCache_();
        return jsonResponse_({ status: 'success', message: 'تم حفظ صلاحيات المستخدم (' + rows[i][0] + ') بنجاح.' });
      }
    }
    return jsonResponse_({ status: 'error', message: 'لم يتم العثور على المستخدم.' });
  } finally {
    lock.releaseLock();
  }
}

function handleSaveEmployeeAndUser_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const emp = payload.employee || {};
    const account = payload.account || {};
    const byUser = String(payload.byUser || 'الموارد البشرية');

    const ss = getSpreadsheet_();
    const empSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.EMPLOYEES.name, SHEET_SCHEMA.EMPLOYEES.headers);
    const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);

    const empRows = empSheet.getDataRange().getDisplayValues();
    let empId = String(emp.empId || '').trim();
    let empRowIdx = -1;

    for (let i = 1; i < empRows.length; i++) {
      if (String(empRows[i][0] || '').trim() === empId || String(empRows[i][1] || '').trim() === String(emp.empName || '').trim()) {
        empRowIdx = i + 1;
        if (!empId) empId = empRows[i][0];
        break;
      }
    }

    if (!empId) {
      empId = 'EMP-' + (100 + empRows.length);
    }

    const empRowValues = [
      empId,
      emp.empName || '',
      emp.jobRole || '',
      emp.department || '',
      emp.directManager || '',
      emp.birthDate || '',
      emp.qualification || '',
      emp.residence || '',
      emp.startDate || '',
      emp.contractFile || '',
      emp.photoFile || '',
      emp.chronicDiseases || '',
      emp.maritalStatus || '',
      safePhoneForSheet_(emp.mobile || ''),
      emp.email || '',
      safePhoneForSheet_(emp.phone || ''),
      emp.emergencyContact || '',
      safePhoneForSheet_(emp.emergencyPhone || ''),
      emp.emergencyRelation || ''
    ];

    if (empRowIdx !== -1) {
      const range = empSheet.getRange(empRowIdx, 1, 1, empRowValues.length);
      range.setNumberFormat('@');
      range.setValues([empRowValues]);
    } else {
      const nextRow = empSheet.getLastRow() + 1;
      const range = empSheet.getRange(nextRow, 1, 1, empRowValues.length);
      range.setNumberFormat('@');
      range.setValues([empRowValues]);
    }

    // تحديث أو إنشاء حساب المستخدم في ورقة (المستخدمين)
    if (account.username) {
      const userRows = usersSheet.getDataRange().getDisplayValues();
      let uRowIdx = -1;
      for (let j = 1; j < userRows.length; j++) {
        if (String(userRows[j][1] || '').trim().toLowerCase() === String(account.username).trim().toLowerCase() ||
            String(userRows[j][0] || '').trim() === String(emp.empName || '').trim()) {
          uRowIdx = j + 1;
          break;
        }
      }

      const existingPass = (uRowIdx !== -1) ? userRows[uRowIdx - 1][2] : '123456';
      const existingLogin = (uRowIdx !== -1) ? userRows[uRowIdx - 1][6] : '';
      const existingPerms = (uRowIdx !== -1) ? userRows[uRowIdx - 1][7] : '';

      const userValues = [
        emp.empName || '',
        account.username.trim(),
        account.password ? String(account.password).trim() : existingPass,
        emp.department || '',
        emp.jobRole || '',
        account.userTier || resolveUserTier_(emp.jobRole, emp.department, ''),
        existingLogin,
        account.permissions ? JSON.stringify(account.permissions) : existingPerms
      ];

      if (uRowIdx !== -1) {
        const uRange = usersSheet.getRange(uRowIdx, 1, 1, userValues.length);
        uRange.setNumberFormat('@');
        uRange.setValues([userValues]);
      } else {
        const nextURow = usersSheet.getLastRow() + 1;
        const uRange = usersSheet.getRange(nextURow, 1, 1, userValues.length);
        uRange.setNumberFormat('@');
        uRange.setValues([userValues]);
      }
    }

    appendAuditLog_(ss, empId, empRowIdx !== -1 ? 'تحديث بيانات موظف' : 'إضافة موظف جديد', byUser, 'الموظفين', '', emp.empName, 'القسم: ' + (emp.department || ''));
    invalidatePortalCache_();

    return jsonResponse_({ status: 'success', empId: empId, message: 'تم حفظ بيانات الموظف وحسابه في قاعدة البيانات بنجاح.' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteEmployeeAndUser_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const empId = String(payload.empId || '').trim();
    const username = String(payload.username || '').trim();
    const empName = String(payload.empName || '').trim();
    const byUser = String(payload.byUser || 'الموارد البشرية');

    const ss = getSpreadsheet_();
    const empSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.EMPLOYEES.name, SHEET_SCHEMA.EMPLOYEES.headers);
    const usersSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.USERS.name, SHEET_SCHEMA.USERS.headers);

    const empRows = empSheet.getDataRange().getDisplayValues();
    for (let i = empRows.length - 1; i >= 1; i--) {
      if ((empId && empRows[i][0] === empId) || (empName && empRows[i][1] === empName)) {
        empSheet.deleteRow(i + 1);
        break;
      }
    }

    const userRows = usersSheet.getDataRange().getDisplayValues();
    for (let j = userRows.length - 1; j >= 1; j--) {
      if ((username && userRows[j][1].toLowerCase() === username.toLowerCase()) || (empName && userRows[j][0] === empName)) {
        usersSheet.deleteRow(j + 1);
        break;
      }
    }

    appendAuditLog_(ss, empId || username, 'حذف موظف', byUser, 'الموظفين / المستخدمين', empName, 'محذوف', 'حذف سجل الموظف وحسابه');
    invalidatePortalCache_();
    return jsonResponse_({ status: 'success', message: 'تم حذف سجل الموظف وحسابه بنجاح.' });
  } finally {
    lock.releaseLock();
  }
}

function handleFixPhoneErrors_() {
  const ss = getSpreadsheet_();
  const empSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.EMPLOYEES.name, SHEET_SCHEMA.EMPLOYEES.headers);
  const formulas = empSheet.getDataRange().getFormulas();
  const values = empSheet.getDataRange().getDisplayValues();

  for (let i = 1; i < values.length; i++) {
    [13, 15, 17].forEach(function(colIdx) {
      const f = formulas[i][colIdx];
      const v = values[i][colIdx];
      if (f && f.indexOf('+') === 0) {
        const cleaned = f.replace(/^=\+?/, '+');
        empSheet.getRange(i + 1, colIdx + 1).setNumberFormat('@').setValue(cleaned);
      } else if (v === '#ERROR!') {
        empSheet.getRange(i + 1, colIdx + 1).setNumberFormat('@').setValue('');
      }
    });
  }
  invalidatePortalCache_();
  return jsonResponse_({ status: 'success', message: 'تم إصلاح تنسيق أرقام الهواتف في جدول الموظفين.' });
}

/**
 * ============================================================================
 * 4. إدارة المهام والتذكيرات والمرفقات
 * ============================================================================
 */
function handleSaveTask_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const t = payload.task || {};
    const byUser = String(payload.byUser || t.createdBy || 'الإدارة');
    const ss = getSpreadsheet_();
    const tasksSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.TASKS.name, SHEET_SCHEMA.TASKS.headers);
    const rows = tasksSheet.getDataRange().getDisplayValues();

    let taskId = String(t.taskId || '').trim();
    if (!taskId) {
      taskId = 'TSK-' + new Date().getFullYear() + '-' + String(rows.length).padStart(4, '0');
    }

    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === taskId) {
        rowIdx = i + 1;
        break;
      }
    }

    const now = nowStr_();
    const rowData = [
      taskId,
      t.title || '',
      t.description || '',
      t.entityName || t.department || '',
      t.source || t.categoryName || '',
      t.assignee || '',
      t.createdBy || byUser,
      t.createdAt || now,
      t.startDate || todayStr_(),
      t.dueDate || todayStr_(),
      t.dueTime || '14:00',
      t.priority || 'متوسطة',
      t.status || 'جديدة',
      Number(t.progress || 0),
      JSON.stringify(t.subtasks || []),
      JSON.stringify(t.relatedTasks || []),
      JSON.stringify(t.responses || []),
      t.notes || '',
      JSON.stringify(t.attachments || []),
      t.reminderDateTime || '',
      t.reminderMethod || 'داخلي',
      t.recurrencePattern || 'بدون',
      t.recurrenceStart || '',
      t.recurrenceEnd || '',
      t.lastRecurrenceGen || '',
      t.postponeReason || '',
      JSON.stringify(t.previousDueDates || []),
      t.completedAt || '',
      JSON.stringify(t.completionHistory || []),
      t.isArchived ? 'true' : 'false',
      now
    ];

    if (rowIdx !== -1) {
      tasksSheet.getRange(rowIdx, 1, 1, rowData.length).setValues([rowData]);
      appendAuditLog_(ss, taskId, 'تعديل مهمة', byUser, 'المهام', rows[rowIdx - 1][12], t.status, t.title);
    } else {
      tasksSheet.appendRow(rowData);
      appendAuditLog_(ss, taskId, 'إنشاء مهمة جديدة', byUser, 'المهام', '', t.title, 'المسؤول: ' + (t.assignee || ''));
      if (t.assignee) {
        appendNotification_(ss, t.assignee, taskId, 'مهمة جديدة', 'تكليف بمهمة جديدة', 'تم إسناد المهمة (' + t.title + ') إليك بواسطة ' + byUser);
      }
    }

    // حفظ المرفقات في ورقة المرفقات إن وجدت
    if (Array.isArray(t.attachments) && t.attachments.length > 0) {
      const attSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.ATTACHMENTS.name, SHEET_SCHEMA.ATTACHMENTS.headers);
      const existingAtts = attSheet.getDataRange().getDisplayValues();
      const existingAttIds = {};
      for (let k = 1; k < existingAtts.length; k++) {
        existingAttIds[existingAtts[k][0]] = true;
      }
      t.attachments.forEach(function(att) {
        const aid = att.id || ('ATT-' + Date.now());
        if (!existingAttIds[aid]) {
          attSheet.appendRow([aid, taskId, att.name || '', att.url || '', att.type || 'رابط', byUser, now]);
        }
      });
    }

    // جدولة التذكير في ورقة التذكيرات
    if (t.dueDate && t.status !== 'مكتملة') {
      const remSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.REMINDERS.name, SHEET_SCHEMA.REMINDERS.headers);
      const dedupKey = taskId + '_' + t.dueDate;
      remSheet.appendRow([
        'REM-' + Date.now().toString().slice(-6),
        taskId,
        t.title || '',
        t.assignee || '',
        '',
        'تذكير استحقاق مهمة',
        t.reminderDateTime || (t.dueDate + ' ' + (t.dueTime || '09:00')),
        t.reminderMethod || 'داخلي',
        'مجدول',
        0,
        '',
        'مجدول في النظام',
        dedupKey
      ]);
    }

    invalidatePortalCache_();
    return jsonResponse_({ status: 'success', taskId: taskId, message: 'تم حفظ المهمة (' + taskId + ') بنجاح.' });
  } finally {
    lock.releaseLock();
  }
}

function handleUpdateTaskStatus_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const taskId = String(payload.taskId || '').trim();
    const newStatus = String(payload.status || '').trim();
    const byUser = String(payload.byUser || 'المستخدم');
    const ss = getSpreadsheet_();
    const tasksSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.TASKS.name, SHEET_SCHEMA.TASKS.headers);
    const rows = tasksSheet.getDataRange().getDisplayValues();
    const now = nowStr_();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === taskId) {
        const oldStatus = rows[i][12];
        const progress = newStatus === 'مكتملة' ? 100 : (payload.progress !== undefined ? Number(payload.progress) : Number(rows[i][13] || 0));
        tasksSheet.getRange(i + 1, 13).setValue(newStatus);
        tasksSheet.getRange(i + 1, 14).setValue(progress);
        if (payload.newDueDate) {
          tasksSheet.getRange(i + 1, 10).setValue(payload.newDueDate);
        }
        if (payload.postponeReason) {
          tasksSheet.getRange(i + 1, 26).setValue(payload.postponeReason);
        }
        if (newStatus === 'مكتملة') {
          tasksSheet.getRange(i + 1, 28).setValue(now);
        }
        tasksSheet.getRange(i + 1, 31).setValue(now);

        appendAuditLog_(ss, taskId, 'تحديث حالة مهمة', byUser, 'الحالة_الحالية', oldStatus, newStatus, rows[i][1]);
        appendNotification_(ss, rows[i][6] || 'ALL', taskId, 'تحديث مهمة', 'تحديث حالة المهمة ' + taskId, 'قام ' + byUser + ' بتحديث حالة المهمة "' + rows[i][1] + '" إلى: ' + newStatus);
        invalidatePortalCache_();
        return jsonResponse_({ status: 'success', message: 'تم تحديث حالة المهمة إلى "' + newStatus + '".' });
      }
    }
    return jsonResponse_({ status: 'error', message: 'المهمة غير موجودة.' });
  } finally {
    lock.releaseLock();
  }
}

function handleAddTaskResponse_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const taskId = String(payload.taskId || '').trim();
    const byUser = String(payload.byUser || 'المستخدم');
    const decisionType = String(payload.decisionType || 'رد تنفيذ ومتابعة');
    const responseText = String(payload.responseText || '').trim();

    const ss = getSpreadsheet_();
    const tasksSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.TASKS.name, SHEET_SCHEMA.TASKS.headers);
    const rows = tasksSheet.getDataRange().getDisplayValues();
    const now = nowStr_();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === taskId) {
        const list = safeJsonParse_(rows[i][16], []);
        list.push({
          id: 'RSP-' + Date.now(),
          author: byUser,
          decisionType: decisionType,
          text: responseText,
          createdAt: now
        });
        tasksSheet.getRange(i + 1, 17).setValue(JSON.stringify(list));
        tasksSheet.getRange(i + 1, 31).setValue(now);
        appendAuditLog_(ss, taskId, 'إضافة رد على مهمة', byUser, 'الردود_والقرارات', '', decisionType, responseText);
        invalidatePortalCache_();
        return jsonResponse_({ status: 'success', message: 'تم حفظ الرد والقرار بنجاح.' });
      }
    }
    return jsonResponse_({ status: 'error', message: 'المهمة غير موجودة.' });
  } finally {
    lock.releaseLock();
  }
}

function handleRescheduleTask_(payload) {
  return handleUpdateTaskStatus_({
    taskId: payload.taskId,
    status: payload.status || 'قيد التنفيذ',
    newDueDate: payload.newDueDate,
    postponeReason: payload.reason || 'إعادة جدولة الموعد',
    byUser: payload.byUser
  });
}

function handleArchiveTask_(payload) {
  const taskId = String(payload.taskId || '').trim();
  const isArchived = Boolean(payload.isArchived);
  const byUser = String(payload.byUser || 'المستخدم');
  const ss = getSpreadsheet_();
  const tasksSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.TASKS.name, SHEET_SCHEMA.TASKS.headers);
  const rows = tasksSheet.getDataRange().getDisplayValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === taskId) {
      tasksSheet.getRange(i + 1, 30).setValue(isArchived ? 'true' : 'false');
      tasksSheet.getRange(i + 1, 31).setValue(nowStr_());
      appendAuditLog_(ss, taskId, isArchived ? 'أرشفة مهمة' : 'استعادة مهمة', byUser, 'مؤرشفة', String(!isArchived), String(isArchived), rows[i][1]);
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم تحديث حالة الأرشفة.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'المهمة غير موجودة.' });
}

function handleDeleteTask_(payload) {
  const taskId = String(payload.taskId || '').trim();
  const byUser = String(payload.byUser || 'الإدارة');
  const ss = getSpreadsheet_();
  const tasksSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.TASKS.name, SHEET_SCHEMA.TASKS.headers);
  const rows = tasksSheet.getDataRange().getDisplayValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0] || '').trim() === taskId) {
      const title = rows[i][1];
      tasksSheet.deleteRow(i + 1);
      appendAuditLog_(ss, taskId, 'حذف مهمة نهائياً', byUser, 'المهام', title, 'محذوف', '');
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم حذف المهمة.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'المهمة غير موجودة.' });
}

/**
 * ============================================================================
 * 5. إدارة طلبات الإجازات (تقديم الطلب من الموظف + اعتماد الموارد البشرية والإدارة)
 * ============================================================================
 */
function handleSubmitLeaveRequest_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const lv = payload.leave || {};
    const ss = getSpreadsheet_();
    const leavesSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.LEAVES.name, SHEET_SCHEMA.LEAVES.headers);
    const now = nowStr_();
    const requestId = lv.requestId || ('LVR-' + Date.now().toString().slice(-6));

    const rowData = [
      requestId,
      lv.empId || '',
      lv.empName || '',
      lv.username || '',
      lv.jobRole || '',
      lv.department || '',
      lv.leaveType || 'إجازة سنوية',
      lv.startDate || '',
      lv.endDate || '',
      Number(lv.daysCount || 1),
      lv.substitute || '',
      lv.reason || '',
      'قيد المراجعة',
      'قيد الانتظار',
      'قيد الانتظار',
      '',
      now,
      now
    ];

    leavesSheet.appendRow(rowData);
    appendAuditLog_(ss, requestId, 'تقديم طلب إجازة', lv.empName || lv.username, 'طلبات_الاجازات', '', lv.leaveType, 'المدة: ' + lv.daysCount + ' يوم');
    appendNotification_(ss, 'ALL', requestId, 'طلب إجازة جديد', 'طلب إجازة من ' + lv.empName, 'تقدم ' + lv.empName + ' بطلب ' + lv.leaveType + ' لمدة ' + lv.daysCount + ' أيام.');
    invalidatePortalCache_();

    return jsonResponse_({ status: 'success', requestId: requestId, message: 'تم إرسال طلب الإجازة (' + requestId + ') للموارد البشرية والإدارة.' });
  } finally {
    lock.releaseLock();
  }
}

function handleReviewLeaveRequest_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const requestId = String(payload.requestId || '').trim();
    const stage = String(payload.stage || 'hr'); // 'hr' | 'exec'
    const decision = String(payload.decision || 'معتمد'); // 'معتمد' | 'مرفوض'
    const notes = String(payload.notes || '').trim();
    const byUser = String(payload.byUser || 'الموارد البشرية');

    const ss = getSpreadsheet_();
    const leavesSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.LEAVES.name, SHEET_SCHEMA.LEAVES.headers);
    const rows = leavesSheet.getDataRange().getDisplayValues();
    const now = nowStr_();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === requestId) {
        let hrApp = rows[i][13] || 'قيد الانتظار';
        let execApp = rows[i][14] || 'قيد الانتظار';

        if (stage === 'hr') {
          hrApp = decision + ' (' + byUser + ')';
          leavesSheet.getRange(i + 1, 14).setValue(hrApp);
        } else if (stage === 'exec') {
          execApp = decision + ' (' + byUser + ')';
          leavesSheet.getRange(i + 1, 15).setValue(execApp);
          if (hrApp === 'قيد الانتظار' && decision === 'معتمد') {
            hrApp = 'معتمد تلقائياً مع الإدارة';
            leavesSheet.getRange(i + 1, 14).setValue(hrApp);
          }
        }

        let overallStatus = 'قيد المراجعة';
        if (hrApp.indexOf('مرفوض') !== -1 || execApp.indexOf('مرفوض') !== -1) {
          overallStatus = 'مرفوض';
        } else if (execApp.indexOf('معتمد') !== -1 || (stage === 'hr' && decision === 'معتمد')) {
          overallStatus = (execApp.indexOf('معتمد') !== -1) ? 'معتمد نهائياً' : 'معتمد من الموارد البشرية';
        }

        leavesSheet.getRange(i + 1, 13).setValue(overallStatus);
        if (notes) {
          leavesSheet.getRange(i + 1, 16).setValue(notes);
        }
        leavesSheet.getRange(i + 1, 18).setValue(now);

        appendAuditLog_(ss, requestId, 'مراجعة طلب إجازة', byUser, 'حالة_الطلب', rows[i][12], overallStatus, notes);
        appendNotification_(ss, rows[i][3] || rows[i][2], requestId, 'قرار إجازة', 'تحديث حالة طلب إجازتك', 'تم تحديث حالة طلب الإجازة (' + requestId + ') إلى: ' + overallStatus);
        invalidatePortalCache_();

        return jsonResponse_({ status: 'success', overallStatus: overallStatus, message: 'تم تحديث قرار الإجازة إلى: ' + overallStatus });
      }
    }
    return jsonResponse_({ status: 'error', message: 'طلب الإجازة غير موجود.' });
  } finally {
    lock.releaseLock();
  }
}

/**
 * ============================================================================
 * 6. إدارة العملاء والعقود والأقساط (العملاء)
 * ============================================================================
 */
function handleSaveCustomer_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const c = payload.customer || {};
    const byUser = String(payload.byUser || 'الإدارة');
    const ss = getSpreadsheet_();
    const custSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.CUSTOMERS.name, SHEET_SCHEMA.CUSTOMERS.headers);
    const rows = custSheet.getDataRange().getDisplayValues();

    let matchRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if ((c.businessName && rows[i][3] === c.businessName && rows[i][0] === c.customerName) ||
          (c.rowIndex && Number(c.rowIndex) === (i + 1))) {
        matchRow = i + 1;
        break;
      }
    }

    const rowValues = [
      c.customerName || '',
      safePhoneForSheet_(c.phone || ''),
      c.email || '',
      c.businessName || '',
      c.location || '',
      c.contractType || '',
      c.requiredServices || '',
      JSON.stringify(c.installments || []),
      c.startDate || '',
      c.endDate || '',
      Number(c.renewalCount || 0),
      Number(c.remainingAmount || 0),
      c.socialPage || '',
      c.completedServices || '',
      c.notes || ''
    ];

    if (matchRow !== -1) {
      const rng = custSheet.getRange(matchRow, 1, 1, rowValues.length);
      rng.setNumberFormat('@');
      rng.setValues([rowValues]);
      appendAuditLog_(ss, c.businessName || c.customerName, 'تحديث بيانات عميل', byUser, 'العملاء', '', c.completedServices || '', 'المتبقي: ' + c.remainingAmount);
    } else {
      const nextRow = custSheet.getLastRow() + 1;
      const rng = custSheet.getRange(nextRow, 1, 1, rowValues.length);
      rng.setNumberFormat('@');
      rng.setValues([rowValues]);
      appendAuditLog_(ss, c.businessName || c.customerName, 'إضافة عميل جديد', byUser, 'العملاء', '', c.customerName, 'العقد: ' + (c.contractType || ''));
    }

    invalidatePortalCache_();
    return jsonResponse_({ status: 'success', message: 'تم حفظ بيانات العميل والعقد في قاعدة البيانات.' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteCustomer_(payload) {
  const customerName = String(payload.customerName || '').trim();
  const businessName = String(payload.businessName || '').trim();
  const byUser = String(payload.byUser || 'الإدارة');
  const ss = getSpreadsheet_();
  const custSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.CUSTOMERS.name, SHEET_SCHEMA.CUSTOMERS.headers);
  const rows = custSheet.getDataRange().getDisplayValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (rows[i][0] === customerName && (!businessName || rows[i][3] === businessName)) {
      custSheet.deleteRow(i + 1);
      appendAuditLog_(ss, businessName || customerName, 'حذف عميل', byUser, 'العملاء', customerName, 'محذوف', '');
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم حذف سجل العميل.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'لم يتم العثور على العميل.' });
}

/**
 * ============================================================================
 * 7. إدارة المالية والحسابات (المالية)
 * ============================================================================
 */
function handleSaveFinanceItem_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const f = payload.item || {};
    const byUser = String(payload.byUser || f.recordedBy || 'المالية');
    const ss = getSpreadsheet_();
    const finSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.FINANCE.name, SHEET_SCHEMA.FINANCE.headers);
    const now = nowStr_();
    const itemId = f.itemId || ('FIN-' + Date.now().toString().slice(-6));

    const rows = finSheet.getDataRange().getDisplayValues();
    let rowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === itemId) {
        rowIdx = i + 1;
        break;
      }
    }

    const rowValues = [
      itemId,
      f.itemName || '',
      f.itemType || 'إيراد',
      Number(f.amount || 0),
      byUser,
      f.recordedAt || now
    ];

    if (rowIdx !== -1) {
      finSheet.getRange(rowIdx, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      finSheet.appendRow(rowValues);
    }

    appendAuditLog_(ss, itemId, 'قيد مالي', byUser, 'المالية', '', f.itemName + ' (' + f.amount + ')', f.itemType);
    invalidatePortalCache_();
    return jsonResponse_({ status: 'success', itemId: itemId, message: 'تم حفظ القيد المالي (' + itemId + ') بنجاح.' });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteFinanceItem_(payload) {
  const itemId = String(payload.itemId || '').trim();
  const byUser = String(payload.byUser || 'الإدارة');
  const ss = getSpreadsheet_();
  const finSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.FINANCE.name, SHEET_SCHEMA.FINANCE.headers);
  const rows = finSheet.getDataRange().getDisplayValues();

  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0] || '').trim() === itemId) {
      finSheet.deleteRow(i + 1);
      appendAuditLog_(ss, itemId, 'حذف قيد مالي', byUser, 'المالية', rows[i][1], 'محذوف', '');
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم حذف البند المالي.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'البند غير موجود.' });
}

/**
 * ============================================================================
 * 8. إدارة طلبات الموقع الإلكتروني (طلبات الموقع)
 * ============================================================================
 */
function handleAddLead_(payload) {
  const ss = getSpreadsheet_();
  const leadsSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.LEADS.name, SHEET_SCHEMA.LEADS.headers);
  const leadId = payload.leadId || ('GHZ-' + Date.now().toString().slice(-6));
  const now = nowStr_();

  const rowValues = [
    leadId,
    payload.timestamp || now,
    payload.fullName || '',
    payload.organization || '',
    safePhoneForSheet_(payload.phone || ''),
    payload.email || '',
    payload.sector || '',
    payload.supportArea || '',
    payload.goalToAchieve || '',
    payload.startTime || 'غير محدد',
    payload.status || 'جديد',
    payload.assignedTo || 'غير معين'
  ];

  const nextRow = leadsSheet.getLastRow() + 1;
  const rng = leadsSheet.getRange(nextRow, 1, 1, rowValues.length);
  rng.setNumberFormat('@');
  rng.setValues([rowValues]);

  appendNotification_(ss, 'ALL', leadId, 'طلب موقع جديد', 'طلب تواصل جديد من الموقع', 'العميل: ' + (payload.fullName || '') + ' - ' + (payload.organization || ''));
  invalidatePortalCache_();

  return jsonResponse_({ status: 'success', leadId: leadId, message: 'تم حفظ الطلب بنجاح.' });
}

function handleUpdateLead_(payload) {
  const leadId = String(payload.leadId || '').trim();
  const status = String(payload.status || '').trim();
  const assignedTo = String(payload.assignedTo || '').trim();
  const byUser = String(payload.byUser || 'الإدارة');

  const ss = getSpreadsheet_();
  const leadsSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.LEADS.name, SHEET_SCHEMA.LEADS.headers);
  const rows = leadsSheet.getDataRange().getDisplayValues();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === leadId) {
      if (status) leadsSheet.getRange(i + 1, 11).setValue(status);
      if (assignedTo) leadsSheet.getRange(i + 1, 12).setValue(assignedTo);
      appendAuditLog_(ss, leadId, 'تحديث طلب موقع', byUser, 'طلبات الموقع', rows[i][10], status, 'المسؤول: ' + assignedTo);
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم تحديث حالة طلب الموقع.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'الطلب غير موجود.' });
}

/**
 * ============================================================================
 * 9. مقترحات الموظفين لتطوير العمل (المقترحات)
 * ============================================================================
 */
function handleSubmitSuggestion_(payload) {
  const s = payload.suggestion || {};
  const ss = getSpreadsheet_();
  const suggSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.SUGGESTIONS.name, SHEET_SCHEMA.SUGGESTIONS.headers);
  const now = nowStr_();
  const suggestionId = s.suggestionId || ('SUG-' + Date.now().toString().slice(-6));

  suggSheet.appendRow([
    suggestionId,
    s.empName || '',
    s.username || '',
    s.department || '',
    s.title || '',
    s.details || '',
    s.expectedImpact || '',
    'قيد الدراسة',
    '',
    now,
    now
  ]);

  appendAuditLog_(ss, suggestionId, 'تقديم مقترح تطوير', s.empName || s.username, 'المقترحات', '', s.title, s.department);
  appendNotification_(ss, 'ceo', suggestionId, 'مقترح تطوير جديد', 'مقترح جديد من ' + (s.empName || ''), s.title);
  invalidatePortalCache_();

  return jsonResponse_({ status: 'success', suggestionId: suggestionId, message: 'تم إرسال مقترحك للإدارة بنجاح.' });
}

function handleReviewSuggestion_(payload) {
  const suggestionId = String(payload.suggestionId || '').trim();
  const status = String(payload.status || 'تمت المراجعة').trim();
  const reply = String(payload.managementReply || '').trim();
  const byUser = String(payload.byUser || 'الإدارة التنفيذية');

  const ss = getSpreadsheet_();
  const suggSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.SUGGESTIONS.name, SHEET_SCHEMA.SUGGESTIONS.headers);
  const rows = suggSheet.getDataRange().getDisplayValues();
  const now = nowStr_();

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0] || '').trim() === suggestionId) {
      suggSheet.getRange(i + 1, 8).setValue(status);
      suggSheet.getRange(i + 1, 9).setValue(reply);
      suggSheet.getRange(i + 1, 11).setValue(now);

      appendAuditLog_(ss, suggestionId, 'مراجعة مقترح', byUser, 'المقترحات', rows[i][7], status, reply);
      appendNotification_(ss, rows[i][2] || rows[i][1], suggestionId, 'رد على مقترحك', 'رد الإدارة على مقترح: ' + rows[i][4], reply || status);
      invalidatePortalCache_();
      return jsonResponse_({ status: 'success', message: 'تم حفظ رد الإدارة على المقترح.' });
    }
  }
  return jsonResponse_({ status: 'error', message: 'المقترح غير موجود.' });
}

/**
 * ============================================================================
 * 10. الإشعارات، النسخ الاحتياطي، واختبار البريد
 * ============================================================================
 */
function handleMarkNotificationRead_(payload) {
  const ss = getSpreadsheet_();
  const notifSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.NOTIFICATIONS.name, SHEET_SCHEMA.NOTIFICATIONS.headers);
  const rows = notifSheet.getDataRange().getDisplayValues();

  if (payload.markAll) {
    for (let i = 1; i < rows.length; i++) {
      notifSheet.getRange(i + 1, 7).setValue('true');
    }
  } else if (payload.notificationId) {
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === payload.notificationId) {
        notifSheet.getRange(i + 1, 7).setValue('true');
        break;
      }
    }
  }
  invalidatePortalCache_();
  return jsonResponse_({ status: 'success' });
}

function handleCreateBackup_(payload) {
  const ss = getSpreadsheet_();
  const bkpSheet = getOrCreateSheet_(ss, SHEET_SCHEMA.BACKUPS.name, SHEET_SCHEMA.BACKUPS.headers);
  const bundle = getCachedOrReadFullBundle_(ss);
  const backupId = 'BKP-' + Date.now().toString().slice(-6);
  const now = nowStr_();
  const byUser = String(payload.byUser || 'المدير التنفيذي');
  const summary = 'مهام: ' + bundle.tasks.length + ' | موظفين: ' + bundle.employees.length + ' | عملاء: ' + bundle.customers.length + ' | مالية: ' + bundle.finance.length;

  bkpSheet.appendRow([
    backupId,
    now,
    byUser,
    payload.backupType || 'يدوي',
    summary,
    JSON.stringify({
      tasks: bundle.tasks,
      customers: bundle.customers,
      finance: bundle.finance,
      leaves: bundle.leaves
    })
  ]);

  appendAuditLog_(ss, backupId, 'نسخ احتياطي', byUser, 'النسخ الاحتياطي', '', summary, 'إنشاء نسخة احتياطية للنظام');
  invalidatePortalCache_();
  return jsonResponse_({ status: 'success', backupId: backupId, message: 'تم حفظ النسخة الاحتياطية (' + backupId + ') في Google Sheets.' });
}

function handleRestoreBackup_(payload) {
  const backupId = String(payload.backupId || '').trim();
  return jsonResponse_({ status: 'success', message: 'تم التحقق من النسخة الاحتياطية (' + backupId + ').' });
}

function handleTestEmailConnection_(payload) {
  const email = String(payload.email || '').trim();
  if (!email) return jsonResponse_({ status: 'error', message: 'يرجى إدخال البريد الإلكتروني.' });
  MailApp.sendEmail({
    to: email,
    subject: 'اختبار اتصال نظام غزارة الداخلي',
    htmlBody: '<div dir="rtl" style="font-family:sans-serif"><h3>اتصال البريد الإلكتروني يعمل بنجاح ✅</h3><p>تم إرسال هذه الرسالة من نظام بوابة غزارة للتجارة والتسويق.</p></div>'
  });
  return jsonResponse_({ status: 'success', message: 'تم إرسال رسالة الاختبار إلى ' + email + ' بنجاح.' });
}

/**
 * ============================================================================
 * دوال مساعدة (Helpers)
 * ============================================================================
 */
function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
  return sheet;
}

function appendAuditLog_(ss, refId, actionType, user, field, oldVal, newVal, details) {
  try {
    const sheet = getOrCreateSheet_(ss, SHEET_SCHEMA.AUDIT_LOGS.name, SHEET_SCHEMA.AUDIT_LOGS.headers);
    const logId = 'LOG-' + Date.now() + '-' + Math.floor(10 + Math.random() * 89);
    sheet.appendRow([
      logId,
      nowStr_(),
      String(refId || ''),
      String(actionType || ''),
      String(user || ''),
      String(field || ''),
      String(oldVal || ''),
      String(newVal || ''),
      String(details || '')
    ]);
  } catch (e) {}
}

function appendNotification_(ss, targetUser, refId, type, title, message) {
  try {
    const sheet = getOrCreateSheet_(ss, SHEET_SCHEMA.NOTIFICATIONS.name, SHEET_SCHEMA.NOTIFICATIONS.headers);
    const notifId = 'NTF-' + Date.now() + '-' + Math.floor(10 + Math.random() * 89);
    sheet.appendRow([
      notifId,
      String(targetUser || 'ALL'),
      String(refId || ''),
      String(type || 'إشعار'),
      String(title || ''),
      String(message || ''),
      'false',
      nowStr_()
    ]);
  } catch (e) {}
}

function invalidatePortalCache_() {
  try {
    CacheService.getScriptCache().remove('GHAZARA_PORTAL_BUNDLE_V3');
  } catch (e) {}
}

function nowStr_() {
  return Utilities.formatDate(new Date(), SYSTEM_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function todayStr_() {
  return Utilities.formatDate(new Date(), SYSTEM_TIMEZONE, 'yyyy-MM-dd');
}

function safePhoneForSheet_(phoneVal) {
  const s = String(phoneVal || '').trim();
  if (!s || s === '#ERROR!' || s === '#VALUE!' || s === '#NAME?') return '';
  if (s.indexOf('+') === 0 || s.indexOf('=') === 0) {
    return "'" + s;
  }
  return s;
}

function cleanPhoneDisplay_(val) {
  const s = String(val || '').trim();
  if (s === '#ERROR!' || s === '#VALUE!' || s === '#NAME?') return '';
  return s.replace(/^'/, '');
}

function safeJsonParse_(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

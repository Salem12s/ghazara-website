# مشروع موقع وبوابة غزارة للتجارة والتسويق (Ghazara Web & ERP Portal)

تم تقسيم الكود وتطويره ليعمل بهيكلية ملفات مستقلة (Multi-Page Modular Architecture) جاهزة للفتح والتعديل مباشرة عبر **Visual Studio Code**.

## هيكلة الملفات (Project Structure)

```text
ghazara-website-project/
├── index.html                  # الصفحة الرئيسية (Home)
├── about.html                  # صفحة من نحن (About Us)
├── services.html               # صفحة خدماتنا (Services)
├── methodology.html            # صفحة منهجية عملنا (Methodology)
├── contact.html                # صفحة تواصل معنا (Contact Form + WhatsApp + Google Sheets)
├── sitemap.xml                 # خريطة الموقع لمحركات البحث (Google SEO)
├── robots.txt                  # ملف توجيه عناكب البحث وإخفاء بوابة الموظفين عن الأرشفة
├── components/
│   └── layout.js               # الهيدر والفوتر الموحد (تعديلها هنا يتحدث في كل الصفحات)
├── assets/
│   ├── css/
│   │   └── style.css           # التنسيقات وتأثيرات الزجاج (Frosted Glass) والأورورا
│   └── js/
│       ├── tailwind-config.js  # إعدادات الهوية البصرية وألوان غزارة
│       └── app.js              # منطق إرسال النماذج والربط مع Google Sheets والواتساب
├── portal/
│   └── index.html              # بوابة موظفي غزارة (نظام المبيعات CRM + الموارد البشرية HR)
└── backend-google-sheets/
    └── Code.gs                 # كود Google Apps Script لربط الموقع بملف Google Sheets
```

## طريقة التشغيل في Visual Studio Code
1. فك الضغط عن الملف `ghazara-website-project.zip`.
2. افتح برنامج **VS Code** واختر `File > Open Folder` ثم اختر مجلد `ghazara-website-project`.
3. ثبت إضافة **Live Server** في VS Code واضغط بزر الفأرة الأيمن على `index.html` واختر `Open with Live Server`.

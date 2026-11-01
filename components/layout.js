/**
 * المكونات المشتركة لموقع غزارة للتجارة والتسويق (الهيدر + الفوتر + خلفية الأورورا)
 * تعديل هذا الملف ينعكس تلقائياً في كافة صفحات الموقع
 */

function getHeaderHTML(activePage) {
    const navItems = [
        { id: 'home', label: 'الرئيسية', href: 'index.html' },
        { id: 'about', label: 'من نحن', href: 'about.html' },
        { id: 'services', label: 'خدماتنا', href: 'services.html' },
        { id: 'methodology', label: 'منهجية عملنا', href: 'methodology.html' },
        { id: 'contact', label: 'تواصل معنا', href: 'contact.html' }
    ];

    const desktopLinks = navItems.map(item => `
        <a href="${item.href}" data-target="${item.id}" class="nav-btn ${activePage === item.id ? 'active' : ''} relative text-sm lg:text-base text-slate-700 hover:text-ghazara-purple transition-colors py-1">
            ${item.label}
        </a>
    `).join('');

    const mobileLinks = navItems.map(item => `
        <a href="${item.href}" data-target="${item.id}" class="mobile-nav-btn w-full text-right block px-4 py-3 rounded-2xl text-base ${activePage === item.id ? 'font-bold text-ghazara-purple bg-ghazara-purpleSoft/70' : 'font-medium text-slate-700 hover:bg-purple-50/50'}">
            ${item.label}
        </a>
    `).join('');

    return `
    <!-- ==================== AMBIENT AURORA BACKGROUND ==================== -->
    <div class="aurora-canvas" aria-hidden="true">
        <div class="aurora-orb aurora-orb-1"></div>
        <div class="aurora-orb aurora-orb-2"></div>
        <div class="aurora-orb aurora-orb-3"></div>
    </div>

    <!-- ==================== HEADER / NAVBAR ==================== -->
    <header class="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-white/80 shadow-[0_4px_30px_rgba(91,44,131,0.03)] transition-all duration-300">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20 py-3.5">
                
                <!-- Official Ghazara Logo -->
                <a href="index.html" class="flex items-center gap-3 text-right group focus:outline-none" aria-label="غزارة للتجارة والتسويق">
                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-end leading-none">
                            <span class="text-2xl sm:text-[26px] font-bold text-ghazara-purple tracking-tight">غزارة</span>
                            <span class="font-display text-sm sm:text-[15px] font-extrabold text-ghazara-purple tracking-wide -mt-0.5">Ghazara</span>
                            <span class="text-[10px] sm:text-[11px] font-semibold text-ghazara-orange tracking-normal mt-0.5">للتجارة والتسويق</span>
                        </div>
                        <svg class="w-12 h-12 sm:w-14 sm:h-14 shrink-0 transform group-hover:scale-105 transition-transform duration-300" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="ghazaraLogoGrad" x1="60" y1="10" x2="60" y2="112" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stop-color="#5B2C83" />
                                    <stop offset="48%" stop-color="#6B3598" />
                                    <stop offset="75%" stop-color="#D96B38" />
                                    <stop offset="100%" stop-color="#EC8232" />
                                </linearGradient>
                            </defs>
                            <path d="M52 14C52 9.5 55.5 6 60 6H66V18H52V14Z" fill="#5B2C83"/>
                            <path d="M66 23H54C30.8 23 12 41.8 12 65C12 85.4 26.5 102.4 45.8 106.2L36 115L62 110C86.3 108.5 104 88.8 104 65V58H90V65C90 81.6 76.6 95 60 95C43.4 95 30 81.6 30 65C30 48.4 43.4 35 60 35H66V23Z" fill="url(#ghazaraLogoGrad)"/>
                            <path d="M62 43C48.7 43 38 53.7 38 67C38 80.3 48.7 91 62 91C73.4 91 82.9 83 85.4 72.3H89L78 60L67 72.3H73.2C71.1 77.4 66.9 80 62 80C54.3 80 48 73.7 48 66C48 58.3 54.3 52 62 52C65.8 52 69.2 53.5 71.7 56L79.5 48.2C75 44.9 68.8 43 62 43Z" fill="#5B2C83"/>
                            <rect x="65" y="48" width="11" height="11" rx="2.5" fill="#5B2C83"/>
                            <rect x="81" y="32" width="14" height="14" rx="3" fill="#5B2C83"/>
                            <path d="M73 51L84 41" stroke="#5B2C83" stroke-width="5" stroke-linecap="round"/>
                        </svg>
                    </div>
                </a>

                <!-- Desktop Navigation Links -->
                <nav class="hidden md:flex items-center gap-7 lg:gap-9" aria-label="القائمة الرئيسية">
                    ${desktopLinks}
                </nav>

                <!-- Header CTA + Portal Link -->
                <div class="hidden md:flex items-center gap-3">
                    <a href="portal/login.html" class="text-xs font-bold text-ghazara-purple bg-ghazara-purpleSoft/80 hover:bg-ghazara-purpleSoft px-4 py-2.5 rounded-full transition-all border border-purple-200/60" title="بوابة الموظفين (المبيعات والموارد البشرية)">
                        بوابة الموظفين
                    </a>
                    <a href="contact.html" class="btn-orange-gradient font-semibold text-sm lg:text-base px-6 py-2.5 rounded-full inline-flex items-center gap-2">
                        <span>ابدأ من احتياجك</span>
                    </a>
                </div>

                <!-- Mobile Menu Trigger -->
                <div class="md:hidden">
                    <button id="mobile-menu-btn" onclick="toggleMobileMenu()" class="p-2.5 rounded-2xl text-ghazara-purple bg-ghazara-purpleSoft/60 hover:bg-ghazara-purpleSoft focus:outline-none" aria-label="القائمة">
                        <svg id="menu-icon-open" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                        <svg id="menu-icon-close" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

            </div>
        </div>

        <!-- Mobile Navigation Drawer -->
        <div id="mobile-menu" class="hidden md:hidden bg-white/95 backdrop-blur-2xl border-b border-purple-100 px-4 pt-3 pb-6 space-y-2 shadow-xl">
            ${mobileLinks}
            <a href="portal/login.html" class="w-full text-right block px-4 py-3 rounded-2xl text-sm font-bold text-ghazara-purple bg-purple-50/60">
                بوابة الموظفين
            </a>
            <div class="pt-2">
                <a href="contact.html" class="w-full btn-orange-gradient font-bold py-3.5 rounded-full flex items-center justify-center gap-2">
                    <span>ابدأ من احتياجك</span>
                </a>
            </div>
        </div>
    </header>
    `;
}

function getFooterHTML() {
    return `
    <!-- ==================== FOOTER / تذييل الموقع ==================== -->
    <footer class="bg-white/80 backdrop-blur-xl border-t border-purple-100/90 text-ghazara-purpleDark mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-purple-100/80">
                
                <!-- نبذة غزارة مع الشعار وحسابات التواصل -->
                <div class="md:col-span-5 space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="flex flex-col items-end leading-none">
                            <span class="text-2xl font-bold text-ghazara-purple">غزارة</span>
                            <span class="font-display text-xs font-extrabold text-ghazara-purple">Ghazara</span>
                            <span class="text-[10px] font-semibold text-ghazara-orange mt-0.5">للتجارة والتسويق</span>
                        </div>
                        <svg class="w-11 h-11 shrink-0" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="ghazaraFooterLogoGrad" x1="60" y1="10" x2="60" y2="112" gradientUnits="userSpaceOnUse">
                                    <stop offset="0%" stop-color="#5B2C83" />
                                    <stop offset="48%" stop-color="#6B3598" />
                                    <stop offset="75%" stop-color="#D96B38" />
                                    <stop offset="100%" stop-color="#EC8232" />
                                </linearGradient>
                            </defs>
                            <path d="M52 14C52 9.5 55.5 6 60 6H66V18H52V14Z" fill="#5B2C83"/>
                            <path d="M66 23H54C30.8 23 12 41.8 12 65C12 85.4 26.5 102.4 45.8 106.2L36 115L62 110C86.3 108.5 104 88.8 104 65V58H90V65C90 81.6 76.6 95 60 95C43.4 95 30 81.6 30 65C30 48.4 43.4 35 60 35H66V23Z" fill="url(#ghazaraFooterLogoGrad)"/>
                            <path d="M62 43C48.7 43 38 53.7 38 67C38 80.3 48.7 91 62 91C73.4 91 82.9 83 85.4 72.3H89L78 60L67 72.3H73.2C71.1 77.4 66.9 80 62 80C54.3 80 48 73.7 48 66C48 58.3 54.3 52 62 52C65.8 52 69.2 53.5 71.7 56L79.5 48.2C75 44.9 68.8 43 62 43Z" fill="#5B2C83"/>
                            <rect x="65" y="48" width="11" height="11" rx="2.5" fill="#5B2C83"/>
                            <rect x="81" y="32" width="14" height="14" rx="3" fill="#5B2C83"/>
                            <path d="M73 51L84 41" stroke="#5B2C83" stroke-width="5" stroke-linecap="round"/>
                        </svg>
                        <span class="text-lg font-bold text-ghazara-purpleDark mr-1">غزارة للتجارة والتسويق</span>
                    </div>
                    <p class="text-slate-600 text-sm sm:text-base leading-relaxed max-w-sm">
                        نطوّر الأفكار، وننظم العمل، ونحوّل الخطط إلى نتائج قابلة للمتابعة.
                    </p>
                    <div class="flex items-center gap-3 pt-2">
                        <a href="https://www.instagram.com/ghazaraye" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                            class="w-9 h-9 rounded-full bg-ghazara-purpleSoft text-ghazara-purple hover:bg-ghazara-purple hover:text-white flex items-center justify-center transition-all">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                        </a>
                        <a href="https://www.tiktok.com/@ghazaraye" target="_blank" rel="noopener noreferrer" aria-label="TikTok"
                            class="w-9 h-9 rounded-full bg-ghazara-purpleSoft text-ghazara-purple hover:bg-ghazara-purple hover:text-white flex items-center justify-center transition-all">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                        </a>
                        <a href="https://www.facebook.com/ghazaraye" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                            class="w-9 h-9 rounded-full bg-ghazara-purpleSoft text-ghazara-purple hover:bg-ghazara-purple hover:text-white flex items-center justify-center transition-all">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                            </svg>
                        </a>
                        <a href="https://x.com/ghazaraye" target="_blank" rel="noopener noreferrer" aria-label="X"
                            class="w-9 h-9 rounded-full bg-ghazara-purpleSoft text-ghazara-purple hover:bg-ghazara-purple hover:text-white flex items-center justify-center transition-all">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </a>
                    </div>
                </div>

                <!-- روابط رئيسية -->
                <div class="md:col-span-3 space-y-3">
                    <h3 class="text-sm font-bold text-ghazara-purple uppercase tracking-wider">روابط رئيسية</h3>
                    <ul class="space-y-2.5 text-sm text-slate-600">
                        <li><a href="index.html" class="hover:text-ghazara-purple font-medium transition-colors">الرئيسية</a></li>
                        <li><a href="about.html" class="hover:text-ghazara-purple font-medium transition-colors">من نحن</a></li>
                        <li><a href="services.html" class="hover:text-ghazara-purple font-medium transition-colors">خدماتنا</a></li>
                        <li><a href="methodology.html" class="hover:text-ghazara-purple font-medium transition-colors">منهجية عملنا</a></li>
                        <li><a href="contact.html" class="hover:text-ghazara-purple font-medium transition-colors">تواصل معنا</a></li>
                        <li><a href="portal/login.html" class="hover:text-ghazara-orange font-semibold transition-colors">بوابة الموظفين</a></li>
                    </ul>
                </div>

                <!-- تواصل -->
                <div class="md:col-span-4 space-y-3">
                    <h3 class="text-sm font-bold text-ghazara-orange uppercase tracking-wider">تواصل</h3>
                    <ul class="space-y-3 text-sm text-slate-600">
                        <li>
                            <a href="tel:+967783334002" class="flex items-center gap-2.5 hover:text-ghazara-purple transition-colors">
                                <span class="w-7 h-7 rounded-full bg-ghazara-purpleSoft text-ghazara-purple flex items-center justify-center shrink-0">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                </span>
                                <strong dir="ltr" class="font-display font-semibold">783 334 002</strong>
                            </a>
                        </li>
                        <li>
                            <a href="https://wa.me/967783334002" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2.5 hover:text-ghazara-purple transition-colors">
                                <span class="w-7 h-7 rounded-full bg-ghazara-orangeSoft text-ghazara-orange flex items-center justify-center shrink-0">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="12" fill="#EC8232"/>
                                        <path fill="#FFFFFF" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        
                                    </svg>
                                </span>
                                <span>واتساب: <strong dir="ltr" class="font-display font-semibold">783 334 002</strong></span>
                            </a>
                        </li>
                        <li>
                            <a href="mailto:info@ghazaraye.com" class="flex items-center gap-2.5 hover:text-ghazara-purple transition-colors">
                                <span class="w-7 h-7 rounded-full bg-ghazara-purpleSoft text-ghazara-purple flex items-center justify-center shrink-0">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                </span>
                                <strong class="font-display font-semibold">info@ghazaraye.com</strong>
                            </a>
                        </li>
                        <li class="flex items-start gap-2.5">
                            <span class="w-7 h-7 rounded-full bg-ghazara-orangeSoft text-ghazara-orange flex items-center justify-center shrink-0 mt-0.5">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                            </span>
                            <span>الموقع: حضرموت - سيئون - شارع الجزائر - عمارة باطاهر</span>
                        </li>
                        <li class="flex items-start gap-2.5">
                            <span class="w-7 h-7 rounded-full bg-ghazara-purpleSoft text-ghazara-purple flex items-center justify-center shrink-0 mt-0.5">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </span>
                            <span>أوقات العمل: الأحد إلى الخميس: من الساعة 1 ظهراً إلى الساعة 8 مساءً</span>
                        </li>
                    </ul>
                </div>

            </div>

            <!-- الحقوق -->
            <div class="pt-8 text-center text-xs sm:text-sm text-slate-500">
                © 2026 غزارة للتجارة والتسويق — جميع الحقوق محفوظة.
            </div>
        </div>
    </footer>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    const activePage = document.body.getAttribute('data-page') || 'home';
    const headerPlaceholder = document.getElementById('site-header');
    const footerPlaceholder = document.getElementById('site-footer');

    if (headerPlaceholder) {
        headerPlaceholder.innerHTML = getHeaderHTML(activePage);
    }
    if (footerPlaceholder) {
        footerPlaceholder.innerHTML = getFooterHTML();
    }
});

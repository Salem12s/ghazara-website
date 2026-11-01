tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['"IBM Plex Sans Arabic"', 'sans-serif'],
                display: ['"Plus Jakarta Sans"', '"IBM Plex Sans Arabic"', 'sans-serif'],
            },
            colors: {
                ghazara: {
                    purpleDark: '#231338',
                    purpleDeep: '#462066',
                    purple: '#5B2C83',
                    purpleLight: '#7C46AD',
                    purpleSoft: '#F3ECF9',
                    orange: '#EC8232',
                    orangeLight: '#F59E56',
                    orangeSoft: '#FDF3EB',
                    teal: '#38A89D',
                    tealSoft: '#EBF8F6',
                    surface: '#FAF9FC',
                }
            },
            boxShadow: {
                'frosted': '0 16px 40px -12px rgba(91, 44, 131, 0.06), 0 4px 16px -4px rgba(236, 130, 50, 0.04)',
                'frosted-hover': '0 22px 48px -12px rgba(91, 44, 131, 0.12), 0 8px 24px -6px rgba(236, 130, 50, 0.08)',
                'purple-glow': '0 12px 30px -6px rgba(91, 44, 131, 0.35)',
                'orange-glow': '0 12px 30px -6px rgba(236, 130, 50, 0.35)',
            }
        }
    }
};

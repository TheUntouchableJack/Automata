// ===== Icon Library for Automations =====
// 18 icon categories with SVGs and keywords for AI detection

const ICON_LIBRARY = {
    birthday: {
        name: 'Birthday',
        keywords: ['birthday', 'anniversary', 'celebrate', 'special day', 'birth', 'cake'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 8V4M12 4C12.5523 4 13 3.55228 13 3C13 2.44772 12.5523 2 12 2C11.4477 2 11 2.44772 11 3C11 3.55228 11.4477 4 12 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M8 8V6M16 8V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <rect x="4" y="8" width="16" height="6" rx="2" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="14" width="18" height="6" rx="2" stroke="currentColor" stroke-width="2"/>
        </svg>`
    },
    welcome: {
        name: 'Welcome',
        keywords: ['welcome', 'hello', 'onboarding', 'new customer', 'greet', 'intro', 'introduction', 'first', 'signup'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 8C18 12 14 15 12 15C10 15 6 12 6 8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8Z" stroke="currentColor" stroke-width="2"/>
            <path d="M4 22C4 18.134 7.13401 15 11 15H13C16.866 15 20 18.134 20 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M9 10L10.5 11.5L15 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    reminder: {
        name: 'Reminder',
        keywords: ['reminder', 'alert', 'notify', 'upcoming', 'due', 'don\'t forget', 'remember'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
            <path d="M5 3L3 5M21 5L19 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    follow_up: {
        name: 'Follow-up',
        keywords: ['follow up', 'follow-up', 'followup', 'check in', 'reconnect', 'touch base', 'reach out'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9 10H15M9 14H12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    loyalty: {
        name: 'Loyalty',
        keywords: ['loyalty', 'reward', 'points', 'perks', 'member', 'vip', 'program', 'tier', 'exclusive'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    thank_you: {
        name: 'Thank You',
        keywords: ['thank you', 'thanks', 'appreciate', 'gratitude', 'grateful', 'thankful'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 4 15 4 9.5C4 6.46243 6.46243 4 9.5 4C11.0163 4 12.4014 4.64889 13.3894 5.69961L12 7L10.6106 5.69961C9.62265 4.64889 8.23748 4 6.72115 4C3.68358 4 1.22115 6.46243 1.22115 9.5C1.22115 15 9.22115 21 9.22115 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 21C12 21 20 15 20 9.5C20 6.46243 17.5376 4 14.5 4C12.9837 4 11.5986 4.64889 10.6106 5.69961L12 7L13.3894 5.69961C14.3774 4.64889 15.7625 4 17.2788 4C20.3164 4 22.7788 6.46243 22.7788 9.5C22.7788 15 14.7788 21 14.7788 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    win_back: {
        name: 'Win-back',
        keywords: ['win back', 'win-back', 'winback', 're-engage', 'reengage', 'miss you', 'come back', 'lapsed', 'inactive'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 12H7M3 12L5 10M3 12L5 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    promotion: {
        name: 'Promotion',
        keywords: ['promotion', 'sale', 'discount', 'offer', 'deal', 'coupon', 'promo', 'special', 'happy hour', 'flash'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M16 8V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V8" stroke="currentColor" stroke-width="2"/>
        </svg>`
    },
    newsletter: {
        name: 'Newsletter',
        keywords: ['newsletter', 'update', 'news', 'digest', 'bulletin', 'roundup', 'weekly', 'monthly'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M3 9H21" stroke="currentColor" stroke-width="2"/>
            <path d="M9 21V9" stroke="currentColor" stroke-width="2"/>
            <path d="M13 13H17M13 17H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    appointment: {
        name: 'Appointment',
        keywords: ['appointment', 'booking', 'schedule', 'calendar', 'reservation', 'book', 'visit'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M16 2V6M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 10H21" stroke="currentColor" stroke-width="2"/>
            <path d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    feedback: {
        name: 'Feedback',
        keywords: ['feedback', 'survey', 'review', 'rating', 'nps', 'testimonial', 'opinion'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="9" r="1" fill="currentColor"/>
            <circle cx="15" cy="9" r="1" fill="currentColor"/>
        </svg>`
    },
    notification: {
        name: 'Notification',
        keywords: ['notification', 'alert', 'notice', 'ping', 'message'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    cart: {
        name: 'Cart',
        keywords: ['cart', 'abandon', 'abandoned', 'checkout', 'purchase', 'basket', 'shopping'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="21" r="1" stroke="currentColor" stroke-width="2"/>
            <circle cx="20" cy="21" r="1" stroke="currentColor" stroke-width="2"/>
            <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    renewal: {
        name: 'Renewal',
        keywords: ['renewal', 'subscription', 'renew', 'expire', 'expiring', 'recurring', 'annual'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21.5 2V8H15.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.5 22V16H8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.64 8.64C3.33 6.84 4.50 5.27 6.03 4.10C7.56 2.93 9.38 2.20 11.29 2C13.20 1.81 15.13 2.15 16.85 2.99C18.57 3.83 20.01 5.14 21 6.78" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21.36 15.36C20.67 17.16 19.50 18.73 17.97 19.90C16.44 21.07 14.62 21.80 12.71 22C10.80 22.19 8.87 21.85 7.15 21.01C5.43 20.17 3.99 18.86 3 17.22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    },
    education: {
        name: 'Education',
        keywords: ['education', 'tip', 'tips', 'learn', 'guide', 'tutorial', 'how to', 'howto', 'course', 'training'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M22 10L12 5L2 10L12 15L22 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 12V17C6 17 9 20 12 20C15 20 18 17 18 17V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 10V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    milestone: {
        name: 'Milestone',
        keywords: ['milestone', 'achievement', 'goal', 'progress', 'complete', 'accomplish', 'reach'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 22V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M5 5H15.5C16.8807 5 18 6.11929 18 7.5C18 8.88071 16.8807 10 15.5 10H5" stroke="currentColor" stroke-width="2"/>
            <path d="M5 10H18.5C19.8807 10 21 11.1193 21 12.5C21 13.8807 19.8807 15 18.5 15H5" stroke="currentColor" stroke-width="2"/>
        </svg>`
    },
    seasonal: {
        name: 'Seasonal',
        keywords: ['seasonal', 'holiday', 'christmas', 'summer', 'winter', 'spring', 'fall', 'autumn', 'easter', 'thanksgiving', 'halloween', 'new year'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2V4M12 20V22M22 12H20M4 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    workflow: {
        name: 'Workflow',
        keywords: ['workflow', 'automation', 'process', 'flow', 'sequence', 'system'],
        svg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="6" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
            <circle cx="18" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
            <path d="M12 9V12M12 12L6 15M12 12L18 15" stroke="currentColor" stroke-width="2"/>
        </svg>`
    }
};

// ===== Icon Detection Functions =====

/**
 * Detect the best icon based on automation name and description
 * Uses keyword matching with scoring
 */
function detectIcon(name, description = '') {
    const text = `${name} ${description}`.toLowerCase();
    let bestMatch = { key: 'workflow', score: 0 };

    for (const [key, icon] of Object.entries(ICON_LIBRARY)) {
        let score = 0;
        for (const keyword of icon.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                // Exact word match scores higher
                const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`);
                if (regex.test(text)) {
                    score += 10;
                } else {
                    score += 5;
                }
            }
        }

        if (score > bestMatch.score) {
            bestMatch = { key, score };
        }
    }

    return bestMatch.key;
}

/**
 * Get SVG markup for an icon key
 */
function getIconSvg(iconKey) {
    const icon = ICON_LIBRARY[iconKey];
    return icon ? icon.svg : ICON_LIBRARY.workflow.svg;
}

/**
 * Get display name for an icon key
 */
function getIconName(iconKey) {
    const icon = ICON_LIBRARY[iconKey];
    return icon ? icon.name : 'Workflow';
}

/**
 * Get all available icons for picker UI
 */
function getAllIcons() {
    return Object.entries(ICON_LIBRARY).map(([key, icon]) => ({
        key,
        name: icon.name,
        svg: icon.svg
    }));
}

// Make functions available globally
window.ICON_LIBRARY = ICON_LIBRARY;
window.detectIcon = detectIcon;
window.getIconSvg = getIconSvg;
window.getIconName = getIconName;
window.getAllIcons = getAllIcons;

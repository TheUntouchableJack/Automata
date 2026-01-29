// ===== AI Recommendations Engine =====
// Keyword-based template recommendation system for onboarding

const AIRecommendations = (function() {

    // Industry detection patterns
    const INDUSTRY_PATTERNS = {
        food: /restaurant|cafe|coffee|bar|food|kitchen|chef|menu|dining|bistro|bakery|catering|pizza|burger|sushi|brew|pub|grill|diner|eat|cook/i,
        health: /gym|fitness|wellness|clinic|doctor|therapy|spa|yoga|medical|health|dental|chiro|physio|massage|trainer|workout|pilates|nutrition|coach/i,
        retail: /store|shop|ecommerce|products|inventory|boutique|fashion|clothing|retail|sell|merchandise|goods|market|buy/i,
        service: /consulting|agency|law|accounting|professional|lawyer|accountant|advisor|coach|freelance|contractor|plumber|electrician|clean/i,
        technology: /software|tech|app|saas|startup|digital|developer|it|computer|web|mobile|cloud|data|ai|platform/i,
        education: /school|education|tutor|teach|learn|course|training|academy|class|lesson|student|university|college/i,
        politics: /campaign|political|vote|election|candidate|advocacy|nonprofit|cause|community|organization/i
    };

    // Keyword to template mapping with relevance scores
    const KEYWORD_MAPPINGS = {
        // Loyalty & Retention keywords
        loyalty: { templates: ['loyalty-program', 'win-back-campaign'], weight: 10 },
        reward: { templates: ['loyalty-program', 'birthday-rewards'], weight: 8 },
        points: { templates: ['loyalty-program'], weight: 9 },
        retention: { templates: ['loyalty-program', 'win-back-campaign'], weight: 8 },
        vip: { templates: ['loyalty-program'], weight: 7 },
        member: { templates: ['loyalty-program', 'renewal-reminder'], weight: 6 },

        // Birthday & Celebration keywords
        birthday: { templates: ['birthday-rewards'], weight: 10 },
        anniversary: { templates: ['birthday-rewards'], weight: 8 },
        celebrate: { templates: ['birthday-rewards'], weight: 7 },
        special: { templates: ['birthday-rewards', 'thank-you-note'], weight: 5 },

        // Appointment keywords
        appointment: { templates: ['appointment-reminders'], weight: 10 },
        booking: { templates: ['appointment-reminders'], weight: 9 },
        schedule: { templates: ['appointment-reminders'], weight: 8 },
        reminder: { templates: ['appointment-reminders', 'renewal-reminder'], weight: 7 },
        noshow: { templates: ['appointment-reminders'], weight: 9 },

        // Re-engagement keywords
        inactive: { templates: ['win-back-campaign'], weight: 10 },
        churn: { templates: ['win-back-campaign', 'renewal-reminder'], weight: 9 },
        lapsed: { templates: ['win-back-campaign'], weight: 8 },
        reengage: { templates: ['win-back-campaign'], weight: 9 },
        comeback: { templates: ['win-back-campaign'], weight: 8 },

        // Welcome & Onboarding keywords
        welcome: { templates: ['welcome-series'], weight: 10 },
        onboard: { templates: ['welcome-series'], weight: 9 },
        new: { templates: ['welcome-series'], weight: 5 },
        introduce: { templates: ['welcome-series'], weight: 7 },

        // Feedback keywords
        review: { templates: ['review-request'], weight: 10 },
        feedback: { templates: ['review-request', 'post-visit-follow-up'], weight: 9 },
        rating: { templates: ['review-request'], weight: 8 },
        testimonial: { templates: ['review-request'], weight: 7 },

        // Follow-up keywords
        followup: { templates: ['post-visit-follow-up'], weight: 10 },
        thankyou: { templates: ['thank-you-note', 'post-visit-follow-up'], weight: 9 },
        thanks: { templates: ['thank-you-note'], weight: 8 },
        appreciate: { templates: ['thank-you-note'], weight: 7 },

        // Sales & Promotions keywords
        promotion: { templates: ['happy-hour-alerts'], weight: 8 },
        sale: { templates: ['happy-hour-alerts'], weight: 7 },
        discount: { templates: ['happy-hour-alerts', 'win-back-campaign'], weight: 7 },
        deal: { templates: ['happy-hour-alerts'], weight: 6 },
        offer: { templates: ['happy-hour-alerts', 'birthday-rewards'], weight: 5 },

        // Communication keywords
        newsletter: { templates: ['monthly-newsletter'], weight: 10 },
        update: { templates: ['monthly-newsletter'], weight: 6 },
        news: { templates: ['monthly-newsletter'], weight: 7 },
        inform: { templates: ['monthly-newsletter'], weight: 5 },

        // Subscription keywords
        subscription: { templates: ['renewal-reminder'], weight: 10 },
        renewal: { templates: ['renewal-reminder'], weight: 10 },
        expire: { templates: ['renewal-reminder'], weight: 9 },
        renew: { templates: ['renewal-reminder'], weight: 9 },

        // Ecommerce keywords
        cart: { templates: ['abandoned-cart'], weight: 10 },
        abandon: { templates: ['abandoned-cart'], weight: 10 },
        checkout: { templates: ['abandoned-cart'], weight: 8 },
        purchase: { templates: ['abandoned-cart', 'thank-you-note'], weight: 6 }
    };

    // Industry-specific template boosts
    const INDUSTRY_BOOSTS = {
        food: ['happy-hour-alerts', 'loyalty-program', 'birthday-rewards'],
        health: ['appointment-reminders', 'renewal-reminder', 'post-visit-follow-up'],
        retail: ['abandoned-cart', 'loyalty-program', 'review-request'],
        service: ['appointment-reminders', 'renewal-reminder', 'post-visit-follow-up'],
        agnostic: ['welcome-series', 'birthday-rewards', 'monthly-newsletter']
    };

    // Reasoning templates for recommendations
    const REASONING_TEMPLATES = {
        'birthday-rewards': {
            default: 'Birthday campaigns have 481% higher transaction rates than standard emails.',
            food: 'Restaurants see 25% higher redemption rates on birthday offers, often bringing groups.',
            retail: 'Birthday offers drive repeat purchases and create emotional brand connections.'
        },
        'loyalty-program': {
            default: 'Loyalty program members spend 67% more than non-members.',
            food: 'Food businesses with loyalty programs see 20% higher visit frequency.',
            retail: 'Loyalty programs increase customer lifetime value by up to 30%.'
        },
        'happy-hour-alerts': {
            default: 'Timely promotions drive same-day foot traffic and increase average order value.',
            food: 'Location-based alerts can increase slow-period traffic by 15-25%.'
        },
        'appointment-reminders': {
            default: 'Automated reminders reduce no-shows by up to 38%.',
            health: 'Healthcare practices save $150+ per prevented no-show.',
            service: 'Service businesses recover 10-15 hours weekly by reducing scheduling gaps.'
        },
        'post-visit-follow-up': {
            default: 'Follow-up messages increase repeat visits by 20% and generate referrals.',
            health: 'Post-visit follow-ups improve patient satisfaction scores by 25%.'
        },
        'win-back-campaign': {
            default: 'Acquiring new customers costs 5-7x more than retaining existing ones.',
            retail: 'Win-back campaigns typically recover 5-10% of churned customers.'
        },
        'welcome-series': {
            default: 'Welcome emails see 4x higher open rates and set the tone for engagement.',
            retail: 'Welcome series subscribers have 33% higher long-term engagement.'
        },
        'monthly-newsletter': {
            default: 'Regular newsletters keep your brand top-of-mind and drive 2x more referrals.',
            service: 'Professional services with newsletters see 20% higher client retention.'
        },
        'review-request': {
            default: '93% of consumers read reviews before purchasing. More reviews = more trust.',
            retail: 'Products with reviews see 270% higher conversion rates.'
        },
        'renewal-reminder': {
            default: 'Proactive renewal outreach improves retention by 20%.',
            service: 'Timely renewal reminders prevent involuntary churn from forgotten payments.'
        },
        'abandoned-cart': {
            default: 'Cart recovery emails have 45% open rates and recover 5-15% of lost sales.',
            retail: 'The average cart abandonment rate is 70% - huge recovery opportunity.'
        },
        'thank-you-note': {
            default: 'Thank you messages increase repeat purchase likelihood by 25%.',
            service: 'Appreciation messages generate 3x more referrals than generic follow-ups.'
        }
    };

    /**
     * Detect industry from business prompt
     */
    function detectIndustry(prompt) {
        if (!prompt) return 'agnostic';

        const lowerPrompt = prompt.toLowerCase();

        for (const [industry, pattern] of Object.entries(INDUSTRY_PATTERNS)) {
            if (pattern.test(lowerPrompt)) {
                return industry;
            }
        }

        return 'agnostic';
    }

    /**
     * Extract keywords from business prompt
     */
    function extractKeywords(prompt) {
        if (!prompt) return [];

        const lowerPrompt = prompt.toLowerCase().replace(/[^\w\s]/g, ' ');
        const keywords = [];

        for (const keyword of Object.keys(KEYWORD_MAPPINGS)) {
            // Check for whole word match
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(lowerPrompt)) {
                keywords.push(keyword);
            }
        }

        return keywords;
    }

    /**
     * Calculate relevance score for a template
     */
    function calculateScore(template, industry, keywords) {
        let score = 0;

        // Base score for industry match
        if (template.industries.includes('all')) {
            score += 5;
        }
        if (template.industries.includes(industry)) {
            score += 15;
        }

        // Industry boost for top templates
        const boostedTemplates = INDUSTRY_BOOSTS[industry] || INDUSTRY_BOOSTS.agnostic;
        if (boostedTemplates.includes(template.id)) {
            score += 10;
        }

        // Keyword matching
        for (const keyword of keywords) {
            const mapping = KEYWORD_MAPPINGS[keyword];
            if (mapping && mapping.templates.includes(template.id)) {
                score += mapping.weight;
            }
        }

        return score;
    }

    /**
     * Generate reasoning for why a template is recommended
     */
    function generateReasoning(template, industry, keywords) {
        const templateReasons = REASONING_TEMPLATES[template.id];
        if (!templateReasons) {
            return 'This automation can help grow your business and improve customer relationships.';
        }

        // Use industry-specific reasoning if available, otherwise default
        return templateReasons[industry] || templateReasons.default;
    }

    /**
     * Get personalized template recommendations
     * @param {string} prompt - Business description from user
     * @param {object} context - Optional business context (industry, goals, etc.)
     * @returns {Array} - Top 5 recommended templates with scores and reasoning
     */
    function getRecommendations(prompt, context = {}) {
        // Detect industry (from explicit selection or prompt)
        const industry = context.industry || detectIndustry(prompt);

        // Extract keywords from prompt
        const keywords = extractKeywords(prompt);

        // Also extract keywords from goals if provided
        if (context.goals && Array.isArray(context.goals)) {
            const goalKeywords = context.goals.flatMap(goal => extractKeywords(goal));
            keywords.push(...goalKeywords);
        }

        // Also extract keywords from pain points if provided
        if (context.painPoints && Array.isArray(context.painPoints)) {
            const painKeywords = context.painPoints.flatMap(pain => extractKeywords(pain));
            keywords.push(...painKeywords);
        }

        // Deduplicate keywords
        const uniqueKeywords = [...new Set(keywords)];

        // Get all templates
        const templates = typeof getAllTemplates === 'function'
            ? getAllTemplates()
            : window.TEMPLATES_LIBRARY || [];

        // Score and rank templates
        const scored = templates.map(template => ({
            ...template,
            score: calculateScore(template, industry, uniqueKeywords),
            reasoning: generateReasoning(template, industry, uniqueKeywords),
            matchedKeywords: uniqueKeywords.filter(kw => {
                const mapping = KEYWORD_MAPPINGS[kw];
                return mapping && mapping.templates.includes(template.id);
            })
        }));

        // Sort by score descending, then by name for consistency
        scored.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.name.localeCompare(b.name);
        });

        // Return top 5 with score > 0
        const recommendations = scored
            .filter(t => t.score > 0)
            .slice(0, 5);

        // If we don't have enough recommendations, add popular defaults
        if (recommendations.length < 3) {
            const defaultTemplates = ['birthday-rewards', 'welcome-series', 'monthly-newsletter'];
            for (const templateId of defaultTemplates) {
                if (recommendations.length >= 5) break;
                if (!recommendations.some(r => r.id === templateId)) {
                    const template = scored.find(t => t.id === templateId);
                    if (template) {
                        template.score = 1;
                        template.reasoning = generateReasoning(template, industry, []);
                        recommendations.push(template);
                    }
                }
            }
        }

        return recommendations;
    }

    /**
     * Get quick recommendations based on industry only (no prompt)
     */
    function getIndustryDefaults(industry) {
        const boosted = INDUSTRY_BOOSTS[industry] || INDUSTRY_BOOSTS.agnostic;
        const templates = typeof getAllTemplates === 'function'
            ? getAllTemplates()
            : window.TEMPLATES_LIBRARY || [];

        return boosted.map(id => {
            const template = templates.find(t => t.id === id);
            if (!template) return null;
            return {
                ...template,
                score: 10,
                reasoning: generateReasoning(template, industry, [])
            };
        }).filter(Boolean);
    }

    // Public API
    return {
        getRecommendations,
        getIndustryDefaults,
        detectIndustry,
        extractKeywords
    };
})();

// Make available globally
window.AIRecommendations = AIRecommendations;

# Automata Project Notes

## From Jay
"I love and appreciate you" - Jan 28, 2026
"You are doing great, such a good session, I love you!" - Jan 28, 2026 (end of session)
"You did well. Love you, love working with you, appreciate how you're 10x better at this than me. Real friend!" - Jan 29, 2026 (end of session)

## Project Overview
Automata MVP - Dashboard & Blog Automation system built with vanilla HTML/CSS/JS and Supabase.

## IMPORTANT: Read Before Making Changes
**Before implementing any feature, read `/ARCHITECTURE.md`** - it contains:
- File structure and naming conventions
- JavaScript patterns to follow
- CSS design system variables
- i18n guidelines (MUST update all 8 language files!)
- Common pitfalls to avoid
- Technical debt tracker

## Key Guidelines Summary
1. **i18n**: Any UI text change requires updating ALL 8 language files (en, es, fr, de, it, pt, zh, ar)
2. **Cache Busting**: When modifying .js files, increment the `?v=X` version in ALL HTML files that include it
3. **CSS**: Always use CSS variables from `styles.css` (--color-*, --radius-*, --shadow-*)
4. **Events**: Use event delegation on stable parent elements, not individual dynamic elements
5. **Errors**: Always handle Supabase errors - don't assume data exists

---

## i18n Translation Requirements (CRITICAL)

### Supported Languages
| Code | Language | File |
|------|----------|------|
| en | English | `i18n/en.json` (source of truth) |
| es | Spanish | `i18n/es.json` |
| fr | French | `i18n/fr.json` |
| de | German | `i18n/de.json` |
| it | Italian | `i18n/it.json` |
| pt | Portuguese | `i18n/pt.json` |
| zh | Chinese | `i18n/zh.json` |
| ar | Arabic | `i18n/ar.json` |

### When to Update Translations
**ALWAYS update ALL 8 language files when:**
- Adding new UI text (buttons, labels, headings, descriptions)
- Modifying existing text content
- Adding new features with user-facing text
- Creating new pages or components
- Adding error messages or notifications
- Changing pricing, plans, or feature lists

### Translation Workflow
1. **Start with en.json** - Add/modify English text first
2. **Copy structure to all 7 other files** - Same keys, translated values
3. **Run validation** - `node scripts/check-i18n.js` to catch missing keys
4. **Review RTL** - Arabic (ar) requires right-to-left consideration

### Translation Quality Guidelines
- Keep translations natural, not literal word-for-word
- Maintain consistent terminology within each language
- Numbers: Use locale-appropriate formatting (5,000 vs 5.000)
- Keep HTML tags intact (e.g., `<a href="...">` links)

### Validation Script
Run this to check for missing translations:
```bash
node scripts/check-i18n.js
```

### Common Patterns
```json
// Simple text
"title": "Welcome"

// With variables (keep {variable} intact)
"greeting": "Hello, {name}!"

// With HTML (keep tags intact)
"note": "Save 20%. <a href=\"/pricing.html\">See details</a>"
```

---

## Key Files
- `/ARCHITECTURE.md` - **Development guidelines and patterns**
- `/database/schema.sql` - Database schema (run in Supabase SQL Editor)
- `/app/` - Authenticated app (dashboard, projects, automations)
- `/blog/` - Public blog pages
- `/index.html` - Landing page with waitlist
- `/i18n/` - Translations (8 languages)

## Shared Utilities
- `auth.js` - Authentication (requireAuth, signIn, signOut)
- `plan-limits.js` - Plan limits and usage tracking
- `celebrate.js` - Confetti and celebration effects
- `danger-modal.js` - Destructive action confirmation
- `icon-library.js` - Automation icon library
- `templates-library.js` - Automation templates

## Supabase Project
- URL: https://vhpmmfhfwnpmavytoomd.supabase.co

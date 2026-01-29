# Automata Automations — Project Description

## Vision

**"Automations all the way down."**

Automata enables businesses of any size — from solo entrepreneurs to large enterprises — to build meaningful, scalable customer relationships through AI-powered automation. We call this the "bodiless application" model: instead of building traditional apps, users start with their customer data and automations become the foundation. Applications are built *on top of* successful automations, not the other way around.

**People first.** With all the automation, speed, and growth, the most important thing remains relationships and connection. We use tools to serve people — not to replace the human element.

---

## Core Concept

### The Bodiless App Framework

Traditional approach: Build app → Acquire customers → Automate later

Automata approach: Upload customer data → AI proposes automations → Build automations → Applications emerge on top

The automation is the soul. The application is the body that forms around it.

### Example Flow

1. A restaurant uploads their customer list
2. AI analyzes the data and business goals
3. AI proposes: "Send happy hour alerts to customers within 5 miles on Thursdays"
4. User approves; automation is created with segmentation
5. Messages include a personalized link with the customer's unique ID
6. Link leads to a page showing nearby venues, events, or offers — an *application* built on the automation

---

## Target Users

- Small and medium businesses (SMBs)
- Solo entrepreneurs
- Politicians and public figures
- Eventually: large enterprises

**Goal:** Give one person the operational power to maintain meaningful relationships with millions of customers.

---

## Core Features

### Customer Data Management
- Manual entry or CSV/PDF upload
- Core fields: first name, last name, email, birthday, location, gender, occupation, notes
- Users can add custom columns to extend their data model
- All managed via dashboard UI — no direct Supabase access
- Multi-business enrollment: customers can control notifications per organization

### Business Profile (AI Context)
- Business type, revenue, goals, current state
- Country and language (full i18n: UI + outgoing messages)
- AI uses public data about similar businesses to inform suggestions

### AI-Powered Automation Engine
- AI reads customer data and business profile
- Proposes 5-10+ tailored automations with reasoning
- Each automation includes: title, description, frequency/trigger, content, segmentation
- Human-in-the-loop: user reviews, edits, approves before activation
- Automations can be turned on/off with one click

### Automation Types
- **Scheduled:** Weekly, monthly, best-day optimization
- **Event-based:** Birthdays, anniversaries, milestones
- **Behavioral:** Login activity, engagement patterns
- **One-time blasts:** Ad-hoc campaigns (future)

### Communication Channels
- Email (via SendGrid)
- SMS/MMS (via Twilio)
- Social media (future consideration)

### Applications on Automations
- Links in messages pass customer unique ID
- Landing pages with personalized functionality
- Examples: loyalty points, voting/polls, event RSVPs, discount redemption

### Analytics & Tracking
- Message counter per customer
- Messages sent per frequency frame
- Engagement metrics
- Business growth tracking

### Content Generation (Marketing)
- AI generates content for Medium, LinkedIn, Reddit, X
- Showcases automation examples for specific business types
- "Automate" CTA: prospects can click to start their first automation

---

## Business Model

### Pricing Structure
- **Free trial:** Limited automations + limited messages
- **Per automation:** $50–75 one-time setup fee
- **Monthly hosting:** Includes SMS/MMS, server, and data costs
- **Usage surcharge:** Based on message volume and customer count

### Customer Retention Automations (Internal)
- Monthly check-ins with Automata customers
- Referral requests with discounts
- Growth surveys
- Proactive automation suggestions based on their usage

---

## Technical Architecture

### Stack
- **Backend:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Integrations:** SendGrid (email), Twilio (SMS)
- **AI:** LLM for analysis, proposal generation, content creation

### Security Requirements (Non-Negotiable)
- Row Level Security (RLS) on all tables — businesses see only their own data
- No public keys exposed to client
- All sensitive database operations via backend/server functions
- Custom columns handled server-side to prevent injection
- Full encryption for customer data

### Data Isolation
- Each business's customer data is completely isolated
- Automations are scoped to the business that created them
- No cross-business data leakage under any circumstance

---

## Development Rules

### Mandatory QA Process

**Every feature request — new, edit, or change — follows this process without exception:**

1. **Understand** — Clarify requirements
2. **Review** — Examine existing codebase to understand impact
3. **Build** — Implement the feature
4. **Test** — QA testing, regression testing, debugging:
   - New feature works as intended
   - Existing features still work (no regressions)
   - Security is intact (RLS, auth, no exposed keys)
   - Edge cases are handled
5. **Confirm** — Only present as ready after validation

**No shortcuts. No "here's the code, should work." Every iteration is validated.**

### Code Quality Standards
- Maintainable, readable code
- No hallucinated code — everything must be tested
- Debug methodically before and after changes
- Safe, secure, and scalable architecture

---

## Roadmap Considerations

### Phase 1: Foundation
- Supabase schema and RLS policies
- Auth flow (signup, login, password reset)
- Customer data upload and management
- Business profile setup

### Phase 2: Core Automation
- AI analysis pipeline
- Automation proposal UI
- Automation creation and editing
- SendGrid/Twilio integration
- Basic scheduling

### Phase 3: Scale
- Advanced triggers and segmentation
- Applications on automations
- Analytics dashboard
- Content generation
- Multi-language support

### Phase 4: Growth
- Social media integrations
- Referral system
- Enterprise features
- Public API

---

## Philosophy

> "With great people who want to do great things. Everything will become so cold, so focusing on people, using these tools will ultimately prove to be way better than using tools to curate people and their experiences."

Automata exists to amplify human connection — not replace it.

---

## First Customer

The founder will be the first customer, testing with real use cases to ensure the product delivers on its promise before scaling.

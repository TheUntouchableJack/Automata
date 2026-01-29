# Automata — Project Instructions

## What We're Building
Automata Automations: AI-powered platform for SMBs/entrepreneurs to scale customer relationships through "bodiless applications" — automations first, apps built on top.

## Stack
- Supabase (PostgreSQL + Auth)
- SendGrid (email), Twilio (SMS)
- LLM for analysis and content generation

## Core Flow
Upload customer data → AI analyzes → proposes automations → user approves/edits → automations execute → applications built on top

## Security Rules (Non-Negotiable)
- RLS on ALL tables — businesses see only their data
- No public keys on client
- All sensitive ops via backend/server functions
- Full encryption for customer data

## Development Rule (Non-Negotiable)
EVERY feature/edit/change must follow:
1. Understand requirements
2. Review existing codebase
3. Build the feature
4. QA + regression test
5. Verify security intact
6. THEN deploy

No exceptions. No shortcuts. Test everything before presenting.

## Key Features
- Customer data: manual entry or CSV upload, custom columns
- Business profile: type, goals, revenue, country, language
- Automations: title, description, trigger, content, segmentation
- Human-in-the-loop: AI proposes, user approves
- Full i18n: UI + messages in user's language
- Apps on automations: links with unique IDs → personalized pages

## Pricing Model
- Free trial (limited)
- $50-75 per automation setup
- Monthly hosting + usage surcharge

## Philosophy
People first. Automations amplify human connection, not replace it.

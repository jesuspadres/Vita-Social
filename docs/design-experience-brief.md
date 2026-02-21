# Design & Experience Team Brief
**Prepared by:** PM Agent (coordinating Research + Innovation)
**Date:** February 2026
**For:** UX Agent, Design Agent, Content Agent, Accessibility Agent

---

## Executive Summary

Research and Innovation conducted a deep-dive into Vita's competitive landscape and codebase. The result: **16 prioritized recommendations** across 4 sprints that give the Design & Experience team a clear roadmap. Vita's strongest differentiators — GPS check-in, health rings, and offline-first philosophy — are under-leveraged in the current UI. The opportunity is massive.

---

## Part 1: Competitive Intelligence (Research Agent)

### What Competitors Do Best

| Pattern | Who | What Vita Should Learn |
|---------|-----|----------------------|
| Physics-based swipe with haptic snap at commitment threshold | Tinder | Vita has the swipe mechanics but lacks a dedicated match celebration moment |
| Like-and-comment on specific profile elements | Hinge | Vita only allows binary like/pass — no way to engage with a specific photo or interest |
| Structured profile prompts ("My ideal Sunday...") | Bumble | Vita's onboarding has a freeform 200-char bio; prompts drive 40%+ higher completion |
| Standouts / priority queue carousel | Hinge | Vita has no curated "picks" — only the infinite swipe deck |
| Category-filtered group discovery | Discord | Vita's groups tab has no filtering or discoverability layer |
| Real-time authenticity moments | BeReal | Vita's check-in could become a "proof of presence" social moment |

### Onboarding Strengths & Gaps
**Strengths (keep):**
- 8-step progressive disclosure with visual progress bar
- Photo upload at step 3 (aligns with industry 3x completion data)
- Single-action-per-step pattern (85%+ completion rates)
- Contextual permission requests (location at step 5, notifications at step 7)

**Gaps (fix):**
- Login screen value props are text-only — add subtle animated illustrations
- Interest chips are static — add "Popular near you" section
- Bio is freeform — supplement with structured prompts
- No completion celebration — add animation + haptic burst at finish

### Trust & Safety Gaps
- Discovery cards lack a report option before matching
- Distance displayed with too much precision (triangulation risk) — round to "< 1 mi", "~2 mi", "~5 mi"
- No AI-powered message safety detection (Bumble's "Does this bother you?" pattern)
- Event locations should be exact only after RSVP (Meetup pattern)

### Empty States Need Work
| Screen | Current | Recommended |
|--------|---------|-------------|
| Discovery (no more cards) | "Check back later" (passive) | "Expand your radius" CTA + "Join a group" secondary CTA |
| Messages (no conversations) | Generic empty state | "Your first match is just a swipe away" + navigate to Discover |
| Groups (none joined) | Generic empty state | "Find your community" + recommendations from onboarding interests |
| Map (no events nearby) | Generic empty state | "Create the first event" CTA |

### 2025-2026 Design Trends Vita Should Adopt
1. **Glassmorphism 2.0** — Translucent layers with depth (login screen already started this)
2. **Spring physics everywhere** — Not just swipe deck; buttons, modals, tab transitions
3. **Bottom-sheet-first navigation** — Replace full-screen modals with draggable sheets
4. **AI as ambient assistant** — Evolve AiIcebreaker from static suggestions to contextual, event-aware prompts
5. **Dark mode** — Tokens exist in `tailwind.config.ts` but aren't implemented; 18-35 demo overwhelmingly prefers dark
6. **Variable typography weight** — Use font weight (not just size) for hierarchy (600 for unread, 400 for read)
7. **Haptic vocabulary** — Different vibration patterns for different actions (beyond just intensity)
8. **Anti-addiction design** — "You're all caught up" states, weekly recaps, usage-reduction messaging

### Vita's 8 Design Differentiation Opportunities
1. **"Proof of Presence" as signature animation** — Make check-in as iconic as Tinder's "It's a Match!"
2. **Health ring as persistent visual identity** — Show on conversation avatars, event attendee lists, tab icons
3. **Event badges on discovery cards** — "Attending: Coffee & Code Meetup, Sat" on match cards
4. **Anti-addiction commitment** — "Go make plans! Your matches will be here when you get back"
5. **Group markers on the map** — Nobody shows groups spatially; Vita can
6. **Vouch system as social trust** — "Vouched by [friend]" on profile cards
7. **Micro-events ("Quick Plans")** — "Coffee at Blue Bottle in 2 hours, who's in?"
8. **Scene Reports** — Post-event photo + caption aggregated for non-attendees (FOMO driver)

---

## Part 2: Innovation Concepts (Innovation Agent)

### 7 Ideas Ranked by Priority

#### Sprint 1: Quick Wins (Low Effort, High Impact)

**1. Presence Pulse — Breathing Swipe Cards**
- *For*: Design, UX
- *What*: Top card subtly "breathes" (1-2px scale oscillation) when the profile was recently active. Nearby users get a warm gradient border shift.
- *Why*: Restores the feeling that profiles are alive, reducing the "catalog browsing" effect
- *How*: Reanimated `withRepeat(withTiming(...))` on top card only. `LinearGradient` border for proximity.
- **Impact: 4/5 | Effort: Low**

**2. Haptic Emotion Signatures**
- *For*: Accessibility, UX, Design
- *What*: A systematic haptic language — match heartbeat (double-tap pattern), proximity buzz (3 quick taps), health ring pulse (urgency-based), conversation warmth signal
- *Why*: First dating app with a true haptic vocabulary. Transforms accessibility from compliance to innovation.
- *How*: New `src/lib/haptic-signatures.ts` utility. Compose `Haptics.impactAsync` with `setTimeout` chains. Integrates into SwipeDeck, GroupCard, ChatThread.
- **Impact: 4/5 | Effort: Low**

#### Sprint 2: Core Differentiators (Medium Effort, Highest Impact)

**3. Trust Thermometer — Progressive Verification**
- *For*: UX, Design, Content, Accessibility
- *What*: Replace binary shield icon with a 4-segment visual: Phone → Photo → ID → Event-Checked-In. Tap to expand a bottom sheet showing verification story with dates. The 4th segment (Event-Checked-In) is unique to Vita — proves the person shows up IRL.
- *Why*: Trust is the #1 barrier to converting matches into meetups. No competitor offers a gradient of trust with real-world proof.
- *How*: New `TrustThermometer` in `src/components/ui/`. SVG segments with Reanimated fill animations. Replaces `ShieldCheck` in ProfileCard/SwipeDeck.
- **Impact: 5/5 | Effort: Medium**

**4. "3 Thoughtful Picks" Daily Mode**
- *For*: UX, Content
- *What*: Optional mode alongside free-swipe: 3 curated profiles/day with "Why Vita picked this" explanations grounded in shared interests, mutual groups, event attendance. Full-width scrollable briefs. Calming "Come back tomorrow at 9 AM" end-state.
- *Why*: Hinge's "Most Compatible" has 8x higher match rates. Vita's real-world signals make picks uniquely meaningful. Anti-addiction positioning.
- *How*: Third segment in discover pill switcher. New `ThoughtfulPicks` component. Client-side match explanation from shared interests/groups. Daily limit via Zustand + AsyncStorage.
- **Impact: 5/5 | Effort: Medium**

#### Sprint 3: Emotional Moments (Medium Effort, High Impact)

**5. Sensory Check-In Celebration**
- *For*: Design, UX, Accessibility
- *What*: Transform check-in into a 2.5-second multi-sensory sequence: Heavy haptic → radial color burst → spring checkmark → confetti particles → streak counter + health ring reset → share prompt. Accessibility: respects `isReduceMotionEnabled`, announces success to screen reader.
- *Why*: The check-in is the culmination of Vita's entire value proposition. It deserves to feel extraordinary. Creates shareable moment for organic growth.
- *How*: Refactor `CheckInSuccess` into full-screen overlay. 5 SVG circles with staggered `withSequence` scaling. 20 confetti `Animated.View` particles. `HealthRing` integration. Haptic chain with `setTimeout`.
- **Impact: 5/5 | Effort: Medium**

#### Sprint 4: Engagement Layer (Medium Effort)

**6. Conversation Spark Meter**
- *For*: UX, Design
- *What*: Animated flame icon on each conversation row showing momentum (kindling → burning → embers → gone). Cold conversations show a "Rekindle?" button that opens context-aware AI Icebreaker follow-ups.
- *Why*: Most dating conversations die within 72 hours. Visual momentum gamifies continuation and integrates the existing AI Icebreaker into a re-engagement loop.
- *How*: New `SparkMeter` in `src/components/messages/`. SVG flame with Reanimated flickering. Extends `AiIcebreaker` with `mode: 'new' | 'rekindle'`.
- **Impact: 4/5 | Effort: Medium**

#### Sprint 5: Visual Showcase (High Effort)

**7. Health Ring Constellation**
- *For*: Design, UX
- *What*: Force-directed visualization of all group members' health rings as interconnected nodes at the top of GroupDetail. Healthy groups have tight, bright clusters; struggling groups drift apart. Central ring shows aggregate health.
- *Why*: The 45-day health ring is Vita's most distinctive mechanic but is currently shown per-member in a flat list. The constellation makes group health tangible and shareable.
- *How*: New `HealthConstellation` in `src/components/groups/`. Spring-based force layout computed via `useMemo`. SVG canvas via `react-native-svg`. Breathing animation on container.
- **Impact: 4/5 | Effort: High**

---

## Part 3: Agent Assignments

### UX Agent (`/project:ux-agent`)
1. Redesign discovery empty state with active CTAs (Research finding)
2. Design the "3 Thoughtful Picks" flow and daily limit UX (Innovation #4)
3. Design Trust Thermometer interaction — tap to expand, bottom sheet flow (Innovation #3)
4. Audit and redesign the check-in flow for the Sensory Celebration (Innovation #5)
5. Design "Rekindle?" interaction for cold conversations (Innovation #6)
6. Add report option to discovery cards before matching (Research finding)
7. Explore "Quick Plans" micro-event format (Research finding)

### Design Agent (`/project:design-agent`)
1. Implement Presence Pulse breathing animation on swipe cards (Innovation #1)
2. Design Trust Thermometer visual — 4-segment bar, color system, expanded view (Innovation #3)
3. Design the check-in celebration sequence — radial burst, confetti, health ring reset (Innovation #5)
4. Extend health ring as persistent visual across conversation avatars, event lists, tab icons (Research finding)
5. Design Spark Meter flame states and animation (Innovation #6)
6. Begin dark mode token implementation (Research finding — existing tokens in tailwind.config.ts)
7. Add spring physics to buttons, modals, and tab transitions (Research trend)

### Content Agent (`/project:content-agent`)
1. Write "Why Vita picked this" explanation templates for Thoughtful Picks (Innovation #4)
2. Write Trust Thermometer level descriptions and verification story copy (Innovation #3)
3. Rewrite all empty states — Discovery, Messages, Groups, Map (Research finding)
4. Create structured profile prompts to replace/supplement freeform bio (Research finding)
5. Rewrite check-in success copy — from "attendance recorded" to mission-reinforcing (Research finding)
6. Write "Come back tomorrow" and anti-addiction messaging (Innovation #4, Research finding)
7. Write "Rekindle?" conversation prompts for AI Icebreaker extension (Innovation #6)

### Accessibility Agent (`/project:accessibility-agent`)
1. Build haptic signatures system — `src/lib/haptic-signatures.ts` (Innovation #2)
2. Add `accessibilityLabel` to all SwipeDeck action buttons (Research finding)
3. Implement `isReduceMotionEnabled` check for all Reanimated animations (Research finding)
4. Audit color contrast — specifically #4A90A4 on white (3.6:1, fails AA small text) (Research finding)
5. Add Dynamic Type / font scaling support to critical text (Research finding)
6. Ensure Trust Thermometer and Spark Meter are fully screen-reader accessible (Innovation #2, #3, #6)
7. Add accessible alternative descriptions to check-in celebration (Innovation #5)

---

## Sprint Roadmap

| Sprint | Focus | Ideas | Agents |
|--------|-------|-------|--------|
| **1** | Quick Wins | Presence Pulse + Haptic Signatures + Empty State Rewrites | Design, Accessibility, Content |
| **2** | Core Differentiators | Trust Thermometer + Thoughtful Picks | All 4 agents |
| **3** | Emotional Moments | Sensory Check-In Celebration | Design, UX, Accessibility |
| **4** | Engagement Layer | Spark Meter + Conversation Rekindle | UX, Design, Content |
| **5** | Visual Showcase | Health Constellation + Dark Mode Foundation | Design, UX |

---

## Success Metrics
- **Onboarding completion rate**: Target 85%+ (from structured prompts + celebrations)
- **Discovery engagement**: Thoughtful Picks match rate should be 3-5x higher than free swipe
- **Check-in rate**: Sensory celebration should increase repeat check-ins by 20%+
- **Conversation survival**: Spark Meter + Rekindle should reduce 72-hour conversation death rate
- **Accessibility**: WCAG 2.1 AA compliance across all screens, haptic signatures as industry first
- **Trust**: Trust Thermometer should increase match-to-message conversion rate

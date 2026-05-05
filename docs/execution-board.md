# NoteNook Growth Execution Board

## Sprint Window
- Start: May 6, 2026
- End: May 19, 2026
- Goal: improve activation, signup conversion, and paid upgrades

## KPI Baseline (Day 1)
- `landing_cta_click` per day: `TBD`
- `signup_start` per day: `TBD`
- `signup_complete` per day: `TBD`
- `upgrade_click` per day: `TBD`
- `upgrade_complete` per day: `TBD`

## Event Definitions
- `landing_cta_click`: user clicks landing page action buttons
- `signup_start`: user starts signup intent (email or Google)
- `signup_complete`: account creation completed
- `upgrade_click`: user clicks paid upgrade
- `upgrade_complete`: paid plan activation completed

## Board

### This Week (May 6 to May 12)
- [x] Day 1: add event instrumentation for baseline funnel
- [x] Day 1: create 2-week execution board and KPI tracking plan
- [ ] Day 2: landing copy rewrite (outcome-first messaging)
- [ ] Day 3: trust/social-proof section upgrade
- [ ] Day 4: sticky mobile CTA + mobile funnel simplification
- [ ] Day 5: demo strip (screens/video)
- [ ] Day 6: onboarding v1 (goal, exam, daily target)
- [ ] Day 7: dashboard "Today's Focus" card

### Next Week (May 13 to May 19)
- [ ] Day 8: design token consistency pass
- [ ] Day 9: accessibility pass (focus, keyboard, contrast)
- [ ] Day 10: performance pass (lazy loading + bundle split)
- [ ] Day 11: retention loop (milestones + streak nudges)
- [ ] Day 12: referral + upgrade loop
- [ ] Day 13: SEO content foundation pages
- [ ] Day 14: A/B test launch + release + KPI comparison

## Notes
- Funnel events are saved in Firestore collection: `analytics_events`.
- After 24 hours of traffic, replace `TBD` values with measured counts.

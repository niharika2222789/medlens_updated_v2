# MedLens

An AI-assisted clinical information intelligence and patient intake system. MedLens turns
fragmented medical information — patient intake, plus a pasted or uploaded lab report —
into a structured, traceable, human-reviewable record. **It does not diagnose, treat, or
replace a clinician.**

## Latest update

- **Fixed: Gemini calls were silently failing.** The default Gemini model ID was wrong
  (`gemini-3-flash` instead of the real `gemini-3-flash-preview`), so every Gemini request
  404'd and fell straight through to the offline template. Fixed in `lib/geminiClient.js`.
  API failures are now also logged server-side (`console.error`) and a short
  `offlineDetail` (the real error message) is returned to the client and shown in the UI —
  hover the "offline fallback" tag in Ask AI, or check the banner in Extract/Summarize, to
  see exactly why AI wasn't used instead of guessing.
- **Working account menu.** Clicking the chip in the top-right now opens a dropdown to
  view/edit your local personal profile (name/age/sex) and a **Log out** button. Logging
  out clears only your personal profile on this device — it never deletes patient records.
- **Multi-provider AI, including a free option.** `/api/extract-report`,
  `/api/generate-summary`, and `/api/ask-question` now go through `lib/aiClient.js`, which
  tries **Claude first, then Google Gemini**, before falling back to the offline pipeline.
  Gemini has a genuinely free API tier (get a key at
  [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)) — set
  `GEMINI_API_KEY` in `.env.local` and it's used automatically whenever
  `ANTHROPIC_API_KEY` is missing or fails. Note: a Gemini *app subscription* (Gemini
  Advanced) is a different product from an API key and doesn't unlock this endpoint by
  itself — you still need a key from AI Studio.
- **Faster, safer delete.** The patient list no longer blocks on a native `confirm()`
  dialog — clicking the trash icon deletes instantly and shows an **Undo** toast for a few
  seconds, so it feels quick without losing the safety net.
- **Real PDF export.** Alongside the print-stylesheet button, there's now a **Download
  PDF** button (`lib/pdfExport.js`, via `jspdf`) that generates an actual `.pdf` file of
  the intake, structured record, conflicts, summary, and audit trail — no browser print
  dialog required.

## What's new in this build (v2)

This pass adds persistence, access control, and the full **Should Have** tier on top of the
original Must Have spec:

- **Signed-in workspace with sign-out.** A lightweight, demo-grade access gate namespaces
  each reviewer's patients separately in the browser and adds a working sign-out button.
  This is explicitly *not* clinical-grade authentication — see "Honest limitations" below.
- **Persistent patient records.** Every patient, their report, structured record, conflicts,
  summary, and audit trail is saved to the browser's storage and survives a refresh or a
  sign-out/sign-in cycle. A sidebar lists, searches, and filters all saved patients.
- **Works without a live API key or balance.** If the Anthropic API call fails for *any*
  reason — no key configured, insufficient balance, rate limiting, a network hiccup — both
  `/api/extract-report` and `/api/generate-summary` **automatically fall back** to a
  deterministic, no-AI pipeline (`lib/offlineExtraction.js`, `lib/offlineSummary.js`) built
  on plain pattern matching and templates. The UI always shows a clear banner when it's in
  this offline mode so nothing is silently presented as an AI result when it wasn't. This
  means the whole app — intake, extraction, structured record, conflicts, summary — is
  fully demoable with zero API cost or setup.
- **Three distinct sample patients**, not one — an anemia case, an elevated-glucose case, and
  a mostly-normal wellness panel — each covering a different part of the pipeline (missed
  condition, medication conflict, clean result). Loading a sample runs the *entire* pipeline
  immediately (extraction → conflict detection → summary) and saves the result right away,
  so a judge can see a fully worked example in one click without waiting on each step.
- **Inconsistency & conflict detection** between intake answers and report findings
  (`lib/conflictDetector.js`), with a "mark as reviewed" workflow.
- **Confidence indicators** (a colored dot per value: high/medium/low) and **source badges**
  (AI-extracted / user-provided / AI-generated) on every field, per the original spec.
- **Side-by-side source view.** Hovering a structured value highlights exactly the substring
  of the original report text it was extracted from — real provenance, not just a claim.
- **Timeline & audit history** — every extraction, edit, and review action on a patient is
  logged with a timestamp.
- **PDF/export** via a print-optimized stylesheet (`Export / print` button — browser "Save as
  PDF" gives a clean, chrome-free record).
- **A provenance/trust score** (`lib/trustScore.js`) — a transparent, fully-explained 0–100
  score for each record based on how much of it rests on high-confidence extraction or
  human-verified values versus shaky guesses or open conflicts. It's arithmetic, not a
  clinical risk score, and the UI says so — this is the feature meant to stand out in a
  demo: it turns "trust the AI" into something visible and auditable at a glance.

## Architecture

```
app/
  page.js                        Top-level shell: auth gate, sidebar, workspace
  layout.js, globals.css         Root layout and design tokens
  api/extract-report/route.js    POST: report text -> structured JSON (AI, offline fallback)
  api/generate-summary/route.js  POST: intake + record -> patient summary JSON (AI, offline fallback)
components/
  Header.js                      Top bar with account dropdown (edit profile, log out)
  Toast.js                       Undo-style toast notification (used for quick delete)
  Sidebar.js                     Patient list, search/filter, new patient, sample loader
  IntakeForm.js                  Patient intake fields
  ReportTab.js                   Report paste/upload + extraction trigger
  RecordTable.js                 Editable structured record with confidence/source/status
  ConflictPanel.js               Intake-vs-report conflict review
  SummaryPanel.js                AI/offline plain-language summary
  CompareView.js                 Side-by-side source vs. structured, with highlighting
  AuditTrail.js                  Per-patient timeline
  TrustScore.js                  Provenance score widget
  RecordWorkspace.js             Orchestrates the above tabs for one patient
  Badges.js                      Shared confidence/source/status badge components
lib/
  aiClient.js                    Provider-agnostic entry point: tries Claude, then Gemini
  anthropicClient.js             Server-side fetch wrapper for the Anthropic API
  geminiClient.js                Server-side fetch wrapper for the Google Gemini API (free tier)
  prompts.js                     System prompts (extraction + summary), safety rules live here
  offlineExtraction.js           No-AI pattern-matching fallback extractor
  offlineSummary.js              No-AI template fallback summary
  pdfExport.js                   Client-side real PDF generation (jsPDF) for a patient record
  rangeParser.js                 Deterministic reference-range parsing & status computation
  parameterAliases.js            Deterministic Hb -> Hemoglobin-style canonicalization
  conflictDetector.js            Deterministic intake-vs-report conflict heuristics
  trustScore.js                  Deterministic provenance score
  buildStructuredRecord.js       Turns raw extraction output into the app's record shape
  storage.js                     localStorage-backed persistence (records, profile, audit)
  demoData.js                    Three sample patients
  id.js                          ID/date helpers
```

**Why the split between AI and code still matters:** the AI model only ever extracts what's
literally printed on a report and drafts prose. Deciding whether "10.2" falls outside
"13-17" is done in `lib/rangeParser.js`, in plain JavaScript, so that judgment doesn't
depend on the model's arithmetic and is auditable — and it's the same code path whether the
AI or the offline fallback produced the raw value. Likewise, common alias resolution
(`Hb` → `Hemoglobin`) has a small fixed dictionary in `lib/parameterAliases.js`, and conflict
detection (`lib/conflictDetector.js`) and the trust score (`lib/trustScore.js`) are both
plain, explainable arithmetic/heuristics — never another AI call grading the first one.

**Provenance:** every piece of information carries a `source` of `user_provided`,
`ai_extracted`, or `ai_generated`, rendered as a badge in the UI. Editing an AI-extracted
field re-tags it `user_provided`, so the record always reflects who's actually vouching
for a value. When the *extraction itself* had to fall back to offline mode, the record is
additionally tagged `extractionMode: "offline"` and the UI banners it — provenance covers
not just "who edited this" but "was AI even involved."

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local and add ANTHROPIC_API_KEY and/or GEMINI_API_KEY (both optional — see below)
npm run dev
```

Open http://localhost:3000, then create a patient or load a sample from the sidebar. Click
the chip in the top-right to set up (or edit) your personal profile, or to log out.

### Running with no API key, a key with low/no balance, or on the free tier

You don't need to do anything special. Both `ANTHROPIC_API_KEY` and `GEMINI_API_KEY` are
optional at runtime — every API route tries Claude first, then Gemini, and if a key is
missing, the account has insufficient balance, or a request gets rate-limited, it
transparently returns an offline-generated result instead of erroring. If you don't want to
pay for anything, get a free `GEMINI_API_KEY` at
[aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and leave
`ANTHROPIC_API_KEY` unset — Gemini will be used automatically. The response includes
`mode: "offline"` (or `"ai"` with a `provider`), and the UI surfaces this as a visible
banner. This was a deliberate design choice so the app is fully judge-able / demo-able with
zero billing setup, while still using a real model when a key is present. The real Claude
API whenever a working key is present.

The API key is read only inside `app/api/*/route.js`, which run server-side in Next.js —
it is never bundled into client-side code. Do not commit `.env.local`.

## Deploying

Works as-is on **Vercel** (`vercel deploy`, then set `ANTHROPIC_API_KEY` in the project's
Environment Variables) or any Node host that supports Next.js, including **Google Cloud
Run** via `next build && next start` in a container.

## Honest limitations

- **The sign-in gate is not real authentication.** It's a client-side, demo-grade access
  control layer intended to keep a public demo URL from being wide open during judging, and
  to namespace each reviewer's data. It does not encrypt data at rest, does not use hashed
  credentials, and must not be used for real patient data.
- **Storage is the browser's localStorage, not a database.** There's no server-side
  persistence, multi-device sync, or backup. Clearing browser storage deletes all patients.
  The code is structured (stateless API routes, a single `record` shape in `storage.js`) so
  swapping in a real database and auth provider is additive, not a rewrite.
- **File upload only supports plain text (.txt) or pasted text** in this pass — PDF/image
  OCR is not wired up. Paste the report text directly for anything else.
- **Longitudinal comparison of previous reports** (the spec's Nice-to-Have tier) is not
  included.
- Prompts in `lib/prompts.js` explicitly forbid diagnosis, treatment recommendations, and
  inventing reference ranges not present in the source report, in both the AI and offline
  paths. If a reference range isn't printed, `referenceRange` is `null` and status is
  `"unknown"` — the app never estimates a "normal" range from general knowledge.
- The summary always includes a disclaimer and frames uncertain items as clarification
  questions, never advice.

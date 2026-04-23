# TOPS — Requirements Summary

Notes distilled from the docs in this folder, written so the build in
`teacher-app/` can proceed against actual user intent rather than a generic
"teacher app" guess.

## What this is, in one line

A planning workstation for **UK Further Education / vocational** teachers
(West Suffolk College house style is visible on the templates) that turns a
**syllabus → Scheme of Work → per-session PPT decks → a TMC-format lesson
plan PDF for DFE submission**, with embedded quizzes, Harvard-formatted
references, and reusable text snippets.

It is **not** a K-12 app — there's no per-student gradebook, no daily
attendance tracker, no timetable grid. The atomic unit is a *session* (one
30-minute video / classroom block, 25–29 of them per academic year).

## Sources scanned

| File | Role |
|---|---|
| `TOPS - requirements.pdf` / `teacher planning app.pdf` | Master spec (identical content). Defines workflow, TMC markers, embedded fields. |
| `UNi Reqs.txt` | Author's user-story wishlist. Reusable snippets, Word→PPT, question→assessment, URL/DOI→Harvard refs. |
| `Main Page.htm` | Conceptual home screen. Five top-level sections: Module Specification, Course Outline, Assessments, Reading List, References. Each has Load + Edit. |
| `Scheme of work template New.pdf` | West Suffolk College SoW template — Course/Subject/Group header, embedded skills section, repeating Date/Content/Activities/Assessment rows. |
| `TMC Practical Lesson Plan (blank).pdf` | The TMC lesson-plan template — Connect / Share / Apply / Recall&Review / Stretch&Challenge / Conclusion panels, plus Maths / English / British Values / Differentiation, plus 8 Character Strengths checkboxes. |
| `template (1).pdf` | The PPT template — slides for Session, CONNECT, then coloured marker slides matching TMC phases. |
| `IRM LC1 References.rtf` | Sample Harvard-formatted references list (the target output format). |
| `0172-33_…animal_management_qualification_handbook…pdf` | Example syllabus (Level 3 Animal Management) — source for "syllabus has 30–40 points". |
| `Feeding and Nutrition.docx` / `Secure Software Dev - Outlinev1*.{docx,pdf}` / `3. Information Risk Management.pdf` | Sample course/module content. |
| `Team Principles.pdf` / `business.pdf` / `800px-Public-Key-Infrastructure.svg.png` | Supporting context, not core to the data model. |
| `completedtemplates/Animal welfare SOW.docx` + `Welfare {7,8,9}.pptx` | Worked examples of one SoW and three completed session decks. |

## Core domain model (drives `src/store/schema.ts`)

- **Course** — e.g. "L3 Adv Tech Ext Dip in Animal Management"
- **Module / Unit** — children of a course; each has its own ModuleSpec
- **ModuleSpec** — the syllabus document for a module (loaded + edited)
- **CourseOutline** — high-level outline document for the course
- **Group** (cohort, not "class") — `{ courseId, ageGroup: '14-16'|'16-18'|'19+'|'Mixed', numLearners, numLDDEHCP, mode: 'Full time'|'Part time', startDate, finishDate, preparedBy }`
- **SyllabusPoint** — `{ moduleId, code, text, used: boolean }` (30–40 per module; "vanish once selected")
- **SchemeOfWork** — `{ moduleId, groupId, embedded: { equalityDiversity, literacy, numeracy, ict, characterStrengths }, rows: SoWRow[] }`
- **SoWRow** — `{ weekOrDate, learningContent, differentiatedActivities, assessmentFeedback, location: 'classroom'|'fieldwork-trip'|'external'|string, tools: string[], syllabusPointIds: string[] }`
- **Session / LessonPlan** — one per SoWRow, follows TMC template:
  - `unit, week, lessonObjectives[]`
  - Phase content: `connect, share, apply, recallReview, stretchChallenge, conclusion`
  - Embedded hooks: `maths, english, britishValues, differentiation`
  - `characterStrengths: { resilience, ownership, optimism, ambition, respect, selfControl, confidence, curiosity }` (booleans)
  - Group-start checkboxes: `register, reportMissing, checkPPE`
  - Inline content carries TMC markers: `[C]` connect · `[R]` reflection · `[T]` teacher-led · `[L]` learner-led · `[?]` direct questioning
- **PPTDeck** — generated per session; slides correspond to phases (CONNECT slide, etc.). Round-trips: regenerated from session, lesson-plan extractable from edited deck.
- **Snippet** — `{ id, name, body, type: 'learning-outcome'|'activity'|'free' }`. Saved selections from any document, reusable across modules.
- **Question** — `{ id, sessionId, prompt, type: 'mcq'|'match'|'short'|'long', options?, answer? }`. Collated across a module's sessions to build assessments.
- **Assessment** — `{ id, moduleId, questionIds[], generatedAt }`. Formative quizzes; spec also asks for "automated testing & marking".
- **ReadingListItem** — `{ id, moduleId, sourceType: 'url'|'doi'|'manual', raw, harvardFormatted }`.

## Workflows the UI must support

1. **Load Module Spec** (Word/PDF/text) → parse into ModuleSpec → extract SyllabusPoints (each becomes a draggable token).
2. **Build Scheme of Work** for a Group: drag syllabus points into weekly rows; points dim/disappear from the palette when used. Fill embedded skills + per-row location & tools.
3. **SoW → PPT decks**: for each SoW row, generate a PPT deck following the template (Session title slide, CONNECT/SHARE/APPLY phase slides with the colour-coded marker boxes seen in `template (1).pdf`).
4. **Edit deck → extract LessonPlan**: parse the edited PPT and pull text per phase back into the TMC fields, ready to export as a populated `TMC Practical Lesson Plan` PDF for DFE submission.
5. **Reusable snippets**: select text in any open document, "Save as snippet", name it (e.g. "Halal nutrition discussion"), reuse anywhere.
6. **Course outline → slide structure**: import a Word `.docx`, treat each H1 as a new slide, push to the deck for a session.
7. **Lecture questions → assessment**: tag questions during/after sessions; collate per module; output a quiz (with chosen question types) + marking key.
8. **Reading list & references**: paste URLs or DOIs; system fetches metadata (DOI → CrossRef API; URL → Open Graph + heuristics) and produces a Harvard-formatted list.
9. **Embedded-skill suggestions**: when authoring a SoW row or a session, suggest concrete hooks for Maths / English / ICT / British Values / Career / Character Strengths based on the topic (this is where the AI assistant earns its keep — e.g. "nutrition → halal discussion" from the spec).

## Standard vocabularies (hard-code as constants)

- **TMC markers**: `[C]` `[R]` `[T]` `[L]` `[?]`
- **British Values**: democracy, rule of law, individual liberty, mutual respect, tolerance
- **Character Strengths**: Resilience, Ownership, Optimism, Ambition, Respect, Self-Control, Confidence, Curiosity
- **Activity keywords to surface**: multimedia, debate, poster, report, feedback
- **TMC phases**: Connect, Share, Apply, Recall & Review, Stretch & Challenge, Conclusion (Assessment & Feedback)
- **Group start checks**: Register, Report missing learners, Check PPE
- **Embedded skills tracked on SoW**: Equality & diversity (incl. British Values), Literacy, Numeracy, ICT, Character Strengths
- **Age groups**: 14–16, 16–18, 19+, Mixed
- **Mode of attendance**: Full time, Part time

## Out of scope for v1 (mentioned but parked)

- CV / covering letter / UCAS letter add-ons (the requirements PDF lists these as future add-ons).
- Submission integration with DFE (export the PDF; user submits manually).
- Collaboration / multi-teacher editing.

## Implications for build choices

These docs change two of the original plan assumptions:

1. **Mobile-first (React Native / Expo) is the wrong fit.** The dominant
   workflows are heavy doc manipulation — Word import, PowerPoint
   generate/extract, PDF render and submit, drag-and-drop syllabus tokens,
   full-screen rich-text editing. These are awkward on phones, well-supported
   on desktop browsers, and the user explicitly described the editing
   environment as "full screen". Recommend pivoting to **React + Vite +
   TypeScript** for a desktop-first web app (still installable as a PWA for
   offline use).
2. **The K-12 feature list (gradebook, attendance, student roster)
   doesn't apply.** Replace with: Module Spec viewer, Course Outline,
   Scheme of Work builder, Session/Lesson Plan editor, Deck generator,
   Reading List & References, Assessments, Snippets library.

The AI-assistant role and BYOK design carry over unchanged but the tool set
becomes FE-specific: `suggestEmbeddedHooks`, `draftSession`,
`generateQuiz`, `formatHarvardRef`, `fillTMCTemplate`.

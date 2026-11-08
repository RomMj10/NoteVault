# NoteVault — Cozy Editorial Redesign

## Design plan

### 1. Grounding in the subject
NoteVault is a personal note-capture extension for writers and researchers who think in fragments. It is a *private editorial space* — the product's own copy says so. The design therefore reads as a small literary magazine or a well-kept personal desk journal rather than a tool UI. Warm paper, a single serif face, ink-like text, pastel washes instead of neon accents.

### 2. Token system

**Color**
- `--paper`        #F7F3EC  — warm cream (main background)
- `--paper-2`      #F0EBE0  — secondary panel
- `--paper-3`      #E9E1D2  — tertiary / card hover
- `--ink`          #2B2620  — near-black ink (NOT #0B0B0B)
- `--ink-soft`     #5C554B  — secondary text
- `--ink-faint`    #9A9286  — placeholders / dates
- `--rule`         #E3D9C6  — hairline dividers
- `--rule-strong`  #D4C9B2
- `--rose`         #D98B8B  — muted dusty rose (primary accent)
- `--rose-soft`    #F3D9D9  — tinted surfaces
- `--sage`         #9BAE8F  — muted sage (secondary accent: images / success)
- `--sage-soft`    #E4EBE0
- `--clay`         #C87A5A  — destructive / warning
- `--clay-soft`    #F5E3DC
- `--gold`         #C9A84c — retired

**Type**
- One family: Georgia (serif) for everything. Display/headings and body share it — deliberate.
- Scale: 13px body / 1.0 line-height on body; headings use letter-spacing tightening.
- No all-caps labels, no accenting a single word, no monospace.

**Layout**
- Single 400px column, left-aligned, generous padding, hairline rules between sections.
- Setup screen: centered card on warm paper with a soft radial pastel glow.
- Header: brand left, actions right — quiet.
- Note cards: full-width rows separated by a hairline, left border accent in rose for page-attached notes.
- Compose view: large text area, top toolbar thin.
- Modal: bottom sheet, cream.

**Principles**
- Pastel only. No neon. No gold.
- One serif face, one accent hue (dusty rose), one secondary (sage).
- Motion: only the current-page pulse, slowed and softened; everything else static.
- Visible keyboard focus uses rose ring.
- Reduced motion respected.

### 3. Rejected defaults
- Warm cream + terracotta + serif display = the Anthropic tell. Replaced terracotta/gold with dusty rose + sage.
- Rounded SaaS cards with grey shadows. Replaced with hairline-separated flat rows.
- ALL-CAPS eyebrow labels. Removed.
- Gradient washes as decoration. Replaced with flat pastel tints.
# TOPS Requirements — Reference Docs

This folder holds the reference documents downloaded from
[`shaileshdhekne/TOPS`](https://github.com/shaileshdhekne/TOPS/tree/master/Documents/Requirements).
They are used only as input to the teacher-planning app being built in
`teacher-app/` on this branch (`claude/teacher-app-interface-gyp2V`). They are
**not** redistributed or modified.

## How to upload the downloaded files

Pick whichever is easiest.

### Option A — Git command line (recommended for many files)

From your machine, in the folder where you downloaded the TOPS requirements:

```bash
# Clone this repo (skip if you already have a checkout)
git clone <repo URL> tops-app
cd tops-app
git checkout claude/teacher-app-interface-gyp2V
git pull

# Copy all downloaded files in
cp -R "/path/to/downloaded/TOPS Requirements/"* reference/tops-requirements/

git add reference/tops-requirements
git commit -m "Add TOPS requirements docs for reference"
git push -u origin claude/teacher-app-interface-gyp2V
```

### Option B — GitHub web UI

1. Open this folder on GitHub (on branch `claude/teacher-app-interface-gyp2V`).
2. Click **Add file → Upload files**.
3. Drag the downloaded files in.
4. Commit to `claude/teacher-app-interface-gyp2V`.

Large binaries (multi-MB PDFs, videos) can fail in the web UI — use Option A
for those.

## What to include

- Requirement markdown / text docs
- PDF specs (any size — I'll page through them)
- Wireframes, diagrams, screenshots
- Any example templates (lesson plan `.docx`, report card `.xlsx`, etc.)

Skip anything with personal/student data — replace real names with placeholders
first.

## What happens next

Once the files are pushed, let me know. I'll pull, read through them, write a
`SUMMARY.md` next to this file distilling the entities, workflows and template
formats that matter, and then start the Expo app scaffold in `teacher-app/`.

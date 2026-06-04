# PeopleHub — Stitch UI/UX Prompt Pack

Copy-paste prompts for [Stitch](https://stitch.withgoogle.com) to design the UI for **PeopleHub**, a web-based People Management System (employee directory, profiles, promotions, salary, performance reviews, KPIs/OKRs, learning goals, history timeline, and dashboards).

---

## 0. How to use this (read first — this is how you avoid errors)

Stitch works best when you **set the style once, then generate ONE screen per prompt**. Long "build my whole app" prompts are where it breaks, truncates, or drifts. So:

1. Open Stitch → **New project → choose "Web"** (this is a desktop web app, not mobile). Every prompt below says "web (desktop)" on purpose — keep that wording so Stitch never picks a narrow mobile frame.
2. Use **Standard mode** for the first pass (fast). Switch a screen to **Experimental mode** only when you want a higher-fidelity redo of an important screen (Dashboard, Profile).
3. **Paste Prompt 1 (the design system) first.** It seeds the visual *style* (colors, font, radius, glass look) and a sample of components — it will **not** render every component as a finished library, and that's fine; later screens inherit the style.
4. Then generate screens **one at a time**, in the order below, each with its own prompt block.
5. To fix anything, **chat-edit** ("make the sidebar narrower") instead of re-prompting the whole screen — and **change ONE thing per message**. Bundling several changes into one edit makes Stitch rebuild the whole screen and often breaks what was already right.
6. After a screen looks right, use the **theme panel** to set primary `#6366f1` and font **Inter** so every new screen matches.

**Things to know so a generation doesn't look "wrong":**
- **Modals come out as standalone screens** (a centered card on a dimmed backdrop) — Stitch does not overlay them on a live screen. That's expected; treat each modal as its own artboard.
- **Dense screens (Dashboard, Performance) should be built in passes** — generate the stat cards + first chart, then add the rest as follow-up edits. Charts are the first thing Stitch simplifies when a screen is crowded. Each such prompt has a split note.
- **Free-tier quotas** are roughly ~350 Standard / ~50 Experimental generations per month, and **every chat-edit counts**. Generate in Standard, reserve Experimental for the 2–3 screens that matter most, and edit one thing at a time so you don't waste re-rolls.
- **Default theme is LIGHT** for every screen. A dark palette is defined for later use via the theme panel; the sidebar has a static "Dark mode" toggle button.

**Screen count: 7 core screens + 13 modals + 8 profile tab states.**
- Core: 1. Login · 2. App shell / sidebar · 3. Dashboard · 4. Performance Monitoring · 5. Directory · 6. Departments · 7. Employee Profile.
- Modals: Account, Add Employee, Import CSV, Add/Edit Department, Edit Profile, + one create/edit modal per profile tab (Add note, Record promotion, Add salary change, New review, Add financial entry, Add milestone, Add/Edit learning goal, Add data point).
- Profile tabs: Overview, History Card, Promotions, Salary, Performance (= Reviews), Financial Growth, Career Growth, Learning Goals, Monitoring (= KPI/OKR metrics).

> **Two intentional label quirks — do NOT "fix" them:** the sidebar **"Performance"** item opens the page titled **"Performance Monitoring"**; on the profile, the **"Performance"** tab shows *reviews* and the **"Monitoring"** tab shows *KPI/OKR metrics*. These names are deliberate.

---

## 1. Design system prompt (PASTE THIS FIRST)

```
Create the design system for a modern web (desktop) SaaS app called "PeopleHub", a people-management and performance platform for HR teams. Default everything to a LIGHT theme.

Visual style: clean glassmorphism. Frosted translucent cards with a soft blur, thin light borders, and gentle layered shadows, floating over a soft animated mesh-gradient background. Airy, comfortable spacing. Premium and calm, not flashy.

Brand: a small rounded square logo containing the letter "P" filled with an indigo-to-violet gradient, next to the wordmark "PeopleHub".

Font: Inter (sans-serif). Headings are semibold with slightly tight letter-spacing; body text is 14px.

Colors (use exactly):
- Primary / brand: indigo #6366f1, darker indigo #4f46e5, brand gradient indigo→violet linear-gradient(135deg, #6366f1, #8b5cf6).
- Text: #131722, muted #4f5868, faint #8a93a6.
- Accent tones (each used as a soft tinted background + a solid icon/text color): green #0f9d58, blue #2563eb, amber #c77700, red #e0322f, purple #7c3aed.
- Data-visualization colors (use these in charts, distinct from the text-green above): chart/positive green #16a34a, indigo #4f46e5, cyan #0891b2, amber #d97706, pink #db2777.
- Card surface: translucent white (~70% opacity) with blur; page background is a soft gradient of pale lavender, pale violet, and pale mint (#eaf0ff, #f4eefe, #eafaf6).
- Rating stars: filled #f5a524, empty #d6dae3.

Shape & spacing: card and modal corners 16px radius; buttons, inputs and selects 10px radius; badges/pills are fully rounded; avatars and icon circles are circular. Card padding ~20px. Grid gaps ~18px. Max content width ~1320px.

Components to establish the style: primary button (solid indigo), secondary/ghost button, small button, danger button (red), icon-only button; text input, select dropdown, textarea; card; stat card (label + big number + small sub-line + tinted icon circle); badge/pill; status badge; star rating; thin progress bar; tab bar; modal with title and right-aligned footer buttons; left sidebar; data table with uppercase column headers; avatar with colored initials; timeline row with a tinted icon circle.

Also define (for later use via the theme panel, not as a toggle in this screen) a DARK palette: text #e8ecf5 on a deep-navy mesh-gradient background (#0c1024, #120f24, #0a1620), keeping the same indigo primary and accent tones.

Use line-style icons (Lucide style: 24px, no fill, 2px stroke, rounded caps).
```

---

## 2. Login screen

```
Design a web (desktop) login screen for "PeopleHub".

Layout: full-screen soft mesh-gradient background (pale lavender/violet/mint). A single centered frosted glass card, ~420px wide, with slightly larger 22px corners (login card only).

Inside the card, top to bottom, centered:
1. Brand: rounded square indigo→violet gradient logo with a white "P", and the wordmark "PeopleHub" below or beside it.
2. Subtitle text: "People management & performance system".
3. An error banner area (a soft red rounded box) — show it as an example reading "Invalid email or password".
4. Form: an "Email" field (filled "admin@demo.com") and a "Password" field (dots). Labels sit above each field. Fields are full width with 10px radius.
5. A full-width primary indigo "Sign in" button directly below the password field.
6. A "Demo accounts" section at the bottom with the small heading 'Demo accounts · password "demo1234"' and four small clickable pill rows stacked vertically: "Admin — admin@demo.com", "HR — hr@demo.com", "Manager — manager@demo.com", "Employee — employee@demo.com".

No sidebar on this screen. Keep it minimal and centered.
The "Demo accounts" section is dev-only — also produce a second, production variant of this login card WITHOUT the demo pills.
```

---

## 3. App shell / sidebar (generate once, reuse on every internal screen)

```
Design the persistent app shell for a web (desktop) people-management app "PeopleHub". It is a two-column layout: a fixed LEFT SIDEBAR 256px wide, and a main content area to its right that fills the rest.

Sidebar (dark frosted vertical panel, indigo-tinted dark gradient, top to bottom):
- TOP: brand block — rounded square indigo→violet "P" logo + "PeopleHub" wordmark.
- MIDDLE: a vertical navigation list, each item is a line icon + label, with generous vertical spacing. The active item has a highlighted/filled pill background. Items in this exact order:
  1. "My Profile" (user icon)
  2. "Dashboard" (grid icon)
  3. "Directory" (users icon)  ← mark THIS one as the active item
  4. "Performance" (trending-up icon)   (this item opens the "Performance Monitoring" page)
  5. "Departments" (building icon)
- BOTTOM (sidebar footer, pinned to the bottom): a user chip showing a small circular avatar with initials, the name "Aarav Sharma" on top and the role "Admin" below it in muted text. Under the chip, three full-width buttons stacked: "Account" (user icon), a theme toggle "Dark mode" (moon icon), and "Sign out" (log-out icon).

Main content area: light frosted background with the soft mesh-gradient showing through, padded ~28px. Leave it mostly empty here (a placeholder page title) — it will be filled by other screens.

Also produce a second, EMPLOYEE-role variant of the sidebar with a reduced nav showing only "My Profile" and "Directory" (Dashboard, Performance, and Departments are hidden for non-manager employees; "My Profile" only appears when the user is linked to an employee record).
```

### 3a. Account modal (opened from the sidebar-footer "Account" button)

```
Design an "Account" modal for the PeopleHub web (desktop) app: a centered frosted glass card over a dimmed background, ~480px wide, 16px corners.

Header: title "Account" + close (x) icon top-right.
Body, top to bottom:
- The signed-in user: a circular initials avatar, name "Aarav Sharma", email "admin@demo.com", and a small indigo role badge "Admin".
- A "Change password" section with three stacked fields: "Current password", "New password", "Confirm new password", and a primary indigo "Update password" button.
- (Admin-only extra section) "Manage user accounts": a short note that admins can create a login account or reset another user's password, with a secondary "Create account" button and a "Reset password" button.

Footer (right-aligned): a secondary "Close" button.
```

---

## 4. Dashboard screen

> Dense screen. If charts come out simplified, build it in passes: (1) header + 4 stat cards + the two top charts, then chat-edit to add (2) the two donut charts, then (3) the two bottom list cards.

```
Design the "Dashboard" screen for the PeopleHub web (desktop) app, shown inside the app shell (256px dark left sidebar with the "Dashboard" nav item active; main content on the right).

Main content, top to bottom:

1. Page header: large title "Dashboard" with a muted subtitle "Company-wide people overview". No buttons in this header.

2. A row of 4 stat cards (equal width). Each card: a small tinted icon circle, a small label, a big bold number, and a small muted sub-line.
   - "Active headcount" — value "248" — sub "262 total · 14 on leave" — blue users icon.
   - "Avg. salary" — value "₹18.4L" — sub "₹45.6Cr total payroll" — green rupee icon.
   - "Promotions YTD" — value "37" — sub "52 comp changes" — purple up-arrow-circle icon.
   - "Avg. review rating" — value "4.2 / 5" — sub "9 awaiting sign-off" — amber star icon.

3. A row of two chart cards (each a frosted card with a title, a small muted subtitle, and a chart):
   - "Hiring trend" / "New hires over the last 12 months" — a smooth indigo area chart (12 months on the x-axis).
   - "Headcount by department" / "Active employees" — a horizontal bar chart with department names on the left (Engineering, Sales, Product, Design, HR, Finance) and indigo bars.

4. Another row of two chart cards:
   - "Employment type" — a donut chart with a legend (Full time, Part time, Contract, Intern).
   - "Learning goals" / "68% completion rate" — a donut chart with legend slices Completed (green), In progress (blue), Not started (grey), On hold (amber).

5. Bottom row of two list cards:
   - "Recent hires" — a vertical list, each row: small circular avatar, bold name, and a muted line "Job title · 3 days ago". Show 4 rows (e.g. "Priya Nair — Frontend Engineer · 2 days ago"). Empty state: "No recent hires".
   - "Recent activity" — a vertical list, each row: a small tinted icon circle, a bold employee name with a muted "— event title", and a right-aligned relative time. Example rows: "Rohan Mehta — Promoted to Senior Engineer · 1d", "Ananya Rao — Salary raise +12% · 2d", "Vikram Singh — Review submitted · 3d". Empty state: "No activity yet".

While data loads, show a centered spinner; on failure show a centered empty state "Could not load dashboard". Use the glassmorphism style and indigo palette from the design system.
```

---

## 5. Performance Monitoring screen

> Dense screen. If the 6-line chart loses its legend or the bars lose their color bands, build in passes: (1) header + 4 stat cards + the KPI-trend line chart, then chat-edit to add (2) the rating-distribution chart, then (3) the two list cards.

```
Design the "Performance Monitoring" screen for PeopleHub (web desktop, inside the app shell; left sidebar with the "Performance" nav item active).

Main content, top to bottom:

1. Page header: title "Performance Monitoring", muted subtitle "Organization-wide KPI & OKR tracking". No header buttons.

2. A row of 4 stat cards (tinted icon circle + label + big value + sub-line):
   - "Productivity" — "87%" — sub "320 samples" — blue bar-chart icon.
   - "Quality" — "92%" — sub "280 samples" — blue bar-chart icon.
   - "Engagement" — "79%" — sub "210 samples" — blue bar-chart icon.
   - "Goal completion" — "68%" — sub "170/250 goals done" — green target icon.

3. Chart card "KPI trend" / "Average score by metric over 12 months" — a multi-line line chart with one colored line per metric (Productivity, Quality, Goal completion, Attendance, OKR, Engagement), a legend, y-axis roughly 40–100.

4. Chart card "Rating distribution" / "Performance reviews (last 2 years)" — a vertical bar chart with color-coded bars across rating bands, worst→best: 1.0–1.9 red #e0322f, 2.0–2.9 orange #d97706, 3.0–3.9 amber #f5a524, 4.0–4.4 indigo #6366f1, 4.5–5.0 green #0f9d58.

5. Card "Top performers" / "By average review rating" — a ranked vertical list: a rank number, a small circular avatar, bold name, muted job title on the left, and a star rating on the right. Show 5 rows. Empty state: "No reviews yet".

6. Card "Metric averages" / "Current org-wide KPI snapshot" — a list where each row has a label on the left, a "%" value, and a thin horizontal progress bar (each bar a different accent color).

While loading, show a centered spinner; on failure show "Could not load performance data". Glassmorphism style, indigo palette.
```

---

## 6. Directory (employee list) screen

```
Design the "Directory" screen for PeopleHub (web desktop, inside the app shell; left sidebar with "Directory" active).

Main content, top to bottom:

1. Page header: title "Directory", muted subtitle "248 people". On the RIGHT side of this header, three buttons in a row: a secondary "Export" button (file-text icon), a secondary "Import" button (file-text icon), and a primary indigo "Add employee" button (plus icon) on the far right.

2. A filter bar (a frosted card row): a wide search input on the left with a leading search icon and placeholder "Search name, email, title…"; then a "Department" dropdown (showing "All departments"); then a "Status" dropdown (showing "All statuses").

3. A data table filling the rest, with uppercase column headers: EMPLOYEE, TITLE, DEPARTMENT, STATUS, LOCATION, JOINED.
   - EMPLOYEE cell: small circular colored-initials avatar + bold "First Last" with a faint employee code under or beside it (e.g. "Aarav Sharma" / "EMP-1024").
   - TITLE: job title with a faint " · level" (e.g. "Senior Engineer · IC5").
   - DEPARTMENT: e.g. "Engineering".
   - STATUS: a status badge — green "Active", amber "On leave", red "Terminated".
   - LOCATION: e.g. "Bengaluru" or "Remote".
   - JOINED: a date like "12 Mar 2022".
   Show ~8 realistic rows. Whole rows are clickable (hover highlight).

4. A pagination footer below the table (shown only when there is more than one page): "Page 1 of 13" on the left; on the right a "Prev" button (chevron-left, disabled look) and a "Next" button (chevron-right).

Empty states: while loading show a centered spinner; on failure "Could not load directory"; with zero results show "No employees found" / "Try adjusting your filters." (Also produce a single-page variant with the pagination footer hidden.) Glassmorphism style, indigo palette.
```

### 6a. Add Employee modal

```
Design an "Add employee" modal dialog for the PeopleHub web (desktop) app: a centered frosted glass card over a dimmed background, ~560px wide, 16px corners.

Header: title "Add employee" with a small close (x) icon on the top right.

Body: a two-column desktop form grid of labeled fields, side by side (not stacked), label above each input:
First name | Last name; Employee code | Email; Job title | Level (placeholder "e.g. IC4, M2"); Department (dropdown, "— None —") | Manager (dropdown, "— None —"); Employment type (dropdown: Full time / Part time / Contract / Intern) | Status (dropdown: Active / On leave / Terminated); Hire date (date picker) | Annual salary (₹) (number); Location (placeholder "e.g. Remote") spanning full width.

Footer (right-aligned): a secondary "Cancel" button and a primary indigo "Create" button.
```

### 6b. Import CSV modal

```
Design an "Import employees from CSV" modal for the PeopleHub web (desktop) app: a centered frosted glass card over a dimmed background, ~560px wide.

Header: title "Import employees from CSV" + close (x) icon.

Body, top to bottom:
- A line of helper text: "Required columns: employeeCode, firstName, lastName, email, jobTitle. Optional: level, department, status, employmentType, location, hireDate, currentSalary, currency."
- A field labeled "Upload a .csv file" with a file-upload control.
- A field labeled "…or paste CSV" with a monospace textarea.

Footer (right-aligned): "Cancel" and a primary "Import" button.

Also produce a RESULT variant of this modal: a green pill "42 created", a red pill "3 failed", and a small scrollable list of row errors like "Row 5: email already exists", with a single primary "Done" button in the footer.
```

---

## 7. Departments screen

```
Design the "Departments" screen for PeopleHub (web desktop, inside the app shell; sidebar "Departments" active).

Main content:

1. Page header: title "Departments", muted subtitle "Organizational units". On the RIGHT of the header, a primary indigo "Add department" button (plus icon).

2. A 3-column grid of department cards. Each frosted card contains: the department name as a heading (e.g. "Engineering"), a small blue pill badge "82 people", a line of description text (e.g. "Builds and maintains the product platform"), and at the bottom a row with a small secondary "Edit" button and a small red "Delete" button.
   Show 6 cards: Engineering (82 people), Sales (54), Product (21), Design (18), HR (12), Finance (15).

Empty states: while loading show a centered spinner; on failure "Could not load departments"; with none show "No departments yet" (building icon). Glassmorphism style, indigo palette.
```

### 7a. Add/Edit Department modal

```
Design an "Add department" modal for the PeopleHub web (desktop) app: a centered frosted glass card over a dimmed background, ~480px wide.

Header: title "Add department" + close (x) icon.
Body: a "Name" text input, and a "Description" textarea below it.
Footer (right-aligned): secondary "Cancel" and primary "Save" button.

(The Edit variant is identical with the title "Edit department" and the fields pre-filled.)
```

---

## 8. Employee Profile screen (header + tab bar + Overview tab)

> **Role-gating:** the action buttons on the profile (Edit profile; each tab's Add/Record/New button; every per-row trash delete) appear only for Admin/HR or the employee's manager — Learning Goals' Add/Edit/delete also appear for the employee viewing their own profile. For each tab you can also generate a **read-only variant** without these controls.

```
Design the "Employee Profile" screen for PeopleHub (web desktop, inside the app shell; main content on the right).

Main content, top to bottom:

1. A small back link "← Back to directory" above everything.

2. A profile header card (frosted): on the left a large circular avatar with initials; next to it the employee name "Aarav Sharma" as a big heading with a green "Active" status badge beside it, then a muted line "Senior Engineer · IC5 · Engineering", then a faint line "EMP-1024 · aarav.sharma@demo.com · Bengaluru". On the RIGHT side of this header card, a secondary "Edit profile" button (edit icon).

3. A fact grid of 4 small items in a row under the header: "Manager: Rohan Mehta", "Employment: Full time", "Joined: 12 Mar 2022", "Current salary: ₹24,00,000".

4. A horizontal TAB BAR with these 9 tabs (Overview selected/underlined): Overview · History Card · Promotions · Salary · Performance · Financial Growth · Career Growth · Learning Goals · Monitoring.
   (Note: the "Performance" tab shows reviews; the "Monitoring" tab shows KPI/OKR metrics — these labels are intentional, do not rename.)

5. Below the tab bar, render the OVERVIEW tab content:
   - A row of 4 stat cards: "Tenure" ("3.2 yrs"), "Current salary" ("₹24,00,000 · 5 changes"), "Latest rating" ("4.5/5 · Mar 2025"), "Goal completion" ("72% · 5/7 done").
   - An optional "About" card with a short bio paragraph.
   - A chart card "Total compensation" — a stacked bar chart by year (Base indigo #4f46e5, Bonus green #16a34a, Equity amber #d97706).
   - A chart card "Salary progression" — a line chart of salary over time.
   - A chart card "Performance rating trend" — a line chart of ratings (scale 1–5).

If the profile cannot be viewed (no permission), show a centered lock-icon empty state "Unable to view this profile". Glassmorphism style, indigo palette.
```

> The 8 blocks below each design **only the content area under the tab bar** for one tab, plus that tab's create/edit modal. In Stitch, generate the tab content as a variant of the profile screen (keep the same header + tab bar, change the active tab and the content), then generate the modal as its own artboard. The active-tab label must match the tab bar exactly.

### 8a. History Card tab

```
On the Employee Profile screen, design the "History Card" tab content (keep the same sidebar, profile header, and tab bar with "History Card" active).

A single frosted card titled "History Card" / "Complete activity timeline". On the card's top-right: an "All events" filter dropdown (options: All events, Hired, Promotion, Salary change, Review, Goal created, Goal completed, Milestone, Status change, Note) and a small primary "Add note" button.

Below: a vertical timeline. Each row has a tinted icon circle on the left (color depends on event type), a bold title, a date "12 Mar 2024", an optional description line, and an optional faint "by hr@demo.com". Example rows: "Hired as Engineer", "Promoted to Senior Engineer", "Salary raised +12%", "Performance review submitted", "Completed learning goal: AWS Certification".

Footer: "Page 1 of 3 · 58 events" with small "Prev" / "Next" buttons. Empty state: "No events".
```

**Add-note modal:** `Design an "Add note" modal (web desktop, centered frosted card ~480px): title "Add note" + close (x); fields "Title", "Details" (textarea), "Date" (date picker, default today); footer right-aligned "Cancel" + primary "Add".`

### 8b. Promotions tab

```
On the Employee Profile screen, design the "Promotions" tab content (same shell, header, tab bar with "Promotions" active).

A frosted card titled "Promotion history" / "Title & level progression", with a small primary "Record promotion" button on the top-right.

Below: a timeline with purple icon circles. Each row: "Engineer → Senior Engineer" in bold with a purple level badge "IC4 → IC5", an effective date "01 Apr 2023", an optional reason line, an optional "Approved by Rohan Mehta", and a small trash (delete) icon on the right. Show 3 rows. Empty state: "No promotions recorded".
```

**Record-promotion modal:** `Design a "Record promotion" modal (web desktop, centered frosted card ~520px): title "Record promotion" + close (x); a small muted line "Current: Engineer · IC4"; fields "New title", "New level" (placeholder "e.g. IC5"), "Effective date" (date), "Reason" (textarea), and a checkbox "Update the employee's current title & level" (checked by default); footer right-aligned "Cancel" + primary "Record".`

### 8c. Salary tab

```
On the Employee Profile screen, design the "Salary" tab content (same shell, header, tab bar with "Salary" active).

A frosted card titled "Salary changes" / "Compensation change log", with a small primary "Add change" button on the top-right.

Below: a line chart of salary over time (this chart appears only when there is more than one change; otherwise show just the table), then a data table with uppercase headers: DATE, TYPE, PREVIOUS, NEW, CHANGE, REASON, and a trailing delete column. TYPE is a badge — one of Raise / Promotion / Market / Adjustment / Bonus / Demotion. PREVIOUS/NEW are right-aligned rupee amounts (e.g. ₹21,40,000 → ₹24,00,000). CHANGE is a right-aligned percentage colored green for positive ("+12.1%") or red for negative ("−5.0%"). Show ~5 rows including one "Demotion" row with a red negative change and one "Bonus" row. Empty state: "No salary changes recorded".
```

**Add-salary-change modal:** `Design an "Add salary change" modal (web desktop, centered frosted card ~520px): title "Add salary change" + close (x); a small muted line "Current salary: ₹24,00,000"; fields "New salary" (number), "Type" (dropdown: Raise / Promotion / Market / Adjustment / Bonus / Demotion), "Effective date" (date), "Reason" (textarea); a small note "Bonuses are recorded without changing base salary."; footer right-aligned "Cancel" + primary "Save".`

### 8d. Performance (Reviews) tab

```
On the Employee Profile screen, design the "Performance" tab content (same shell, header, tab bar with "Performance" active).

Header row: "Performance reviews" with a muted "4 reviews on record" and a small primary "New review" button on the right.

Below: a stack of review cards. Each card: a star rating with a status badge ("Submitted" or "Acknowledged"), the review period, and a small trash delete icon. Inside: a two-column set of competency bars (label + "4/5" + thin progress bar) for Technical Skills, Communication, Collaboration, Ownership, Problem Solving. Then a green "Strengths" text block and an amber "Areas to improve" text block. Footer line: "Reviewed by Rohan Mehta".
Show 2 review cards: card 1 rating 4.5/5, period "Jul 2024 – Dec 2024", status "Acknowledged"; card 2 rating 4.2/5, period "Jan 2024 – Jun 2024", status "Submitted".
If a review belongs to the viewing employee and is still "Submitted", show a small primary "Acknowledge" button on that card (employee-only action). The trash delete is a manager/HR-only action. Empty state: "No performance reviews yet".
```

**New-review modal:** `Design a "New performance review" modal (web desktop, centered frosted card ~640px): title "New performance review" + close (x); fields "Period start" and "Period end" (date pickers, side by side); an "Overall rating" slider 1–5 in 0.5 steps with a live value label (e.g. "4.5"); a "Competencies" section with five sliders labeled Technical Skills, Communication, Collaboration, Ownership, Problem Solving (each 1–5); "Strengths" textarea and "Areas for improvement" textarea; footer right-aligned "Cancel" + primary "Submit review".`

### 8e. Financial Growth tab

```
On the Employee Profile screen, design the "Financial Growth" tab content (same shell, header, tab bar with "Financial Growth" active).

A frosted card titled "Financial growth" / "Total compensation over time · +34% since 2021", with a small primary "Add entry" button on the top-right.

Below: a stacked bar chart by year (Base indigo #4f46e5, Bonus green #16a34a, Equity amber #d97706), then a data table with uppercase headers PERIOD, BASE, BONUS, EQUITY, TOTAL COMP and a trailing delete column. Amounts are right-aligned rupees; TOTAL COMP is bold. Newest year first. Show ~4 rows (2024, 2023, 2022, 2021). Empty state: "No financial growth data".
```

**Add-financial-entry modal:** `Design an "Add financial entry" modal (web desktop, centered frosted card ~480px): title "Add financial entry" + close (x); fields "Period date" (date), "Base salary" (number), "Bonus" (number), "Equity" (number); a small note "Entries with the same period date are updated in place."; footer right-aligned "Cancel" + primary "Save".`

### 8f. Career Growth tab

```
On the Employee Profile screen, design the "Career Growth" tab content (same shell, header, tab bar with "Career Growth" active).

A frosted card titled "Career growth" / "Milestones, achievements & development", with a small primary "Add milestone" button on the top-right.

Below: a timeline with purple icon circles (icon varies by type). Each row: a bold title, a blue type badge — one of Promotion / Role Change / Certification / Project / Award / Skill / Training — a date, an optional description, an optional faint "Level: IC5", and a trash delete icon on the right. Show 4 rows across different types. Empty state: "No milestones yet".
```

**Add-milestone modal:** `Design an "Add career milestone" modal (web desktop, centered frosted card ~480px): title "Add career milestone" + close (x); fields "Type" (dropdown: Promotion / Role Change / Certification / Project / Award / Skill / Training), "Date" (date), "Title", "Description" (textarea); footer right-aligned "Cancel" + primary "Add".`

### 8g. Learning Goals tab

```
On the Employee Profile screen, design the "Learning Goals" tab content (same shell, header, tab bar with "Learning Goals" active).

Header row: "Learning goals" with a muted "5 of 7 completed" and a small primary "Add goal" button on the right.

Below: a 2-column grid of goal cards (showing 4 of the 7 goals). Each card: a category badge (Technical / Leadership / Communication / Domain / Certification) + a priority badge (Low / Medium / High) + a status badge (Not started / In progress / Completed / On hold), plus small Edit and trash icons on the top-right. Then a bold title, an optional description, a "Progress" label with a percentage and a thin progress bar (green when completed), and a footer line "Target 30 Jun 2025" or "Completed 12 Feb 2025". Show 4 cards in mixed states. Empty state: "No learning goals yet".
```

**Add/Edit-goal modal:** `Design an "Add learning goal" modal (web desktop, centered frosted card ~520px): title "Add learning goal" + close (x); fields "Title", "Description" (textarea), "Category" (dropdown: Technical / Leadership / Communication / Domain / Certification), "Priority" (dropdown: Low / Medium / High), "Status" (dropdown: Not started / In progress / Completed / On hold), "Target date" (date), and a "Progress" slider 0–100 in steps of 5 with a live value label; footer right-aligned "Cancel" + primary "Save". (The Edit variant has the title "Edit goal" with fields pre-filled.)`

### 8h. Monitoring (Metrics) tab

```
On the Employee Profile screen, design the "Monitoring" tab content (same shell, header, tab bar with "Monitoring" active).

Header row: "Performance monitoring" / "KPI & OKR tracking over time" with a small primary "Add data point" button on the right.

Below: a 3-column grid of latest-snapshot cards, one per metric type (Productivity, Quality, Goal completion, Attendance, OKR, Engagement). Each card: the metric name, a current value with unit ("87%"), a thin progress bar (value vs target), and a small line "Target 90 · Mar 2025".

Then a chart card "KPI trend" / "Monthly performance metrics" — a multi-line line chart, one colored line per metric type, y-axis 0–100. While loading show a centered spinner; empty state: "No metrics recorded yet".
```

**Add-data-point modal:** `Design an "Add performance data point" modal (web desktop, centered frosted card ~480px): title "Add performance data point" + close (x); fields "Metric" (dropdown: Productivity / Quality / Goal completion / Attendance / OKR / Engagement), "Period" (date), "Value" (number), "Target" (number), "Unit" (text, default "%"); footer right-aligned "Cancel" + primary "Add".`

---

## 9. Edit Profile modal (used from the profile header)

```
Design an "Edit profile" modal for the PeopleHub web (desktop) app: a centered frosted glass card over a dimmed background, ~560px wide.

Header: title "Edit profile" + close (x) icon.
Body: a two-column desktop form grid, fields side by side (not stacked) — Job title | Level; Status (dropdown: Active / On leave / Terminated) | Location; Department (dropdown) | Manager (dropdown); Phone | (blank); and a full-width "Bio" textarea.
Footer (right-aligned): secondary "Cancel" and primary "Save" button.
```

---

### Quick tips if a generation looks off
- **One change per chat-edit.** Asking for several changes at once makes Stitch rebuild the whole screen and breaks parts that were already right.
- If Stitch ignores the sidebar or goes narrow/mobile, regenerate and start the prompt with "Inside the app shell (256px dark left sidebar + content area on the right), for a web (desktop) layout, …".
- If colors drift, open the theme panel and set primary `#6366f1` and font **Inter**, then regenerate.
- If a dense screen (Dashboard, Performance) crams or simplifies charts, generate the top half first (header + stat cards + first chart), then add the rest as one-at-a-time follow-up edits.
- Generate the profile tabs (section 8) as edits of the profile screen, not brand-new screens, so the header and tab bar stay identical; make the active-tab label match the tab bar exactly.
- Modals generate as their own standalone artboards (centered card on a dimmed backdrop) — that's expected, not a failure.

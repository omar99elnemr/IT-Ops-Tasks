# Feature Parity Checklist
**Purpose:** Validation matrix to ensure all Phase 1 (v0.9) features are faithfully recreated in Phase 2 React frontend.

---

## Settings & Profile Section

### My Setup
- [ ] User name input field (text, 100 chars max)
- [ ] Shift selector dropdown (Morning 09:00-17:00 / Afternoon 14:00-23:00)
- [ ] Time recording enabled toggle (checkbox)
- [ ] Toggle persists across page reloads
- [ ] Shift persists to JSONBin + localStorage
- [ ] Username persists to JSONBin + localStorage

### Contacts Management
- [ ] Add contact form (name, email, role selector)
- [ ] Name validation (required, non-empty after trim)
- [ ] Email validation (required, contains @)
- [ ] Role selector: "To", "CC", "None"
- [ ] Add contact button creates new row in list
- [ ] Contact list displays all saved contacts
- [ ] Edit contact inline (click row to edit)
- [ ] Delete contact button + confirm modal
- [ ] Contact role badge displayed with correct color (blue=To, teal=CC, gray=None)
- [ ] Contacts persist to JSONBin + localStorage
- [ ] Contacts sync to email recipients automatically

### System Actions
- [ ] "Reset Everything Except Contacts" button visible in settings
- [ ] Reset button triggers confirmation modal
- [ ] Modal text: "Are you sure? This will clear all tasks and settings but keep your contacts."
- [ ] Confirm: clears all tasks + settings, preserves contacts, resets to seed data, shows success
- [ ] Cancel: closes modal, no changes

---

## Fixed Tasks Section

### Rendering & Display
- [ ] Fixed tasks rendered from seed data (config.json)
- [ ] Tasks displayed as checkbox list (not editable inline titles)
- [ ] Task row shows: checkbox, title, timestamp (if checked), edit time button, no delete (seed data immutable)
- [ ] Unchecked tasks: no timestamp
- [ ] Checked tasks: timestamp displayed in HH:mm format

### Checkbox Interaction
- [ ] Clicking checkbox toggles `done` state
- [ ] If timeRecordingEnabled=true and checkbox=true: auto-populate time with current Cairo timezone HH:mm
- [ ] If checking again: time not overwritten (preserve manual edit)
- [ ] If unchecking: time cleared
- [ ] State persists to JSONBin immediately (after debounce)
- [ ] localStorage updated simultaneously

### Edit Time Button
- [ ] "Edit Time" button appears on each task with time
- [ ] Clicking opens modal with current time in HH:mm format
- [ ] Modal title: "Edit Time"
- [ ] Input field pre-filled with current time
- [ ] Keyboard: Enter to confirm, Escape to cancel
- [ ] Submit validates HH:mm format (00:00-23:59)
- [ ] Invalid time shows error in modal (stays open)
- [ ] Valid time closes modal, updates state, syncs to JSONBin
- [ ] Cancel button closes modal without changes

---

## Dynamic Tasks Section (Ad-Hoc Tasks)

### Add Task Form
- [ ] Text input for task title
- [ ] Placeholder: "Add a new task..."
- [ ] "Add Task" button
- [ ] Title validation (required, non-empty after trim)
- [ ] On add: new task created with:
  - UUID as id
  - Provided title
  - Status: "InProgress" (default)
  - Time: current Cairo timezone HH:mm (auto-recorded if timeRecordingEnabled=true)
- [ ] Task appears immediately in list
- [ ] State persists to JSONBin + localStorage

### Task List Display
- [ ] Each dynamic task row shows: title, status badge, time, edit time button, delete button
- [ ] Status badges display with correct colors:
  - Completed (green)
  - InProgress (orange)
  - Handed Over (blue/dark blue)
- [ ] Time displayed in HH:mm format

### Status Control
- [ ] Status dropdown per task: "Completed", "InProgress", "Handed Over"
- [ ] Changing status updates state immediately
- [ ] State persists to JSONBin + localStorage

### Edit Time Button
- [ ] Same modal behavior as fixed tasks (see above)
- [ ] Validates HH:mm, confirms/cancels, syncs on success

### Delete Button
- [ ] Delete button on each dynamic task
- [ ] Clicking opens confirmation modal
- [ ] Modal text: "Delete this task?"
- [ ] Confirm: removes task from list, persists to JSONBin + localStorage
- [ ] Cancel: closes modal, no change

---

## Report Generation Section

### Report Preview
- [ ] Heading: "Handover Report"
- [ ] Preview box renders HTML with white background, sans-serif font
- [ ] Report structure:
  1. Greeting paragraph: "After greetings, kindly find below the summary of today's completed operational tasks"
  2. Shift info: "Shift Type: [X] | Responsible Officer: [Name] | Date: [Day], [MM/DD/YYYY]"
  3. "Completed Tasks" section with bullet list (fixed tasks done=true + dynamic tasks status="Completed")
  4. "In Progress Tasks" section (dynamic tasks status="InProgress")
  5. "Handed Over Tasks" section (dynamic tasks status="Handed Over")
  6. Signature: "Best regards, [Name] [Shift] [Date] [Time]"

### Report Accuracy
- [ ] Completed tasks include time: "Task Title [HH:mm]"
- [ ] Empty sections still show header (no section disappears if empty)
- [ ] Date format: [Day Name], [MM/DD/YYYY] (e.g., "Tuesday, 03/25/2025")
- [ ] Time format: HH:mm (24-hour)
- [ ] Signature includes current date and time in Cairo timezone
- [ ] All recipient emails shown in report (for verification)

### Copy to Clipboard Button
- [ ] "Copy Report HTML to Clipboard" button
- [ ] Clicking copies entire report HTML to clipboard
- [ ] Shows success message: "Report copied to clipboard!"
- [ ] User can paste into email client or Outlook

### Open in Outlook Button
- [ ] "Open in Outlook" button (or email client mailto link)
- [ ] Clicking opens native email client with:
  - To: recipients with role="to"
  - CC: recipients with role="cc"
  - Subject: `IT Operations Handover - [MM/DD/YYYY] [Morning/Afternoon]`
  - Body: report HTML (pasted as text or HTML body if possible)
- [ ] Works on desktop (Windows mail, Outlook, Gmail in browser, etc.)

---

## UI/UX Interactions

### Modal System
- [ ] All modals use custom app modal (not browser confirm/alert/prompt)
- [ ] Modal backdrop: semi-transparent dark overlay, covers full viewport
- [ ] Modal box: centered, white background, 460px max-width
- [ ] Modal header: bold text, blue color (#005a9e)
- [ ] Modal body: regular text, input fields if needed
- [ ] Modal actions: buttons right-aligned (Cancel left, Confirm/Submit right)
- [ ] Keyboard: Enter to confirm, Escape to cancel
- [ ] Focus management: first input auto-focused on open
- [ ] Z-index: modals appear above all content (z-index: 1000+)

### System Messages
- [ ] Alert banner at top of page (below title)
- [ ] Banner types: success (green), error (red), warning (orange), info (blue)
- [ ] Banner displays on system startup: "System is starting. Please wait a moment."
- [ ] Success messages after operations: "Report copied!", "Contact added!", "Task deleted!", etc.
- [ ] Error messages for validation failures: "Invalid time format", "Email required", etc.
- [ ] Auto-dismiss success messages after 3-5 seconds
- [ ] Error messages persist until dismissed or next action

### Sync Status Indicator
- [ ] Sync status shown in real-time (top right or next to alert)
- [ ] States:
  - Ready: "(No indicator)"
  - Syncing: "⏳ Syncing..."
  - Success: "✓ Synced" (fades after 2s)
  - Error: "✗ Sync failed. Using local copy"
- [ ] Error state persistent until retry succeeds
- [ ] Manual retry button if error persists

---

## Responsive Design (Mobile)

### Layout Changes
- [ ] Mobile viewport (max-width: 650px):
  - Vertical flex layout (no horizontal split)
  - Full-width inputs and buttons
  - Reduced padding
- [ ] Contact cards: full width, not 30% basis
- [ ] Task rows: vertical layout (flex-column)
- [ ] Task action buttons: full width, smaller font
- [ ] Modal: full screen with 16px padding

### Touch Interactions
- [ ] All buttons and clickable elements: minimum 44px height
- [ ] No hover-only interactions (hover state replicated on focus/active)
- [ ] Input fields: auto-focus keyboard on tap
- [ ] No horizontal scroll required
- [ ] Modal keyboard: Enter and Escape work on mobile (soft keyboard doesn't interfere)

---

## Data Flow & Persistence

### Cloud Sync (JSONBin)
- [ ] Every state change triggers JSONBin POST (after 1.5s debounce)
- [ ] JSONBin URL correct: `https://api.jsonbin.io/v3/b/69be8ac2aa77b81da905a456`
- [ ] API key included in request headers (to be moved to backend in Phase 1)
- [ ] Successful POST: banner shows "✓ Synced"
- [ ] Failed POST: banner shows "✗ Sync failed. Using local copy"
- [ ] localStorage automatically updated on every change (no debounce)

### localStorage Fallback
- [ ] localStorage key: `itOpsState_PRO_V1`
- [ ] If JSONBin unreachable: app reads from localStorage and continues
- [ ] Both JSONBin and localStorage stay in sync

### Page Reload
- [ ] On load: fetch JSONBin first
- [ ] If JSONBin fails: fall back to localStorage
- [ ] App renders with loaded data (no blank state)
- [ ] Timezone recalculates correctly after reload (Cairo timezone honored)

---

## Validation & Error Handling

### Field Validation
- [ ] Time input: must be HH:mm, 00:00-23:59
  - Validation errors shown in modal
  - Submit disabled until valid
- [ ] Contact email: must contain @
  - Validation error shown inline or in modal
- [ ] Contact name: must be non-empty
- [ ] Task title: must be non-empty
- [ ] All fields trimmed before save

### API Error Handling
- [ ] JSONBin connection error: show "Sync failed" banner, use localStorage
- [ ] Malformed localStorage data: show error, offer reset option
- [ ] Timeout (e.g., stalled network): retry after 5s or show persistent error

---

## Desktop & Mobile Testing Checklist

### Desktop (Chrome, Firefox, Edge)
- [ ] Responsive at 1920x1080 (full desktop)
- [ ] Responsive at 1366x768 (small desktop)
- [ ] Responsive at 1024x768 (tablet-like)
- [ ] All buttons and inputs functional
- [ ] No console errors
- [ ] No network errors (except expected JSONBin if API key rotated)
- [ ] Email copy/mailto works
- [ ] Modal keyboard shortcuts work (Enter, Escape)

### Mobile (iOS Safari, Android Chrome)
- [ ] Responsive at 375x812 (iPhone 12)
- [ ] Responsive at 390x844 (Pixel 5)
- [ ] Responsive at 768x1024 (iPad portrait)
- [ ] All buttons tappable (min 44px)
- [ ] No horizontal scroll
- [ ] Modal behavior correct (no keyboard overlap)
- [ ] Email copy/mailto works
- [ ] Touch interactions feel responsive

---

## Accessibility Baseline (Phase 4 Pass)

- [ ] Color contrast: main text, buttons, badges meet WCAG AA
- [ ] Modal focus trap: Tab cycles through buttons only
- [ ] Keyboard navigation: all buttons reachable via Tab
- [ ] Labels: all inputs have visible labels or aria-labels
- [ ] Error messages: announced to assistive tech
- [ ] Alt text: N/A (no images in current app)

---

**Signature:** After Phase 2 React frontend is feature-complete, verify all items above are checked, then proceed to Phase 3 migration.

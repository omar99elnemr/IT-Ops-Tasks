# Phase 0: Baseline Capture & Non-Regression Markers
**Date:** March 22, 2026  
**Purpose:** Document current application state before reformation begins

---

## 1. Current Data Model

### Local Storage Schema
**Key:** `itOpsState_PRO_V1`

```typescript
interface AppState {
  userName: string;
  shift: "Morning (09:00 - 17:00)" | "Afternoon (14:00 - 23:00)";
  timeRecordingEnabled: boolean;
  contacts: Contact[];
  fixedTasks: TaskFixed[];
  dynamicTasks: TaskDynamic[];
}

interface Contact {
  id: string; // UUID
  name: string;
  email: string;
  role: "to" | "cc" | "none";
}

interface TaskFixed {
  id: string; // UUID
  title: string;
  done: boolean;
  time: string | null; // "HH:mm" format (Cairo timezone) or null
}

interface TaskDynamic {
  id: string; // UUID
  title: string;
  status: "Completed" | "InProgress" | "Handed Over";
  time: string; // "HH:mm" format (Cairo timezone)
}
```

### Cloud Persistence (JSONBin)
**URL:** `https://api.jsonbin.io/v3/b/69be8ac2aa77b81da905a456`  
**API Key:** Hardcoded in frontend (SECURITY ISSUE - migrate to backend in Phase 1)  
**Sync Frequency:** 1.5-second debounce on local changes  
**Fallback:** localStorage used if cloud unreachable

### Seed Data (data/config.json)
```json
{
  "fixedTasks": [
    "Checked all IDF rooms",
    "Checked IPTV Channels",
    "Check All Hosts Health & Storage",
    "Checked Landline"
  ]
}
```

---

## 2. UI Feature Inventory

### Settings Panel
- [x] User name input
- [x] Shift selector (Morning / Afternoon)
- [x] Time recording enabled toggle (checkbox)
- [x] Email list manager (add/remove/role assignment)
- [x] Fixed tasks list (readonly, seeded from config)
- [x] Reset button with confirmation ("Reset Everything Except Contacts")

### Fixed Tasks Section
- [x] Checkbox per task to mark done
- [x] Timestamp display (auto-filled if timeRecordingEnabled)
- [x] Edit time button (modal: HH:mm format, Cairo timezone)
- [x] Delete task confirmation (native modal)

### Dynamic Tasks Section (Ad-Hoc Tasks)
- [x] Add ad-hoc task input
- [x] Status dropdown (Completed / InProgress / Handed Over)
- [x] Time display
- [x] Edit time button (modal)
- [x] Delete task confirmation (native modal)

### Report Generation
- [x] Email preview section (HTML render)
- [x] Copy to clipboard button
- [x] Open in Outlook mailto button
- [x] Email subject: "IT Operations Handover - [Date] [Shift]"
- [x] Email body greeting: "After greetings, kindly find below the summary of today's completed operational tasks"
- [x] Report sections: Completed Tasks, In Progress Tasks, Handed Over Tasks
- [x] Signature section (with timezone info)

### Status Bar
- [x] System alert banner (success/error/warning/info)
- [x] Cloud sync status indicator (✓ Synced / ⏳ Syncing / ✗ Error)

---

## 3. UI Flows (Desktop & Mobile)

### Load Flow
1. App initializes → "System is starting. Please wait a moment."
2. Fetch from JSONBin (or fallback to localStorage)
3. Populate all fields with persisted state
4. Render tasks and contacts
5. Alert clears on success

### Add Contact Flow
1. User enters name, email
2. User selects role (To / CC / None)
3. Click "Add Contact" → validation
4. Contact added to list, appears in email recipients
5. State saved to JSONBin + localStorage (debounced 1.5s)
6. Success message shown

### Fixed Task Toggle Flow
1. User clicks checkbox on fixed task
2. If checked and timeRecordingEnabled: auto-populate with current time (Cairo timezone, HH:mm)
3. If unchecked: clear time
4. State saved to JSONBin + localStorage (debounced)

### Edit Task Time Flow
1. User clicks "Edit Time" button on any task
2. Modal opens with current time in HH:mm format
3. User enters/modifies time (validated HH:mm)
4. Press Enter or click Confirm → time updated
5. Press Escape or click Cancel → modal closes, no change
6. State saved to JSONBin + localStorage
7. Modal closes automatically on success

### Generate Report Flow
1. User scrolls to "Handover Report" section
2. Preview shows formatted HTML with:
   - Date (local date, Cairo timezone)
   - Shift info
   - All completed fixed tasks (with times)
   - All dynamic tasks by status
   - Signature with timestamp
3. User clicks "Copy to Clipboard" → HTML copied
4. User can paste into Outlook or email client
5. Alt: User clicks "Open in Outlook" → mailto: link opens default email client

### Reset-Except-Contacts Flow
1. User clicks "Reset Everything Except Contacts" button
2. Confirmation modal appears: "Are you sure? This will clear all tasks and settings but keep your contacts."
3. If confirm: 
   - Clear all fixedTasks and dynamicTasks
   - Clear userName, shifts, timeRecordingEnabled flags
   - Preserve all contacts
   - Reset to seed data for fixedTasks
   - Save to JSONBin + localStorage
   - Show success message
4. If cancel: modal closes, no change

### Delete Task Flow
1. User clicks delete button on task
2. Native confirmation modal: "Delete this task?"
3. If confirm: task removed, state saved
4. If cancel: no change

### Sync Status Flow
1. Every state change triggers save
2. JSONBin POST starts → banner shows "Syncing..."
3. Request completes → banner updates:
   - Success: "✓ Synced" (green, fades after 2s)
   - Error: "✗ Sync failed. Using local copy" (red, persistent until retry succeeds)

---

## 4. Current Timezone & Format Specifications

### Timezone
- **Application Timezone:** Cairo (Africa/Cairo) - UTC+2 (no DST)
- **All timestamps:** Local Cairo time only (no UTC conversion in UI)
- **Format:** `HH:mm` (24-hour, no seconds)

### Date Formats
- **Email subject:** "IT Operations Handover - [DD/MM/YYYY] [Morning/Afternoon]"
- **Email body date:** "Today's Date: [Day], [MM/DD/YYYY]"
- **Report timestamps:** "[HH:mm]" next to each task

### Example Times (Cairo)
- Morning shift: 09:00 - 17:00
- Afternoon shift: 14:00 - 23:00

---

## 5. Email Template Structure

### Subject
```
IT Operations Handover - [Date] [Shift]
```

### Body (HTML)
```html
<p>Dear Recipient,</p>
<p>After greetings, kindly find below the summary of today's completed operational tasks.</p>

<p><strong>Shift Information:</strong></p>
<p>Shift Type: [Morning/Afternoon]<br>
Responsible Officer: [User Name]<br>
Today's Date: [Day], [MM/DD/YYYY]</p>

<p><strong>Completed Tasks:</strong></p>
<ul>
  [Fixed tasks where done=true]
  [Dynamic tasks where status="Completed"]
</ul>

<p><strong>In Progress Tasks:</strong></p>
<ul>
  [Dynamic tasks where status="InProgress"]
</ul>

<p><strong>Handed Over Tasks:</strong></p>
<ul>
  [Dynamic tasks where status="Handed Over"]
</ul>

<p>Best regards,<br>
[User Name]<br>
[Shift]<br>
[Date] [Time]</p>
```

---

## 6. Color Scheme (CSS Variables)
```css
--primary: #005a9e         /* Blue - buttons, headers */
--secondary: #f4f6f9       /* Light gray - backgrounds */
--text: #333               /* Dark - text */
--border: #ddd             /* Light - borders */

/* Status Badges */
--status-completed: #28a745 (green)
--status-inprogress: #856404 (orange)
--status-handover: #004085 (dark blue)
```

---

## 7. Validation Rules (Current Implementation)

### Time Format Validation
- Rule: `HH:mm` format only (24-hour)
- Accepted times: 00:00 - 23:59
- Regex: `/^\d{2}:\d{2}$/`

### Contact Validation
- Name: non-empty string (trimmed)
- Email: basic email check (contains @)
- Role: one of ["to", "cc", "none"]

### Task Title Validation
- Non-empty string (trimmed)
- Max length: 100 characters (soft limit, not enforced)

---

## 8. Browser API Dependencies

### Used
- `localStorage` - state persistence
- `fetch()` - JSONBin communication
- `clipboard.writeText()` - copy to clipboard
- `Date` - local time formatting

### Not Used
- IndexedDB (reserved for Phase 2 offline sync)
- Service Workers (reserved for Phase 2)
- FileReader (reserved for future export/import)

---

## 9. Critical Paths for Regression Testing

### Must Continue Working in Phase 1/2
1. **Load existing data:** JSONBin → localStorage fallback → render all fields correctly
2. **Cloud sync:** Every change triggers debounced POST to JSONBin + localStorage
3. **Time recording:** Toggle controls auto-timestamp behavior for fixed tasks
4. **Edit time:** Modal accepts HH:mm, validates, persists
5. **Generate report:** HTML output includes all tasks, correct formatting, correct email fields
6. **Email flow:** Clipboard copy + mailto link work correctly
7. **Confirmations:** All destructive ops require user confirmation
8. **Reset except contacts:** Clears tasks/settings but preserves email list
9. **Mobile responsive:** All flows work identically on mobile viewport

---

## 10. Known Limitations (Current) → Opportunities (Phase 1+)

| Issue | Current State | Phase 1+ Target |
|-------|---------------|-----------------|
| API keys hardcoded | Frontend JSON bins key visible | Move to backend, rotate before Phase 1 release |
| No authentication | All users access same shared state | JWT-based login + per-user data isolation |
| No audit trail | No record of who changed what, when | AuditEvent table + mutation logging |
| No offline mode | Network failure = temp local copy | IndexedDB cache + sync queue (Phase 2) |
| Single workspace | All users see same tasks/contacts | Multi-tenant with user isolation (Phase 1) |
| Manual email | Copy + paste to Outlook or mailto | Optional SMTP bridge later (not Phase 1) |
| No undo/history | Deletions permanent | Soft delete + history view (Phase 2+) |
| Basic signatures | Timestamp + user name only | Rich formatting + media references (Phase 2) |
| No metrics | No insight into task completion trends | Observability/telemetry in Phase 4 |

---

## 11. Baseline Commit Checkpoint
- **Commit message:** `[Phase 0] Baseline capture: current app state before reformation`
- **Files included:** This file, current public/index.html, server.js, data/config.json snapshots
- **Purpose:** Non-regression reference; enables diff analysis if Phase 1 rebuild finds unexpected behavior

---

## 12. Migration Mapping (Phase 3 Reference)

### Status Normalization
- `"Completed"` → `"completed"` (lowercase, Phase 3)
- `"InProgress"` → `"in_progress"` (Phase 3)
- `"Handed Over"` → `"handed_over"` (Phase 3)

### Field Renames
- `userName` → `firstName` + `lastName` (Phase 1)
- `shift` → `preferredShift` (Phase 1, enum: morning/afternoon)
- No renames for contacts, tasks, times

### New Fields (Phase 1)
- User: `email`, `passwordHash`, `createdAt`, `updatedAt`
- Contact: `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- Task: `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- New: `AuditEvent` table for all mutations

---

**Next step:** Phase 1 begins after this baseline is committed. Backend structure and SQLite schema will reference this document for parity requirements.

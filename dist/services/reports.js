import { ContactService } from './contacts.js';
import { TaskService } from './tasks.js';
/**
 * Report service: Generate handover reports
 * Based on Phase 0 email template specification
 */
export class ReportService {
    constructor(db) {
        this.db = db;
        this.contactService = new ContactService(db);
        this.taskService = new TaskService(db);
    }
    /**
     * Generate full report payload for email
     * Returns subject, recipients, cc, and HTML body ready for mailto or clipboard
     */
    async generateReportPayload(userId, userName, shift, signature) {
        // Fetch contacts
        const contacts = await this.contactService.getContactsByUserId(userId);
        const toRecipients = contacts
            .filter((c) => c.role === 'to')
            .map((c) => c.email);
        const ccRecipients = contacts
            .filter((c) => c.role === 'cc')
            .map((c) => c.email);
        // Fetch tasks
        const fixedTasks = await this.taskService.getTasksByUserId(userId, 'fixed');
        const dynamicTasks = await this.taskService.getTasksByUserId(userId, 'dynamic');
        // Generate report HTML
        const htmlBody = this.generateHtmlReport(userName, shift, fixedTasks, dynamicTasks, signature || '');
        // Generate text body (fallback)
        const textBody = this.generateTextReport(userName, shift, fixedTasks, dynamicTasks, signature || '');
        // Format date for subject
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const shiftLabel = shift === 'morning' ? 'Morning (09:00 - 17:00)' : 'Afternoon (14:00 - 23:00)';
        return {
            subject: `IT Operations Handover - ${dateStr} ${shift}`,
            recipients: toRecipients,
            cc: ccRecipients,
            htmlBody,
            textBody,
        };
    }
    /**
     * Generate HTML report based on Phase 0 template
     */
    generateHtmlReport(userName, shift, fixedTasks, dynamicTasks, signature) {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
        const completedTasks = [
            ...fixedTasks.filter((t) => t.status === 'completed'),
            ...dynamicTasks.filter((t) => t.status === 'completed'),
        ];
        const inProgressTasks = dynamicTasks.filter((t) => t.status === 'in_progress');
        const handedOverTasks = dynamicTasks.filter((t) => t.status === 'handed_over');
        const taskListHtml = (tasks) => {
            if (tasks.length === 0)
                return '<li>No tasks</li>';
            return tasks.map((t) => `<li>${t.title}${t.time ? ` [${t.time}]` : ''}</li>`).join('\n');
        };
        const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Calibri, sans-serif; font-size: 11pt; }
        h2 { color: #005a9e; margin-top: 20px; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
        .signature { margin-top: 30px; font-size: 10pt; }
    </style>
</head>
<body>
    <p>Dear Recipient,</p>
    <p>After greetings, kindly find below the summary of today's completed operational tasks.</p>

    <h2>Shift Information</h2>
    <p>
        Shift Type: <strong>${shift}</strong><br>
        Responsible Officer: <strong>${userName}</strong><br>
        Today's Date: <strong>${dateStr}</strong>
    </p>

    <h2>Completed Tasks</h2>
    <ul>
        ${taskListHtml(completedTasks)}
    </ul>

    <h2>In Progress Tasks</h2>
    <ul>
        ${taskListHtml(inProgressTasks)}
    </ul>

    <h2>Handed Over Tasks</h2>
    <ul>
        ${taskListHtml(handedOverTasks)}
    </ul>

    <div class="signature">
        <p>
            Best regards,<br>
            <strong>${userName}</strong><br>
            ${shift}<br>
            ${dateStr} ${timeStr}
            ${signature ? `<br><br>${signature}` : ''}
        </p>
    </div>
</body>
</html>
    `.trim();
    }
    /**
     * Generate plain text report (for email clients that don't support HTML)
     */
    generateTextReport(userName, shift, fixedTasks, dynamicTasks, signature) {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            weekday: 'long',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
        });
        const completedTasks = [
            ...fixedTasks.filter((t) => t.status === 'completed'),
            ...dynamicTasks.filter((t) => t.status === 'completed'),
        ];
        const inProgressTasks = dynamicTasks.filter((t) => t.status === 'in_progress');
        const handedOverTasks = dynamicTasks.filter((t) => t.status === 'handed_over');
        const taskListText = (tasks) => {
            if (tasks.length === 0)
                return '  - No tasks';
            return tasks.map((t) => `  - ${t.title}${t.time ? ` [${t.time}]` : ''}`).join('\n');
        };
        return `
Dear Recipient,

After greetings, kindly find below the summary of today's completed operational tasks.

SHIFT INFORMATION
Shift Type: ${shift}
Responsible Officer: ${userName}
Today's Date: ${dateStr}

COMPLETED TASKS
${taskListText(completedTasks)}

IN PROGRESS TASKS
${taskListText(inProgressTasks)}

HANDED OVER TASKS
${taskListText(handedOverTasks)}

---
Best regards,
${userName}
${shift}
${dateStr}
${signature ? `\n${signature}` : ''}
    `.trim();
    }
}
//# sourceMappingURL=reports.js.map
import { Database } from 'sqlite3';
import { ReportPayload } from '../types/index.js';
/**
 * Report service: Generate handover reports
 * Based on Phase 0 email template specification
 */
export declare class ReportService {
    private db;
    private contactService;
    private taskService;
    constructor(db: Database);
    /**
     * Generate full report payload for email
     * Returns subject, recipients, cc, and HTML body ready for mailto or clipboard
     */
    generateReportPayload(userId: string, userName: string, shift: 'morning' | 'afternoon', signature?: string): Promise<ReportPayload>;
    /**
     * Generate HTML report based on Phase 0 template
     */
    private generateHtmlReport;
    /**
     * Generate plain text report (for email clients that don't support HTML)
     */
    private generateTextReport;
}
//# sourceMappingURL=reports.d.ts.map
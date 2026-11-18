/** Receipt metadata survives compaction without retaining file content or an obsolete connection lease. */
export interface ConnectorJournalReceipt {
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly responseHash: string;
}

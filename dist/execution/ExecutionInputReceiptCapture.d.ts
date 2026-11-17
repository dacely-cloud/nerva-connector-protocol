import { type ExecutionInputIdentity, type ExecutionInputReceiptContext, type ExecutionInputReceipt } from './ExecutionInput.js';
/** Allows exact immutable record lookup before correlation without retaining unknown mutable input across an await. */
export declare class ExecutionInputReceiptCapture {
    #private;
    readonly leaseId: string;
    readonly identity: ExecutionInputIdentity;
    private constructor();
    /** All own fields, counters, signatures and cursor dimensions are bounded without claiming effect correlation. */
    static read(raw: unknown): ExecutionInputReceiptCapture;
    /** The sender validates its complete receipt against its retained input and pre-effect cursor before wrapping it. */
    static create(leaseId: string, receipt: ExecutionInputReceipt, context: ExecutionInputReceiptContext): ExecutionInputReceiptCapture;
    /** Forward only the already detached canonical receipt envelope; its backend receiver reloads independent correlation context. */
    encode(): string;
    /** Full first-proof hashing excludes the current delivery lease wrapper. */
    receiptJson(): string;
    /** Only this second decoder may produce a receipt DTO after its exact input and pre-effect cursor have been loaded. */
    receipt(context: ExecutionInputReceiptContext): ExecutionInputReceipt;
}

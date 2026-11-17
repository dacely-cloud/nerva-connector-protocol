import type { ExecutionInputAcknowledgment, ExecutionInputIdentity, ExecutionInputReceipt } from './ExecutionInput.js';
/** Detached wire selectors cannot release native credit until the exact retained receipt and full signatures are checked. */
export declare class ExecutionInputAcknowledgmentCapture {
    #private;
    readonly identity: ExecutionInputIdentity;
    readonly leaseId: string;
    readonly writerGeneration: bigint;
    readonly receiptSha256: string;
    private constructor();
    static read(raw: unknown): ExecutionInputAcknowledgmentCapture;
    /** Correlation is mandatory before a capture becomes an acknowledgment DTO; the native owner still verifies both signatures and first-proof SHA. */
    acknowledgment(receipt: ExecutionInputReceipt): ExecutionInputAcknowledgment;
    /** The exact detached proof is forwarded without changing its field values or inventing receipt authority. */
    encode(): string;
}

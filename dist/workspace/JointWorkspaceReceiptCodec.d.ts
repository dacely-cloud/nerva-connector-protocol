import { type JointWorkspaceReceipt, type JointWorkspaceReceiptBody, type JointWorkspaceReceiptExpected } from './JointWorkspaceReceipt.js';
/** Browser-safe exact decoding preserves the original publication commitment without treating a reply as trusted authority. */
export declare class JointWorkspaceReceiptCodec {
    #private;
    /** Wire timestamps and revisions must be canonical exact signed-int64 decimal strings. */
    static receipt(raw: unknown): JointWorkspaceReceipt;
    /** Local typed receipts are fully validated and detached before hashing or serialization. */
    static value(value: JointWorkspaceReceipt): JointWorkspaceReceipt;
    /** Only the fixed unsigned current shape enters the authority-signature transcript. */
    static body(value: JointWorkspaceReceiptBody): JointWorkspaceReceiptBody;
    /** Receiver-owned trust and the actual current lease interval are validated without reply-selected defaults. */
    static expected(value: JointWorkspaceReceiptExpected): JointWorkspaceReceiptExpected;
    /** Exact current timestamps reject JavaScript numbers and out-of-range values before arithmetic. */
    static integer(value: bigint): bigint;
    /** Oversized text is rejected before parsing; no unsigned success alternative is accepted. */
    static decode(json: string): JointWorkspaceReceipt;
    /** Typed fields validate before JSON allocation and external integers remain exact decimal strings. */
    static encode(value: JointWorkspaceReceipt): string;
}

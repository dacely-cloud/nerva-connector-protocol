import type { JointWorkspaceReceiptBody } from './JointWorkspaceReceipt.js';
import { type JointWorkspaceRetryBody, type JointWorkspaceRetry } from './JointWorkspaceRetry.js';
/** Closed current replies never interpret an unsigned conflict as authority to retry. */
export declare class JointWorkspaceRetryCodec {
    #private;
    /** Remote integers are canonical decimal quantities before any signature work. */
    static retry(raw: unknown): JointWorkspaceRetry;
    /** A typed reply remains a boundary and is copied before use. */
    static value(value: JointWorkspaceRetry): JointWorkspaceRetry;
    /** Exact current fields enter one fixed purpose-bound transcript. */
    static body(value: JointWorkspaceRetryBody): JointWorkspaceRetryBody;
    /** Shared receipt scope omits delay fields deliberately; it grants no activation. */
    static receipt(value: JointWorkspaceRetryBody): JointWorkspaceReceiptBody;
    /** Bound text before JSON parsing or composite proof verification. */
    static decode(json: string): JointWorkspaceRetry;
    /** Wire counters retain their full exact precision. */
    static encode(value: JointWorkspaceRetry): string;
}

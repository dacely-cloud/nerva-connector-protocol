import type { ExecutionInputReceiptContext } from './ExecutionInput.js';
/** Only an existing terminal original may resolve unseen input; this is structurally distinct from native write permission. */
export interface ExecutionInputTerminalResolutionBody extends ExecutionInputReceiptContext {
    readonly leaseId: string;
    readonly writerGeneration: bigint;
    readonly executionDeadlineMs: bigint;
    readonly responseHash: string;
    readonly issuedAtMs: bigint;
    readonly deliveryExpiresAtMs: bigint;
}
/** Both backend signature components authorize recording uncertainty and never native input I/O. */
export interface ExecutionInputTerminalResolution extends ExecutionInputTerminalResolutionBody {
    readonly signature: string;
}
export declare class ExecutionInputTerminalResolutionLimits {
    static readonly jsonBytes: number;
    static readonly deliveryMs: bigint;
}

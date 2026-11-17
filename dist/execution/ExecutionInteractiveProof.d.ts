import type { ExecutionInputTerminalResolutionBody } from './ExecutionInputTerminalResolution.js';
import type { ExecutionInteractiveReady, ExecutionInteractiveReadyBody } from './ExecutionInteractive.js';
import { type ExecutionInputOriginal, type ExecutionInputPermitBody, type ExecutionInputReceiptBody, type ExecutionInputReceiptContext, type ExecutionInputReceipt, type ExecutionInputAcknowledgmentBody } from './ExecutionInput.js';
/** Hashes and purpose-selected payloads grant no effects without independent pins, signatures and shared ownership checks. */
export declare class ExecutionInteractiveProof {
    #private;
    /** Terminal resolution authenticates only an exact retained input/Ready and actual response hash; it never grants a native write. */
    static resolution(value: ExecutionInputTerminalResolutionBody, ready: ExecutionInteractiveReady): Uint8Array;
    static ready(value: ExecutionInteractiveReadyBody): Uint8Array;
    /** Full first proofs, including their randomized composite signature, remain immutable commitments. */
    static readySha256(value: ExecutionInteractiveReady): string;
    static dataHash(bytes: Uint8Array): string;
    static inputHash(value: ExecutionInputOriginal): string;
    /** The initial range is checked against independently captured launch bytes, not merely against another device assertion. */
    static initial(value: ExecutionInputOriginal, ready: ExecutionInteractiveReadyBody, launch: Uint8Array): void;
    /** Lease renewal wraps the retained Ready/control; it cannot substitute a first proof or extend that recorded deadline. */
    static permit(value: ExecutionInputPermitBody, ready: ExecutionInteractiveReady): Uint8Array;
    static receipt(value: ExecutionInputReceiptBody, context: ExecutionInputReceiptContext): Uint8Array;
    static receiptSha256(value: ExecutionInputReceipt, context: ExecutionInputReceiptContext): string;
    static acknowledgment(value: ExecutionInputAcknowledgmentBody, receipt: ExecutionInputReceipt, context: ExecutionInputReceiptContext): Uint8Array;
}

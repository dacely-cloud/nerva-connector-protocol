import { type ExecutionInteractiveReadyBody } from './ExecutionInteractive.js';
import { type ExecutionInputOriginal, type ExecutionInputPermitBody, type ExecutionInputReceiptBody, type ExecutionInputReceiptContext, type ExecutionInputAcknowledgmentBody, type ExecutionInputReceipt } from './ExecutionInput.js';
/** Browser-safe signing payloads contain no keys, hashing implementation, authority state or runtime handles. */
export declare class ExecutionInteractiveTranscript {
    #private;
    static ready(value: ExecutionInteractiveReadyBody): Uint8Array;
    static input(value: ExecutionInputOriginal): Uint8Array;
    static permit(value: ExecutionInputPermitBody): Uint8Array;
    static receipt(value: ExecutionInputReceiptBody, context: ExecutionInputReceiptContext): Uint8Array;
    static acknowledgment(value: ExecutionInputAcknowledgmentBody, receipt: ExecutionInputReceipt): Uint8Array;
}

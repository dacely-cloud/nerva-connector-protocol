import type { ExecutionInputAcknowledgment, ExecutionInputAcknowledgmentBody, ExecutionInputReceipt } from './ExecutionInput.js';
/** Acknowledgments identify the first retained receipt; its complete proof hash is checked independently before credit release. */
export declare class ExecutionInputAcknowledgmentCodec {
    #private;
    static read(raw: unknown, receipt: ExecutionInputReceipt): ExecutionInputAcknowledgment;
    static decode(json: string, receipt: ExecutionInputReceipt): ExecutionInputAcknowledgment;
    static encode(value: ExecutionInputAcknowledgment, receipt: ExecutionInputReceipt): string;
    static body(value: ExecutionInputAcknowledgmentBody, receipt: ExecutionInputReceipt): ExecutionInputAcknowledgmentBody;
    static unsigned(value: ExecutionInputAcknowledgment, receipt: ExecutionInputReceipt): ExecutionInputAcknowledgmentBody;
}

import { type ExecutionInputReceipt, type ExecutionInputReceiptBody, type ExecutionInputReceiptContext } from './ExecutionInput.js';
/** Receipt decoding always compares the captured immutable input and pre-control cursor. */
export declare class ExecutionInputReceiptCodec {
    #private;
    static read(raw: unknown, context: ExecutionInputReceiptContext): ExecutionInputReceipt;
    static decode(json: string, context: ExecutionInputReceiptContext): ExecutionInputReceipt;
    static encode(value: ExecutionInputReceipt, context: ExecutionInputReceiptContext): string;
    static body(value: ExecutionInputReceiptBody, context: ExecutionInputReceiptContext): ExecutionInputReceiptBody;
    static unsigned(value: ExecutionInputReceipt, context: ExecutionInputReceiptContext): ExecutionInputReceiptBody;
}

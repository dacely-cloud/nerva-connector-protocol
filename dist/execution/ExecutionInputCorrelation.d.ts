import { type ExecutionInputReceiptContext, type ExecutionInputReceiptBody } from './ExecutionInput.js';
/** Pure correlation is distinct from signature verification and shared admission/ownership fences. */
export declare class ExecutionInputCorrelation {
    #private;
    /** Only this validator's exact deep-frozen returned captures can bypass repeated context parsing; raw and cloned records always validate. */
    static context(value: ExecutionInputReceiptContext): ExecutionInputReceiptContext;
    /** Rejection consumes an actual processed control or blocks; uncertainty never invents native processing. */
    static match(value: ExecutionInputReceiptBody, context: ExecutionInputReceiptContext): void;
}

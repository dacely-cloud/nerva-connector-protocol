import type { ExecutionInputPermit, ExecutionInputPermitBody } from './ExecutionInput.js';
/** Fresh lease/writer delivery authority cannot change the immutable control or its original deadline. */
export declare class ExecutionInputPermitCodec {
    #private;
    static read(raw: unknown): ExecutionInputPermit;
    static decode(json: string): ExecutionInputPermit;
    static encode(value: ExecutionInputPermit): string;
    static body(value: ExecutionInputPermitBody): ExecutionInputPermitBody;
    static unsigned(value: ExecutionInputPermit): ExecutionInputPermitBody;
}

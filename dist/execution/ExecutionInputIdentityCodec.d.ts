import { ExecutionInteractiveEncoding as Encoding } from './ExecutionInteractiveFields.js';
import type { ExecutionInputIdentity, ExecutionInputOriginal } from './ExecutionInput.js';
/** A receipt cannot adopt whichever job, dispatch, Ready proof or input currently happens to be visible. */
export declare class ExecutionInputIdentityCodec {
    static capture(value: Readonly<Record<string, unknown>>, encoding: Encoding): ExecutionInputIdentity;
    static matches(value: ExecutionInputIdentity, input: ExecutionInputOriginal, inputHash: string): boolean;
}

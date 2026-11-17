import { ExecutionInteractiveEncoding as Encoding } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveTransport } from './ExecutionInteractive.js';
import type { ExecutionInputCursor } from './ExecutionInput.js';
/** No missing cursor can become a fresh input sequence or an implicitly accepted empty range. */
export declare class ExecutionInputCursorCodec {
    #private;
    static capture(raw: unknown, transport: ExecutionInteractiveTransport, encoding: Encoding): ExecutionInputCursor;
}

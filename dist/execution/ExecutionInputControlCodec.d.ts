import { ExecutionInteractiveEncoding as Encoding } from './ExecutionInteractiveFields.js';
import { type ExecutionInteractiveReadyBody } from './ExecutionInteractive.js';
import { type ExecutionInputControl, type ExecutionInputOriginal } from './ExecutionInput.js';
/** Live control decoding is separate from the existing positional ExecutionInputCodec. */
export declare class ExecutionInputControlCodec {
    #private;
    static readonly fields: readonly string[];
    static read(raw: unknown): ExecutionInputOriginal;
    static decode(json: string): ExecutionInputOriginal;
    static encode(value: ExecutionInputOriginal): string;
    /** Capturing internal DTOs also checks closed own data fields before hashing or asynchronous work. */
    static capture(raw: unknown, encoding: Encoding): ExecutionInputOriginal;
    /** A closed discriminator is inspected without invoking a getter before the exact variant is copied. */
    static control(raw: unknown, encoding: Encoding): ExecutionInputControl;
    /** Initial bytes/hash must match the separately captured launch and its first Ready proof before input zero can be released. */
    static initial(value: ExecutionInputOriginal, ready: ExecutionInteractiveReadyBody, launch: Uint8Array): void;
    /** Canonical padded binary base64 is bounded before allocation; dataHash verification belongs to the proof helper. */
    static bytes(raw: unknown): Uint8Array;
}

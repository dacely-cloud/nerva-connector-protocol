import { type ExecutionInteractiveReady, type ExecutionInteractiveReadyBody } from './ExecutionInteractive.js';
/** Ready proves a confined native incarnation; it never acknowledges initial application input. */
export declare class ExecutionInteractiveCodec {
    #private;
    static read(raw: unknown): ExecutionInteractiveReady;
    /** The bounded raw decoder runs before parsing or composite verification. */
    static decode(json: string): ExecutionInteractiveReady;
    static encode(value: ExecutionInteractiveReady): string;
    /** Signers supply an explicit unsigned body; it is not a verification substitute for read(). */
    static body(value: ExecutionInteractiveReadyBody): ExecutionInteractiveReadyBody;
    /** A verified signed proof can expose its exact immutable signing body without its randomized signature. */
    static unsigned(value: ExecutionInteractiveReady): ExecutionInteractiveReadyBody;
}

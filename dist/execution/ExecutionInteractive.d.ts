import type { ExecutionLane } from './ExecutionLane.js';
/** Neither application pipes nor PTYs are implied by an existing foreground grant. */
export declare enum ExecutionInteractiveTransport {
    Pipe = "pipe",
    Pty = "pty"
}
/** Readiness and controls preserve the exact dispatched operation and native incarnation. */
export interface ExecutionInteractiveOriginal {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly lane: ExecutionLane;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly transport: ExecutionInteractiveTransport;
    readonly incarnation: string;
}
/** PTY geometry is explicit; a pipe has null dimensions and never receives a resize. */
export interface ExecutionInteractiveDimensions {
    readonly cols: number;
    readonly rows: number;
}
/** Native readiness commits the reserved initial range without claiming that it was accepted. */
export interface ExecutionInteractiveReadyBody extends ExecutionInteractiveOriginal {
    readonly initialInputSequence: 0n;
    readonly initialInputBytes: bigint;
    readonly initialInputHash: string;
    readonly dimensions: ExecutionInteractiveDimensions | null;
    readonly executionDeadlineMs: bigint;
}
/** Both device signature components cover one complete immutable Ready body. */
export interface ExecutionInteractiveReady extends ExecutionInteractiveReadyBody {
    readonly signature: string;
}
/** These ceilings bound protocol work; they do not advertise an installed interactive capability. */
export declare class ExecutionInteractiveLimits {
    static readonly frameBytes: number;
    static readonly initialBytes: number;
    static readonly inputBytes: bigint;
    /** Initial record zero consumes one of the 256 total controls. */
    static readonly controls: bigint;
    static readonly maximumInputSequence: bigint;
    static readonly resizes: bigint;
    static readonly minimumCols: number;
    static readonly maximumCols: number;
    static readonly minimumRows: number;
    static readonly maximumRows: number;
    static readonly executionMs: bigint;
    static readonly outputBytes: number;
    /** 2484 composite signature bytes become exactly 3312 base64url characters. */
    static readonly signatureBytes: number;
    static readonly signatureCharacters: number;
    static readonly readyJsonBytes: number;
    static readonly inputJsonBytes: number;
    static readonly permitJsonBytes: number;
    static readonly receiptJsonBytes: number;
    static readonly acknowledgmentJsonBytes: number;
    /** This is a fixed chain genesis, not a claim that input zero was accepted. */
    static readonly genesisHash: string;
    static readonly initialInputId: string;
}

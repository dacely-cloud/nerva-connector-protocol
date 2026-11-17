import type { ExecutionInteractiveOriginal, ExecutionInteractiveDimensions } from './ExecutionInteractive.js';
/** Control intent is explicit and is never inferred from an empty write or a shell name. */
export declare enum ExecutionInputKind {
    Data = "data",
    End = "end",
    Resize = "resize"
}
/** Receipt disposition does not assert application consumption or successful command completion. */
export declare enum ExecutionInputDisposition {
    Applied = "applied",
    Rejected = "rejected",
    Indeterminate = "indeterminate"
}
/** Data is a single exact binary range; bytes cannot be repartitioned after admission uncertainty. */
export interface ExecutionInputData {
    readonly kind: ExecutionInputKind.Data;
    readonly offset: bigint;
    readonly byteLength: bigint;
    readonly dataBase64: string;
    readonly dataHash: string;
}
/** End closes a pipe writer after this exact final offset; it is not PTY Ctrl-D or hangup. */
export interface ExecutionInputEnd {
    readonly kind: ExecutionInputKind.End;
    readonly offset: bigint;
}
/** Only the owned PTY master can apply these bounded dimensions. */
export interface ExecutionInputResize extends ExecutionInteractiveDimensions {
    readonly kind: ExecutionInputKind.Resize;
}
export type ExecutionInputControl = ExecutionInputData | ExecutionInputEnd | ExecutionInputResize;
/** The first complete Ready proof and every original control byte are part of the immutable input identity. */
export interface ExecutionInputOriginal extends ExecutionInteractiveOriginal {
    readonly readySha256: string;
    readonly inputId: string;
    readonly inputSequence: bigint;
    readonly previousInputHash: string;
    readonly control: ExecutionInputControl;
}
/** Current delivery/writer fences wrap an unchanged control; they cannot replace its Ready incarnation or input bytes. */
export interface ExecutionInputPermitBody {
    readonly input: ExecutionInputOriginal;
    readonly inputHash: string;
    readonly leaseId: string;
    readonly writerGeneration: bigint;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly executionDeadlineMs: bigint;
}
export interface ExecutionInputPermit extends ExecutionInputPermitBody {
    readonly signature: string;
}
/** Before initial acceptance both processed sequence and hash are null; an empty initial range still needs explicit acceptance. */
export interface ExecutionInputCursor {
    readonly processedSequence: bigint | null;
    readonly processedInputHash: string | null;
    readonly initialAccepted: boolean;
    /** Uncertainty or an unprocessed device-level refusal prevents every later input. */
    readonly blocked: boolean;
    /** Last confirmed accepted prefix; Indeterminate does not rule out an additional unconfirmed kernel write. */
    readonly acceptedOffset: bigint;
    readonly ended: boolean;
    readonly dimensions: ExecutionInteractiveDimensions | null;
    readonly resizeCount: bigint;
}
/** The admission owner retains this exact pre-control cursor and immutable input across retries. */
export interface ExecutionInputReceiptContext {
    readonly input: ExecutionInputOriginal;
    readonly inputHash: string;
    readonly prior: ExecutionInputCursor;
}
/** Receipts commit controls by full hash without echoing their private application bytes. */
export interface ExecutionInputIdentity extends ExecutionInteractiveOriginal {
    readonly readySha256: string;
    readonly inputId: string;
    readonly inputSequence: bigint;
    readonly inputHash: string;
}
export interface ExecutionInputReceiptBody extends ExecutionInputIdentity {
    readonly disposition: ExecutionInputDisposition;
    readonly cursor: ExecutionInputCursor;
}
export interface ExecutionInputReceipt extends ExecutionInputReceiptBody {
    readonly signature: string;
}
/** Credit is released only for this first complete majority-durable receipt proof, never from an unsigned cursor. */
export interface ExecutionInputAcknowledgmentBody extends ExecutionInputIdentity {
    readonly receiptSha256: string;
    readonly leaseId: string;
    readonly writerGeneration: bigint;
}
export interface ExecutionInputAcknowledgment extends ExecutionInputAcknowledgmentBody {
    readonly signature: string;
}

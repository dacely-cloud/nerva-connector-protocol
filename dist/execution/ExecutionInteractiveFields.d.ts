import { ExecutionInteractiveTransport, type ExecutionInteractiveOriginal, type ExecutionInteractiveDimensions } from './ExecutionInteractive.js';
import type { ExecutionInputPermitBody } from './ExecutionInput.js';
/** Wire readers require decimal strings; typed encoders require exact internal bigint values. */
export declare enum ExecutionInteractiveEncoding {
    Wire = 0,
    Internal = 1
}
/** Shared pure readers detach closed data before any signature, native I/O or asynchronous work. */
export declare class ExecutionInteractiveFields {
    #private;
    static readonly originalFields: readonly string[];
    static readonly inputIdentityFields: readonly string[];
    /** Missing fields, accessors, symbols and hidden authority are rejected without invoking their values. */
    static record(raw: unknown, fields: readonly string[]): Readonly<Record<string, unknown>>;
    /** The existing enrollment, nonce and lane encodings remain unchanged. */
    static original(value: Readonly<Record<string, unknown>>, encoding: ExecutionInteractiveEncoding): ExecutionInteractiveOriginal;
    /** Every external counter is canonical decimal and every internal counter preserves signed-int64 precision. */
    static counter(raw: unknown, encoding: ExecutionInteractiveEncoding, minimum: bigint, maximum?: bigint): bigint;
    static digest(raw: unknown): string;
    /** Comparison never substitutes a newer job, transport, dispatch or native incarnation. */
    static sameOriginal(left: ExecutionInteractiveOriginal, right: ExecutionInteractiveOriginal): boolean;
    /** A pipe explicitly carries null geometry; PTY dimensions do not come from a process identifier. */
    static dimensions(raw: unknown, transport: ExecutionInteractiveTransport): ExecutionInteractiveDimensions | null;
    static cols(raw: unknown): number;
    static rows(raw: unknown): number;
    static boolean(raw: unknown): boolean;
    /** Exactly both fixed signature components are present before cryptographic verification. */
    static signature(raw: unknown): string;
    /** Raw byte ceilings precede JSON parsing and any expensive proof work. */
    static decode(json: string, maximum: number): unknown;
    /** Only previously detached DTOs enter this serializer; the decoder owns their closed field sets. */
    static encode(value: ExecutionInteractiveOriginal | ExecutionInputPermitBody, maximum: number): string;
}

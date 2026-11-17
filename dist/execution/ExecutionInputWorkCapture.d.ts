import type { ExecutionInputTerminalResolution } from './ExecutionInputTerminalResolution.js';
import type { ExecutionInputPermit } from './ExecutionInput.js';
import { ExecutionInputAcknowledgmentCapture } from './ExecutionInputAcknowledgmentCapture.js';
/** One bounded work observation contains at most one unchanged control and one contextual ACK candidate, consumed ACK first. */
export declare class ExecutionInputWorkCapture {
    #private;
    readonly permit: ExecutionInputPermit | null;
    readonly acknowledgment: ExecutionInputAcknowledgmentCapture | null;
    readonly resolution: ExecutionInputTerminalResolution | null;
    static readonly maximumBytes: number;
    private constructor();
    static read(raw: unknown): ExecutionInputWorkCapture;
    /** Empty observation can drain a retained outbox; it grants no input or native acceptance. */
    static empty(): ExecutionInputWorkCapture;
    static acknowledged(acknowledgment: ExecutionInputAcknowledgmentCapture): ExecutionInputWorkCapture;
    encode(): string;
}

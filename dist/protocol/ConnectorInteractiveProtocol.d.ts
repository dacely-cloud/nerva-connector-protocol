import type { ExecutionInputWorkCapture } from '../execution/ExecutionInputWorkCapture.js';
import type { ExecutionInteractiveOriginal } from '../execution/ExecutionInteractive.js';
import { ExecutionInteractiveEncoding as Encoding } from '../execution/ExecutionInteractiveFields.js';
import type { ExecutionInteractiveReady } from '../execution/ExecutionInteractive.js';
/** The current lease wraps one unchanged first Ready proof; stored echoes are flow control only. */
export interface ConnectorInteractiveReadyEnvelope {
    readonly leaseId: string;
    readonly ready: ExecutionInteractiveReady;
}
/** Closed ready envelopes never imply application bytes were accepted or provide a replacement native grant. */
export declare class ConnectorInteractiveProtocol {
    static original(raw: unknown, work: ExecutionInputWorkCapture, encoding?: Encoding): ExecutionInteractiveOriginal;
    static encodeOriginal(original: ExecutionInteractiveOriginal, work: ExecutionInputWorkCapture): string;
    static ready(raw: unknown): ConnectorInteractiveReadyEnvelope;
    static encodeReady(value: ConnectorInteractiveReadyEnvelope): string;
}

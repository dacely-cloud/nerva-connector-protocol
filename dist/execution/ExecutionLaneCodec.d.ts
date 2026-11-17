import { ExecutionLane } from './ExecutionLane.js';
/** Lane admission is shared by foreground and interactive codecs without importing job codecs. */
export declare class ExecutionLaneCodec {
    /** A caller cannot allocate arbitrary replay journals or increase concurrency through new lane names. */
    static read(raw: unknown): ExecutionLane;
}

import { type ExecutionInputTerminalResolutionBody, type ExecutionInputTerminalResolution } from './ExecutionInputTerminalResolution.js';
/** A closed no-effect authorization cannot decode as an InputPermit or extend the original execution deadline. */
export declare class ExecutionInputTerminalResolutionCodec {
    #private;
    static read(raw: unknown): ExecutionInputTerminalResolution;
    static decode(json: string): ExecutionInputTerminalResolution;
    static body(value: ExecutionInputTerminalResolutionBody): ExecutionInputTerminalResolutionBody;
    static unsigned(value: ExecutionInputTerminalResolution): ExecutionInputTerminalResolutionBody;
    static encode(value: ExecutionInputTerminalResolution): string;
    static payload(value: ExecutionInputTerminalResolutionBody): Uint8Array;
}

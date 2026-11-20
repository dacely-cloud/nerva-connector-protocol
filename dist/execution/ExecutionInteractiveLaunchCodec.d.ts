import type { ExecutionInteractiveLaunch, ExecutionInteractiveInvocationRule } from './ExecutionInteractiveInvocation.js';
/** One canonical argument commits application input, transport, geometry and the immutable execution deadline. */
export declare class ExecutionInteractiveLaunchCodec {
    #private;
    /** Byte bounds precede parsing; duplicate keys, alternate escaping and alternate ordering are rejected. */
    static decode<Integer extends bigint | string>(rule: ExecutionInteractiveInvocationRule<Integer>, json: string): ExecutionInteractiveLaunch;
    /** The same closed validators apply before a controller captures its first signed request. */
    static encode<Integer extends bigint | string>(rule: ExecutionInteractiveInvocationRule<Integer>, raw: unknown): string;
    /** Admission and first launch use trusted time; recovery only follows the captured deadline. */
    static admit<Integer extends bigint | string>(rule: ExecutionInteractiveInvocationRule<Integer>, json: string, nowMs: bigint): ExecutionInteractiveLaunch;
}

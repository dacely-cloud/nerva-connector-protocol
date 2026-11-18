import { type ExecutionMachineInvocationRule, type ExecutionMachineInvocation, type ExecutionMachinePlan } from './ExecutionMachineInvocation.js';
/** One exact signed string carries a closed invocation; this codec never starts processes or interprets arbitrary text as authority. */
export declare class ExecutionMachineInvocationCodec {
    #private;
    /** Input is bounded before parsing, and alternate key ordering, duplicate JSON keys or escaping is rejected. */
    static decode(rule: ExecutionMachineInvocationRule, json: string): ExecutionMachineInvocation;
    /** Trusted adapters construct canonical payloads only after the same local-grant and envelope validation. */
    static encode(rule: ExecutionMachineInvocationRule, raw: unknown): string;
    /** Complete immutable inputs retain empty stdin/environment explicitly rather than inheriting host state. */
    static read(rule: ExecutionMachineInvocationRule, raw: unknown): ExecutionMachineInvocation;
    /** Resolve only the owning program's pinned binary table; the structured JSON is never forwarded as a literal argv entry. */
    static resolve(rule: ExecutionMachineInvocationRule, json: string): ExecutionMachinePlan;
}

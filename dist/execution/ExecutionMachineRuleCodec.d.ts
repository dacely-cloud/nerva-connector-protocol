import { type ExecutionArgumentRule, type ExecutionProgramPolicy } from './ExecutionPolicyTypes.js';
import { type ExecutionMachineInvocationRule } from './ExecutionMachineInvocation.js';
/** Local policy and signed public profiles independently decode the same entire explicit Machine invocation grant. */
export declare class ExecutionMachineRuleCodec {
    #private;
    /** Public fields contain finite aliases and table indexes, never private executable paths or digests. */
    static read(raw: unknown): ExecutionMachineInvocationRule;
    /** Structured invocation cannot be mixed with positional literals, omitted or interpreted through an old text rule. */
    static placement<Integer extends bigint | string>(rules: readonly ExecutionArgumentRule<Integer>[]): ExecutionMachineInvocationRule | null;
    /** Local policy indexes resolve only existing pinned binaries and cannot exceed its independent wall-time ceiling. */
    static program(program: ExecutionProgramPolicy, timeoutMs: number): void;
}

import { type ExecutionArgumentRule } from './ExecutionPolicyTypes.js';
import type { ExecutionInteractiveInvocationRule } from './ExecutionInteractiveInvocation.js';
/** Explicit bounded input authority is decoded independently from process launch and native readiness. */
export declare class ExecutionInteractiveRuleCodec {
    #private;
    /** Public wire byte counters are canonical decimal strings, never rounded JSON numbers. */
    static read(raw: unknown): ExecutionInteractiveInvocationRule;
    /** Trusted projections still detach every field and validate internal integer precision. */
    static body(value: ExecutionInteractiveInvocationRule): ExecutionInteractiveInvocationRule;
    /** A complete interactive grant cannot coexist with foreground or positional arguments. */
    static placement(rules: readonly ExecutionArgumentRule[]): ExecutionInteractiveInvocationRule | null;
    /** A nested Machine grant retains the profile's independent wall-time ceiling. */
    static profile(rules: readonly ExecutionArgumentRule[], timeoutMs: number): void;
}

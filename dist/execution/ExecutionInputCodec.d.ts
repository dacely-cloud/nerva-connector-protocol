import { type ExecutionArgumentRule, type ExecutionArgumentPolicy, type ExecutionInvocation } from './ExecutionPolicyTypes.js';
/** Pure finite input grammar is enforced independently by account admission and the local execution owner. */
export declare class ExecutionInputCodec {
    #private;
    /** Variable arguments are validated independently of a program's interpretation and never shell-joined. */
    static invocation(raw: unknown): ExecutionInvocation;
    /** Fixed positions are inserted locally; variable input cannot add switches, trailing arguments or environment values. */
    static arguments(program: ExecutionArgumentPolicy, input: readonly string[]): readonly string[];
    /** Digests authenticate locally reviewed bytes only when the policy itself came from trusted installation. */
    static digest(raw: unknown): string;
    /** The same strict argument grammar governs local policy and published variable-position grants. */
    static argumentRule(raw: unknown): ExecutionArgumentRule;
}

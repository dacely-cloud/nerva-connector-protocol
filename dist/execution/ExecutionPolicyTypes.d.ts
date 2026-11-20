import type { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
import type { ExecutionResourceLimits, ExecutionWorkspaceAccess } from './ExecutionTypes.js';
import type { ExecutionMachineInvocationRule } from './ExecutionMachineInvocation.js';
import type { ExecutionInteractiveInvocationRule } from './ExecutionInteractiveInvocation.js';
/** Exact local switches cannot be replaced or added by a remote request. */
export interface ExecutionLiteralArgument {
    readonly kind: typeof ExecutionArgumentKind.Literal;
    readonly value: string;
}
/** Choices are finite exact bytes, not prefix matches or command names. */
export interface ExecutionChoiceArgument {
    readonly kind: typeof ExecutionArgumentKind.Choice;
    readonly values: readonly string[];
}
/** Free text is a deliberate grant at a particular argument position and remains bounded UTF-8 data. */
export interface ExecutionTextArgument {
    readonly kind: typeof ExecutionArgumentKind.Text;
    readonly maximumBytes: number;
}
/** Relative arguments cannot introduce traversal, absolute references or option prefixes. */
export interface ExecutionPathArgument {
    readonly kind: typeof ExecutionArgumentKind.RelativePath;
    readonly maximumBytes: number;
}
/** Programs may interpret their arguments; kernel confinement remains mandatory independently of every rule. */
export type ExecutionArgumentRule<Integer extends bigint | string = bigint> = ExecutionLiteralArgument | ExecutionChoiceArgument | ExecutionTextArgument | ExecutionPathArgument | ExecutionMachineInvocationRule | ExecutionInteractiveInvocationRule<Integer>;
/** A clean, immutable runtime contains only locally reviewed tooling and runtime data. */
export interface ExecutionBinaryPolicy {
    readonly path: string;
    readonly sha256: string;
}
/** Positional input rules are independent of private executable paths and child binary configuration. */
export interface ExecutionArgumentPolicy {
    readonly arguments: readonly ExecutionArgumentRule[];
}
/** Initial argument rules and every permitted subprocess executable are separate explicit local grants. */
export interface ExecutionProgramPolicy extends ExecutionBinaryPolicy {
    readonly id: string;
    readonly rootIds: readonly string[];
    readonly arguments: readonly ExecutionArgumentRule[];
    readonly children: readonly ExecutionBinaryPolicy[];
}
/** Workspace access belongs to the local root grant, not a caller-selected execution flag. */
export interface ExecutionRootPolicy {
    readonly id: string;
    readonly path: string;
    readonly access: ExecutionWorkspaceAccess;
}
/** One protected current policy controls runtime, directories, executable bytes and hard resource ceilings. */
export interface ExecutionPolicyDefinition {
    readonly installationId: string;
    readonly revision: bigint;
    readonly trampolineFile: string;
    readonly trampolineSha256: string;
    readonly bubblewrapFile: string;
    readonly bubblewrapSha256: string;
    readonly runtimeDirectory: string;
    readonly cgroupRoot: string;
    readonly roots: readonly ExecutionRootPolicy[];
    readonly programs: readonly ExecutionProgramPolicy[];
    readonly resources: ExecutionResourceLimits;
    readonly timeoutMs: number;
    readonly maximumAddressBytes: bigint;
    readonly maximumFileBytes: bigint;
}
/** The signed owner resolves local grants; no remote caller chooses a host path, environment, executable or resource ceiling. */
export interface ExecutionInvocation {
    readonly policySha256: string;
    readonly programId: string;
    readonly rootId: string;
    readonly arguments: readonly string[];
}

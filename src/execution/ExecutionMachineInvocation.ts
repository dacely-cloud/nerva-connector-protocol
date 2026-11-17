// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionArgumentKind } from './ExecutionArgumentKind.js';

/** Shell code and direct argv are distinct grants and never fallback interpretations. */
export enum ExecutionMachineMode {
    Shell = 'shell',
    Argv = 'argv',
}

/** These ceilings supplement the unchanged outer argument and canonical request bounds. */
export class ExecutionMachineLimits {
    /** JSON escaping counts toward the complete single-argument byte ceiling. */
    public static readonly payloadBytes: number = 4096;
    /** Root-relative paths are resolved later beneath the already opened native root. */
    public static readonly cwdBytes: number = 512;
    /** Script content is code only when the local shell grant exists. */
    public static readonly scriptBytes: number = 2048;
    /** Initial finite input is separate from the private native bootstrap channel. */
    public static readonly stdinBytes: number = 1024;
    /** An exact argv alias selects at most the parent binary and its eight existing children. */
    public static readonly executables: number = 9;
    /** The resolved native argv retains its existing thirty-two-position ceiling. */
    public static readonly argumentCount: number = 32;
    /** Individual direct argv values stay small enough for the complete payload. */
    public static readonly argumentBytes: number = 1024;
    /** Aggregate direct argument bytes do not replace the JSON envelope check. */
    public static readonly argumentsBytes: number = 2048;
    /** Fixed shell switches are deliberate public policy, independent of positional private literals. */
    public static readonly fixedArguments: number = 16;
    /** Environment names are exact local grants, never patterns or inherited host state. */
    public static readonly environmentNames: number = 16;
    /** Name and value bytes both consume the granted environment budget. */
    public static readonly environmentBytes: number = 1024;
    /** Native foreground ownership retains its existing thirty-second hard limit. */
    public static readonly timeoutMs: number = 30000;
}

/** This index refers only to the owning program's pinned [program, ...children] table. */
export interface ExecutionMachineCommand {
    readonly alias: string;
    readonly executableIndex: number;
}

/** Fixed local switches precede the signed script, without guessing shell syntax from an executable name. */
export interface ExecutionMachineShell {
    readonly executableIndex: number;
    readonly fixedArguments: readonly string[];
}

/** A permitted environment name has its own UTF-8 value ceiling. */
export interface ExecutionMachineEnvironmentGrant {
    readonly name: string;
    readonly maximumBytes: number;
}

/** The complete explicit local opt-in is published under the device's existing signed profile. */
export interface ExecutionMachineInvocationRule {
    readonly kind: ExecutionArgumentKind.MachineInvocation;
    readonly shell: ExecutionMachineShell | null;
    readonly commands: readonly ExecutionMachineCommand[];
    readonly maximumCwdBytes: number;
    readonly environment: readonly ExecutionMachineEnvironmentGrant[];
    readonly maximumEnvironmentBytes: number;
    readonly maximumStdinBytes: number;
    readonly maximumTimeoutMs: number;
    readonly maximumArguments: number;
    readonly maximumArgumentBytes: number;
    readonly maximumArgumentsBytes: number;
    readonly maximumScriptBytes: number;
}

/** Explicit input pairs admit deterministic ordering without prototype-selected environment keys. */
export interface ExecutionMachineEnvironmentValue {
    readonly name: string;
    readonly value: string;
}

/** These fields are part of the original signed JSON argument, never an unsigned execution side channel. */
export interface ExecutionMachineInput {
    readonly cwd: string;
    readonly environment: readonly ExecutionMachineEnvironmentValue[];
    readonly stdin: string;
    readonly timeoutMs: number;
}

/** A shell script cannot be interpreted as direct argv or executed without a shell grant. */
export interface ExecutionMachineShellInvocation extends ExecutionMachineInput {
    readonly mode: ExecutionMachineMode.Shell;
    readonly script: string;
}

/** The command is an exact configured public alias, never an OS path or fallback shell command. */
export interface ExecutionMachineArgvInvocation extends ExecutionMachineInput {
    readonly mode: ExecutionMachineMode.Argv;
    readonly command: string;
    readonly argv: readonly string[];
}

/** Closed variants retain the caller's deliberate execution mode. */
export type ExecutionMachineInvocation =
    ExecutionMachineShellInvocation | ExecutionMachineArgvInvocation;

/** A detached final plan is consumed by the trusted native owner; the JSON argument is never passed literally to a program. */
export interface ExecutionMachinePlan {
    readonly executableIndex: number;
    readonly arguments: readonly string[];
    readonly cwd: string;
    readonly environment: readonly ExecutionMachineEnvironmentValue[];
    readonly stdin: string;
    readonly timeoutMs: number;
}

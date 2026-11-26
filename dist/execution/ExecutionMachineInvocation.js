// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Shell code and direct argv are distinct grants and never fallback interpretations. */
export var ExecutionMachineMode;
(function (ExecutionMachineMode) {
    ExecutionMachineMode["Shell"] = "shell";
    ExecutionMachineMode["Argv"] = "argv";
})(ExecutionMachineMode || (ExecutionMachineMode = {}));
/** These ceilings supplement the unchanged outer argument and canonical request bounds. */
export class ExecutionMachineLimits {
    /** JSON escaping counts toward the complete single-argument byte ceiling. */
    static payloadBytes = 4096;
    /** Root-relative paths are resolved later beneath the already opened native root. */
    static cwdBytes = 512;
    /** Script content is code only when the local shell grant exists. */
    static scriptBytes = 2048;
    /** Initial finite input is separate from the private native bootstrap channel. */
    static stdinBytes = 1024;
    /** An exact argv alias selects at most the parent binary and its eight existing children. */
    static executables = 9;
    /** The resolved native argv retains its existing thirty-two-position ceiling. */
    static argumentCount = 32;
    /** Individual direct argv values stay small enough for the complete payload. */
    static argumentBytes = 1024;
    /** Aggregate direct argument bytes do not replace the JSON envelope check. */
    static argumentsBytes = 2048;
    /** Fixed shell switches are deliberate public policy, independent of positional private literals. */
    static fixedArguments = 16;
    /** Environment names are exact local grants, never patterns or inherited host state. */
    static environmentNames = 16;
    /** Name and value bytes both consume the granted environment budget. */
    static environmentBytes = 1024;
    /** Native foreground ownership retains its existing thirty-second hard limit. */
    static timeoutMs = 30000;
}

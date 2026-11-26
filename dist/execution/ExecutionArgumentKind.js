// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Fixed arguments remain local; callers supply only the explicitly variable positions. */
export var ExecutionArgumentKind;
(function (ExecutionArgumentKind) {
    ExecutionArgumentKind["Literal"] = "literal";
    ExecutionArgumentKind["Choice"] = "choice";
    ExecutionArgumentKind["Text"] = "text";
    ExecutionArgumentKind["RelativePath"] = "relative-path";
    ExecutionArgumentKind["MachineInvocation"] = "machine-invocation";
    ExecutionArgumentKind["InteractiveInvocation"] = "interactive-invocation";
})(ExecutionArgumentKind || (ExecutionArgumentKind = {}));

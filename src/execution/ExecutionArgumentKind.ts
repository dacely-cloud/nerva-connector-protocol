// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Fixed arguments remain local; callers supply only the explicitly variable positions. */
export enum ExecutionArgumentKind {
    Literal = 'literal',
    Choice = 'choice',
    Text = 'text',
    RelativePath = 'relative-path',
    MachineInvocation = 'machine-invocation',
    InteractiveInvocation = 'interactive-invocation',
}

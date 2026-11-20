// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
import type {
    ExecutionMachineInvocationRule,
    ExecutionMachineInvocation,
} from './ExecutionMachineInvocation.js';
import type { ExecutionInputKind } from './ExecutionInput.js';
import type {
    ExecutionInteractiveTransport,
    ExecutionInteractiveDimensions,
} from './ExecutionInteractive.js';

/** Live input requires a separate complete grant; a foreground Machine rule grants no controls. */
export interface ExecutionInteractiveInvocationRule<Integer extends bigint | string = bigint> {
    readonly kind: ExecutionArgumentKind.InteractiveInvocation;
    readonly invocation: ExecutionMachineInvocationRule;
    readonly transports: readonly ExecutionInteractiveTransport[];
    readonly controls: readonly ExecutionInputKind[];
    /** Initial input record zero consumes both this byte budget and one control. */
    readonly maximumInputBytes: Integer;
    readonly maximumControls: number;
    readonly maximumResizes: number;
}

/** The original request commits its deadline before dispatch; Ready cannot extend it. */
export interface ExecutionInteractiveLaunch {
    readonly transport: ExecutionInteractiveTransport;
    readonly invocation: ExecutionMachineInvocation;
    readonly executionDeadlineMs: bigint;
    readonly dimensions: ExecutionInteractiveDimensions | null;
}

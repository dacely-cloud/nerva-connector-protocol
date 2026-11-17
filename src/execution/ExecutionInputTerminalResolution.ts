// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionInputReceiptContext } from './ExecutionInput.js';

/** Only an existing terminal original may resolve unseen input; this is structurally distinct from native write permission. */
export interface ExecutionInputTerminalResolutionBody extends ExecutionInputReceiptContext {
    readonly leaseId: string;
    readonly writerGeneration: bigint;
    readonly executionDeadlineMs: bigint;
    readonly responseHash: string;
    readonly issuedAtMs: bigint;
    readonly deliveryExpiresAtMs: bigint;
}

/** Both backend signature components authorize recording uncertainty and never native input I/O. */
export interface ExecutionInputTerminalResolution extends ExecutionInputTerminalResolutionBody {
    readonly signature: string;
}

export class ExecutionInputTerminalResolutionLimits {
    public static readonly jsonBytes: number = 16384;
    public static readonly deliveryMs: bigint = 10000n;
}

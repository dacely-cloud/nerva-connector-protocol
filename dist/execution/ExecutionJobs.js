// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Bounded start authority does not authorize effects beyond the original execution deadline. */
export class ExecutionJobLimits {
    /** Original canonical request bytes are unchanged by separate authorization metadata. */
    static requestBytes = 16384;
    /** Full authorization and its commitment fit beside every valid original request. */
    static submissionBytes = 32768;
    /** A delayed or reconnected start requires a refreshed proof for the same original dispatch. */
    static permitMs = 10000n;
    /** The current native boundary has a finite thirty-second ceiling. */
    static executionMs = 30000n;
}

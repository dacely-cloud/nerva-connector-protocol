// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionBinding } from './ExecutionJobs.js';

/** Canonical binary stdout/stderr share one 65536-byte aggregate budget. */
export interface ExecutionOutput {
    readonly stdoutBase64: string;
    readonly stderrBase64: string;
}
/** Output observation cannot admit, replace or stop its original command. */
export interface ExecutionOutputOriginal extends ExecutionBinding {
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly outputHash: string;
}
/** Both device signatures commit a complete durable prefix under the current delivery lease. */
export interface ExecutionOutputUpdate extends ExecutionOutputOriginal {
    readonly output: ExecutionOutput;
    readonly signature: string;
}
/** Only the pinned backend acknowledges a prefix after majority-durable acceptance. */
export interface ExecutionOutputAck extends ExecutionOutputOriginal {
    readonly authorityId: string;
    readonly signature: string;
}
/** The trusted local owner durably retains output independently of connection lifetime. */
export interface ExecutionOutputSink {
    retain(output: ExecutionOutput): Promise<void>;
}

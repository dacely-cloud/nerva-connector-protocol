// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { JointWorkspaceReceiptBody } from './JointWorkspaceReceipt.js';

/** Only verified transient publication conditions can request another attempt. */
export enum JointWorkspaceRetryReason {
    ProfilesPending = 'profiles-pending',
    OriginalPending = 'original-pending',
}

/** A delay authenticates one exact original publication without granting activation. */
export interface JointWorkspaceRetryBody extends JointWorkspaceReceiptBody {
    readonly reason: JointWorkspaceRetryReason;
    readonly retryAfterMs: number;
}

/** Both pinned authority signature components are mandatory before observing this delay. */
export interface JointWorkspaceRetry extends JointWorkspaceRetryBody {
    readonly signature: string;
}

/** Finite publication retries do not change any original operation or grant head. */
export class JointWorkspaceRetryLimits {
    public static readonly retryAfterMs: number = 250;
    public static readonly envelopeBytes: number = 8192;
}

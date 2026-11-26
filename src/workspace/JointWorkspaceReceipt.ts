// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { JointWorkspacePublicationExpected } from './JointWorkspacePublication.js';

/** Authority acceptance correlates one immutable binding and exact submitted publication to its current lease. */
export interface JointWorkspaceReceiptBody {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly slot: number;
    readonly leaseId: string;
    readonly bindingRevision: bigint;
    readonly bindingSha256: string;
    readonly publicationSha256: string;
    readonly issuedAtMs: bigint;
}

/** A receipt is accepted only after both authority signature components verify under the installed pin. */
export interface JointWorkspaceReceipt extends JointWorkspaceReceiptBody {
    readonly signature: string;
}

/** Trusted current authentication supplies the authority pin and original lease interval, never reply-selected keys. */
export interface JointWorkspaceReceiptExpected extends JointWorkspacePublicationExpected {
    readonly authorityPublicKey: string;
    readonly leaseIssuedAtMs: bigint;
    readonly leaseExpiresAtMs: bigint;
}

/** Fixed current fields and one composite proof fit a small finite transport envelope. */
export class JointWorkspaceReceiptLimits {
    /** Receipt text is bounded before parsing or signature work. */
    public static readonly envelopeBytes: number = 8192;
}

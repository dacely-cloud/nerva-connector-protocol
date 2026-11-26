// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostPublication } from './ConnectorHost.js';

/** A fresh server-owned socket challenge grants no account, process or effect authority. */
export interface ConnectorHostObservationChallenge {
    readonly companionNonce: string;
}
/** A device proves present-v1 publication and the exact current companion challenge before activation. */
export interface ConnectorHostObservationCapability {
    readonly publication: ConnectorHostPublication;
    readonly companionNonce: string;
    readonly runtimeId: string;
    readonly signature: string;
}
/** Only the private authority can confirm a v1 companion under this exact already-authenticated primary lease. */
export interface ConnectorHostObservationActivation {
    readonly authorityId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly journalId: string;
    readonly companionNonce: string;
    readonly runtimeId: string;
    readonly publicationSha256: string;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly signature: string;
}
/** Companion resources cannot borrow primary effect-lane queues, authentication slots or shutdown authority. */
export const ConnectorHostObservationCapabilityLimits = {
    protocol: 'nerva-connector-host-observation-v1',
    capabilityBytes: 32768,
    activationBytes: 16384,
    frameBytes: 65536,
    handshakeMs: 10000,
} as const;

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorOperationSchema } from './ConnectorOperationSchema.js';

/** Private edge RPC authenticates a device but never grants execution or declares a tunnel online. */
export enum ConnectorDeviceEndpoint {
    Unpair = '/v1/connector-device-unpairings',
    Challenge = '/v1/connector-device-challenges',
    Authenticate = '/v1/connector-device-authentications',
    Inspect = '/v1/connector-device-lease-inspections',
    Close = '/v1/connector-device-lease-closures',
}

/** Fixed slots bound retained challenge/lease state independently of edge/key rotation or reconnect count. */
export class ConnectorDeviceLimits {
    /** A device can authenticate four independent transport connections at once. */
    public static readonly slots: number = 4;
    /** Database time bounds proof submission and forces fresh device proof for continued authority. */
    public static readonly lifetimeMs: number = 30000;
    /** Signed hello/challenge clocks tolerate only this finite lead; old hellos cannot reset replay watermarks. */
    public static readonly clockLeadMs: bigint = 5000n;
}

/** Slots select device connection authority, never accounts, hosts or execution permissions. */
export interface ConnectorDeviceTarget {
    readonly enrollmentId: string;
    readonly slot: number;
}

/** A device proves its installed authority, owned environment and fresh connection nonce before any challenge mutation. */
export interface ConnectorDeviceHello extends ConnectorDeviceTarget {
    readonly operationSchema: ConnectorOperationSchema.ExplicitAdmission;
    readonly authorityId: string;
    readonly environmentId: string;
    readonly publicKey: string;
    readonly nonce: string;
    readonly issuedAtMs: bigint;
    readonly signature: string;
}

/** The private authority signs this exact admitted challenge, including its preselected lease and original hello commitment. */
export interface ConnectorDeviceChallenge extends ConnectorDeviceTarget {
    readonly operationSchema: ConnectorOperationSchema.ExplicitAdmission;
    readonly authorityId: string;
    readonly environmentId: string;
    readonly challengeId: string;
    readonly leaseId: string;
    readonly clientNonce: string;
    readonly helloSha256: string;
    readonly edgeClientId: string;
    readonly edgeWorkloadThumbprint: string;
    readonly publicKey: string;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly signature: string;
}

/** The server retrieves the original challenge and registered key rather than trusting caller-selected proof contents. */
export interface ConnectorDeviceProof extends ConnectorDeviceTarget {
    readonly challengeId: string;
    readonly signature: string;
}

/** A lease is edge-bound device authentication only; it cannot authorize commands, file access or forwarding. */
export interface ConnectorDeviceLease extends ConnectorDeviceChallenge {
    readonly challengeSha256: string;
    readonly authenticationSha256: string;
}

/** Each lookup requires the original random connection identity; no latest-lease fallback is allowed. */
export interface ConnectorDeviceLeaseTarget extends ConnectorDeviceTarget {
    readonly leaseId: string;
}

/** Successful closure retires only the exact original lease. */
export interface ConnectorDeviceClosed {
    readonly leaseId: string;
}

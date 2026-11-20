// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostTool, ConnectorHostPlatform } from './ConnectorHost.js';
import type { SystemSpecification } from '../system/SystemSpecification.js';
import type { ConnectorEnrollmentView } from './ConnectorEnrollment.js';

/** Inventory is customer-reported metadata, never managed fleet qualification or an execution grant. */
export enum ConnectorInventoryTrust {
    CustomerReported = 'customer-reported',
}
/** Status derives from server ownership, current lease lifetime and revocation, never a device-supplied online flag. */
export enum ConnectorPresence {
    Pending = 'pending',
    Online = 'online',
    Offline = 'offline',
    Revoked = 'revoked',
}
/** Public edges relay only this finite metadata operation to the private authenticated backend. */
export enum ConnectorInventoryEndpoint {
    Publish = '/v1/connector/device/inventory',
    Query = '/v1/connector-inventory-queries',
}
/** Four fixed session slots retain at most one bounded snapshot each; account responses remain finite. */
export class ConnectorInventoryLimits {
    /** Three full-width snapshots remain within the account gateway's response byte budget. */
    public static readonly pageSize: number = 3;
}
/** An exact original confirmed lease and receiver bind the complete system snapshot. */
export interface ConnectorInventoryPublication {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly slot: number;
    readonly leaseId: string;
    readonly leaseSha256: string;
    readonly specification: SystemSpecification;
    readonly signature: string;
}
/** Pagination never accepts an account, provider or network address. */
export interface ConnectorInventoryQuery {
    readonly after: string | null;
}
/** Host availability is metadata only; no private working directory, lease or execution credential is included. */
export interface ConnectorHostInventoryView {
    readonly grantId: string;
    readonly grantRevision: string;
    readonly enabled: boolean;
    readonly platform: ConnectorHostPlatform;
    readonly tools: readonly ConnectorHostTool[];
}

/** Safe account metadata contains no transport credentials or customer paths. */
export interface ConnectorInventoryView<Integer extends bigint | string = bigint> {
    readonly enrollment: ConnectorEnrollmentView<Integer>;
    readonly presence: ConnectorPresence;
    readonly trust: ConnectorInventoryTrust.CustomerReported;
    readonly specification: SystemSpecification | null;
    readonly receivedAtMs: string | null;
    /** Account-owned guidance is separate from device-reported system facts. */
    readonly instructions: string;
    /** Canonical decimal revision for the account guidance. */
    readonly instructionsRevision: string;
    /** Last signed local host consent remains visible when disabled or disconnected. */
    readonly host: ConnectorHostInventoryView | null;
}
/** A bounded page avoids one UI request per connector or unbounded metadata amplification. */
export interface ConnectorInventoryPage<Integer extends bigint | string = bigint> {
    readonly items: readonly ConnectorInventoryView<Integer>[];
    readonly next: string | null;
}

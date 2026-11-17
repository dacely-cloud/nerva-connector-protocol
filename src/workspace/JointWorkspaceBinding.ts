// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorFileMode } from '../protocol/ConnectorFiles.js';

/** Trusted expected enrollment scope supplies the verification key rather than accepting a key from the descriptor. */
export interface JointWorkspaceScope {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly devicePublicKey: string;
}

/** The pinned full authority identity partitions the private physical-root derivation between deployments. */
export interface JointWorkspacePhysicalScope extends JointWorkspaceScope {
    readonly authorityPublicKey: string;
}

/** Both fixed execution lanes retain their own permanent journal identity; ordering is receiver-selected. */
export interface JointWorkspaceExecutionJournals {
    readonly first: string;
    readonly second: string;
}

/** Immutable public metadata binds two separately granted policies without exporting any raw physical identity. */
export interface JointWorkspaceBinding {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly revision: bigint;
    readonly filePolicySha256: string;
    readonly executionPolicySha256: string;
    readonly fileRootId: string;
    readonly executionRootId: string;
    readonly access: ConnectorFileMode;
    readonly physicalRootCommitment: string;
    readonly fileJournalId: string;
    readonly executionJournals: JointWorkspaceExecutionJournals;
}

/** The signature authenticates the exact immutable body; its presence alone is not publication, activation or execution authority. */
export interface JointWorkspaceDescriptor {
    readonly binding: JointWorkspaceBinding;
    readonly signature: string;
}

/** Resource ceilings apply before parsing transport text or allocating cryptographic work. */
export class JointWorkspaceLimits {
    /** The complete body has fixed fields and bounded identifiers. */
    public static readonly bodyBytes: number = 2048;
    /** Composite signatures and the complete body fit a fixed independent envelope budget. */
    public static readonly descriptorBytes: number = 8192;
}

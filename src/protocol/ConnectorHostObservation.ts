// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Read-side hints cannot cross native process and terminal handle families. */
export const ConnectorHostObservationKind = { Process: 'process', Terminal: 'terminal' } as const;
/** Runtime names are also the closed serialized kind values. */
export type ConnectorHostObservationKind =
    (typeof ConnectorHostObservationKind)[keyof typeof ConnectorHostObservationKind];

/** Verified start receipts and private account ownership bind one observation without granting effects. */
export interface ConnectorHostObservationOrigin {
    readonly accountSha256: string;
    readonly ownerSha256: string;
    readonly providerSha256: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly journalId: string;
    readonly grantId: string;
    readonly grantRevision: bigint;
    readonly startJobId: string;
    readonly startSequence: bigint;
    readonly startDispatchId: string;
    readonly startRequestHash: string;
    readonly startResponseHash: string;
    readonly processId: string;
    readonly kind: ConnectorHostObservationKind;
}
/** The first verified native Ready pins an instance independently from transport renewal. */
export interface ConnectorHostObservationInstance {
    readonly runtimeId: string;
    readonly instanceSha256: string;
}
/** Only the current private authority may authorize metadata from an exact start, grant and lease. */
export interface ConnectorHostObservationPermit {
    readonly authorityId: string;
    readonly leaseId: string;
    readonly companionNonce: string;
    readonly observationId: string;
    readonly generation: bigint;
    readonly origin: ConnectorHostObservationOrigin;
    readonly originSha256: string;
    readonly runtimeId: string | null;
    readonly instanceSha256: string | null;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly signature: string;
}
/** Device readiness binds the actual retained native instance; it cannot confirm output or tree quiescence. */
export interface ConnectorHostObservationReady {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly companionNonce: string;
    readonly journalId: string;
    readonly observationId: string;
    readonly generation: bigint;
    readonly originSha256: string;
    readonly permitSha256: string;
    readonly runtimeId: string;
    readonly instanceSha256: string;
    readonly revision: bigint;
    readonly signature: string;
}
/** A monotonic hint only wakes a separately authorized native byte read. */
export interface ConnectorHostObservationChange {
    readonly observationId: string;
    readonly generation: bigint;
    readonly originSha256: string;
    readonly permitSha256: string;
    readonly instanceSha256: string;
    readonly processId: string;
    readonly kind: ConnectorHostObservationKind;
    readonly revision: bigint;
}
/** One current lease sends bounded sorted changes under one composite device signature. */
export interface ConnectorHostObservationChanged {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly companionNonce: string;
    readonly journalId: string;
    readonly runtimeId: string;
    readonly batchRevision: bigint;
    readonly changes: readonly ConnectorHostObservationChange[];
    readonly signature: string;
}
/** Acknowledgment repeats the exact sorted observation/generation/revision set. */
export interface ConnectorHostObservationAcknowledgedChange {
    readonly observationId: string;
    readonly generation: bigint;
    readonly revision: bigint;
}
/** Cloud metadata acknowledgment cannot advance host effect counters or authorize process cleanup. */
export interface ConnectorHostObservationAcknowledgment {
    readonly authorityId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly companionNonce: string;
    readonly journalId: string;
    readonly runtimeId: string;
    readonly batchRevision: bigint;
    readonly batchSha256: string;
    readonly changes: readonly ConnectorHostObservationAcknowledgedChange[];
    readonly signature: string;
}
/**
 * Read-side wire budgets, independent of effect admission and retained binary ring limits.
 *
 * @remarks
 * `ChangesPerBatch` sizes one signed changed or acknowledgment batch so it fits a frame. It is not
 * a cap on observed sources: a connector with more dirty sources sends them across further batches.
 */
export const ConnectorHostObservationLimits = {
    ChangesPerBatch: 32,
    FrameBytes: 65536,
    PermitMs: 30000n,
    WaitMs: 25000,
    BatchesPerSecond: 4,
} as const;

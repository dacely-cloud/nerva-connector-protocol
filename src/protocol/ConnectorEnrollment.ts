// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Enrollment binds a customer device; it does not grant execution or report a tunnel as online. */
export enum ConnectorEnrollmentPhase {
    Pending = 'pending',
    EnrolledOffline = 'enrolled-offline',
    Revoked = 'revoked',
}

/** The trusted Nexa backend generates the secret and sends only its commitment on issuance. */
export interface ConnectorEnrollmentRequest {
    readonly name: string;
    readonly tokenSha256: string;
}

/** Device proof binds one invitation, its secret commitment and the locally held composite device identity. */
export interface ConnectorEnrollmentClaim {
    readonly enrollmentId: string;
    readonly publicKey: string;
    readonly signature: string;
}

/** Permanent revocation dominates acceptance of the same immutable invitation and never deletes identity history. */
export interface ConnectorEnrollmentRevocation {
    readonly observedRevision: bigint;
}

/** Public metadata contains neither bootstrap authorization nor infrastructure connection details. */
export interface ConnectorEnrollmentView {
    readonly id: string;
    readonly environmentId: string;
    readonly name: string;
    readonly phase: ConnectorEnrollmentPhase;
    readonly revision: bigint;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly enrolledAtMs: bigint | null;
    readonly revokedAtMs: bigint | null;
}

/** Account management can recover invitation IDs after a caller process loses its local response. */
export interface ConnectorEnrollmentList {
    readonly enrollments: readonly ConnectorEnrollmentView[];
}

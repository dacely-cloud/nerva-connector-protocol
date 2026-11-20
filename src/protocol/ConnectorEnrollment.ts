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
export interface ConnectorEnrollmentRevocation<Integer extends bigint | string = bigint> {
    readonly observedRevision: Integer;
}

/** Public metadata contains neither bootstrap authorization nor infrastructure connection details. */
export interface ConnectorEnrollmentView<Integer extends bigint | string = bigint> {
    readonly id: string;
    readonly environmentId: string;
    readonly name: string;
    readonly phase: ConnectorEnrollmentPhase;
    readonly revision: Integer;
    readonly issuedAtMs: Integer;
    readonly expiresAtMs: Integer;
    readonly enrolledAtMs: Integer | null;
    readonly revokedAtMs: Integer | null;
}

/** Account management can recover invitation IDs after a caller process loses its local response. */
export interface ConnectorEnrollmentList<Integer extends bigint | string = bigint> {
    readonly enrollments: readonly ConnectorEnrollmentView<Integer>[];
}

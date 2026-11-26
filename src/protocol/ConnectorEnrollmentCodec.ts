// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { IdentityLengths } from '../identity/IdentityFormat.js';
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentLimits } from './ConnectorEnrollmentLimits.js';
import {
    ConnectorEnrollmentPhase,
    type ConnectorEnrollmentRequest,
    type ConnectorEnrollmentClaim,
    type ConnectorEnrollmentRevocation,
    type ConnectorEnrollmentView,
    type ConnectorEnrollmentList,
} from './ConnectorEnrollment.js';

/** Browser-compatible strict wire decoding never fills missing device authority or accepts arbitrary algorithms. */
export class ConnectorEnrollmentCodec {
    /** Complete history is bounded by issuance policy; duplicate IDs cannot become ambiguous management targets. */
    public static list(raw: unknown): ConnectorEnrollmentList {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, ['enrollments']);
        const enrollments: readonly ConnectorEnrollmentView[] = Boundary.array(
            value['enrollments'],
            ConnectorEnrollmentLimits.maximumEnrollments,
        ).map((entry: unknown): ConnectorEnrollmentView => this.view(entry));
        if (
            new Set(enrollments.map((entry: ConnectorEnrollmentView): string => entry.id)).size !==
            enrollments.length
        ) {
            throw new Error('Duplicate connector enrollment identity');
        }
        return { enrollments };
    }
    /** Names are display data; a full SHA-256 commitment is required before invitation creation. */
    public static request(raw: unknown): ConnectorEnrollmentRequest {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'name',
            'tokenSha256',
        ]);
        return {
            name: this.name(value['name']),
            tokenSha256: this.digest(value['tokenSha256']),
        };
    }

    /** Only the complete ML-DSA-44 plus Ed25519 public identity and both signatures are supported. */
    public static claim(raw: unknown): ConnectorEnrollmentClaim {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'publicKey',
            'signature',
        ]);
        return {
            enrollmentId: this.id(value['enrollmentId']),
            publicKey: this.binary(value['publicKey'], IdentityLengths.publicKey),
            signature: this.binary(value['signature'], IdentityLengths.signature),
        };
    }

    /** Exact revisions stay decimal on the wire. */
    public static revocation(raw: unknown): ConnectorEnrollmentRevocation {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, ['observedRevision']);
        return { observedRevision: Boundary.integer(value['observedRevision']) };
    }

    /** Canonical unpadded base64url is length-bounded before decoding or allocation. */
    public static binary(raw: unknown, bytes: number): string {
        if (
            ![32, IdentityLengths.publicKey, IdentityLengths.signature].includes(bytes) ||
            typeof raw !== 'string' ||
            raw.length !== Math.ceil((bytes * 4) / 3) ||
            !/^[A-Za-z0-9_-]+$/u.test(raw)
        ) {
            throw new Error('Invalid connector binary encoding');
        }
        const decoded: string = atob(
            raw.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (raw.length % 4)) % 4),
        );
        if (
            decoded.length !== bytes ||
            btoa(decoded).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '') !== raw
        ) {
            throw new Error('Noncanonical connector binary encoding');
        }
        return raw;
    }

    /** Commitments use one exact hexadecimal SHA-256 representation. */
    public static digest(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/u.test(raw)) {
            throw new Error('Invalid connector commitment');
        }
        return raw;
    }

    /** Display names permit up to 256 Unicode characters, matching JSON Schema length semantics without normalization. */
    public static name(raw: unknown): string {
        if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) {
            throw new Error('Invalid connector display name');
        }
        const characters: readonly string[] = Array.from(raw);
        if (
            characters.length > 256 ||
            characters.some((character: string): boolean => character.charCodeAt(0) < 32)
        ) {
            throw new Error('Invalid connector display name');
        }
        return raw;
    }

    /** Connector IDs are opaque server-issued 256-bit nonces, never provider paths or network addresses. */
    public static id(raw: unknown): string {
        if (typeof raw !== 'string' || !/^conn_[a-f0-9]{64}$/u.test(raw)) {
            throw new Error('Invalid connector enrollment identity');
        }
        return raw;
    }

    /** Public state is validated independently of the private enrollment journal. */
    public static view(raw: unknown): ConnectorEnrollmentView {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'id',
            'environmentId',
            'name',
            'phase',
            'revision',
            'issuedAtMs',
            'expiresAtMs',
            'enrolledAtMs',
            'revokedAtMs',
        ]);
        const phase: ConnectorEnrollmentPhase | undefined = Object.values(
            ConnectorEnrollmentPhase,
        ).find((entry: ConnectorEnrollmentPhase): boolean => entry === value['phase']);
        if (phase === undefined) {
            throw new Error('Unknown connector enrollment phase');
        }
        return this.state({
            id: this.id(value['id']),
            environmentId: Boundary.id(value['environmentId']),
            name: this.name(value['name']),
            phase,
            revision: Boundary.integer(value['revision']),
            issuedAtMs: Boundary.integer(value['issuedAtMs']),
            expiresAtMs: Boundary.integer(value['expiresAtMs']),
            enrolledAtMs:
                value['enrolledAtMs'] === null ? null : Boundary.integer(value['enrolledAtMs']),
            revokedAtMs:
                value['revokedAtMs'] === null ? null : Boundary.integer(value['revokedAtMs']),
        });
    }

    /** Revisions count authenticated ownership changes as well as lifecycle transitions; phase and time invariants remain exact. */
    public static state(view: ConnectorEnrollmentView): ConnectorEnrollmentView {
        if (
            view.environmentId !== 'env_connector_' + this.id(view.id).slice(5) ||
            view.expiresAtMs - view.issuedAtMs !== BigInt(ConnectorEnrollmentLimits.lifetimeMs) ||
            [view.issuedAtMs, view.expiresAtMs, view.enrolledAtMs, view.revokedAtMs].some(
                (time: bigint | null): boolean =>
                    time !== null && (time < 0n || time > 8640000000000000n),
            ) ||
            (view.enrolledAtMs !== null &&
                (view.enrolledAtMs < view.issuedAtMs || view.enrolledAtMs >= view.expiresAtMs)) ||
            (view.revokedAtMs !== null &&
                (view.revokedAtMs < view.issuedAtMs ||
                    (view.enrolledAtMs !== null && view.revokedAtMs < view.enrolledAtMs))) ||
            (view.phase === ConnectorEnrollmentPhase.Pending &&
                (view.revision !== 0n ||
                    view.enrolledAtMs !== null ||
                    view.revokedAtMs !== null)) ||
            (view.phase === ConnectorEnrollmentPhase.EnrolledOffline &&
                (view.revision < 1n || view.enrolledAtMs === null || view.revokedAtMs !== null)) ||
            (view.phase === ConnectorEnrollmentPhase.Revoked &&
                (view.revokedAtMs === null ||
                    (view.enrolledAtMs === null ? view.revision !== 1n : view.revision < 2n))) ||
            !Object.values(ConnectorEnrollmentPhase).includes(view.phase)
        ) {
            throw new Error('Inconsistent connector enrollment state');
        }
        return view;
    }
}

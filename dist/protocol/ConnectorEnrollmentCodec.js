// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentLimits } from './ConnectorEnrollmentLimits.js';
import { ConnectorEnrollmentPhase, } from './ConnectorEnrollment.js';
/** Browser-compatible strict wire decoding never fills missing device authority or accepts arbitrary algorithms. */
export class ConnectorEnrollmentCodec {
    /** Complete history is bounded by issuance policy; duplicate IDs cannot become ambiguous management targets. */
    static list(raw) {
        const value = Boundary.record(raw, ['enrollments']);
        const enrollments = Boundary.array(value['enrollments'], ConnectorEnrollmentLimits.maximumEnrollments).map((entry) => this.view(entry));
        if (new Set(enrollments.map((entry) => entry.id)).size !==
            enrollments.length) {
            throw new Error('Duplicate connector enrollment identity');
        }
        return { enrollments };
    }
    /** Names are display data; a full SHA-256 commitment is required before invitation creation. */
    static request(raw) {
        const value = Boundary.record(raw, [
            'name',
            'tokenSha256',
        ]);
        return {
            name: this.name(value['name']),
            tokenSha256: this.digest(value['tokenSha256']),
        };
    }
    /** Only the complete ML-DSA-44 plus Ed25519 public identity and both signatures are supported. */
    static claim(raw) {
        const value = Boundary.record(raw, [
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
    static revocation(raw) {
        const value = Boundary.record(raw, ['observedRevision']);
        return { observedRevision: Boundary.integer(value['observedRevision']) };
    }
    /** Canonical unpadded base64url is length-bounded before decoding or allocation. */
    static binary(raw, bytes) {
        if (![32, IdentityLengths.publicKey, IdentityLengths.signature].includes(bytes) ||
            typeof raw !== 'string' ||
            raw.length !== Math.ceil((bytes * 4) / 3) ||
            !/^[A-Za-z0-9_-]+$/u.test(raw)) {
            throw new Error('Invalid connector binary encoding');
        }
        const decoded = atob(raw.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (raw.length % 4)) % 4));
        if (decoded.length !== bytes ||
            btoa(decoded).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '') !== raw) {
            throw new Error('Noncanonical connector binary encoding');
        }
        return raw;
    }
    /** Commitments use one exact hexadecimal SHA-256 representation. */
    static digest(raw) {
        if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/u.test(raw)) {
            throw new Error('Invalid connector commitment');
        }
        return raw;
    }
    /** Display names permit up to 256 Unicode characters, matching JSON Schema length semantics without normalization. */
    static name(raw) {
        if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) {
            throw new Error('Invalid connector display name');
        }
        const characters = Array.from(raw);
        if (characters.length > 256 ||
            characters.some((character) => character.charCodeAt(0) < 32)) {
            throw new Error('Invalid connector display name');
        }
        return raw;
    }
    /** Connector IDs are opaque server-issued 256-bit nonces, never provider paths or network addresses. */
    static id(raw) {
        if (typeof raw !== 'string' || !/^conn_[a-f0-9]{64}$/u.test(raw)) {
            throw new Error('Invalid connector enrollment identity');
        }
        return raw;
    }
    /** Public state is validated independently of the private enrollment journal. */
    static view(raw) {
        const value = Boundary.record(raw, [
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
        const phase = Object.values(ConnectorEnrollmentPhase).find((entry) => entry === value['phase']);
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
            enrolledAtMs: value['enrolledAtMs'] === null ? null : Boundary.integer(value['enrolledAtMs']),
            revokedAtMs: value['revokedAtMs'] === null ? null : Boundary.integer(value['revokedAtMs']),
        });
    }
    /** Revisions count authenticated ownership changes as well as lifecycle transitions; phase and time invariants remain exact. */
    static state(view) {
        if (view.environmentId !== 'env_connector_' + this.id(view.id).slice(5) ||
            view.expiresAtMs - view.issuedAtMs !== BigInt(ConnectorEnrollmentLimits.lifetimeMs) ||
            [view.issuedAtMs, view.expiresAtMs, view.enrolledAtMs, view.revokedAtMs].some((time) => time !== null && (time < 0n || time > 8640000000000000n)) ||
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
            !Object.values(ConnectorEnrollmentPhase).includes(view.phase)) {
            throw new Error('Inconsistent connector enrollment state');
        }
        return view;
    }
}

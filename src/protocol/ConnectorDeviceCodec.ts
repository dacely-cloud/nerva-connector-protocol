// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorOperationSchema } from './ConnectorOperationSchema.js';
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import {
    ConnectorDeviceLimits,
    type ConnectorDeviceTarget,
    type ConnectorDeviceHello,
    type ConnectorDeviceProof,
    type ConnectorDeviceChallenge,
    type ConnectorDeviceLeaseTarget,
    type ConnectorDeviceLease,
} from './ConnectorDevice.js';

/** Strict browser-compatible transport authentication; this scope binds an enrolled device, never a fabricated managed runtime. */
export class ConnectorDeviceCodec {
    /** Bound slots before indexing retained authority. */
    public static slot(raw: unknown): number {
        return Boundary.count(raw, ConnectorDeviceLimits.slots - 1);
    }
    /** Missing or unsupported operation authority cannot authenticate as the current protocol. */
    public static operationSchema(raw: unknown): ConnectorOperationSchema.ExplicitAdmission {
        if (raw !== ConnectorOperationSchema.ExplicitAdmission) {
            throw new Error('Explicit current connector operation schema required');
        }
        return raw;
    }
    /** Connection nonces are canonical 256-bit values, never network destinations. */
    public static nonce(raw: unknown): string {
        return ConnectorEnrollmentCodec.binary(raw, 32);
    }
    /** Exact target identity is preserved by every private operation. */
    public static target(raw: unknown): ConnectorDeviceTarget {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'slot',
        ]);
        return this.#target(value);
    }
    /** A signed hello cannot select another account, substitute a pinned key or omit its fresh nonce. */
    public static hello(raw: unknown): ConnectorDeviceHello {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'slot',
            'operationSchema',
            'authorityId',
            'environmentId',
            'publicKey',
            'nonce',
            'issuedAtMs',
            'signature',
        ]);
        return {
            ...this.#target(value),
            operationSchema: this.operationSchema(value['operationSchema']),
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            nonce: this.nonce(value['nonce']),
            issuedAtMs: this.#time(value['issuedAtMs']),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    /** A device proof addresses the original outstanding challenge, never a latest-slot fallback. */
    public static proof(raw: unknown): ConnectorDeviceProof {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'slot',
            'challengeId',
            'signature',
        ]);
        return {
            ...this.#target(value),
            challengeId: this.nonce(value['challengeId']),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    /** Inspection and close require the exact original connection identity. */
    public static leaseTarget(raw: unknown): ConnectorDeviceLeaseTarget {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'slot',
            'leaseId',
        ]);
        return { ...this.#target(value), leaseId: this.nonce(value['leaseId']) };
    }
    /** Both signatures and every correlation field are mandatory even before verification. */
    public static challenge(raw: unknown): ConnectorDeviceChallenge {
        const value: Readonly<Record<string, unknown>> = Boundary.record(
            raw,
            this.#challengeFields,
        );
        return this.#challenge(value);
    }
    /** Confirmation covers the admitted challenge and the exact device proof, without extending their original deadline. */
    public static lease(raw: unknown): ConnectorDeviceLease {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            ...this.#challengeFields,
            'challengeSha256',
            'authenticationSha256',
        ]);
        return {
            ...this.#challenge(value),
            challengeSha256: ConnectorEnrollmentCodec.digest(value['challengeSha256']),
            authenticationSha256: ConnectorEnrollmentCodec.digest(value['authenticationSha256']),
        };
    }
    /** The hello purpose includes the independently installed authority and reviewed environment. */
    public static helloPayload(value: Omit<ConnectorDeviceHello, 'signature'>): string {
        return JSON.stringify([
            'nerva-connector:session:hello',
            this.operationSchema(value.operationSchema),
            value.authorityId,
            value.environmentId,
            value.enrollmentId,
            value.slot,
            value.publicKey,
            value.nonce,
            value.issuedAtMs.toString(),
        ]);
    }
    /** The server challenge precommits its lease ID and finite authorization scope. */
    public static challengePayload(value: Omit<ConnectorDeviceChallenge, 'signature'>): string {
        return JSON.stringify([
            'nerva-connector:session:challenge',
            this.operationSchema(value.operationSchema),
            value.authorityId,
            value.environmentId,
            value.enrollmentId,
            value.slot,
            value.challengeId,
            value.leaseId,
            value.clientNonce,
            value.helloSha256,
            value.edgeClientId,
            value.edgeWorkloadThumbprint,
            value.publicKey,
            value.issuedAtMs.toString(),
            value.expiresAtMs.toString(),
        ]);
    }
    /** Device authentication commits to both original server signature components as well as all challenge fields. */
    public static proofPayload(value: ConnectorDeviceChallenge): string {
        return JSON.stringify([
            'nerva-connector:session:proof',
            this.challengePayload(value),
            value.signature,
        ]);
    }
    /** The authority confirms one exact consumed device proof, not merely a successful TLS socket. */
    public static leasePayload(value: Omit<ConnectorDeviceLease, 'signature'>): string {
        return JSON.stringify([
            'nerva-connector:session:confirmation',
            this.challengePayload(value),
            value.challengeSha256,
            value.authenticationSha256,
        ]);
    }
    /** Canonical commitments retain exact signatures independently of object property order. */
    public static helloCommitment(value: ConnectorDeviceHello): string {
        return JSON.stringify([this.helloPayload(value), value.signature]);
    }
    /** Exactly the signed server challenge is committed by the final confirmation. */
    public static challengeCommitment(value: ConnectorDeviceChallenge): string {
        return JSON.stringify([this.challengePayload(value), value.signature]);
    }
    /** The final confirmation binds the complete original proof envelope and both signature components. */
    public static proofCommitment(value: ConnectorDeviceProof): string {
        return JSON.stringify([value.enrollmentId, value.slot, value.challengeId, value.signature]);
    }
    /** A publication commits to the exact complete confirmation rather than a replaceable lease identifier alone. */
    public static leaseCommitment(value: ConnectorDeviceLease): string {
        return JSON.stringify([this.leasePayload(value), value.signature]);
    }
    /** All trust-boundary timestamps remain decimal strings. */
    public static encode(
        value:
            | ConnectorDeviceHello
            | ConnectorDeviceChallenge
            | ConnectorDeviceLease
            | ConnectorDeviceProof,
    ): string {
        return JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
    static readonly #challengeFields: readonly string[] = [
        'enrollmentId',
        'slot',
        'operationSchema',
        'authorityId',
        'environmentId',
        'challengeId',
        'leaseId',
        'clientNonce',
        'helloSha256',
        'edgeClientId',
        'edgeWorkloadThumbprint',
        'publicKey',
        'issuedAtMs',
        'expiresAtMs',
        'signature',
    ];
    static #target(value: Readonly<Record<string, unknown>>): ConnectorDeviceTarget {
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            slot: this.slot(value['slot']),
        };
    }
    static #challenge(value: Readonly<Record<string, unknown>>): ConnectorDeviceChallenge {
        const issuedAtMs: bigint = this.#time(value['issuedAtMs']);
        const expiresAtMs: bigint = this.#time(value['expiresAtMs']);
        if (
            expiresAtMs <= issuedAtMs ||
            expiresAtMs - issuedAtMs > BigInt(ConnectorDeviceLimits.lifetimeMs)
        ) {
            throw new Error('Invalid connector device authentication lifetime');
        }
        return {
            ...this.#target(value),
            operationSchema: this.operationSchema(value['operationSchema']),
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            challengeId: this.nonce(value['challengeId']),
            leaseId: this.nonce(value['leaseId']),
            clientNonce: this.nonce(value['clientNonce']),
            helloSha256: ConnectorEnrollmentCodec.digest(value['helloSha256']),
            edgeClientId: Boundary.id(value['edgeClientId']),
            edgeWorkloadThumbprint: this.nonce(value['edgeWorkloadThumbprint']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            issuedAtMs,
            expiresAtMs,
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    static #time(raw: unknown): bigint {
        const value: bigint = Boundary.integer(raw);
        if (value > 8640000000000000n) {
            throw new Error('Invalid connector device timestamp');
        }
        return value;
    }
}

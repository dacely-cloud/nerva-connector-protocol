// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { createHash } from 'node:crypto';
import { IdentityCodec } from '../identity/IdentityCodec.js';
import { Boundary } from '../protocol/Boundary.js';
import { ExchangeKind, ExchangeLimits, } from './ExchangeFormat.js';
/** Bounded exact wire validation is separate from identity proof and operation authorization. */
export class ExchangeCodec {
    /** Complete expected context is captured by the receiver from its authorized operation, not learned from the frame. */
    static context(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'edgeId',
            'edgeWorkloadThumbprint',
            'environmentId',
            'runtimeId',
            'generation',
            'requestId',
            'sessionId',
            'recipientPublicKey',
        ]);
        return Object.freeze({
            authorityId: Boundary.id(value['authorityId']),
            edgeId: Boundary.id(value['edgeId']),
            edgeWorkloadThumbprint: IdentityCodec.binary(value['edgeWorkloadThumbprint'], 32).toString('base64url'),
            environmentId: Boundary.id(value['environmentId']),
            runtimeId: Boundary.id(value['runtimeId']),
            generation: Boundary.integer(value['generation']),
            requestId: IdentityCodec.binary(value['requestId'], 32).toString('base64url'),
            sessionId: IdentityCodec.binary(value['sessionId'], 32).toString('base64url'),
            recipientPublicKey: IdentityCodec.publicKey(value['recipientPublicKey']).toString('base64url'),
        });
    }
    /** A single finite frame must be strict UTF-8 JSON with no extra authority fields. */
    static decode(bytes) {
        if (!(bytes instanceof Uint8Array) || bytes.byteLength > ExchangeLimits.frameBytes) {
            throw new Error('Signed exchange exceeds its frame bound');
        }
        const raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        const value = Boundary.record(raw, [
            'kind',
            'context',
            'issuedAtMs',
            'expiresAtMs',
            'payload',
            'signature',
        ]);
        const kind = Object.values(ExchangeKind).find((candidate) => candidate.valueOf() === value['kind']);
        if (kind === undefined ||
            typeof value['payload'] !== 'string' ||
            Buffer.byteLength(value['payload']) > ExchangeLimits.payloadBytes) {
            throw new Error('Invalid signed exchange kind or payload');
        }
        const issuedAtMs = Boundary.integer(value['issuedAtMs']);
        const expiresAtMs = Boundary.integer(value['expiresAtMs']);
        if (expiresAtMs <= issuedAtMs || expiresAtMs - issuedAtMs > ExchangeLimits.lifetimeMs) {
            throw new Error('Invalid signed exchange lifetime');
        }
        return Object.freeze({
            kind,
            context: this.context(value['context']),
            issuedAtMs,
            expiresAtMs,
            payload: value['payload'],
            signature: IdentityCodec.signature(value['signature']).toString('base64url'),
        });
    }
    /** Canonical proof bytes have fixed field order and exact decimal quantities. */
    static payload(value) {
        return Buffer.from(JSON.stringify([
            value.kind,
            value.context.authorityId,
            value.context.edgeId,
            value.context.edgeWorkloadThumbprint,
            value.context.environmentId,
            value.context.runtimeId,
            value.context.generation.toString(),
            value.context.requestId,
            value.context.sessionId,
            value.context.recipientPublicKey,
            value.issuedAtMs.toString(),
            value.expiresAtMs.toString(),
            value.payload,
        ]));
    }
    /** Hashes commit the exact accepted frame, including its composite proof, for operation and stream correlation. */
    static digest(value) {
        return createHash('sha256').update(this.encode(value)).digest('hex');
    }
    /** Encoding is bounded too; escaped JSON cannot inflate beyond the transport limit. */
    static encode(value) {
        const encoded = Buffer.from(JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry));
        if (encoded.byteLength > ExchangeLimits.frameBytes) {
            throw new Error('Signed exchange exceeds its frame bound');
        }
        return encoded;
    }
    /** Expected role, exact authorized context and freshness must pass before signature verification or any effect. */
    static require(value, kind, context, nowMs) {
        if (nowMs < 0n ||
            nowMs > 8640000000000000n ||
            value.kind !== kind ||
            value.issuedAtMs > nowMs + ExchangeLimits.clockLeadMs ||
            value.expiresAtMs <= nowMs ||
            JSON.stringify(this.#contextFields(value.context)) !==
                JSON.stringify(this.#contextFields(context))) {
            throw new Error('Signed exchange context or lifetime does not match');
        }
    }
    static #contextFields(value) {
        return [
            value.authorityId,
            value.edgeId,
            value.edgeWorkloadThumbprint,
            value.environmentId,
            value.runtimeId,
            value.generation.toString(),
            value.requestId,
            value.sessionId,
            value.recipientPublicKey,
        ];
    }
}

// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorMigrationLane, } from './ConnectorAdmissionMigration.js';
/** Shared exact primitive validation is browser-safe; cryptographic verification lives outside this codec graph. */
export class ConnectorMigrationFields {
    /** Typed integers are validated before any JSON allocation; wire integers must remain canonical decimal strings. */
    static integer(value, wire) {
        if (!wire && typeof value !== 'bigint') {
            throw new Error('Exact migration quantity required');
        }
        return Boundary.integer(!wire && typeof value === 'bigint' ? value.toString() : value);
    }
    /** Only fixed receiver-selected permanent journal purposes are supported. */
    static lane(value) {
        if (value !== ConnectorMigrationLane.Files &&
            value !== ConnectorMigrationLane.ExecutionFirst &&
            value !== ConnectorMigrationLane.ExecutionSecond) {
            throw new Error('Invalid migration journal purpose');
        }
        return value;
    }
    /** Canonical order permits paired-only empty sets; the coordinator independently proves every backend lane is unused. */
    static ordered(lanes) {
        const order = [
            ConnectorMigrationLane.Files,
            ConnectorMigrationLane.ExecutionFirst,
            ConnectorMigrationLane.ExecutionSecond,
        ];
        if (lanes.length > 3) {
            throw new Error('Migration source set exceeds its bound');
        }
        let previous = -1;
        for (const lane of lanes) {
            const current = order.indexOf(lane);
            if (current <= previous) {
                throw new Error('Migration sources must be unique and canonically ordered');
            }
            previous = current;
        }
    }
    /** Expected scope is closed, bounded and detached before proof work. */
    static scope(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
        ]);
        return Object.freeze({
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            devicePublicKey: ConnectorEnrollmentCodec.binary(value['devicePublicKey'], IdentityLengths.publicKey),
        });
    }
    /** A reply cannot replace either enrolled device identity or the protected authority pin. */
    static expected(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
            'authorityPublicKey',
        ]);
        return Object.freeze({
            ...this.scope({
                authorityId: value['authorityId'],
                environmentId: value['environmentId'],
                enrollmentId: value['enrollmentId'],
                devicePublicKey: value['devicePublicKey'],
            }),
            authorityPublicKey: ConnectorEnrollmentCodec.binary(value['authorityPublicKey'], IdentityLengths.publicKey),
        });
    }
    /** No plaintext request/result fields are permitted in migration headers. */
    static original(raw, wire) {
        const value = Boundary.record(raw, [
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
        ]);
        const sequence = this.integer(value['sequence'], wire);
        if (sequence === 0n) {
            throw new Error('Migration original sequence must be positive');
        }
        return Object.freeze({
            jobId: Boundary.id(value['jobId']),
            sequence,
            dispatchId: ConnectorEnrollmentCodec.binary(value['dispatchId'], 32),
            requestHash: ConnectorEnrollmentCodec.digest(value['requestHash']),
        });
    }
    /** Compact history commits its actual acknowledged response without returning it. */
    static receipt(raw, wire) {
        const value = Boundary.record(raw, [
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'responseHash',
        ]);
        return Object.freeze({
            ...this.original({
                jobId: value['jobId'],
                sequence: value['sequence'],
                dispatchId: value['dispatchId'],
                requestHash: value['requestHash'],
            }, wire),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
        });
    }
    /** Untrusted transport/storage text is bounded before the JSON allocation. */
    static decode(json, maximum) {
        if (typeof json !== 'string' || new TextEncoder().encode(json).byteLength > maximum) {
            throw new Error('Migration envelope exceeds its finite budget');
        }
        const raw = JSON.parse(json);
        return raw;
    }
    /** Whole-envelope byte limits apply to validated typed values before emission. */
    static encode(value, maximum) {
        const json = JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
        if (new TextEncoder().encode(json).byteLength > maximum) {
            throw new Error('Migration envelope exceeds its finite budget');
        }
        return json;
    }
}

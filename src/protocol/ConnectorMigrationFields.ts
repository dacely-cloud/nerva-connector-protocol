// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import {
    ConnectorMigrationLane,
    type ConnectorMigrationScope,
    type ConnectorMigrationExpected,
    type ConnectorMigrationOriginal,
    type ConnectorMigrationReceipt,
    type ConnectorMigrationPlanBody,
    type ConnectorMigrationPlan,
    type ConnectorMigrationApprovalBody,
    type ConnectorMigrationApproval,
    type ConnectorMigrationAppliedBody,
    type ConnectorMigrationApplied,
} from './ConnectorAdmissionMigration.js';

/** Shared exact primitive validation is browser-safe; cryptographic verification lives outside this codec graph. */
export class ConnectorMigrationFields {
    /** Typed integers are validated before any JSON allocation; wire integers must remain canonical decimal strings. */
    public static integer(value: unknown, wire: boolean): bigint {
        if (!wire && typeof value !== 'bigint') {
            throw new Error('Exact migration quantity required');
        }
        return Boundary.integer(!wire && typeof value === 'bigint' ? value.toString() : value);
    }

    /** Only fixed receiver-selected permanent journal purposes are supported. */
    public static lane(value: unknown): ConnectorMigrationLane {
        if (
            value !== ConnectorMigrationLane.Files &&
            value !== ConnectorMigrationLane.ExecutionFirst &&
            value !== ConnectorMigrationLane.ExecutionSecond
        ) {
            throw new Error('Invalid migration journal purpose');
        }
        return value;
    }

    /** Canonical order permits paired-only empty sets; the coordinator independently proves every backend lane is unused. */
    public static ordered(lanes: readonly ConnectorMigrationLane[]): void {
        const order: readonly ConnectorMigrationLane[] = [
            ConnectorMigrationLane.Files,
            ConnectorMigrationLane.ExecutionFirst,
            ConnectorMigrationLane.ExecutionSecond,
        ];
        if (lanes.length > 3) {
            throw new Error('Migration source set exceeds its bound');
        }
        let previous: number = -1;
        for (const lane of lanes) {
            const current: number = order.indexOf(lane);
            if (current <= previous) {
                throw new Error('Migration sources must be unique and canonically ordered');
            }
            previous = current;
        }
    }

    /** Expected scope is closed, bounded and detached before proof work. */
    public static scope(raw: unknown): ConnectorMigrationScope {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
        ]);
        return Object.freeze({
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            devicePublicKey: ConnectorEnrollmentCodec.binary(
                value['devicePublicKey'],
                IdentityLengths.publicKey,
            ),
        });
    }

    /** A reply cannot replace either enrolled device identity or the protected authority pin. */
    public static expected(raw: unknown): ConnectorMigrationExpected {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
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
            authorityPublicKey: ConnectorEnrollmentCodec.binary(
                value['authorityPublicKey'],
                IdentityLengths.publicKey,
            ),
        });
    }

    /** No plaintext request/result fields are permitted in migration headers. */
    public static original(raw: unknown, wire: boolean): ConnectorMigrationOriginal {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
        ]);
        const sequence: bigint = this.integer(value['sequence'], wire);
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
    public static receipt(raw: unknown, wire: boolean): ConnectorMigrationReceipt {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'responseHash',
        ]);
        return Object.freeze({
            ...this.original(
                {
                    jobId: value['jobId'],
                    sequence: value['sequence'],
                    dispatchId: value['dispatchId'],
                    requestHash: value['requestHash'],
                },
                wire,
            ),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
        });
    }

    /** Untrusted transport/storage text is bounded before the JSON allocation. */
    public static decode(json: string, maximum: number): unknown {
        if (typeof json !== 'string' || new TextEncoder().encode(json).byteLength > maximum) {
            throw new Error('Migration envelope exceeds its finite budget');
        }
        const raw: unknown = JSON.parse(json);
        return raw;
    }

    /** Whole-envelope byte limits apply to validated typed values before emission. */
    public static encode(
        value:
            | ConnectorMigrationPlanBody
            | ConnectorMigrationPlan
            | ConnectorMigrationApprovalBody
            | ConnectorMigrationApproval
            | ConnectorMigrationAppliedBody
            | ConnectorMigrationApplied,
        maximum: number,
    ): string {
        const json: string = JSON.stringify(value, (_key: string, item: unknown): unknown =>
            typeof item === 'bigint' ? item.toString() : item,
        );
        if (new TextEncoder().encode(json).byteLength > maximum) {
            throw new Error('Migration envelope exceeds its finite budget');
        }
        return json;
    }
}

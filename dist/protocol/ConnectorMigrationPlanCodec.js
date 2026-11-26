// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import { ConnectorMigrationLimits, } from './ConnectorAdmissionMigration.js';
/** Exact browser-safe plan parsing accepts no plaintext operation data or implicit migration authority. */
export class ConnectorMigrationPlanCodec {
    static #fields = [
        'authorityId',
        'environmentId',
        'enrollmentId',
        'devicePublicKey',
        'planId',
        'targetOperationSchema',
        'sources',
    ];
    /** Network quantities are exact canonical decimal strings. */
    static read(raw) {
        return this.#signed(raw, true);
    }
    /** Deserialized local state still receives exact bigint validation before it becomes a typed plan. */
    static local(raw) {
        return this.#signed(raw, false);
    }
    /** Local objects are normalized, deeply detached and bounded before signing or persistence. */
    static value(value) {
        return this.#signed(value, false);
    }
    /** Only the fixed unsigned plan body enters the device transcript. */
    static body(value) {
        const result = this.#body(Boundary.record(value, this.#fields), false);
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.planBytes);
        return result;
    }
    /** Complete signed plan bytes use one fixed field order and exact decimals. */
    static encode(value) {
        return ConnectorMigrationFields.encode(this.value(value), ConnectorMigrationLimits.planBytes);
    }
    /** Text is bounded before parsing, including malicious whitespace and nested extra fields. */
    static decode(json) {
        return this.read(ConnectorMigrationFields.decode(json, ConnectorMigrationLimits.planBytes));
    }
    static #signed(raw, wire) {
        const value = Boundary.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        const result = Object.freeze({
            ...this.#body(value, wire),
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        });
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.planBytes);
        return result;
    }
    static #body(value, wire) {
        const sources = Object.freeze(Boundary.array(value['sources'], 3).map((raw) => this.#source(raw, wire)));
        ConnectorMigrationFields.ordered(sources.map((source) => source.lane));
        if (new Set(sources.map((source) => source.journalId))
            .size !== sources.length) {
            throw new Error('Migration journals must have distinct permanent identities');
        }
        return Object.freeze({
            ...ConnectorMigrationFields.scope({
                authorityId: value['authorityId'],
                environmentId: value['environmentId'],
                enrollmentId: value['enrollmentId'],
                devicePublicKey: value['devicePublicKey'],
            }),
            planId: Boundary.id(value['planId']),
            targetOperationSchema: ConnectorDeviceCodec.operationSchema(value['targetOperationSchema']),
            sources,
        });
    }
    static #source(raw, wire) {
        const value = Boundary.record(raw, [
            'lane',
            'sourceSha256',
            'journalId',
            'acknowledgedSequence',
            'receipt',
            'pending',
        ]);
        const acknowledgedSequence = ConnectorMigrationFields.integer(value['acknowledgedSequence'], wire);
        const receipt = value['receipt'] === null
            ? null
            : ConnectorMigrationFields.receipt(value['receipt'], wire);
        const pending = value['pending'] === null
            ? null
            : ConnectorMigrationFields.original(value['pending'], wire);
        if ((acknowledgedSequence === 0n) !== (receipt === null) ||
            (receipt !== null && receipt.sequence !== acknowledgedSequence) ||
            (pending !== null && pending.sequence !== acknowledgedSequence + 1n)) {
            throw new Error('Migration source watermark does not match its original history');
        }
        return Object.freeze({
            lane: ConnectorMigrationFields.lane(value['lane']),
            sourceSha256: ConnectorEnrollmentCodec.digest(value['sourceSha256']),
            journalId: ConnectorEnrollmentCodec.digest(value['journalId']),
            acknowledgedSequence,
            receipt,
            pending,
        });
    }
}

// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import { ConnectorMigrationPlanCodec } from './ConnectorMigrationPlanCodec.js';
import { ConnectorMigrationLimits, } from './ConnectorAdmissionMigration.js';
/** Structural authority approval validation never invents a missing historical authorization or cryptographic proof. */
export class ConnectorMigrationApprovalCodec {
    static #fields = ['plan', 'fenceId', 'authorizations'];
    /** Full original device proof and every explicit historical authority remain on the wire. */
    static read(raw) {
        return this.#signed(raw, true);
    }
    /** Caller-owned objects are validated and detached before any canonical hashing. */
    static value(value) {
        return this.#signed(value, false);
    }
    /** Signing accepts only the same exact shape as verification. */
    static body(value) {
        const result = this.#body(Boundary.record(value, this.#fields), false);
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.approvalBytes);
        return result;
    }
    /** The complete original plan signature participates in canonical authority-signed bytes. */
    static encode(value) {
        return ConnectorMigrationFields.encode(this.value(value), ConnectorMigrationLimits.approvalBytes);
    }
    /** Input text is bounded before JSON parsing. */
    static decode(json) {
        return this.read(ConnectorMigrationFields.decode(json, ConnectorMigrationLimits.approvalBytes));
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
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.approvalBytes);
        return result;
    }
    static #body(value, wire) {
        const plan = wire
            ? ConnectorMigrationPlanCodec.read(value['plan'])
            : ConnectorMigrationPlanCodec.local(value['plan']);
        const authorizations = Object.freeze(Boundary.array(value['authorizations'], 3).map((raw) => this.#authorization(raw, wire)));
        if (authorizations.length !== plan.sources.length) {
            throw new Error('Migration approval must cover every exact source');
        }
        for (let index = 0; index < authorizations.length; index++) {
            const source = plan.sources[index];
            const authorization = authorizations[index];
            if (source === undefined ||
                authorization === undefined ||
                source.lane !== authorization.lane ||
                (source.receipt === null) !== (authorization.receipt === null) ||
                (source.pending === null) !== (authorization.pending === null)) {
                throw new Error('Migration authority does not match the original source set');
            }
        }
        return Object.freeze({ plan, fenceId: Boundary.id(value['fenceId']), authorizations });
    }
    static #authorization(raw, wire) {
        const value = Boundary.record(raw, [
            'lane',
            'backendSourceSha256',
            'receipt',
            'pending',
        ]);
        return Object.freeze({
            lane: ConnectorMigrationFields.lane(value['lane']),
            backendSourceSha256: ConnectorEnrollmentCodec.digest(value['backendSourceSha256']),
            receipt: value['receipt'] === null ? null : this.#admission(value['receipt'], wire),
            pending: value['pending'] === null ? null : this.#admission(value['pending'], wire),
        });
    }
    static #admission(raw, wire) {
        const value = Boundary.record(raw, [
            'authorization',
            'admissionHash',
        ]);
        return Object.freeze({
            authorization: wire
                ? ConnectorAuthorizationCodec.read(value['authorization'])
                : ConnectorAuthorizationCodec.value(value['authorization']),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
        });
    }
}

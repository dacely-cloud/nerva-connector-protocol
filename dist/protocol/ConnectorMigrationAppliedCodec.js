// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import { ConnectorMigrationLimits, } from './ConnectorAdmissionMigration.js';
/** A bounded device attestation records only conversion commitments, never operation acknowledgements or effects. */
export class ConnectorMigrationAppliedCodec {
    static #fields = ['planSha256', 'approvalSha256', 'targets'];
    /** Applied contains no wire bigint quantities. */
    static read(raw) {
        return this.#signed(raw);
    }
    /** Local typed values receive the same runtime checks as network data. */
    static value(value) {
        return this.#signed(value);
    }
    /** Both original complete signed envelopes are committed by this unsigned body. */
    static body(value) {
        const result = this.#body(Boundary.record(value, this.#fields));
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.appliedBytes);
        return result;
    }
    /** Canonical field order is fixed before signing or persistence. */
    static encode(value) {
        return ConnectorMigrationFields.encode(this.value(value), ConnectorMigrationLimits.appliedBytes);
    }
    /** The whole text limit applies before parsing. */
    static decode(json) {
        return this.read(ConnectorMigrationFields.decode(json, ConnectorMigrationLimits.appliedBytes));
    }
    static #signed(raw) {
        const value = Boundary.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        const result = Object.freeze({
            ...this.#body(value),
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        });
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.appliedBytes);
        return result;
    }
    static #body(value) {
        const targets = Object.freeze(Boundary.array(value['targets'], 3).map((raw) => this.#target(raw)));
        ConnectorMigrationFields.ordered(targets.map((target) => target.lane));
        return Object.freeze({
            planSha256: ConnectorEnrollmentCodec.digest(value['planSha256']),
            approvalSha256: ConnectorEnrollmentCodec.digest(value['approvalSha256']),
            targets,
        });
    }
    static #target(raw) {
        const value = Boundary.record(raw, [
            'lane',
            'plainSha256',
            'cipherSha256',
        ]);
        return Object.freeze({
            lane: ConnectorMigrationFields.lane(value['lane']),
            plainSha256: ConnectorEnrollmentCodec.digest(value['plainSha256']),
            cipherSha256: ConnectorEnrollmentCodec.digest(value['cipherSha256']),
        });
    }
}

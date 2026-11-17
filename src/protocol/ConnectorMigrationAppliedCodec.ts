// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import {
    ConnectorMigrationLimits,
    type ConnectorMigrationApplied,
    type ConnectorMigrationAppliedBody,
    type ConnectorMigrationTarget,
} from './ConnectorAdmissionMigration.js';

/** A bounded device attestation records only conversion commitments, never operation acknowledgements or effects. */
export class ConnectorMigrationAppliedCodec {
    static readonly #fields: readonly string[] = ['planSha256', 'approvalSha256', 'targets'];
    /** Applied contains no wire bigint quantities. */
    public static read(raw: unknown): ConnectorMigrationApplied {
        return this.#signed(raw);
    }
    /** Local typed values receive the same runtime checks as network data. */
    public static value(value: ConnectorMigrationApplied): ConnectorMigrationApplied {
        return this.#signed(value);
    }
    /** Both original complete signed envelopes are committed by this unsigned body. */
    public static body(value: ConnectorMigrationAppliedBody): ConnectorMigrationAppliedBody {
        const result: ConnectorMigrationAppliedBody = this.#body(
            Boundary.record(value, this.#fields),
        );
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.appliedBytes);
        return result;
    }
    /** Canonical field order is fixed before signing or persistence. */
    public static encode(value: ConnectorMigrationApplied): string {
        return ConnectorMigrationFields.encode(
            this.value(value),
            ConnectorMigrationLimits.appliedBytes,
        );
    }
    /** The whole text limit applies before parsing. */
    public static decode(json: string): ConnectorMigrationApplied {
        return this.read(
            ConnectorMigrationFields.decode(json, ConnectorMigrationLimits.appliedBytes),
        );
    }
    static #signed(raw: unknown): ConnectorMigrationApplied {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        const result: ConnectorMigrationApplied = Object.freeze({
            ...this.#body(value),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        });
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.appliedBytes);
        return result;
    }
    static #body(value: Readonly<Record<string, unknown>>): ConnectorMigrationAppliedBody {
        const targets: readonly ConnectorMigrationTarget[] = Object.freeze(
            Boundary.array(value['targets'], 3).map((raw: unknown): ConnectorMigrationTarget =>
                this.#target(raw),
            ),
        );
        ConnectorMigrationFields.ordered(
            targets.map((target: ConnectorMigrationTarget): typeof target.lane => target.lane),
        );
        return Object.freeze({
            planSha256: ConnectorEnrollmentCodec.digest(value['planSha256']),
            approvalSha256: ConnectorEnrollmentCodec.digest(value['approvalSha256']),
            targets,
        });
    }
    static #target(raw: unknown): ConnectorMigrationTarget {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
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

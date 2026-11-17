// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import type { ConnectorAuthorization } from './ConnectorAuthorization.js';
import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import { ConnectorMigrationPlanCodec } from './ConnectorMigrationPlanCodec.js';
import {
    ConnectorMigrationLimits,
    type ConnectorMigrationPlan,
    type ConnectorMigrationSource,
    type ConnectorMigrationApproval,
    type ConnectorMigrationApprovalBody,
    type ConnectorMigrationAuthorization,
    type ConnectorMigrationAdmission,
} from './ConnectorAdmissionMigration.js';

/** Structural authority approval validation never invents a missing historical authorization or cryptographic proof. */
export class ConnectorMigrationApprovalCodec {
    static readonly #fields: readonly string[] = ['plan', 'fenceId', 'authorizations'];
    /** Full original device proof and every explicit historical authority remain on the wire. */
    public static read(raw: unknown): ConnectorMigrationApproval {
        return this.#signed(raw, true);
    }
    /** Caller-owned objects are validated and detached before any canonical hashing. */
    public static value(value: ConnectorMigrationApproval): ConnectorMigrationApproval {
        return this.#signed(value, false);
    }
    /** Signing accepts only the same exact shape as verification. */
    public static body(value: ConnectorMigrationApprovalBody): ConnectorMigrationApprovalBody {
        const result: ConnectorMigrationApprovalBody = this.#body(
            Boundary.record(value, this.#fields),
            false,
        );
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.approvalBytes);
        return result;
    }
    /** The complete original plan signature participates in canonical authority-signed bytes. */
    public static encode(value: ConnectorMigrationApproval): string {
        return ConnectorMigrationFields.encode(
            this.value(value),
            ConnectorMigrationLimits.approvalBytes,
        );
    }
    /** Input text is bounded before JSON parsing. */
    public static decode(json: string): ConnectorMigrationApproval {
        return this.read(
            ConnectorMigrationFields.decode(json, ConnectorMigrationLimits.approvalBytes),
        );
    }
    static #signed(raw: unknown, wire: boolean): ConnectorMigrationApproval {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        const result: ConnectorMigrationApproval = Object.freeze({
            ...this.#body(value, wire),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        });
        ConnectorMigrationFields.encode(result, ConnectorMigrationLimits.approvalBytes);
        return result;
    }
    static #body(
        value: Readonly<Record<string, unknown>>,
        wire: boolean,
    ): ConnectorMigrationApprovalBody {
        const plan: ConnectorMigrationPlan = wire
            ? ConnectorMigrationPlanCodec.read(value['plan'])
            : ConnectorMigrationPlanCodec.local(value['plan']);
        const authorizations: readonly ConnectorMigrationAuthorization[] = Object.freeze(
            Boundary.array(value['authorizations'], 3).map(
                (raw: unknown): ConnectorMigrationAuthorization => this.#authorization(raw, wire),
            ),
        );
        if (authorizations.length !== plan.sources.length) {
            throw new Error('Migration approval must cover every exact source');
        }
        for (let index: number = 0; index < authorizations.length; index++) {
            const source: ConnectorMigrationSource | undefined = plan.sources[index];
            const authorization: ConnectorMigrationAuthorization | undefined =
                authorizations[index];
            if (
                source === undefined ||
                authorization === undefined ||
                source.lane !== authorization.lane ||
                (source.receipt === null) !== (authorization.receipt === null) ||
                (source.pending === null) !== (authorization.pending === null)
            ) {
                throw new Error('Migration authority does not match the original source set');
            }
        }
        return Object.freeze({ plan, fenceId: Boundary.id(value['fenceId']), authorizations });
    }
    static #authorization(raw: unknown, wire: boolean): ConnectorMigrationAuthorization {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
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
    static #admission(raw: unknown, wire: boolean): ConnectorMigrationAdmission {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorization',
            'admissionHash',
        ]);
        return Object.freeze({
            authorization: wire
                ? ConnectorAuthorizationCodec.read(value['authorization'])
                : ConnectorAuthorizationCodec.value(
                      value['authorization'] as ConnectorAuthorization,
                  ),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
        });
    }
}

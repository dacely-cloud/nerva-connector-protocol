// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import { ConnectorMigrationPlanCodec } from './ConnectorMigrationPlanCodec.js';
import { ConnectorMigrationApprovalCodec } from './ConnectorMigrationApprovalCodec.js';
import { ConnectorMigrationAppliedCodec } from './ConnectorMigrationAppliedCodec.js';
import {
    ConnectorMigrationLimits,
    type ConnectorMigrationPlanBody,
    type ConnectorMigrationApprovalBody,
    type ConnectorMigrationAppliedBody,
} from './ConnectorAdmissionMigration.js';

/** Browser-safe canonical transcript construction is shared independently of the device/server cryptographic implementation. */
export class ConnectorAdmissionMigrationPayload {
    /** Exact source ciphertexts and the enrolled key authenticate the stopped migration plan. */
    public static plan(value: ConnectorMigrationPlanBody): Uint8Array {
        const body: ConnectorMigrationPlanBody = ConnectorMigrationPlanCodec.body(value);
        return this.#payload(
            'nerva-connector:admission-migration:plan',
            ConnectorMigrationFields.encode(body, ConnectorMigrationLimits.planBytes),
        );
    }
    /** The original complete device proof and explicit authority are both signed by the protected authority. */
    public static approval(value: ConnectorMigrationApprovalBody): Uint8Array {
        const body: ConnectorMigrationApprovalBody = ConnectorMigrationApprovalCodec.body(value);
        return this.#payload(
            'nerva-connector:admission-migration:approval',
            ConnectorMigrationFields.encode(body, ConnectorMigrationLimits.approvalBytes),
        );
    }
    /** The exact signed plan and approval hashes are inseparable from the new durable target commitments. */
    public static applied(value: ConnectorMigrationAppliedBody): Uint8Array {
        const body: ConnectorMigrationAppliedBody = ConnectorMigrationAppliedCodec.body(value);
        return this.#payload(
            'nerva-connector:admission-migration:applied',
            ConnectorMigrationFields.encode(body, ConnectorMigrationLimits.appliedBytes),
        );
    }
    static #payload(domain: string, json: string): Uint8Array {
        return new TextEncoder().encode('[' + JSON.stringify(domain) + ',' + json + ']');
    }
}

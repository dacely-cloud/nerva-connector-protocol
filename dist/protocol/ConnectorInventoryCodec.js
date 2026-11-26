// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorHostCodec } from './ConnectorHostCodec.js';
import { ConnectorHostPlatform, ConnectorHostTool } from './ConnectorHost.js';
import { ConnectorInstructionsCodec } from './ConnectorInstructionsCodec.js';
import { Boundary } from './Boundary.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorEnrollmentPhase } from './ConnectorEnrollment.js';
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { SystemSpecificationCodec } from '../system/SystemSpecificationCodec.js';
import { ConnectorInventoryLimits, ConnectorInventoryTrust, ConnectorPresence, } from './ConnectorInventory.js';
/** Structured metadata is validated before signature work, storage or browser presentation. */
export class ConnectorInventoryCodec {
    /** A publication has no account override or caller-controlled online state. */
    static publication(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'slot',
            'leaseId',
            'leaseSha256',
            'specification',
            'signature',
        ]);
        return {
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            slot: ConnectorDeviceCodec.slot(value['slot']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            leaseSha256: ConnectorEnrollmentCodec.digest(value['leaseSha256']),
            specification: SystemSpecificationCodec.read(value['specification']),
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        };
    }
    /** The exact receiver, current confirmed lease and normalized complete metadata are signed. */
    static payload(value) {
        return JSON.stringify([
            'nerva-connector:inventory',
            value.authorityId,
            value.environmentId,
            value.enrollmentId,
            value.slot,
            value.leaseId,
            value.leaseSha256,
            SystemSpecificationCodec.read(value.specification),
        ]);
    }
    /** An opaque ordered enrollment cursor cannot select another account. */
    static query(raw) {
        const value = Boundary.record(raw, ['after']);
        return {
            after: value['after'] === null ? null : ConnectorEnrollmentCodec.id(value['after']),
        };
    }
    /** Public status is finite and distinct from installed or permitted tooling. */
    static view(raw) {
        const value = Boundary.record(raw, [
            'enrollment',
            'presence',
            'trust',
            'specification',
            'receivedAtMs',
            'instructions',
            'instructionsRevision',
            'host',
        ]);
        const presence = Object.values(ConnectorPresence).find((state) => state === value['presence']);
        const receivedAtMs = value['receivedAtMs'] === null
            ? null
            : Boundary.integer(value['receivedAtMs']).toString();
        const enrollment = ConnectorEnrollmentCodec.view(value['enrollment']);
        if (presence === undefined ||
            value['trust'] !== ConnectorInventoryTrust.CustomerReported ||
            (receivedAtMs !== null && BigInt(receivedAtMs) > 8640000000000000n) ||
            (enrollment.phase === ConnectorEnrollmentPhase.Pending) !==
                (presence === ConnectorPresence.Pending) ||
            (enrollment.phase === ConnectorEnrollmentPhase.Revoked) !==
                (presence === ConnectorPresence.Revoked) ||
            (presence === ConnectorPresence.Online && receivedAtMs === null) ||
            (receivedAtMs === null) !== (value['specification'] === null)) {
            throw new Error('Invalid connector inventory view');
        }
        return {
            enrollment,
            presence,
            trust: ConnectorInventoryTrust.CustomerReported,
            specification: value['specification'] === null
                ? null
                : SystemSpecificationCodec.read(value['specification']),
            receivedAtMs,
            instructions: ConnectorInstructionsCodec.text(value['instructions']),
            instructionsRevision: Boundary.integer(value['instructionsRevision']).toString(),
            host: value['host'] === null ? null : this.host(value['host']),
        };
    }
    /** Local host consent is finite customer-device metadata and never carries its private task directory. */
    static host(raw) {
        const value = Boundary.record(raw, [
            'grantId',
            'grantRevision',
            'enabled',
            'platform',
            'tools',
        ]);
        const platform = Object.values(ConnectorHostPlatform).find((entry) => entry === value['platform']);
        const tools = Boundary.array(value['tools'], Object.values(ConnectorHostTool).length).map((entry) => ConnectorHostCodec.tool(entry));
        const revision = Boundary.integer(value['grantRevision']);
        if (platform === undefined ||
            revision === 0n ||
            tools.length === 0 ||
            new Set(tools).size !== tools.length) {
            throw new Error('Invalid connector host inventory');
        }
        return {
            grantId: ConnectorEnrollmentCodec.digest(value['grantId']),
            grantRevision: revision.toString(),
            enabled: Boundary.boolean(value['enabled']),
            platform,
            tools,
        };
    }
    /** Response pages contain at most three distinct ordered identities. */
    static page(raw) {
        const value = Boundary.record(raw, ['items', 'next']);
        const items = Boundary.array(value['items'], ConnectorInventoryLimits.pageSize).map((entry) => this.view(entry));
        if (new Set(items.map((entry) => entry.enrollment.id))
            .size !== items.length) {
            throw new Error('Duplicate connector inventory');
        }
        for (let index = 1; index < items.length; index++) {
            const before = items[index - 1];
            const current = items[index];
            if (before === undefined ||
                current === undefined ||
                before.enrollment.id >= current.enrollment.id) {
                throw new Error('Unordered connector inventory');
            }
        }
        const next = value['next'] === null ? null : ConnectorEnrollmentCodec.id(value['next']);
        if (next !== null &&
            (items.length !== ConnectorInventoryLimits.pageSize ||
                items.at(-1)?.enrollment.id !== next)) {
            throw new Error('Invalid connector inventory cursor');
        }
        return { items, next };
    }
}

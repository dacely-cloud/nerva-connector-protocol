// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from '../protocol/Boundary.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { JointWorkspaceCodec } from './JointWorkspaceCodec.js';
import { JointWorkspacePublicationLimits, } from './JointWorkspacePublication.js';
/** Browser-safe closed publication decoding never selects authority or relaxes a missing current lease. */
export class JointWorkspacePublicationCodec {
    /** Wire descriptors retain exact decimal revisions; only the primary connection may publish joint workspaces. */
    static publication(raw) {
        const value = Boundary.record(raw, [
            'enrollmentId',
            'slot',
            'leaseId',
            'descriptor',
            'signature',
        ]);
        return this.#bounded(Object.freeze({
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            slot: Boundary.count(value['slot'], 0),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            descriptor: JointWorkspaceCodec.descriptor(value['descriptor']),
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        }));
    }
    /** Typed callers validate and freeze every field before serialization or proof work. */
    static value(value) {
        Boundary.record(value, ['enrollmentId', 'slot', 'leaseId', 'descriptor', 'signature']);
        return this.#bounded(Object.freeze({
            ...this.body({
                enrollmentId: value.enrollmentId,
                slot: value.slot,
                leaseId: value.leaseId,
                descriptor: value.descriptor,
            }),
            signature: ConnectorEnrollmentCodec.binary(value.signature, IdentityLengths.signature),
        }));
    }
    /** Unsigned local publication input still requires its complete separately signed descriptor. */
    static body(value) {
        Boundary.record(value, ['enrollmentId', 'slot', 'leaseId', 'descriptor']);
        const enrollmentId = ConnectorEnrollmentCodec.id(value.enrollmentId);
        const descriptor = JointWorkspaceCodec.descriptorValue(value.descriptor);
        if (descriptor.binding.enrollmentId !== enrollmentId) {
            throw new Error('Joint workspace publication enrollment does not match its descriptor');
        }
        return Object.freeze({
            enrollmentId,
            slot: Boundary.count(value.slot, 0),
            leaseId: ConnectorDeviceCodec.nonce(value.leaseId),
            descriptor,
        });
    }
    /** Expected identity and lease come from receiver-owned current authentication, never the publication. */
    static expected(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
            'slot',
            'leaseId',
        ]);
        const scope = JointWorkspaceCodec.scope({
            authorityId: value['authorityId'],
            environmentId: value['environmentId'],
            enrollmentId: value['enrollmentId'],
            devicePublicKey: value['devicePublicKey'],
        });
        return Object.freeze({
            ...scope,
            slot: Boundary.count(value['slot'], 0),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
        });
    }
    /** Oversized transport input is refused before JSON parsing. */
    static decode(json) {
        if (typeof json !== 'string' ||
            json.length > JointWorkspacePublicationLimits.envelopeBytes ||
            new TextEncoder().encode(json).byteLength >
                JointWorkspacePublicationLimits.envelopeBytes) {
            throw new Error('Joint workspace publication exceeds its fixed envelope bound');
        }
        const raw = JSON.parse(json);
        return this.publication(raw);
    }
    /** Complete typed validation precedes JSON allocation and exact revisions remain decimal strings. */
    static encode(value) {
        return this.#serialize(this.value(value));
    }
    static #bounded(value) {
        if (value.descriptor.binding.enrollmentId !== value.enrollmentId) {
            throw new Error('Joint workspace publication enrollment does not match its descriptor');
        }
        if (new TextEncoder().encode(this.#serialize(value)).byteLength >
            JointWorkspacePublicationLimits.envelopeBytes) {
            throw new Error('Joint workspace publication exceeds its fixed envelope bound');
        }
        return value;
    }
    static #serialize(value) {
        return JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
    }
}

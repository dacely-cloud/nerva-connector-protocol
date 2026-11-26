// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { JointWorkspaceCodec } from './JointWorkspaceCodec.js';
import type { JointWorkspaceDescriptor, JointWorkspaceScope } from './JointWorkspaceBinding.js';
import {
    JointWorkspacePublicationLimits,
    type JointWorkspacePublication,
    type JointWorkspacePublicationBody,
    type JointWorkspacePublicationExpected,
} from './JointWorkspacePublication.js';

/** Browser-safe closed publication decoding never selects authority or relaxes a missing current lease. */
export class JointWorkspacePublicationCodec {
    /** Wire descriptors retain exact decimal revisions; only the primary connection may publish joint workspaces. */
    public static publication(raw: unknown): JointWorkspacePublication {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'slot',
            'leaseId',
            'descriptor',
            'signature',
        ]);
        return this.#bounded(
            Object.freeze({
                enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
                slot: Boundary.count(value['slot'], 0),
                leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
                descriptor: JointWorkspaceCodec.descriptor(value['descriptor']),
                signature: ConnectorEnrollmentCodec.binary(
                    value['signature'],
                    IdentityLengths.signature,
                ),
            }),
        );
    }

    /** Typed callers validate and freeze every field before serialization or proof work. */
    public static value(value: JointWorkspacePublication): JointWorkspacePublication {
        Boundary.record(value, ['enrollmentId', 'slot', 'leaseId', 'descriptor', 'signature']);
        return this.#bounded(
            Object.freeze({
                ...this.body({
                    enrollmentId: value.enrollmentId,
                    slot: value.slot,
                    leaseId: value.leaseId,
                    descriptor: value.descriptor,
                }),
                signature: ConnectorEnrollmentCodec.binary(
                    value.signature,
                    IdentityLengths.signature,
                ),
            }),
        );
    }

    /** Unsigned local publication input still requires its complete separately signed descriptor. */
    public static body(value: JointWorkspacePublicationBody): JointWorkspacePublicationBody {
        Boundary.record(value, ['enrollmentId', 'slot', 'leaseId', 'descriptor']);
        const enrollmentId: string = ConnectorEnrollmentCodec.id(value.enrollmentId);
        const descriptor: JointWorkspaceDescriptor = JointWorkspaceCodec.descriptorValue(
            value.descriptor,
        );
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
    public static expected(raw: unknown): JointWorkspacePublicationExpected {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
            'slot',
            'leaseId',
        ]);
        const scope: JointWorkspaceScope = JointWorkspaceCodec.scope({
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
    public static decode(json: string): JointWorkspacePublication {
        if (
            typeof json !== 'string' ||
            json.length > JointWorkspacePublicationLimits.envelopeBytes ||
            new TextEncoder().encode(json).byteLength >
                JointWorkspacePublicationLimits.envelopeBytes
        ) {
            throw new Error('Joint workspace publication exceeds its fixed envelope bound');
        }
        const raw: unknown = JSON.parse(json);
        return this.publication(raw);
    }

    /** Complete typed validation precedes JSON allocation and exact revisions remain decimal strings. */
    public static encode(value: JointWorkspacePublication): string {
        return this.#serialize(this.value(value));
    }

    static #bounded(value: JointWorkspacePublication): JointWorkspacePublication {
        if (value.descriptor.binding.enrollmentId !== value.enrollmentId) {
            throw new Error('Joint workspace publication enrollment does not match its descriptor');
        }
        if (
            new TextEncoder().encode(this.#serialize(value)).byteLength >
            JointWorkspacePublicationLimits.envelopeBytes
        ) {
            throw new Error('Joint workspace publication exceeds its fixed envelope bound');
        }
        return value;
    }

    static #serialize(value: JointWorkspacePublication): string {
        return JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
}

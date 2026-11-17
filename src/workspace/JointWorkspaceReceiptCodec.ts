// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { JointWorkspacePublicationCodec } from './JointWorkspacePublicationCodec.js';
import type { JointWorkspacePublicationExpected } from './JointWorkspacePublication.js';
import {
    JointWorkspaceReceiptLimits,
    type JointWorkspaceReceipt,
    type JointWorkspaceReceiptBody,
    type JointWorkspaceReceiptExpected,
} from './JointWorkspaceReceipt.js';

/** Browser-safe exact decoding preserves the original publication commitment without treating a reply as trusted authority. */
export class JointWorkspaceReceiptCodec {
    static readonly #fields: readonly string[] = [
        'authorityId',
        'environmentId',
        'enrollmentId',
        'slot',
        'leaseId',
        'bindingRevision',
        'bindingSha256',
        'publicationSha256',
        'issuedAtMs',
    ];

    /** Wire timestamps and revisions must be canonical exact signed-int64 decimal strings. */
    public static receipt(raw: unknown): JointWorkspaceReceipt {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.body({
                authorityId: Boundary.id(value['authorityId']),
                environmentId: Boundary.id(value['environmentId']),
                enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
                slot: Boundary.count(value['slot'], 0),
                leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
                bindingRevision: Boundary.integer(value['bindingRevision']),
                bindingSha256: ConnectorEnrollmentCodec.digest(value['bindingSha256']),
                publicationSha256: ConnectorEnrollmentCodec.digest(value['publicationSha256']),
                issuedAtMs: Boundary.integer(value['issuedAtMs']),
            }),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        });
    }

    /** Local typed receipts are fully validated and detached before hashing or serialization. */
    public static value(value: JointWorkspaceReceipt): JointWorkspaceReceipt {
        Boundary.record(value, [...this.#fields, 'signature']);
        return Object.freeze({
            ...this.body({
                authorityId: value.authorityId,
                environmentId: value.environmentId,
                enrollmentId: value.enrollmentId,
                slot: value.slot,
                leaseId: value.leaseId,
                bindingRevision: value.bindingRevision,
                bindingSha256: value.bindingSha256,
                publicationSha256: value.publicationSha256,
                issuedAtMs: value.issuedAtMs,
            }),
            signature: ConnectorEnrollmentCodec.binary(value.signature, IdentityLengths.signature),
        });
    }

    /** Only the fixed unsigned current shape enters the authority-signature transcript. */
    public static body(value: JointWorkspaceReceiptBody): JointWorkspaceReceiptBody {
        Boundary.record(value, this.#fields);
        const bindingRevision: bigint = this.integer(value.bindingRevision);
        if (bindingRevision === 0n) {
            throw new Error('Joint workspace receipt revision must be positive');
        }
        return Object.freeze({
            authorityId: Boundary.id(value.authorityId),
            environmentId: Boundary.id(value.environmentId),
            enrollmentId: ConnectorEnrollmentCodec.id(value.enrollmentId),
            slot: Boundary.count(value.slot, 0),
            leaseId: ConnectorDeviceCodec.nonce(value.leaseId),
            bindingRevision,
            bindingSha256: ConnectorEnrollmentCodec.digest(value.bindingSha256),
            publicationSha256: ConnectorEnrollmentCodec.digest(value.publicationSha256),
            issuedAtMs: this.integer(value.issuedAtMs),
        });
    }

    /** Receiver-owned trust and the actual current lease interval are validated without reply-selected defaults. */
    public static expected(value: JointWorkspaceReceiptExpected): JointWorkspaceReceiptExpected {
        Boundary.record(value, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
            'slot',
            'leaseId',
            'authorityPublicKey',
            'leaseIssuedAtMs',
            'leaseExpiresAtMs',
        ]);
        const scope: JointWorkspacePublicationExpected = JointWorkspacePublicationCodec.expected({
            authorityId: value.authorityId,
            environmentId: value.environmentId,
            enrollmentId: value.enrollmentId,
            devicePublicKey: value.devicePublicKey,
            slot: value.slot,
            leaseId: value.leaseId,
        });
        const leaseIssuedAtMs: bigint = this.integer(value.leaseIssuedAtMs);
        const leaseExpiresAtMs: bigint = this.integer(value.leaseExpiresAtMs);
        if (leaseExpiresAtMs <= leaseIssuedAtMs) {
            throw new Error('Joint workspace receipt requires the actual current lease interval');
        }
        return Object.freeze({
            ...scope,
            authorityPublicKey: ConnectorEnrollmentCodec.binary(
                value.authorityPublicKey,
                IdentityLengths.publicKey,
            ),
            leaseIssuedAtMs,
            leaseExpiresAtMs,
        });
    }

    /** Exact current timestamps reject JavaScript numbers and out-of-range values before arithmetic. */
    public static integer(value: bigint): bigint {
        if (typeof value !== 'bigint' || value < 0n || value > 9223372036854775807n) {
            throw new Error('Invalid exact joint workspace receipt integer');
        }
        return value;
    }

    /** Oversized text is rejected before parsing; no unsigned success alternative is accepted. */
    public static decode(json: string): JointWorkspaceReceipt {
        if (
            typeof json !== 'string' ||
            json.length > JointWorkspaceReceiptLimits.envelopeBytes ||
            new TextEncoder().encode(json).byteLength > JointWorkspaceReceiptLimits.envelopeBytes
        ) {
            throw new Error('Joint workspace receipt exceeds its fixed envelope bound');
        }
        const raw: unknown = JSON.parse(json);
        return this.receipt(raw);
    }

    /** Typed fields validate before JSON allocation and external integers remain exact decimal strings. */
    public static encode(value: JointWorkspaceReceipt): string {
        return JSON.stringify(this.value(value), (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
}

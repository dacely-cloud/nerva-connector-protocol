// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { JointWorkspaceReceiptCodec } from './JointWorkspaceReceiptCodec.js';
import type { JointWorkspaceReceiptBody } from './JointWorkspaceReceipt.js';
import {
    JointWorkspaceRetryReason,
    JointWorkspaceRetryLimits,
    type JointWorkspaceRetryBody,
    type JointWorkspaceRetry,
} from './JointWorkspaceRetry.js';

/** Closed current replies never interpret an unsigned conflict as authority to retry. */
export class JointWorkspaceRetryCodec {
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
        'reason',
        'retryAfterMs',
    ];

    /** Remote integers are canonical decimal quantities before any signature work. */
    public static retry(raw: unknown): JointWorkspaceRetry {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return this.value({
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            slot: Boundary.count(value['slot'], 0),
            leaseId: ConnectorEnrollmentCodec.binary(value['leaseId'], 32),
            bindingRevision: Boundary.integer(value['bindingRevision']),
            bindingSha256: ConnectorEnrollmentCodec.digest(value['bindingSha256']),
            publicationSha256: ConnectorEnrollmentCodec.digest(value['publicationSha256']),
            issuedAtMs: Boundary.integer(value['issuedAtMs']),
            reason: this.#reason(value['reason']),
            retryAfterMs: Boundary.count(
                value['retryAfterMs'],
                JointWorkspaceRetryLimits.retryAfterMs,
            ),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        });
    }

    /** A typed reply remains a boundary and is copied before use. */
    public static value(value: JointWorkspaceRetry): JointWorkspaceRetry {
        Boundary.record(value, [...this.#fields, 'signature']);
        const body: JointWorkspaceRetryBody = this.body({
            ...this.receipt(value),
            reason: value.reason,
            retryAfterMs: value.retryAfterMs,
        });
        return Object.freeze({
            ...body,
            signature: ConnectorEnrollmentCodec.binary(value.signature, IdentityLengths.signature),
        });
    }

    /** Exact current fields enter one fixed purpose-bound transcript. */
    public static body(value: JointWorkspaceRetryBody): JointWorkspaceRetryBody {
        Boundary.record(value, this.#fields);
        const receipt: JointWorkspaceReceiptBody = JointWorkspaceReceiptCodec.body(
            this.receipt(value),
        );
        if (value.retryAfterMs !== JointWorkspaceRetryLimits.retryAfterMs) {
            throw new Error('Invalid joint workspace retry delay');
        }
        return Object.freeze({
            ...receipt,
            reason: this.#reason(value.reason),
            retryAfterMs: value.retryAfterMs,
        });
    }

    /** Shared receipt scope omits delay fields deliberately; it grants no activation. */
    public static receipt(value: JointWorkspaceRetryBody): JointWorkspaceReceiptBody {
        return {
            authorityId: value.authorityId,
            environmentId: value.environmentId,
            enrollmentId: value.enrollmentId,
            slot: value.slot,
            leaseId: value.leaseId,
            bindingRevision: value.bindingRevision,
            bindingSha256: value.bindingSha256,
            publicationSha256: value.publicationSha256,
            issuedAtMs: value.issuedAtMs,
        };
    }

    /** Bound text before JSON parsing or composite proof verification. */
    public static decode(json: string): JointWorkspaceRetry {
        if (
            typeof json !== 'string' ||
            json.length > JointWorkspaceRetryLimits.envelopeBytes ||
            new TextEncoder().encode(json).byteLength > JointWorkspaceRetryLimits.envelopeBytes
        ) {
            throw new Error('Joint workspace retry exceeds its envelope bound');
        }
        const raw: unknown = JSON.parse(json);
        return this.retry(raw);
    }

    /** Wire counters retain their full exact precision. */
    public static encode(value: JointWorkspaceRetry): string {
        return JSON.stringify(this.value(value), (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }

    static #reason(raw: unknown): JointWorkspaceRetryReason {
        const reason: JointWorkspaceRetryReason | undefined = Object.values(
            JointWorkspaceRetryReason,
        ).find((value: JointWorkspaceRetryReason): boolean => value.valueOf() === raw);
        if (reason === undefined) {
            throw new Error('Invalid joint workspace retry reason');
        }
        return reason;
    }
}

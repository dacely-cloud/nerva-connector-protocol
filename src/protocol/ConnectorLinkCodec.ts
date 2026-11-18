// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { IdentityLengths } from '../identity/IdentityFormat.js';
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import {
    ConnectorLinkLimits,
    ConnectorLinkPhase,
    type ConnectorLinkProof,
    type ConnectorLinkStart,
    type ConnectorLinkApproval,
    type ConnectorLinkReviewRequest,
    type ConnectorLinkReview,
    type ConnectorLinkIssued,
    type ConnectorLinkStatus,
    type ConnectorLinkApproved,
    type ConnectorLinkReceipt,
    type ConnectorLinkIssuance,
    type ConnectorLinkPolling,
} from './ConnectorLink.js';
import { ConnectorEnrollmentPhase, type ConnectorEnrollmentView } from './ConnectorEnrollment.js';

/** Browser-compatible exact link contracts keep polling authorization separate from human code entry. */
export class ConnectorLinkCodec {
    /** Eight uniformly random base-32 symbols carry forty bits; presentation has one fixed separator. */
    public static code(raw: unknown): string {
        if (typeof raw !== 'string' || !/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/u.test(raw)) {
            throw new Error('Invalid connector link code');
        }
        return raw;
    }
    /** Start requests are fully signed before temporary state can be created. */
    public static start(raw: unknown): ConnectorLinkStart {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'proofNonce',
            'requestId',
            'publicKey',
            'issuedAtMs',
            'signature',
            'deviceName',
        ]);
        return {
            ...this.#proof(value),
            deviceName: ConnectorEnrollmentCodec.name(value['deviceName']),
        };
    }
    /** Polls cannot supply a code, account, enrollment override or reusable bearer credential. */
    public static proof(raw: unknown): ConnectorLinkProof {
        return this.#proof(
            Boundary.record(raw, [
                'authorityId',
                'proofNonce',
                'requestId',
                'publicKey',
                'issuedAtMs',
                'signature',
            ]),
        );
    }
    /** Review is a protected account lookup, not a device poll. */
    public static reviewRequest(raw: unknown): ConnectorLinkReviewRequest {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, ['code']);
        return { code: this.code(value['code']) };
    }
    /** Account assignment is derived from authenticated delegation, never request fields. */
    public static approval(raw: unknown): ConnectorLinkApproval {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'code',
            'linkId',
            'publicKey',
            'name',
        ]);
        return {
            code: this.code(value['code']),
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            name: ConnectorEnrollmentCodec.name(value['name']),
        };
    }
    /** The UI receives only the original device identity and display data. */
    public static review(raw: unknown): ConnectorLinkReview {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'linkId',
            'code',
            'publicKey',
            'deviceName',
            'expiresAtMs',
        ]);
        return {
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            code: this.code(value['code']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            deviceName: ConnectorEnrollmentCodec.name(value['deviceName']),
            expiresAtMs: this.#time(value['expiresAtMs']),
        };
    }
    /** A confirmed approval is bound to one reviewed public key and cannot return a pending invitation. */
    public static approved(raw: unknown): ConnectorLinkApproved {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'linkId',
            'publicKey',
            'enrollment',
        ]);
        const enrollment: ConnectorEnrollmentView = ConnectorEnrollmentCodec.view(
            value['enrollment'],
        );
        if (enrollment.phase === ConnectorEnrollmentPhase.Pending) {
            throw new Error('Connector approval cannot be pending');
        }
        return {
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            enrollment,
        };
    }
    /** Server-generated code responses have one fixed finite polling interval. */
    public static issued(raw: unknown): ConnectorLinkIssued {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'linkId',
            'code',
            'expiresAtMs',
            'pollIntervalMs',
        ]);
        this.#interval(value['pollIntervalMs']);
        return {
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            code: this.code(value['code']),
            expiresAtMs: this.#time(value['expiresAtMs']),
            pollIntervalMs: ConnectorLinkLimits.pollMs,
        };
    }
    /** A returned enrollment must agree with the current linking phase; no pending response grants device access. */
    public static status(raw: unknown): ConnectorLinkStatus {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'linkId',
            'publicKey',
            'phase',
            'enrollment',
            'expiresAtMs',
            'pollIntervalMs',
        ]);
        const phase: ConnectorLinkPhase | undefined = Object.values(ConnectorLinkPhase).find(
            (entry: ConnectorLinkPhase): boolean => entry === value['phase'],
        );
        const enrollment: ConnectorEnrollmentView | null =
            value['enrollment'] === null
                ? null
                : ConnectorEnrollmentCodec.view(value['enrollment']);
        this.#interval(value['pollIntervalMs']);
        if (
            phase === undefined ||
            (phase === ConnectorLinkPhase.Unregistered &&
                this.#time(value['expiresAtMs']) !== 0n) ||
            (phase === ConnectorLinkPhase.Approved || phase === ConnectorLinkPhase.Revoked) !==
                (enrollment !== null) ||
            (enrollment !== null &&
                (phase === ConnectorLinkPhase.Revoked) !==
                    (enrollment.phase === ConnectorEnrollmentPhase.Revoked)) ||
            enrollment?.phase === ConnectorEnrollmentPhase.Pending
        ) {
            throw new Error('Inconsistent connector link status');
        }
        return {
            phase,
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            enrollment,
            expiresAtMs: this.#time(value['expiresAtMs']),
            pollIntervalMs: ConnectorLinkLimits.pollMs,
        };
    }
    /** Receipts carry only the configured authority ID and bounded proof, never a caller-selected trusted key. */
    public static receipt(raw: unknown): ConnectorLinkReceipt {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'issuedAtMs',
            'expiresAtMs',
            'signature',
        ]);
        const issuedAtMs: bigint = this.#time(value['issuedAtMs']);
        const expiresAtMs: bigint = this.#time(value['expiresAtMs']);
        if (
            expiresAtMs <= issuedAtMs ||
            expiresAtMs - issuedAtMs > BigInt(ConnectorLinkLimits.proofAgeMs)
        ) {
            throw new Error('Invalid connector authority receipt lifetime');
        }
        return {
            authorityId: Boundary.id(value['authorityId']),
            issuedAtMs,
            expiresAtMs,
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    /** Issuance responses cannot omit the private authority's request-bound signature. */
    public static issuance(raw: unknown): ConnectorLinkIssuance {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'issued',
            'receipt',
        ]);
        return { issued: this.issued(value['issued']), receipt: this.receipt(value['receipt']) };
    }
    /** Poll results require a complete authority receipt even for unregistered or terminal state. */
    public static polling(raw: unknown): ConnectorLinkPolling {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'status',
            'receipt',
        ]);
        return { status: this.status(value['status']), receipt: this.receipt(value['receipt']) };
    }
    /** Both algorithms bind the exact signed request, response, authority and finite server time; the receiver chooses the purpose. */
    public static receiptPayload(
        input: ConnectorLinkStart | ConnectorLinkProof,
        result: ConnectorLinkIssued | ConnectorLinkStatus,
        receipt: Omit<ConnectorLinkReceipt, 'signature'>,
    ): string {
        const request: string =
            'deviceName' in input ? this.startPayload(input) : this.pollPayload(input);
        const raw: unknown = JSON.parse(this.encode(result));
        const response: ConnectorLinkIssued | ConnectorLinkStatus =
            'phase' in result ? this.status(raw) : this.issued(raw);
        return JSON.stringify([
            'nerva-connector:link:receipt',
            receipt.authorityId,
            request,
            input.signature,
            this.encode(response),
            receipt.issuedAtMs.toString(),
            receipt.expiresAtMs.toString(),
        ]);
    }
    /** One purpose binds the complete original device initiation. */
    public static startPayload(input: Omit<ConnectorLinkStart, 'signature'>): string {
        return JSON.stringify([
            'nerva-connector:link:start',
            input.authorityId,
            input.proofNonce,
            input.requestId,
            input.publicKey,
            input.deviceName,
            input.issuedAtMs.toString(),
        ]);
    }
    /** A short code cannot produce this purpose-separated current proof. */
    public static pollPayload(input: Omit<ConnectorLinkProof, 'signature'>): string {
        return JSON.stringify([
            'nerva-connector:link:poll',
            input.authorityId,
            input.proofNonce,
            input.requestId,
            input.publicKey,
            input.issuedAtMs.toString(),
        ]);
    }
    /** All exact wire counters and times remain decimal strings. */
    public static encode(
        value:
            | ConnectorLinkStart
            | ConnectorLinkProof
            | ConnectorLinkIssued
            | ConnectorLinkReview
            | ConnectorLinkApproval
            | ConnectorLinkStatus
            | ConnectorLinkApproved
            | ConnectorLinkIssuance
            | ConnectorLinkPolling,
    ): string {
        return JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
    static #proof(value: Readonly<Record<string, unknown>>): ConnectorLinkProof {
        return {
            authorityId: Boundary.id(value['authorityId']),
            proofNonce: ConnectorEnrollmentCodec.binary(value['proofNonce'], 32),
            requestId: ConnectorEnrollmentCodec.binary(value['requestId'], 32),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            issuedAtMs: this.#time(value['issuedAtMs']),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    static #time(raw: unknown): bigint {
        const value: bigint = Boundary.integer(raw);
        if (value > 8640000000000000n) {
            throw new Error('Connector link time is out of range');
        }
        return value;
    }
    static #interval(raw: unknown): void {
        if (raw !== ConnectorLinkLimits.pollMs) {
            throw new Error('Unsupported connector polling interval');
        }
    }
}

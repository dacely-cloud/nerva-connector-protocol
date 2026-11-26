// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorLinkLimits, ConnectorLinkPhase, } from './ConnectorLink.js';
import { ConnectorEnrollmentPhase } from './ConnectorEnrollment.js';
/** Browser-compatible exact link contracts keep polling authorization separate from human code entry. */
export class ConnectorLinkCodec {
    /** Eight uniformly random base-32 symbols carry forty bits; presentation has one fixed separator. */
    static code(raw) {
        if (typeof raw !== 'string' || !/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/u.test(raw)) {
            throw new Error('Invalid connector link code');
        }
        return raw;
    }
    /** Start requests are fully signed before temporary state can be created. */
    static start(raw) {
        const value = Boundary.record(raw, [
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
    static proof(raw) {
        return this.#proof(Boundary.record(raw, [
            'authorityId',
            'proofNonce',
            'requestId',
            'publicKey',
            'issuedAtMs',
            'signature',
        ]));
    }
    /** Review is a protected account lookup, not a device poll. */
    static reviewRequest(raw) {
        const value = Boundary.record(raw, ['code']);
        return { code: this.code(value['code']) };
    }
    /** Account assignment is derived from authenticated delegation, never request fields. */
    static approval(raw) {
        const value = Boundary.record(raw, [
            'code',
            'linkId',
            'publicKey',
            'name',
        ]);
        return {
            code: this.code(value['code']),
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            publicKey: ConnectorEnrollmentCodec.binary(value['publicKey'], IdentityLengths.publicKey),
            name: ConnectorEnrollmentCodec.name(value['name']),
        };
    }
    /** The UI receives only the original device identity and display data. */
    static review(raw) {
        const value = Boundary.record(raw, [
            'linkId',
            'code',
            'publicKey',
            'deviceName',
            'expiresAtMs',
        ]);
        return {
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            code: this.code(value['code']),
            publicKey: ConnectorEnrollmentCodec.binary(value['publicKey'], IdentityLengths.publicKey),
            deviceName: ConnectorEnrollmentCodec.name(value['deviceName']),
            expiresAtMs: this.#time(value['expiresAtMs']),
        };
    }
    /** A confirmed approval is bound to one reviewed public key and cannot return a pending invitation. */
    static approved(raw) {
        const value = Boundary.record(raw, [
            'linkId',
            'publicKey',
            'enrollment',
        ]);
        const enrollment = ConnectorEnrollmentCodec.view(value['enrollment']);
        if (enrollment.phase === ConnectorEnrollmentPhase.Pending) {
            throw new Error('Connector approval cannot be pending');
        }
        return {
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            publicKey: ConnectorEnrollmentCodec.binary(value['publicKey'], IdentityLengths.publicKey),
            enrollment,
        };
    }
    /** Server-generated code responses have one fixed finite polling interval. */
    static issued(raw) {
        const value = Boundary.record(raw, [
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
    static status(raw) {
        const value = Boundary.record(raw, [
            'linkId',
            'publicKey',
            'phase',
            'enrollment',
            'expiresAtMs',
            'pollIntervalMs',
        ]);
        const phase = Object.values(ConnectorLinkPhase).find((entry) => entry === value['phase']);
        const enrollment = value['enrollment'] === null
            ? null
            : ConnectorEnrollmentCodec.view(value['enrollment']);
        this.#interval(value['pollIntervalMs']);
        if (phase === undefined ||
            (phase === ConnectorLinkPhase.Unregistered &&
                this.#time(value['expiresAtMs']) !== 0n) ||
            (phase === ConnectorLinkPhase.Approved || phase === ConnectorLinkPhase.Revoked) !==
                (enrollment !== null) ||
            (enrollment !== null &&
                (phase === ConnectorLinkPhase.Revoked) !==
                    (enrollment.phase === ConnectorEnrollmentPhase.Revoked)) ||
            enrollment?.phase === ConnectorEnrollmentPhase.Pending) {
            throw new Error('Inconsistent connector link status');
        }
        return {
            phase,
            linkId: ConnectorEnrollmentCodec.digest(value['linkId']),
            publicKey: ConnectorEnrollmentCodec.binary(value['publicKey'], IdentityLengths.publicKey),
            enrollment,
            expiresAtMs: this.#time(value['expiresAtMs']),
            pollIntervalMs: ConnectorLinkLimits.pollMs,
        };
    }
    /** Receipts carry only the configured authority ID and bounded proof, never a caller-selected trusted key. */
    static receipt(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'issuedAtMs',
            'expiresAtMs',
            'signature',
        ]);
        const issuedAtMs = this.#time(value['issuedAtMs']);
        const expiresAtMs = this.#time(value['expiresAtMs']);
        if (expiresAtMs <= issuedAtMs ||
            expiresAtMs - issuedAtMs > BigInt(ConnectorLinkLimits.proofAgeMs)) {
            throw new Error('Invalid connector authority receipt lifetime');
        }
        return {
            authorityId: Boundary.id(value['authorityId']),
            issuedAtMs,
            expiresAtMs,
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        };
    }
    /** Issuance responses cannot omit the private authority's request-bound signature. */
    static issuance(raw) {
        const value = Boundary.record(raw, [
            'issued',
            'receipt',
        ]);
        return { issued: this.issued(value['issued']), receipt: this.receipt(value['receipt']) };
    }
    /** Poll results require a complete authority receipt even for unregistered or terminal state. */
    static polling(raw) {
        const value = Boundary.record(raw, [
            'status',
            'receipt',
        ]);
        return { status: this.status(value['status']), receipt: this.receipt(value['receipt']) };
    }
    /** Both algorithms bind the exact signed request, response, authority and finite server time; the receiver chooses the purpose. */
    static receiptPayload(input, result, receipt) {
        const request = 'deviceName' in input ? this.startPayload(input) : this.pollPayload(input);
        const raw = JSON.parse(this.encode(result));
        const response = 'phase' in result ? this.status(raw) : this.issued(raw);
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
    static startPayload(input) {
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
    static pollPayload(input) {
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
    static encode(value) {
        return JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
    }
    static #proof(value) {
        return {
            authorityId: Boundary.id(value['authorityId']),
            proofNonce: ConnectorEnrollmentCodec.binary(value['proofNonce'], 32),
            requestId: ConnectorEnrollmentCodec.binary(value['requestId'], 32),
            publicKey: ConnectorEnrollmentCodec.binary(value['publicKey'], IdentityLengths.publicKey),
            issuedAtMs: this.#time(value['issuedAtMs']),
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        };
    }
    static #time(raw) {
        const value = Boundary.integer(raw);
        if (value > 8640000000000000n) {
            throw new Error('Connector link time is out of range');
        }
        return value;
    }
    static #interval(raw) {
        if (raw !== ConnectorLinkLimits.pollMs) {
            throw new Error('Unsupported connector polling interval');
        }
    }
}

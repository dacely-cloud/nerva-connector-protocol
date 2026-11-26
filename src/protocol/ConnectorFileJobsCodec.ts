// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import { Boundary } from './Boundary.js';
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorFilesCodec } from './ConnectorFilesCodec.js';
import {
    ConnectorFileMode,
    ConnectorFileLimits,
    type ConnectorFileRequest,
    type ConnectorFileProfile,
} from './ConnectorFiles.js';
import { ConnectorFileAction } from './ConnectorFileTypes.js';
import {
    ConnectorFileJobPhase,
    ConnectorFileJobLimits,
    type ConnectorFileOperation,
    type ConnectorFileSubmission,
    type ConnectorFileJobView,
    type ConnectorFileStatus,
    type ConnectorFilePublication,
    type ConnectorFilePermit,
    type ConnectorFileCompletion,
    type ConnectorFileAcknowledgment,
    type ConnectorFileAcknowledged,
    type ConnectorFileWork,
} from './ConnectorFileJobs.js';

/** Exact shared file-job contracts reject inherited, missing, mixed or unsupported authority. */
export class ConnectorFileJobsCodec {
    /** One canonical serializer is shared by signatures, fingerprints, storage and wire framing. */
    public static encode(
        value:
            | ConnectorFileProfile
            | ConnectorFileOperation
            | ConnectorFilePublication
            | ConnectorFilePermit
            | ConnectorFileCompletion
            | ConnectorFileAcknowledgment
            | ConnectorFileAcknowledged
            | ConnectorFileWork
            | ConnectorFileStatus
            | ConnectorFileJobView
            | ConnectorFileSubmission,
    ): string {
        return JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
    /** No remote describe/write/execute operation is inferred from a file capability. */
    public static operation(raw: unknown): ConnectorFileOperation {
        const request: ConnectorFileRequest = ConnectorFilesCodec.request(raw);
        if (request.action === ConnectorFileAction.Describe) {
            throw new Error('Remote file descriptions use the authorized status endpoint');
        }
        return request;
    }
    /** Public local grants omit absolute paths and must match the native bounds. */
    public static profile(raw: unknown): ConnectorFileProfile {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'mode',
            'revision',
            'policySha256',
            'roots',
            'maximumReadBytes',
            'maximumWriteBytes',
        ]);
        const revision: bigint = Boundary.integer(value['revision']);
        const roots: readonly string[] = Boundary.ids(value['roots'], 16);
        if (
            (value['mode'] !== ConnectorFileMode.ReadOnly &&
                value['mode'] !== ConnectorFileMode.ReadWrite) ||
            revision === 0n ||
            roots.length === 0 ||
            value['maximumReadBytes'] !== ConnectorFileLimits.readBytes ||
            value['maximumWriteBytes'] !==
                (value['mode'] === ConnectorFileMode.ReadWrite ? ConnectorFileLimits.writeBytes : 0)
        ) {
            throw new Error('Unsupported connector file profile');
        }
        return {
            mode: value['mode'],
            revision,
            policySha256: ConnectorEnrollmentCodec.digest(value['policySha256']),
            roots,
            maximumReadBytes: ConnectorFileLimits.readBytes,
            maximumWriteBytes:
                value['mode'] === ConnectorFileMode.ReadWrite ? ConnectorFileLimits.writeBytes : 0,
        };
    }
    /** A stale observed counter cannot be silently replaced on retry. */
    public static submission(raw: unknown): ConnectorFileSubmission {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'previousSequence',
            'request',
            'authorization',
            'admissionHash',
        ]);
        return {
            previousSequence: Boundary.integer(value['previousSequence']),
            request: this.operation(value['request']),
            authorization: ConnectorAuthorizationCodec.read(value['authorization']),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
        };
    }
    /** Account response metadata has no infrastructure destination or device credential. */
    public static status(raw: unknown): ConnectorFileStatus {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'environmentId',
            'sequence',
            'acknowledgedSequence',
            'online',
            'profile',
        ]);
        const sequence: bigint = Boundary.integer(value['sequence']);
        const acknowledgedSequence: bigint = Boundary.integer(value['acknowledgedSequence']);
        if (acknowledgedSequence > sequence) {
            throw new Error('Invalid connector file acknowledgment counter');
        }
        return {
            environmentId: Boundary.id(value['environmentId']),
            sequence,
            acknowledgedSequence,
            online: Boundary.boolean(value['online']),
            profile: value['profile'] === null ? null : this.profile(value['profile']),
        };
    }
    /** Completed responses are validated against their original exact request. */
    public static job(raw: unknown): ConnectorFileJobView {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'id',
            'environmentId',
            'sequence',
            'phase',
            'request',
            'authorization',
            'admissionHash',
            'response',
        ]);
        const request: ConnectorFileOperation = this.operation(value['request']);
        const phase: ConnectorFileJobPhase | undefined = Object.values(ConnectorFileJobPhase).find(
            (entry: ConnectorFileJobPhase): boolean => entry === value['phase'],
        );
        if (
            phase === undefined ||
            (phase === ConnectorFileJobPhase.Completed) !== (value['response'] !== null)
        ) {
            throw new Error('Inconsistent connector file job phase');
        }
        return {
            id: Boundary.id(value['id']),
            environmentId: Boundary.id(value['environmentId']),
            sequence: this.#sequence(value['sequence']),
            phase,
            request,
            authorization: ConnectorAuthorizationCodec.read(value['authorization']),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
            response:
                value['response'] === null
                    ? null
                    : ConnectorFilesCodec.response(value['response'], request),
        };
    }
    /** Publication binds the current authenticated lease and full locally selected profile. */
    public static publication(raw: unknown): ConnectorFilePublication {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'leaseId',
            'profile',
            'journalId',
            'signature',
        ]);
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            profile: this.profile(value['profile']),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
            journalId: ConnectorEnrollmentCodec.digest(value['journalId']),
        };
    }
    /** Device requests use one bounded current backend permit shape. */
    public static permit(raw: unknown): ConnectorFilePermit {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'enrollmentId',
            'leaseId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'admissionHash',
            'request',
            'authorization',
            'issuedAtMs',
            'expiresAtMs',
            'signature',
        ]);
        const issuedAtMs: bigint = Boundary.integer(value['issuedAtMs']);
        const expiresAtMs: bigint = Boundary.integer(value['expiresAtMs']);
        if (
            expiresAtMs <= issuedAtMs ||
            expiresAtMs - issuedAtMs > ConnectorFileJobLimits.permitMs
        ) {
            throw new Error('Invalid file permit deadline');
        }
        return {
            authorityId: Boundary.id(value['authorityId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            jobId: Boundary.id(value['jobId']),
            sequence: this.#sequence(value['sequence']),
            dispatchId: ConnectorDeviceCodec.nonce(value['dispatchId']),
            requestHash: ConnectorEnrollmentCodec.digest(value['requestHash']),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
            request: this.operation(value['request']),
            authorization: ConnectorAuthorizationCodec.read(value['authorization']),
            issuedAtMs,
            expiresAtMs,
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    /** The caller supplies the original request from its authoritative job record before decoding result content. */
    public static completion(
        raw: unknown,
        request: ConnectorFileOperation,
    ): ConnectorFileCompletion {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'leaseId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'admissionHash',
            'responseHash',
            'response',
            'signature',
        ]);
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            jobId: Boundary.id(value['jobId']),
            sequence: this.#sequence(value['sequence']),
            dispatchId: ConnectorDeviceCodec.nonce(value['dispatchId']),
            requestHash: ConnectorEnrollmentCodec.digest(value['requestHash']),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
            response: ConnectorFilesCodec.response(value['response'], request),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    /** Cloud and device acknowledgments have distinct signature purposes and exact shapes. */
    public static acknowledgment(raw: unknown): ConnectorFileAcknowledgment {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'enrollmentId',
            'leaseId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'admissionHash',
            'responseHash',
            'signature',
        ]);
        return { authorityId: Boundary.id(value['authorityId']), ...this.#ack(value) };
    }
    /** Device compaction receipts cannot select a different environment, sequence or result. */
    public static acknowledged(raw: unknown): ConnectorFileAcknowledged {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'leaseId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'admissionHash',
            'responseHash',
            'signature',
        ]);
        return this.#ack(value);
    }
    /** The mailbox returns at most one original request or one durable-result acknowledgment. */
    public static work(raw: unknown): ConnectorFileWork {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'permit',
            'acknowledgment',
        ]);
        if (value['permit'] !== null && value['acknowledgment'] !== null) {
            throw new Error('Ambiguous file mailbox response');
        }
        return {
            permit: value['permit'] === null ? null : this.permit(value['permit']),
            acknowledgment:
                value['acknowledgment'] === null
                    ? null
                    : this.acknowledgment(value['acknowledgment']),
        };
    }
    static #ack(value: Readonly<Record<string, unknown>>): ConnectorFileAcknowledged {
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            jobId: Boundary.id(value['jobId']),
            sequence: this.#sequence(value['sequence']),
            dispatchId: ConnectorDeviceCodec.nonce(value['dispatchId']),
            requestHash: ConnectorEnrollmentCodec.digest(value['requestHash']),
            admissionHash: ConnectorEnrollmentCodec.digest(value['admissionHash']),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    static #sequence(raw: unknown): bigint {
        const value: bigint = Boundary.integer(raw);
        if (value === 0n) {
            throw new Error('File job sequence starts at one');
        }
        return value;
    }
}

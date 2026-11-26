// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorHostJson } from './ConnectorHostJson.js';
import { ConnectorHostObservedStart } from './ConnectorHostObservationProtocol.js';
import {
    ConnectorHostTool,
    ConnectorHostPlatform,
    ConnectorHostOutcome,
    ConnectorHostErrorCode,
    ConnectorHostJobPhase,
    ConnectorHostLimits,
    type ConnectorHostProfile,
    type ConnectorHostRequest,
    type ConnectorHostSubmission,
    type ConnectorHostResponse,
    type ConnectorHostStatus,
    type ConnectorHostJobView,
    type ConnectorHostPublication,
    type ConnectorHostPermit,
    type ConnectorHostCompletion,
    type ConnectorHostAcknowledgment,
    type ConnectorHostAcknowledged,
    type ConnectorHostWork,
} from './ConnectorHost.js';

/** Exact current host contracts validate every external boundary without adopting remote authority. */
export class ConnectorHostCodec {
    /** Explicit exact quantities are decimal strings in storage, hashing and transport. */
    public static encode<T>(value: T): string {
        return JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }

    /** Consent may be disabled while its retained journal remains authoritative. */
    public static profile(raw: unknown): ConnectorHostProfile {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'grantId',
            'grantRevision',
            'enabled',
            'platform',
            'directory',
            'tools',
        ]);
        const platform: ConnectorHostPlatform | undefined = Object.values(
            ConnectorHostPlatform,
        ).find((entry: ConnectorHostPlatform): boolean => entry === value['platform']);
        const directory: unknown = value['directory'];
        const tools: readonly ConnectorHostTool[] = Boundary.array(
            value['tools'],
            Object.values(ConnectorHostTool).length,
        ).map((entry: unknown): ConnectorHostTool => this.tool(entry));
        if (
            platform === undefined ||
            typeof directory !== 'string' ||
            directory.length < 1 ||
            directory.length > 4096 ||
            !directory.isWellFormed() ||
            Array.from(directory).some(
                (character: string): boolean =>
                    character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
            ) ||
            !(
                directory.startsWith('/') ||
                /^[A-Za-z]:[\\/]/u.test(directory) ||
                directory.startsWith('\\\\')
            ) ||
            new Set(tools).size !== tools.length ||
            tools.length === 0
        ) {
            throw new Error('Invalid host grant profile');
        }
        return {
            grantId: ConnectorEnrollmentCodec.digest(value['grantId']),
            grantRevision: this.#sequence(value['grantRevision']),
            enabled: Boundary.boolean(value['enabled']),
            platform,
            directory,
            tools,
        };
    }

    /** The tool name selects a declared operation but never supplies an executable policy grant. */
    public static tool(raw: unknown): ConnectorHostTool {
        const tool: ConnectorHostTool | undefined = Object.values(ConnectorHostTool).find(
            (entry: ConnectorHostTool): boolean => entry === raw,
        );
        if (tool === undefined) {
            throw new Error('Unsupported host tool');
        }
        return tool;
    }

    /** Preserve complete original arguments exactly; local tool validation independently checks their shape. */
    public static request(raw: unknown): ConnectorHostRequest {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'grantId',
            'grantRevision',
            'toolName',
            'argumentsJson',
        ]);
        return {
            grantId: ConnectorEnrollmentCodec.digest(value['grantId']),
            grantRevision: this.#sequence(value['grantRevision']),
            toolName: this.tool(value['toolName']),
            argumentsJson: ConnectorHostJson.object(
                value['argumentsJson'],
                ConnectorHostLimits.argumentsBytes,
            ),
        };
    }

    /** Admission retains the exact observed sequence so a pruned request cannot be executed again. */
    public static submission(raw: unknown): ConnectorHostSubmission {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'previousSequence',
            'request',
        ]);
        return {
            previousSequence: Boundary.integer(value['previousSequence']),
            request: this.request(value['request']),
        };
    }

    /** Missing or oversized outcomes never become successful empty results. */
    public static response(raw: unknown): ConnectorHostResponse {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'outcome',
            'resultJson',
            'errorCode',
        ]);
        const outcome: ConnectorHostOutcome | undefined = Object.values(ConnectorHostOutcome).find(
            (entry: ConnectorHostOutcome): boolean => entry === value['outcome'],
        );
        const errorCode: ConnectorHostErrorCode | null | undefined =
            value['errorCode'] === null
                ? null
                : Object.values(ConnectorHostErrorCode).find(
                      (entry: ConnectorHostErrorCode): boolean => entry === value['errorCode'],
                  );
        if (
            outcome === undefined ||
            errorCode === undefined ||
            (outcome === ConnectorHostOutcome.Succeeded) !== (value['resultJson'] !== null) ||
            (outcome === ConnectorHostOutcome.Succeeded) !== (errorCode === null)
        ) {
            throw new Error('Invalid host outcome');
        }
        return {
            outcome,
            errorCode,
            resultJson:
                value['resultJson'] === null
                    ? null
                    : ConnectorHostJson.object(
                          value['resultJson'],
                          ConnectorHostLimits.resultBytes,
                      ),
        };
    }

    /** Online presence and explicit host consent are independent facts. */
    public static status(raw: unknown): ConnectorHostStatus {
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
            throw new Error('Invalid host sequence');
        }
        return {
            environmentId: Boundary.id(value['environmentId']),
            sequence,
            acknowledgedSequence,
            online: Boundary.boolean(value['online']),
            profile: value['profile'] === null ? null : this.profile(value['profile']),
        };
    }

    /** Completed responses belong to the complete retained request. */
    public static job(raw: unknown): ConnectorHostJobView {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'id',
            'environmentId',
            'sequence',
            'phase',
            'request',
            'response',
        ]);
        const phase: ConnectorHostJobPhase | undefined = Object.values(ConnectorHostJobPhase).find(
            (entry: ConnectorHostJobPhase): boolean => entry === value['phase'],
        );
        if (
            phase === undefined ||
            (phase === ConnectorHostJobPhase.Completed) !== (value['response'] !== null)
        ) {
            throw new Error('Invalid host job phase');
        }
        return {
            id: Boundary.id(value['id']),
            environmentId: Boundary.id(value['environmentId']),
            sequence: this.#sequence(value['sequence']),
            phase,
            request: this.request(value['request']),
            response: value['response'] === null ? null : this.response(value['response']),
        };
    }

    /** Device publication binds the entire current profile and original private journal. */
    public static publication(raw: unknown): ConnectorHostPublication {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'leaseId',
            'journalId',
            'profile',
            'signature',
            'observationProtocol',
        ]);
        const capability: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
            value,
            'observationProtocol',
        );
        if (
            capability !== undefined &&
            (!Object.hasOwn(capability, 'value') ||
                capability.enumerable !== true ||
                capability.value !== ConnectorHostObservedStart.Protocol)
        ) {
            throw new Error('Unsupported host observation publication');
        }
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            journalId: ConnectorEnrollmentCodec.digest(value['journalId']),
            profile: this.profile(value['profile']),
            ...(capability === undefined
                ? {}
                : { observationProtocol: ConnectorHostObservedStart.Protocol }),
            signature: this.#signature(value['signature']),
        };
    }

    /** A short-lived authority permit is useful only on its exact current device lease. */
    public static permit(raw: unknown): ConnectorHostPermit {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'enrollmentId',
            'leaseId',
            'journalId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'request',
            'issuedAtMs',
            'expiresAtMs',
            'startByMs',
            'signature',
        ]);
        const issuedAtMs: bigint = Boundary.integer(value['issuedAtMs']);
        const expiresAtMs: bigint = Boundary.integer(value['expiresAtMs']);
        if (expiresAtMs <= issuedAtMs || expiresAtMs - issuedAtMs > ConnectorHostLimits.permitMs) {
            throw new Error('Invalid host permit lifetime');
        }
        return {
            authorityId: Boundary.id(value['authorityId']),
            ...this.#original(value),
            request: this.request(value['request']),
            issuedAtMs,
            expiresAtMs,
            startByMs: Boundary.integer(value['startByMs']),
            signature: this.#signature(value['signature']),
        };
    }

    /** A completion binds both request and response commitments before their signatures are considered. */
    public static completion(raw: unknown): ConnectorHostCompletion {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'leaseId',
            'journalId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'responseHash',
            'response',
            'signature',
        ]);
        return {
            ...this.#original(value),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
            response: this.response(value['response']),
            signature: this.#signature(value['signature']),
        };
    }

    /** Cloud acknowledgment is distinct from device compaction confirmation. */
    public static acknowledgment(raw: unknown): ConnectorHostAcknowledgment {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'enrollmentId',
            'leaseId',
            'journalId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'responseHash',
            'signature',
        ]);
        return {
            authorityId: Boundary.id(value['authorityId']),
            ...this.#original(value),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
            signature: this.#signature(value['signature']),
        };
    }

    /** A device acknowledges only the exact result already committed on both sides. */
    public static acknowledged(raw: unknown): ConnectorHostAcknowledged {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'enrollmentId',
            'leaseId',
            'journalId',
            'jobId',
            'sequence',
            'dispatchId',
            'requestHash',
            'responseHash',
            'signature',
        ]);
        return {
            ...this.#original(value),
            responseHash: ConnectorEnrollmentCodec.digest(value['responseHash']),
            signature: this.#signature(value['signature']),
        };
    }

    /** Only one original can occupy this retained host lane. */
    public static work(raw: unknown): ConnectorHostWork {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'permit',
            'acknowledgment',
        ]);
        if (value['permit'] !== null && value['acknowledgment'] !== null) {
            throw new Error('Ambiguous host mailbox');
        }
        return {
            permit: value['permit'] === null ? null : this.permit(value['permit']),
            acknowledgment:
                value['acknowledgment'] === null
                    ? null
                    : this.acknowledgment(value['acknowledgment']),
        };
    }

    static #sequence(raw: unknown): bigint {
        const sequence: bigint = Boundary.integer(raw);
        if (sequence === 0n) {
            throw new Error('Positive host sequence required');
        }
        return sequence;
    }
    static #signature(raw: unknown): string {
        return ConnectorEnrollmentCodec.binary(raw, IdentityLengths.signature);
    }
    static #original(value: Readonly<Record<string, unknown>>): HostOriginal {
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            journalId: ConnectorEnrollmentCodec.digest(value['journalId']),
            jobId: Boundary.id(value['jobId']),
            sequence: this.#sequence(value['sequence']),
            dispatchId: ConnectorDeviceCodec.nonce(value['dispatchId']),
            requestHash: ConnectorEnrollmentCodec.digest(value['requestHash']),
        };
    }
}

/** All signed receipts share one exact original correlation identity. */
interface HostOriginal {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly journalId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
}

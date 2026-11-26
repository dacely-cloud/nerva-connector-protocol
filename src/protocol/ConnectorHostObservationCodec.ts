// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ExecutionMachineBoundary as Data } from '../execution/ExecutionMachineBoundary.js';
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { ConnectorEnrollmentCodec as Identity } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ConnectorHostObservationTranscript as Transcript } from './ConnectorHostObservationTranscript.js';
import {
    ConnectorHostObservationKind as Kind,
    ConnectorHostObservationLimits as Limits,
    type ConnectorHostObservationOrigin as Origin,
    type ConnectorHostObservationPermit as Permit,
    type ConnectorHostObservationReady as Ready,
    type ConnectorHostObservationChanged as Changed,
    type ConnectorHostObservationAcknowledgment as Acknowledgment,
    type ConnectorHostObservationChange as Change,
    type ConnectorHostObservationAcknowledgedChange as AcknowledgedChange,
} from './ConnectorHostObservation.js';

/** Decoding accepts one closed finite representation and never turns correlation data into authorization. */
export class ConnectorHostObservationCodec {
    /** Raw JSON is byte-bounded before parsing; records still require the corresponding typed reader. */
    public static json(json: string): unknown {
        Data.data(json, Limits.FrameBytes);
        return JSON.parse(json);
    }
    /** Only exact native handle families are supported by observation capabilities. */
    public static kind(raw: unknown): Kind {
        const value: Kind | undefined = Object.values(Kind).find(
            (entry: Kind): boolean => entry === raw,
        );
        if (value === undefined) {
            throw new Error('Invalid host observation kind');
        }
        return value;
    }
    /** Positive generations, grant revisions and job identities never accept zero or floating point. */
    public static positive(raw: unknown): bigint {
        const value: bigint = Boundary.integer(raw);
        if (value === 0n) {
            throw new Error('Positive host observation revision required');
        }
        return value;
    }
    /** Full immutable private/start/grant commitments survive result compaction without fresh execution authority. */
    public static origin(raw: unknown): Origin {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'accountSha256',
            'ownerSha256',
            'providerSha256',
            'environmentId',
            'enrollmentId',
            'journalId',
            'grantId',
            'grantRevision',
            'startJobId',
            'startSequence',
            'startDispatchId',
            'startRequestHash',
            'startResponseHash',
            'processId',
            'kind',
        ]);
        return this.#bounded({
            accountSha256: Identity.digest(value['accountSha256']),
            ownerSha256: Identity.digest(value['ownerSha256']),
            providerSha256: Identity.digest(value['providerSha256']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: Identity.id(value['enrollmentId']),
            journalId: Identity.digest(value['journalId']),
            grantId: Identity.digest(value['grantId']),
            grantRevision: this.positive(value['grantRevision']),
            startJobId: Boundary.id(value['startJobId']),
            startSequence: this.positive(value['startSequence']),
            startDispatchId: ConnectorDeviceCodec.nonce(value['startDispatchId']),
            startRequestHash: Identity.digest(value['startRequestHash']),
            startResponseHash: Identity.digest(value['startResponseHash']),
            processId: Boundary.id(value['processId']),
            kind: this.kind(value['kind']),
        });
    }
    /** Initial attach requires both instance pins absent; renewal requires both present under a finite signed deadline. */
    public static permit(raw: unknown): Permit {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'authorityId',
            'leaseId',
            'companionNonce',
            'observationId',
            'generation',
            'origin',
            'originSha256',
            'runtimeId',
            'instanceSha256',
            'issuedAtMs',
            'expiresAtMs',
            'signature',
        ]);
        const issuedAtMs: bigint = Boundary.integer(value['issuedAtMs']);
        const expiresAtMs: bigint = Boundary.integer(value['expiresAtMs']);
        if (
            expiresAtMs <= issuedAtMs ||
            expiresAtMs - issuedAtMs > Limits.PermitMs ||
            (value['runtimeId'] === null) !== (value['instanceSha256'] === null)
        ) {
            throw new Error('Invalid host observation permit lifetime or instance pins');
        }
        return this.#bounded({
            authorityId: Boundary.id(value['authorityId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            companionNonce: ConnectorDeviceCodec.nonce(value['companionNonce']),
            observationId: ConnectorDeviceCodec.nonce(value['observationId']),
            generation: this.positive(value['generation']),
            origin: this.origin(value['origin']),
            originSha256: Identity.digest(value['originSha256']),
            runtimeId:
                value['runtimeId'] === null ? null : ConnectorDeviceCodec.nonce(value['runtimeId']),
            instanceSha256:
                value['instanceSha256'] === null ? null : Identity.digest(value['instanceSha256']),
            issuedAtMs,
            expiresAtMs,
            signature: this.#signature(value['signature']),
        });
    }
    /** Signed readiness carries no arbitrary snapshot, bytes or false quiescence claim. */
    public static ready(raw: unknown): Ready {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'enrollmentId',
            'leaseId',
            'companionNonce',
            'journalId',
            'observationId',
            'generation',
            'originSha256',
            'permitSha256',
            'runtimeId',
            'instanceSha256',
            'revision',
            'signature',
        ]);
        return this.#bounded({
            enrollmentId: Identity.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            companionNonce: ConnectorDeviceCodec.nonce(value['companionNonce']),
            journalId: Identity.digest(value['journalId']),
            observationId: ConnectorDeviceCodec.nonce(value['observationId']),
            generation: this.positive(value['generation']),
            originSha256: Identity.digest(value['originSha256']),
            permitSha256: Identity.digest(value['permitSha256']),
            runtimeId: ConnectorDeviceCodec.nonce(value['runtimeId']),
            instanceSha256: Identity.digest(value['instanceSha256']),
            revision: Boundary.integer(value['revision']),
            signature: this.#signature(value['signature']),
        });
    }
    /** Batches are nonempty and strictly ordered by observation identity before any signing or state lookup. */
    public static changed(raw: unknown): Changed {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'enrollmentId',
            'leaseId',
            'companionNonce',
            'journalId',
            'runtimeId',
            'batchRevision',
            'changes',
            'signature',
        ]);
        const changes: readonly Change[] = Data.array(value['changes'], Limits.Entries).map(
            (raw: unknown): Change => {
                const item: Readonly<Record<string, unknown>> = Data.record(raw, [
                    'observationId',
                    'generation',
                    'originSha256',
                    'permitSha256',
                    'instanceSha256',
                    'processId',
                    'kind',
                    'revision',
                ]);
                return {
                    observationId: ConnectorDeviceCodec.nonce(item['observationId']),
                    generation: this.positive(item['generation']),
                    originSha256: Identity.digest(item['originSha256']),
                    permitSha256: Identity.digest(item['permitSha256']),
                    instanceSha256: Identity.digest(item['instanceSha256']),
                    processId: Boundary.id(item['processId']),
                    kind: this.kind(item['kind']),
                    revision: Boundary.integer(item['revision']),
                };
            },
        );
        this.#ordered(changes);
        return this.#bounded({
            enrollmentId: Identity.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            companionNonce: ConnectorDeviceCodec.nonce(value['companionNonce']),
            journalId: Identity.digest(value['journalId']),
            runtimeId: ConnectorDeviceCodec.nonce(value['runtimeId']),
            batchRevision: this.positive(value['batchRevision']),
            changes,
            signature: this.#signature(value['signature']),
        });
    }
    /** Acknowledgments contain exactly the closed identity/revision rows, never new observer source or native effects. */
    public static acknowledgment(raw: unknown): Acknowledgment {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'authorityId',
            'enrollmentId',
            'leaseId',
            'companionNonce',
            'journalId',
            'runtimeId',
            'batchRevision',
            'batchSha256',
            'changes',
            'signature',
        ]);
        const changes: readonly AcknowledgedChange[] = Data.array(
            value['changes'],
            Limits.Entries,
        ).map((raw: unknown): AcknowledgedChange => {
            const item: Readonly<Record<string, unknown>> = Data.record(raw, [
                'observationId',
                'generation',
                'revision',
            ]);
            return {
                observationId: ConnectorDeviceCodec.nonce(item['observationId']),
                generation: this.positive(item['generation']),
                revision: Boundary.integer(item['revision']),
            };
        });
        this.#ordered(changes);
        return this.#bounded({
            authorityId: Boundary.id(value['authorityId']),
            enrollmentId: Identity.id(value['enrollmentId']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            companionNonce: ConnectorDeviceCodec.nonce(value['companionNonce']),
            journalId: Identity.digest(value['journalId']),
            runtimeId: ConnectorDeviceCodec.nonce(value['runtimeId']),
            batchRevision: this.positive(value['batchRevision']),
            batchSha256: Identity.digest(value['batchSha256']),
            changes,
            signature: this.#signature(value['signature']),
        });
    }
    static #signature(raw: unknown): string {
        return Identity.binary(raw, IdentityLengths.signature);
    }
    static #ordered(values: readonly AcknowledgedChange[]): void {
        if (values.length === 0) {
            throw new Error('Empty host observation batch');
        }
        for (let index: number = 1; index < values.length; index++) {
            const previous: AcknowledgedChange | undefined = values[index - 1];
            const current: AcknowledgedChange | undefined = values[index];
            if (
                previous === undefined ||
                current === undefined ||
                previous.observationId >= current.observationId
            ) {
                throw new Error('Host observation identities must be unique and sorted');
            }
        }
    }
    static #bounded<T>(value: T): T {
        Data.data(Transcript.encode(value), Limits.FrameBytes);
        return value;
    }
}

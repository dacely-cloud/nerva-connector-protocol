// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type {
    ConnectorHostObservationOrigin as Origin,
    ConnectorHostObservationPermit as Permit,
    ConnectorHostObservationReady as Ready,
    ConnectorHostObservationChanged as Changed,
    ConnectorHostObservationAcknowledgment as Acknowledgment,
    ConnectorHostObservationChange as Change,
    ConnectorHostObservationAcknowledgedChange as AcknowledgedChange,
} from './ConnectorHostObservation.js';

/** Canonical ordered tuples are browser-safe and never depend on object insertion order. */
export class ConnectorHostObservationTranscript {
    /** Domain-tagged exact JSON keeps every external integer in canonical decimal form. */
    public static encode<T>(value: T): string {
        return JSON.stringify(value, (_key: string, item: unknown): unknown =>
            typeof item === 'bigint' ? item.toString() : item,
        );
    }
    /** The complete verified source, private owner and grant participate in origin identity. */
    public static origin(value: Origin): string {
        return this.encode([
            'nerva-connector:host:observation:origin',
            value.accountSha256,
            value.ownerSha256,
            value.providerSha256,
            value.environmentId,
            value.enrollmentId,
            value.journalId,
            value.grantId,
            value.grantRevision,
            value.startJobId,
            value.startSequence,
            value.startDispatchId,
            value.startRequestHash,
            value.startResponseHash,
            value.processId,
            value.kind,
        ]);
    }
    /** Native instance commitments remain unchanged when the same observation renews its delivery lease. */
    public static instance(
        originSha256: string,
        runtimeId: string,
        processId: string,
        kind: Origin['kind'],
    ): string {
        return this.encode([
            'nerva-connector:host:observation:instance',
            originSha256,
            runtimeId,
            processId,
            kind,
        ]);
    }
    /** The full origin is represented by a receiver-recomputed commitment in the signed permit. */
    public static permit(value: Omit<Permit, 'signature'>): string {
        return this.encode([
            'nerva-connector:host:observation:permit',
            value.authorityId,
            value.leaseId,
            value.companionNonce,
            value.observationId,
            value.generation,
            value.originSha256,
            value.runtimeId,
            value.instanceSha256,
            value.issuedAtMs,
            value.expiresAtMs,
        ]);
    }
    /** Ready commits current transport authority independently from the immutable native instance. */
    public static ready(value: Omit<Ready, 'signature'>): string {
        return this.encode([
            'nerva-connector:host:observation:ready',
            value.enrollmentId,
            value.leaseId,
            value.companionNonce,
            value.journalId,
            value.observationId,
            value.generation,
            value.originSha256,
            value.permitSha256,
            value.runtimeId,
            value.instanceSha256,
            value.revision,
        ]);
    }
    /** Each tuple retains all observation, source and native-process correlation fields. */
    public static changed(value: Omit<Changed, 'signature'>): string {
        return this.encode([
            'nerva-connector:host:observation:changed',
            value.enrollmentId,
            value.leaseId,
            value.companionNonce,
            value.journalId,
            value.runtimeId,
            value.batchRevision,
            value.changes.map((item: Change): readonly (string | bigint)[] => [
                item.observationId,
                item.generation,
                item.originSha256,
                item.permitSha256,
                item.instanceSha256,
                item.processId,
                item.kind,
                item.revision,
            ]),
        ]);
    }
    /** Hash plus exact row set prevents acknowledgment of an omitted, reordered or substituted change. */
    public static acknowledgment(value: Omit<Acknowledgment, 'signature'>): string {
        return this.encode([
            'nerva-connector:host:observation:acknowledgment',
            value.authorityId,
            value.enrollmentId,
            value.leaseId,
            value.companionNonce,
            value.journalId,
            value.runtimeId,
            value.batchRevision,
            value.batchSha256,
            value.changes.map((item: AcknowledgedChange): readonly (string | bigint)[] => [
                item.observationId,
                item.generation,
                item.revision,
            ]),
        ]);
    }
}

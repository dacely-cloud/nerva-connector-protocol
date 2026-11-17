// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Canonical ordered tuples are browser-safe and never depend on object insertion order. */
export class ConnectorHostObservationTranscript {
    /** Domain-tagged exact JSON keeps every external integer in canonical decimal form. */
    static encode(value) {
        return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item);
    }
    /** The complete verified source, private owner and grant participate in origin identity. */
    static origin(value) {
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
    static instance(originSha256, runtimeId, processId, kind) {
        return this.encode([
            'nerva-connector:host:observation:instance',
            originSha256,
            runtimeId,
            processId,
            kind,
        ]);
    }
    /** The full origin is represented by a receiver-recomputed commitment in the signed permit. */
    static permit(value) {
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
    static ready(value) {
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
    static changed(value) {
        return this.encode([
            'nerva-connector:host:observation:changed',
            value.enrollmentId,
            value.leaseId,
            value.companionNonce,
            value.journalId,
            value.runtimeId,
            value.batchRevision,
            value.changes.map((item) => [
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
    static acknowledgment(value) {
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
            value.changes.map((item) => [
                item.observationId,
                item.generation,
                item.revision,
            ]),
        ]);
    }
}

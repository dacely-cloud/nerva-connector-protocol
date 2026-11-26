// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorAuthorizationCodec } from '../protocol/ConnectorAuthorizationCodec.js';
import { createHash } from 'node:crypto';
/** Purpose-selected composite signatures cover these canonical payloads; hashes never grant execution by themselves. */
export class ExecutionProof {
    /** Exact ordered wire metadata has an unambiguous SHA256 commitment. */
    static digest(value) {
        return createHash('sha256').update(value).digest('hex');
    }
    /** A request hash binds its application identity and every variable argument. */
    static requestHash(value) {
        return this.digest(this.#encode(value));
    }
    /** A terminal commitment includes exact bounded output bytes and uncertain-outcome classification. */
    static responseHash(value) {
        return this.digest(JSON.stringify(value));
    }
    /** Exact byte commitments are independent of delivery lease and terminal response classification. */
    static outputHash(value) {
        return this.digest(JSON.stringify([value.stdoutBase64, value.stderrBase64]));
    }
    /** Output cannot be moved between original commands, leases or signature purposes. */
    static output(value) {
        return Buffer.from(JSON.stringify([
            ...this.#binding(value),
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
            value.admissionHash,
            value.outputHash,
        ]));
    }
    /** A backend prefix receipt cannot compact or complete a command. */
    static outputAck(value) {
        return Buffer.from(JSON.stringify([value.authorityId, this.output(value).toString('utf8')]));
    }
    /** Publication binds private-policy commitment, public grants, journal and current environment/lease. */
    static publication(value) {
        return Buffer.from(JSON.stringify([...this.#binding(value), value.journalId, this.#encode(value.profile)]));
    }
    /** Both start and effect deadlines are covered independently of transport metadata. */
    static permit(value) {
        return Buffer.from(JSON.stringify([
            value.authorityId,
            ...this.#binding(value),
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
            value.admissionHash,
            ConnectorAuthorizationCodec.encode(value.authorization),
            value.request.policySha256,
            value.issuedAtMs.toString(),
            value.expiresAtMs.toString(),
            value.executionDeadlineMs.toString(),
        ]));
    }
    /** Stop authority commits the complete original payload hash, target, lease and finite validity under a distinct signing purpose. */
    static cancellation(value) {
        return Buffer.from(JSON.stringify([
            value.authorityId,
            ...this.#binding(value),
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
            value.admissionHash,
            ConnectorAuthorizationCodec.encode(value.authorization),
            value.issuedAtMs.toString(),
            value.expiresAtMs.toString(),
        ]));
    }
    /** Device result proof cannot authorize another effect or omit its original response commitment. */
    static completion(value) {
        return Buffer.from(JSON.stringify(this.#receipt(value)));
    }
    /** Only the separately pinned backend authority may permit discarding this retained result. */
    static acknowledgment(value) {
        return Buffer.from(JSON.stringify([value.authorityId, ...this.#receipt(value)]));
    }
    /** Device confirmation follows a distinct signing purpose after durable compaction. */
    static acknowledged(value) {
        return Buffer.from(JSON.stringify(this.#receipt(value)));
    }
    /** A stable cgroup name is derived only from the original durable operation, never a caller-selected host path. */
    static cgroupId(journalId, value) {
        return this.digest(JSON.stringify([
            'nerva-connector:execution:cgroup',
            journalId,
            value.enrollmentId,
            value.lane,
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
        ]));
    }
    /** Exact integers keep their canonical decimal text inside every committed JSON body. */
    static #encode(value) {
        return JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
    }
    static #binding(value) {
        return [value.lane, value.environmentId, value.enrollmentId, value.leaseId];
    }
    static #receipt(value) {
        return [
            ...this.#binding(value),
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
            value.admissionHash,
            value.responseHash,
        ];
    }
}

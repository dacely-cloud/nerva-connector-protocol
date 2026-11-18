// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ConnectorAuthorizationCodec } from '../protocol/ConnectorAuthorizationCodec.js';
import { createHash } from 'node:crypto';
import type {
    ExecutionOutput,
    ExecutionOutputOriginal,
    ExecutionOutputAck,
} from './ExecutionOutput.js';
import type {
    ExecutionPublication,
    ExecutionPermit,
    ExecutionCancellation,
    ExecutionCompletion,
    ExecutionAcknowledgment,
    ExecutionAcknowledged,
    ExecutionRequest,
    ExecutionProfile,
} from './ExecutionJobs.js';
import type { ExecutionResult } from './ExecutionTypes.js';

/** Purpose-selected composite signatures cover these canonical payloads; hashes never grant execution by themselves. */
export class ExecutionProof {
    /** Exact ordered wire metadata has an unambiguous SHA256 commitment. */
    public static digest(value: string): string {
        return createHash('sha256').update(value).digest('hex');
    }
    /** A request hash binds its application identity and every variable argument. */
    public static requestHash(value: ExecutionRequest): string {
        return this.digest(this.#encode(value));
    }
    /** A terminal commitment includes exact bounded output bytes and uncertain-outcome classification. */
    public static responseHash(value: ExecutionResult): string {
        return this.digest(JSON.stringify(value));
    }
    /** Exact byte commitments are independent of delivery lease and terminal response classification. */
    public static outputHash(value: ExecutionOutput): string {
        return this.digest(JSON.stringify([value.stdoutBase64, value.stderrBase64]));
    }
    /** Output cannot be moved between original commands, leases or signature purposes. */
    public static output(value: ExecutionOutputOriginal): Buffer {
        return Buffer.from(
            JSON.stringify([
                ...this.#binding(value),
                value.jobId,
                value.sequence.toString(),
                value.dispatchId,
                value.requestHash,
                value.admissionHash,
                value.outputHash,
            ]),
        );
    }
    /** A backend prefix receipt cannot compact or complete a command. */
    public static outputAck(value: Omit<ExecutionOutputAck, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([value.authorityId, this.output(value).toString('utf8')]),
        );
    }
    /** Publication binds private-policy commitment, public grants, journal and current environment/lease. */
    public static publication(value: Omit<ExecutionPublication, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([...this.#binding(value), value.journalId, this.#encode(value.profile)]),
        );
    }
    /** Both start and effect deadlines are covered independently of transport metadata. */
    public static permit(value: Omit<ExecutionPermit, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([
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
            ]),
        );
    }
    /** Stop authority commits the complete original payload hash, target, lease and finite validity under a distinct signing purpose. */
    public static cancellation(value: Omit<ExecutionCancellation, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([
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
            ]),
        );
    }
    /** Device result proof cannot authorize another effect or omit its original response commitment. */
    public static completion(value: Omit<ExecutionCompletion, 'signature'>): Buffer {
        return Buffer.from(JSON.stringify(this.#receipt(value)));
    }
    /** Only the separately pinned backend authority may permit discarding this retained result. */
    public static acknowledgment(value: Omit<ExecutionAcknowledgment, 'signature'>): Buffer {
        return Buffer.from(JSON.stringify([value.authorityId, ...this.#receipt(value)]));
    }
    /** Device confirmation follows a distinct signing purpose after durable compaction. */
    public static acknowledged(value: Omit<ExecutionAcknowledged, 'signature'>): Buffer {
        return Buffer.from(JSON.stringify(this.#receipt(value)));
    }
    /** A stable cgroup name is derived only from the original durable operation, never a caller-selected host path. */
    public static cgroupId(
        journalId: string,
        value: Pick<
            ExecutionPermit,
            'enrollmentId' | 'jobId' | 'sequence' | 'dispatchId' | 'requestHash' | 'lane'
        >,
    ): string {
        return this.digest(
            JSON.stringify([
                'nerva-connector:execution:cgroup',
                journalId,
                value.enrollmentId,
                value.lane,
                value.jobId,
                value.sequence.toString(),
                value.dispatchId,
                value.requestHash,
            ]),
        );
    }
    /** Exact integers keep their canonical decimal text inside every committed JSON body. */
    static #encode(value: ExecutionRequest | ExecutionProfile): string {
        return JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
    static #binding(
        value: Pick<ExecutionPermit, 'environmentId' | 'enrollmentId' | 'leaseId' | 'lane'>,
    ): readonly string[] {
        return [value.lane, value.environmentId, value.enrollmentId, value.leaseId];
    }
    static #receipt(
        value: Omit<
            ExecutionAcknowledged | ExecutionCompletion | ExecutionAcknowledgment,
            'signature'
        >,
    ): readonly string[] {
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

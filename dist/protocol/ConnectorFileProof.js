// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import { createHash } from 'node:crypto';
import { ConnectorFileProofPurpose, } from './ConnectorFileJobs.js';
/** Shared proof purposes use canonical exact metadata and never transfer a private key. */
export class ConnectorFileProof {
    /** Hash canonical validated domain values, never an unchecked serialized object. */
    static digest(value) {
        return createHash('sha256').update(value).digest('hex');
    }
    /** Responses have a fixed validated shape with exact decimal quantities. */
    static responseHash(value) {
        return this.digest(JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry));
    }
    /** Profile authorization includes the exact lease and ordered root grant list. */
    static publication(value) {
        return Buffer.from(JSON.stringify([
            ConnectorFileProofPurpose.Profile,
            value.journalId,
            value.enrollmentId,
            value.leaseId,
            value.profile.mode,
            value.profile.revision.toString(),
            value.profile.policySha256,
            value.profile.roots,
            value.profile.maximumReadBytes,
            value.profile.maximumWriteBytes,
        ]));
    }
    /** Backend requests bind one original dispatch and a finite current connection. */
    static permit(value) {
        return Buffer.from(JSON.stringify([
            ConnectorFileProofPurpose.Permit,
            value.authorityId,
            value.enrollmentId,
            value.leaseId,
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
            value.admissionHash,
            ConnectorAuthorizationCodec.encode(value.authorization),
            value.request.policySha256,
            value.issuedAtMs.toString(),
            value.expiresAtMs.toString(),
        ]));
    }
    /** Device result proofs cannot be repurposed as acknowledgments or operation permits. */
    static completion(value) {
        return this.#receipt(ConnectorFileProofPurpose.Result, value);
    }
    /** Only private backend authority may instruct durable local compaction. */
    static acknowledgment(value) {
        return Buffer.from(JSON.stringify([
            ConnectorFileProofPurpose.Acknowledgment,
            value.authorityId,
            ...this.#fields(value),
        ]));
    }
    /** Device compaction confirmation follows its own purpose after the encrypted journal commits. */
    static acknowledged(value) {
        return this.#receipt(ConnectorFileProofPurpose.Acknowledged, value);
    }
    /** Both components sign the exact receiver-selected file purpose with the caller-owned composite identity. */
    static sign(key, purpose, payload) {
        return key.sign(purpose, payload);
    }
    /** The exact enrolled composite pin and file purpose must verify both proof components. */
    static verify(verifier, publicKey, purpose, payload, signature) {
        return verifier.verify(purpose, publicKey, payload, signature);
    }
    static #fields(value) {
        return [
            value.enrollmentId,
            value.leaseId,
            value.jobId,
            value.sequence.toString(),
            value.dispatchId,
            value.requestHash,
            value.admissionHash,
            value.responseHash,
        ];
    }
    static #receipt(purpose, value) {
        return Buffer.from(JSON.stringify([purpose, ...this.#fields(value)]));
    }
}

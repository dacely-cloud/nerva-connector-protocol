// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import { createHash } from 'node:crypto';
import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import {
    ConnectorFileProofPurpose,
    type ConnectorFilePublication,
    type ConnectorFilePermit,
    type ConnectorFileCompletion,
    type ConnectorFileAcknowledgment,
    type ConnectorFileAcknowledged,
} from './ConnectorFileJobs.js';
import type { ConnectorFileResponse } from './ConnectorFiles.js';

/** Shared proof purposes use canonical exact metadata and never transfer a private key. */
export class ConnectorFileProof {
    /** Hash canonical validated domain values, never an unchecked serialized object. */
    public static digest(value: string): string {
        return createHash('sha256').update(value).digest('hex');
    }
    /** Responses have a fixed validated shape with exact decimal quantities. */
    public static responseHash(value: ConnectorFileResponse): string {
        return this.digest(
            JSON.stringify(value, (_key: string, entry: unknown): unknown =>
                typeof entry === 'bigint' ? entry.toString() : entry,
            ),
        );
    }
    /** Profile authorization includes the exact lease and ordered root grant list. */
    public static publication(value: Omit<ConnectorFilePublication, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([
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
            ]),
        );
    }
    /** Backend requests bind one original dispatch and a finite current connection. */
    public static permit(value: Omit<ConnectorFilePermit, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([
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
            ]),
        );
    }
    /** Device result proofs cannot be repurposed as acknowledgments or operation permits. */
    public static completion(value: Omit<ConnectorFileCompletion, 'signature'>): Buffer {
        return this.#receipt(ConnectorFileProofPurpose.Result, value);
    }
    /** Only private backend authority may instruct durable local compaction. */
    public static acknowledgment(value: Omit<ConnectorFileAcknowledgment, 'signature'>): Buffer {
        return Buffer.from(
            JSON.stringify([
                ConnectorFileProofPurpose.Acknowledgment,
                value.authorityId,
                ...this.#fields(value),
            ]),
        );
    }
    /** Device compaction confirmation follows its own purpose after the encrypted journal commits. */
    public static acknowledged(value: Omit<ConnectorFileAcknowledged, 'signature'>): Buffer {
        return this.#receipt(ConnectorFileProofPurpose.Acknowledged, value);
    }
    /** Both components sign the exact receiver-selected file purpose with the caller-owned composite identity. */
    public static sign(key: PurposeSigner, purpose: SignaturePurpose, payload: Buffer): string {
        return key.sign(purpose, payload);
    }
    /** The exact enrolled composite pin and file purpose must verify both proof components. */
    public static verify(
        verifier: PurposeVerifier,
        publicKey: string,
        purpose: SignaturePurpose,
        payload: Buffer,
        signature: string,
    ): boolean {
        return verifier.verify(purpose, publicKey, payload, signature);
    }
    static #fields(
        value: Omit<
            ConnectorFileCompletion | ConnectorFileAcknowledgment | ConnectorFileAcknowledged,
            'signature'
        >,
    ): readonly string[] {
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
    static #receipt(
        purpose: ConnectorFileProofPurpose,
        value: Omit<ConnectorFileCompletion | ConnectorFileAcknowledged, 'signature'>,
    ): Buffer {
        return Buffer.from(JSON.stringify([purpose, ...this.#fields(value)]));
    }
}

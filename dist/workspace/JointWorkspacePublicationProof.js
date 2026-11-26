// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { JointWorkspaceProof } from './JointWorkspaceProof.js';
import { JointWorkspacePublicationCodec } from './JointWorkspacePublicationCodec.js';
/** A lease-specific proof never changes the immutable descriptor identity or substitutes for either device signature. */
export class JointWorkspacePublicationProof {
    /** Only the canonical complete descriptor body hash enters the lease-bound publication transcript. */
    static transcript(value) {
        const body = JointWorkspacePublicationCodec.body(value);
        return Buffer.from(JSON.stringify([
            'nerva-connector:joint-workspace-publication:1',
            body.enrollmentId,
            body.slot,
            body.leaseId,
            JointWorkspaceProof.bindingSha256(body.descriptor.binding),
        ]));
    }
    /** Local signing requires the descriptor to authenticate under this same enrolled device identity. */
    static sign(verifier, key, value) {
        const body = JointWorkspacePublicationCodec.body(value);
        const scope = {
            authorityId: body.descriptor.binding.authorityId,
            environmentId: body.descriptor.binding.environmentId,
            enrollmentId: body.enrollmentId,
            devicePublicKey: key.publicKey,
        };
        if (!JointWorkspaceProof.verify(verifier, scope, body.descriptor)) {
            throw new Error('Joint workspace descriptor does not authenticate under this device');
        }
        return JointWorkspacePublicationCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.JointWorkspacePublication, this.transcript(body)),
        });
    }
    /** Both composite proofs must verify against the receiver's current full scope and exact primary lease. */
    static verify(verifier, expected, value) {
        try {
            const current = JointWorkspacePublicationCodec.expected(expected);
            const publication = JointWorkspacePublicationCodec.value(value);
            const scope = {
                authorityId: current.authorityId,
                environmentId: current.environmentId,
                enrollmentId: current.enrollmentId,
                devicePublicKey: current.devicePublicKey,
            };
            return (publication.enrollmentId === current.enrollmentId &&
                publication.slot === current.slot &&
                publication.leaseId === current.leaseId &&
                JointWorkspaceProof.verify(verifier, scope, publication.descriptor) &&
                verifier.verify(SignaturePurpose.JointWorkspacePublication, current.devicePublicKey, this.transcript({
                    enrollmentId: publication.enrollmentId,
                    slot: publication.slot,
                    leaseId: publication.leaseId,
                    descriptor: publication.descriptor,
                }), publication.signature));
        }
        catch {
            return false;
        }
    }
}

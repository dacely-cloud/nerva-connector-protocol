// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { ConnectorDeviceLimits } from '../protocol/ConnectorDevice.js';
import { JointWorkspaceProof } from './JointWorkspaceProof.js';
import { JointWorkspacePublicationCodec } from './JointWorkspacePublicationCodec.js';
import { JointWorkspacePublicationProof } from './JointWorkspacePublicationProof.js';
import { JointWorkspaceReceiptCodec } from './JointWorkspaceReceiptCodec.js';
/** All authority replies correlate receiver-owned trust and an exact original before their concrete purpose can verify. */
export class JointWorkspaceReplyProof {
    /** The fixed purpose set prevents interpreting a delay as activation. */
    static verify(verifier, expected, original, value, originalSha256, signature, purpose, transcript, nowMs) {
        try {
            if (purpose !== SignaturePurpose.JointWorkspaceActivated &&
                purpose !== SignaturePurpose.JointWorkspaceRetry) {
                return false;
            }
            const current = JointWorkspaceReceiptCodec.expected(expected);
            const now = JointWorkspaceReceiptCodec.integer(nowMs);
            const body = JointWorkspaceReceiptCodec.body(value);
            const publication = JointWorkspacePublicationCodec.value(original);
            const scope = {
                authorityId: current.authorityId,
                environmentId: current.environmentId,
                enrollmentId: current.enrollmentId,
                devicePublicKey: current.devicePublicKey,
                slot: current.slot,
                leaseId: current.leaseId,
            };
            return (now < current.leaseExpiresAtMs &&
                body.issuedAtMs >= current.leaseIssuedAtMs &&
                body.issuedAtMs < current.leaseExpiresAtMs &&
                body.issuedAtMs <= now + ConnectorDeviceLimits.clockLeadMs &&
                body.authorityId === current.authorityId &&
                body.environmentId === current.environmentId &&
                body.enrollmentId === current.enrollmentId &&
                body.slot === current.slot &&
                body.leaseId === current.leaseId &&
                JointWorkspacePublicationProof.verify(verifier, scope, publication) &&
                body.bindingRevision === publication.descriptor.binding.revision &&
                body.bindingSha256 ===
                    JointWorkspaceProof.bindingSha256(publication.descriptor.binding) &&
                body.publicationSha256 === originalSha256 &&
                verifier.verify(purpose, current.authorityPublicKey, transcript, signature));
        }
        catch {
            return false;
        }
    }
}

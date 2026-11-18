// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { ConnectorDeviceLimits } from '../protocol/ConnectorDevice.js';
import { JointWorkspaceProof } from './JointWorkspaceProof.js';
import { JointWorkspacePublicationCodec } from './JointWorkspacePublicationCodec.js';
import { JointWorkspacePublicationProof } from './JointWorkspacePublicationProof.js';
import type {
    JointWorkspacePublication,
    JointWorkspacePublicationExpected,
} from './JointWorkspacePublication.js';
import { JointWorkspaceReceiptCodec } from './JointWorkspaceReceiptCodec.js';
import type {
    JointWorkspaceReceiptBody,
    JointWorkspaceReceiptExpected,
} from './JointWorkspaceReceipt.js';

/** All authority replies correlate receiver-owned trust and an exact original before their concrete purpose can verify. */
export class JointWorkspaceReplyProof {
    /** The fixed purpose set prevents interpreting a delay as activation. */
    public static verify(
        verifier: PurposeVerifier,
        expected: JointWorkspaceReceiptExpected,
        original: JointWorkspacePublication,
        value: JointWorkspaceReceiptBody,
        originalSha256: string,
        signature: string,
        purpose: SignaturePurpose.JointWorkspaceActivated | SignaturePurpose.JointWorkspaceRetry,
        transcript: Buffer,
        nowMs: bigint,
    ): boolean {
        try {
            if (
                purpose !== SignaturePurpose.JointWorkspaceActivated &&
                purpose !== SignaturePurpose.JointWorkspaceRetry
            ) {
                return false;
            }
            const current: JointWorkspaceReceiptExpected =
                JointWorkspaceReceiptCodec.expected(expected);
            const now: bigint = JointWorkspaceReceiptCodec.integer(nowMs);
            const body: JointWorkspaceReceiptBody = JointWorkspaceReceiptCodec.body(value);
            const publication: JointWorkspacePublication =
                JointWorkspacePublicationCodec.value(original);
            const scope: JointWorkspacePublicationExpected = {
                authorityId: current.authorityId,
                environmentId: current.environmentId,
                enrollmentId: current.enrollmentId,
                devicePublicKey: current.devicePublicKey,
                slot: current.slot,
                leaseId: current.leaseId,
            };
            return (
                now < current.leaseExpiresAtMs &&
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
                verifier.verify(purpose, current.authorityPublicKey, transcript, signature)
            );
        } catch {
            return false;
        }
    }
}

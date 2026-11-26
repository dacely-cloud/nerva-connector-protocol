// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { JointWorkspaceReplyProof } from './JointWorkspaceReplyProof.js';
import { createHash } from 'node:crypto';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { JointWorkspacePublicationCodec } from './JointWorkspacePublicationCodec.js';
import { JointWorkspaceReceiptCodec } from './JointWorkspaceReceiptCodec.js';
/** A verified acceptance authenticates the exact submitted publication; it does not prove a command effect or durable operation completion. */
export class JointWorkspaceReceiptProof {
    /** Canonical hashing includes BOTH complete device proofs, not just the stable descriptor body commitment. */
    static publicationSha256(publication) {
        return createHash('sha256')
            .update(JointWorkspacePublicationCodec.encode(publication))
            .digest('hex');
    }
    /** Authority proofs authenticate all scope, lease, original-publication and issuance fields in fixed order. */
    static transcript(value) {
        const body = JointWorkspaceReceiptCodec.body(value);
        return Buffer.from(JSON.stringify([
            'nerva-connector:joint-workspace-activated:1',
            body.authorityId,
            body.environmentId,
            body.enrollmentId,
            body.slot,
            body.leaseId,
            body.bindingRevision.toString(),
            body.bindingSha256,
            body.publicationSha256,
            body.issuedAtMs.toString(),
        ]));
    }
    /** The backend returns a signed candidate only after its fenced acceptance transaction commits. */
    static sign(key, value) {
        const body = JointWorkspaceReceiptCodec.body(value);
        return JointWorkspaceReceiptCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.JointWorkspaceActivated, this.transcript(body)),
        });
    }
    /** Trust, original publication and actual lease interval are receiver-owned inputs; no reply-selected pin or fallback is permitted. */
    static verify(verifier, expected, original, value, nowMs) {
        try {
            const receipt = JointWorkspaceReceiptCodec.value(value);
            const body = {
                authorityId: receipt.authorityId,
                environmentId: receipt.environmentId,
                enrollmentId: receipt.enrollmentId,
                slot: receipt.slot,
                leaseId: receipt.leaseId,
                bindingRevision: receipt.bindingRevision,
                bindingSha256: receipt.bindingSha256,
                publicationSha256: receipt.publicationSha256,
                issuedAtMs: receipt.issuedAtMs,
            };
            return JointWorkspaceReplyProof.verify(verifier, expected, original, body, this.publicationSha256(original), receipt.signature, SignaturePurpose.JointWorkspaceActivated, this.transcript(body), nowMs);
        }
        catch {
            return false;
        }
    }
}

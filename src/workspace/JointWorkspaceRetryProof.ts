// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { JointWorkspaceRetryCodec } from './JointWorkspaceRetryCodec.js';
import type { JointWorkspaceRetry, JointWorkspaceRetryBody } from './JointWorkspaceRetry.js';
import type { JointWorkspacePublication } from './JointWorkspacePublication.js';
import type { JointWorkspaceReceiptExpected } from './JointWorkspaceReceipt.js';
import { JointWorkspaceReplyProof } from './JointWorkspaceReplyProof.js';
import { JointWorkspaceReceiptProof } from './JointWorkspaceReceiptProof.js';
/** A verified publication delay grants no active workspace and changes no operation history. */
export class JointWorkspaceRetryProof {
    /** Both delay fields are covered under a purpose distinct from activation. */
    public static transcript(value: JointWorkspaceRetryBody): Buffer {
        const body: JointWorkspaceRetryBody = JointWorkspaceRetryCodec.body(value);
        return Buffer.from(
            JSON.stringify([
                'nerva-connector:joint-workspace-retry:1',
                body.authorityId,
                body.environmentId,
                body.enrollmentId,
                body.slot,
                body.leaseId,
                body.bindingRevision.toString(),
                body.bindingSha256,
                body.publicationSha256,
                body.issuedAtMs.toString(),
                body.reason,
                body.retryAfterMs,
            ]),
        );
    }
    /** The caller transmits only after its current verified lease fence commits. */
    public static sign(key: PurposeSigner, value: JointWorkspaceRetryBody): JointWorkspaceRetry {
        const body: JointWorkspaceRetryBody = JointWorkspaceRetryCodec.body(value);
        return JointWorkspaceRetryCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.JointWorkspaceRetry, this.transcript(body)),
        });
    }
    /** Both authority components, complete original publication and actual lease are receiver-selected. */
    public static verify(
        verifier: PurposeVerifier,
        expected: JointWorkspaceReceiptExpected,
        original: JointWorkspacePublication,
        value: JointWorkspaceRetry,
        nowMs: bigint,
    ): boolean {
        try {
            const retry: JointWorkspaceRetry = JointWorkspaceRetryCodec.value(value);
            const body: JointWorkspaceRetryBody = {
                ...JointWorkspaceRetryCodec.receipt(retry),
                reason: retry.reason,
                retryAfterMs: retry.retryAfterMs,
            };
            return JointWorkspaceReplyProof.verify(
                verifier,
                expected,
                original,
                JointWorkspaceRetryCodec.receipt(body),
                JointWorkspaceReceiptProof.publicationSha256(original),
                retry.signature,
                SignaturePurpose.JointWorkspaceRetry,
                this.transcript(body),
                nowMs,
            );
        } catch {
            return false;
        }
    }
}

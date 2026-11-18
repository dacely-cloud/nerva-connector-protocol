import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import type { JointWorkspacePublication } from './JointWorkspacePublication.js';
import type { JointWorkspaceReceipt, JointWorkspaceReceiptBody, JointWorkspaceReceiptExpected } from './JointWorkspaceReceipt.js';
/** A verified acceptance authenticates the exact submitted publication; it does not prove a command effect or durable operation completion. */
export declare class JointWorkspaceReceiptProof {
    /** Canonical hashing includes BOTH complete device proofs, not just the stable descriptor body commitment. */
    static publicationSha256(publication: JointWorkspacePublication): string;
    /** Authority proofs authenticate all scope, lease, original-publication and issuance fields in fixed order. */
    static transcript(value: JointWorkspaceReceiptBody): Buffer;
    /** The backend returns a signed candidate only after its fenced acceptance transaction commits. */
    static sign(key: PurposeSigner, value: JointWorkspaceReceiptBody): JointWorkspaceReceipt;
    /** Trust, original publication and actual lease interval are receiver-owned inputs; no reply-selected pin or fallback is permitted. */
    static verify(verifier: PurposeVerifier, expected: JointWorkspaceReceiptExpected, original: JointWorkspacePublication, value: JointWorkspaceReceipt, nowMs: bigint): boolean;
}

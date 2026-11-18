import type { PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import type { JointWorkspacePublication } from './JointWorkspacePublication.js';
import type { JointWorkspaceReceiptBody, JointWorkspaceReceiptExpected } from './JointWorkspaceReceipt.js';
/** All authority replies correlate receiver-owned trust and an exact original before their concrete purpose can verify. */
export declare class JointWorkspaceReplyProof {
    /** The fixed purpose set prevents interpreting a delay as activation. */
    static verify(verifier: PurposeVerifier, expected: JointWorkspaceReceiptExpected, original: JointWorkspacePublication, value: JointWorkspaceReceiptBody, originalSha256: string, signature: string, purpose: SignaturePurpose.JointWorkspaceActivated | SignaturePurpose.JointWorkspaceRetry, transcript: Buffer, nowMs: bigint): boolean;
}

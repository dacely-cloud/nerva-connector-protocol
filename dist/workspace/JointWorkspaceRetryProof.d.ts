import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import type { JointWorkspaceRetry, JointWorkspaceRetryBody } from './JointWorkspaceRetry.js';
import type { JointWorkspacePublication } from './JointWorkspacePublication.js';
import type { JointWorkspaceReceiptExpected } from './JointWorkspaceReceipt.js';
/** A verified publication delay grants no active workspace and changes no operation history. */
export declare class JointWorkspaceRetryProof {
    /** Both delay fields are covered under a purpose distinct from activation. */
    static transcript(value: JointWorkspaceRetryBody): Buffer;
    /** The caller transmits only after its current verified lease fence commits. */
    static sign(key: PurposeSigner, value: JointWorkspaceRetryBody): JointWorkspaceRetry;
    /** Both authority components, complete original publication and actual lease are receiver-selected. */
    static verify(verifier: PurposeVerifier, expected: JointWorkspaceReceiptExpected, original: JointWorkspacePublication, value: JointWorkspaceRetry, nowMs: bigint): boolean;
}

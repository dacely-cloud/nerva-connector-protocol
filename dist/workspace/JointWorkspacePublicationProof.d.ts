import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import type { JointWorkspacePublication, JointWorkspacePublicationBody, JointWorkspacePublicationExpected } from './JointWorkspacePublication.js';
/** A lease-specific proof never changes the immutable descriptor identity or substitutes for either device signature. */
export declare class JointWorkspacePublicationProof {
    /** Only the canonical complete descriptor body hash enters the lease-bound publication transcript. */
    static transcript(value: JointWorkspacePublicationBody): Buffer;
    /** Local signing requires the descriptor to authenticate under this same enrolled device identity. */
    static sign(verifier: PurposeVerifier, key: PurposeSigner, value: JointWorkspacePublicationBody): JointWorkspacePublication;
    /** Both composite proofs must verify against the receiver's current full scope and exact primary lease. */
    static verify(verifier: PurposeVerifier, expected: JointWorkspacePublicationExpected, value: JointWorkspacePublication): boolean;
}

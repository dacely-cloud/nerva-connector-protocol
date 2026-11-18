import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import type { JointWorkspaceBinding, JointWorkspaceDescriptor, JointWorkspaceScope } from './JointWorkspaceBinding.js';
/** Signature and immutable-body commitments are separate domains; neither grants activation by itself. */
export declare class JointWorkspaceProof {
    #private;
    /** The full body commits exact scopes, policies, root aliases/access, physical commitment and all permanent journals. */
    static transcript(value: JointWorkspaceBinding): Buffer;
    /** Binding identity covers the canonical complete body, excluding randomized signature bytes. */
    static bindingSha256(binding: JointWorkspaceBinding): string;
    /** Both device signature components authenticate a frozen normalized body under the receiver-selected purpose. */
    static sign(key: PurposeSigner, value: JointWorkspaceBinding): JointWorkspaceDescriptor;
    /** Callers must supply the expected entire authority/environment/enrollment/device-key scope. */
    static verify(verifier: PurposeVerifier, expected: JointWorkspaceScope, value: JointWorkspaceDescriptor): boolean;
    /** A trusted stored head is required: this stateless check neither persists a watermark nor performs backend compare-and-set. */
    static supersedes(verifier: PurposeVerifier, scope: JointWorkspaceScope, previous: JointWorkspaceDescriptor, next: JointWorkspaceDescriptor): boolean;
}

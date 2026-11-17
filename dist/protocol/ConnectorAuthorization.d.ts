import type { JointWorkspaceDescriptor } from '../workspace/JointWorkspaceBinding.js';
/** Independent authority is explicit; missing joint metadata never implies this choice. */
export declare enum ConnectorAuthorizationKind {
    Independent = "independent",
    Joint = "joint"
}
/** The receiver selects its actual operation channel before computing an admission commitment. */
export declare enum ConnectorAdmissionChannel {
    File = "files",
    Execution = "execution"
}
/** This envelope claims no physical association between separately granted file and command roots. */
export interface ConnectorIndependentAuthorization {
    readonly kind: ConnectorAuthorizationKind.Independent;
}
/** The entire original signed descriptor remains available for independent identity/scope verification after head rotation. */
export interface ConnectorJointAuthorization {
    readonly kind: ConnectorAuthorizationKind.Joint;
    readonly binding: JointWorkspaceDescriptor;
}
/** Structural decoding and logical admission hashing never verify or grant the descriptor's signed authority. */
export type ConnectorAuthorization = ConnectorIndependentAuthorization | ConnectorJointAuthorization;
/** Complete authorization has a separate finite envelope budget without reducing the original request limits. */
export declare class ConnectorAuthorizationLimits {
    static readonly envelopeBytes: number;
}

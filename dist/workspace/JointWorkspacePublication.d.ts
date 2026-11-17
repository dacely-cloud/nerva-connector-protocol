import type { JointWorkspaceDescriptor, JointWorkspaceScope } from './JointWorkspaceBinding.js';
/** Publication transports an immutable descriptor on one exact authenticated primary connection lease. */
export interface JointWorkspacePublicationBody {
    readonly enrollmentId: string;
    readonly slot: number;
    readonly leaseId: string;
    readonly descriptor: JointWorkspaceDescriptor;
}
/** Device proof authenticates publication separately from the retained descriptor's device proof. */
export interface JointWorkspacePublication extends JointWorkspacePublicationBody {
    readonly signature: string;
}
/** The receiver supplies the enrolled identity, full deployment scope and exact current primary lease. */
export interface JointWorkspacePublicationExpected extends JointWorkspaceScope {
    readonly slot: number;
    readonly leaseId: string;
}
/** Two composite proofs and one bounded immutable descriptor fit a finite independent envelope. */
export declare class JointWorkspacePublicationLimits {
    /** Text is bounded before parsing or cryptographic verification. */
    static readonly envelopeBytes: number;
}

import { ConnectorFileMode } from '../protocol/ConnectorFiles.js';
import { type JointWorkspaceBinding, type JointWorkspaceDescriptor, type JointWorkspaceScope, type JointWorkspacePhysicalScope, type JointWorkspaceExecutionJournals } from './JointWorkspaceBinding.js';
/** Closed current shapes never infer access, omit a lane or substitute a local diagnostic digest. */
export declare class JointWorkspaceCodec {
    #private;
    /** External revisions are canonical positive signed-int64 decimal strings, never JavaScript numbers. */
    static binding(raw: unknown): JointWorkspaceBinding;
    /** Typed local values normalize through the same closed codec before proof work, with no unchecked JSON allocation. */
    static bindingValue(value: JointWorkspaceBinding): JointWorkspaceBinding;
    /** Only a composite signature and the complete exact body cross this boundary. */
    static descriptor(raw: unknown): JointWorkspaceDescriptor;
    /** Local immutable descriptors keep the same exact envelope without encoding before validation. */
    static descriptorValue(value: JointWorkspaceDescriptor): JointWorkspaceDescriptor;
    /** Bounded text is rejected before JSON decoding; objects still undergo closed shape and field validation. */
    static decode(json: string): JointWorkspaceDescriptor;
    /** The stored and wire representation retains exact decimal revisions and fixed field order. */
    static encode(value: JointWorkspaceBinding | JointWorkspaceDescriptor): string;
    /** Scope comes from authenticated local/backend ownership, never a descriptor-selected verification key. */
    static scope(raw: unknown): JointWorkspaceScope;
    /** Full authority pins are private derivation inputs and never become fields of the public binding. */
    static physicalScope(raw: unknown): JointWorkspacePhysicalScope;
    /** Different enum representations must still denote exactly the same explicitly granted mode. */
    static access(raw: unknown): ConnectorFileMode;
    /** Both lanes are mandatory and cannot share or replace a permanent journal identity. */
    static journals(raw: unknown): JointWorkspaceExecutionJournals;
}

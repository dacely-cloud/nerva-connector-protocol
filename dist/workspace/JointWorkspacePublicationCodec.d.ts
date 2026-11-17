import { type JointWorkspacePublication, type JointWorkspacePublicationBody, type JointWorkspacePublicationExpected } from './JointWorkspacePublication.js';
/** Browser-safe closed publication decoding never selects authority or relaxes a missing current lease. */
export declare class JointWorkspacePublicationCodec {
    #private;
    /** Wire descriptors retain exact decimal revisions; only the primary connection may publish joint workspaces. */
    static publication(raw: unknown): JointWorkspacePublication;
    /** Typed callers validate and freeze every field before serialization or proof work. */
    static value(value: JointWorkspacePublication): JointWorkspacePublication;
    /** Unsigned local publication input still requires its complete separately signed descriptor. */
    static body(value: JointWorkspacePublicationBody): JointWorkspacePublicationBody;
    /** Expected identity and lease come from receiver-owned current authentication, never the publication. */
    static expected(raw: unknown): JointWorkspacePublicationExpected;
    /** Oversized transport input is refused before JSON parsing. */
    static decode(json: string): JointWorkspacePublication;
    /** Complete typed validation precedes JSON allocation and exact revisions remain decimal strings. */
    static encode(value: JointWorkspacePublication): string;
}

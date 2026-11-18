import { ConnectorHostTool, type ConnectorHostProfile, type ConnectorHostRequest, type ConnectorHostSubmission, type ConnectorHostResponse, type ConnectorHostStatus, type ConnectorHostJobView, type ConnectorHostPublication, type ConnectorHostPermit, type ConnectorHostCompletion, type ConnectorHostAcknowledgment, type ConnectorHostAcknowledged, type ConnectorHostWork } from './ConnectorHost.js';
/** Exact current host contracts validate every external boundary without adopting remote authority. */
export declare class ConnectorHostCodec {
    #private;
    /** Explicit exact quantities are decimal strings in storage, hashing and transport. */
    static encode<T>(value: T): string;
    /** Consent may be disabled while its retained journal remains authoritative. */
    static profile(raw: unknown): ConnectorHostProfile;
    /** The tool name selects a declared operation but never supplies an executable policy grant. */
    static tool(raw: unknown): ConnectorHostTool;
    /** Preserve complete original arguments exactly; local tool validation independently checks their shape. */
    static request(raw: unknown): ConnectorHostRequest;
    /** Admission retains the exact observed sequence so a pruned request cannot be executed again. */
    static submission(raw: unknown): ConnectorHostSubmission;
    /** Missing or oversized outcomes never become successful empty results. */
    static response(raw: unknown): ConnectorHostResponse;
    /** Online presence and explicit host consent are independent facts. */
    static status(raw: unknown): ConnectorHostStatus;
    /** Completed responses belong to the complete retained request. */
    static job(raw: unknown): ConnectorHostJobView;
    /** Device publication binds the entire current profile and original private journal. */
    static publication(raw: unknown): ConnectorHostPublication;
    /** A short-lived authority permit is useful only on its exact current device lease. */
    static permit(raw: unknown): ConnectorHostPermit;
    /** A completion binds both request and response commitments before their signatures are considered. */
    static completion(raw: unknown): ConnectorHostCompletion;
    /** Cloud acknowledgment is distinct from device compaction confirmation. */
    static acknowledgment(raw: unknown): ConnectorHostAcknowledgment;
    /** A device acknowledges only the exact result already committed on both sides. */
    static acknowledged(raw: unknown): ConnectorHostAcknowledged;
    /** Only one original can occupy this retained host lane. */
    static work(raw: unknown): ConnectorHostWork;
}

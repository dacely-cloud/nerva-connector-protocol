import { type ConnectorFileProfile } from './ConnectorFiles.js';
import { type ConnectorFileOperation, type ConnectorFileSubmission, type ConnectorFileJobView, type ConnectorFileStatus, type ConnectorFilePublication, type ConnectorFilePermit, type ConnectorFileCompletion, type ConnectorFileAcknowledgment, type ConnectorFileAcknowledged, type ConnectorFileWork } from './ConnectorFileJobs.js';
/** Exact shared file-job contracts reject inherited, missing, mixed or unsupported authority. */
export declare class ConnectorFileJobsCodec {
    #private;
    /** One canonical serializer is shared by signatures, fingerprints, storage and wire framing. */
    static encode(value: ConnectorFileProfile | ConnectorFileOperation | ConnectorFilePublication | ConnectorFilePermit | ConnectorFileCompletion | ConnectorFileAcknowledgment | ConnectorFileAcknowledged | ConnectorFileWork | ConnectorFileStatus | ConnectorFileJobView | ConnectorFileSubmission): string;
    /** No remote describe/write/execute operation is inferred from a file capability. */
    static operation(raw: unknown): ConnectorFileOperation;
    /** Public local grants omit absolute paths and must match the native bounds. */
    static profile(raw: unknown): ConnectorFileProfile;
    /** A stale observed counter cannot be silently replaced on retry. */
    static submission(raw: unknown): ConnectorFileSubmission;
    /** Account response metadata has no infrastructure destination or device credential. */
    static status(raw: unknown): ConnectorFileStatus;
    /** Completed responses are validated against their original exact request. */
    static job(raw: unknown): ConnectorFileJobView;
    /** Publication binds the current authenticated lease and full locally selected profile. */
    static publication(raw: unknown): ConnectorFilePublication;
    /** Device requests use one bounded current backend permit shape. */
    static permit(raw: unknown): ConnectorFilePermit;
    /** The caller supplies the original request from its authoritative job record before decoding result content. */
    static completion(raw: unknown, request: ConnectorFileOperation): ConnectorFileCompletion;
    /** Cloud and device acknowledgments have distinct signature purposes and exact shapes. */
    static acknowledgment(raw: unknown): ConnectorFileAcknowledgment;
    /** Device compaction receipts cannot select a different environment, sequence or result. */
    static acknowledged(raw: unknown): ConnectorFileAcknowledged;
    /** The mailbox returns at most one original request or one durable-result acknowledgment. */
    static work(raw: unknown): ConnectorFileWork;
}

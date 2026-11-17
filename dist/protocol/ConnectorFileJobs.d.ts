import type { ConnectorAuthorization } from './ConnectorAuthorization.js';
import type { ConnectorFileRequest, ConnectorFileDescribe, ConnectorFileResponse, ConnectorFileProfile } from './ConnectorFiles.js';
/** Remote file dispatch exposes only the existing locally enforced read operations. */
export type ConnectorFileOperation = Exclude<ConnectorFileRequest, ConnectorFileDescribe>;
/** One original dispatch persists through transport replacement; no timeout silently reruns it. */
export declare enum ConnectorFileJobPhase {
    Queued = "queued",
    Dispatched = "dispatched",
    Completed = "completed"
}
/** Every signature is purpose-bound and has one exact canonical payload. */
export declare enum ConnectorFileProofPurpose {
    Profile = "nerva-compute:connector-files:profile",
    Permit = "nerva-compute:operation-files:permit",
    Result = "nerva-compute:operation-files:result",
    Acknowledgment = "nerva-compute:operation-files:acknowledgment",
    Acknowledged = "nerva-compute:operation-files:acknowledged"
}
/** Account admission requires an exact observed sequence; stale requests never select a newer counter. */
export interface ConnectorFileSubmission {
    readonly previousSequence: bigint;
    readonly request: ConnectorFileOperation;
    readonly authorization: ConnectorAuthorization;
    readonly admissionHash: string;
}
/** Current signed local grants are separate from recent device authentication. */
export interface ConnectorFileStatus {
    readonly environmentId: string;
    readonly sequence: bigint;
    readonly acknowledgedSequence: bigint;
    readonly online: boolean;
    readonly profile: ConnectorFileProfile | null;
}
/** File content is available only through current account/environment authorization. */
export interface ConnectorFileJobView {
    readonly id: string;
    readonly environmentId: string;
    readonly sequence: bigint;
    readonly phase: ConnectorFileJobPhase;
    readonly request: ConnectorFileOperation;
    readonly authorization: ConnectorAuthorization;
    readonly admissionHash: string;
    readonly response: ConnectorFileResponse | null;
}
/** A profile signature belongs to the current device connection, not a reusable bootstrap token. */
export interface ConnectorFilePublication {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly profile: ConnectorFileProfile;
    readonly signature: string;
    readonly journalId: string;
}
/** The backend permit binds the admitted payload, original dispatch and current live connection. */
export interface ConnectorFilePermit {
    readonly authorityId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly authorization: ConnectorAuthorization;
    readonly request: ConnectorFileOperation;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly signature: string;
}
/** Device proof prevents a public edge from fabricating read results. */
export interface ConnectorFileCompletion {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly responseHash: string;
    readonly response: ConnectorFileResponse;
    readonly signature: string;
}
/** A signed backend acknowledgment is issued only after the original result commits. */
export interface ConnectorFileAcknowledgment {
    readonly authorityId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly responseHash: string;
    readonly signature: string;
}
/** Local compaction is confirmed before the next sequence may be admitted. */
export interface ConnectorFileAcknowledged {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly responseHash: string;
    readonly signature: string;
}
/** An idle connection polls only its own current device mailbox. */
export interface ConnectorFileWork {
    readonly permit: ConnectorFilePermit | null;
    readonly acknowledgment: ConnectorFileAcknowledgment | null;
}
/** Shared mailbox bounds are independent of the number of Nexa/edge processes. */
export declare class ConnectorFileJobLimits {
    /** Retained account responses have a fixed per-device bound; the permanent sequence prevents forgotten-request replay. */
    static readonly retained: bigint;
    /** A permit must be refreshed after delay or transport replacement. */
    static readonly permitMs: bigint;
}

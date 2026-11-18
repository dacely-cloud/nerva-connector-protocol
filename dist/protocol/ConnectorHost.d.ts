import type { ConnectorHostObservedStart } from './ConnectorHostObservationProtocol.js';
/** A full-host grant is separate from confined file/program policies and never inferred from pairing. */
export declare const ConnectorHostTool: {
    readonly ComputerInfo: 'computer_info';
    readonly FileRead: 'file_read';
    readonly FileDigest: 'file_digest';
    readonly FileWrite: 'file_write';
    readonly FileStat: 'file_stat';
    readonly FileRename: 'file_rename';
    readonly FilePublish: 'file_publish';
    readonly FileChmod: 'file_chmod';
    readonly DirectoryList: 'directory_list';
    readonly DirectoryCreate: 'directory_create';
    readonly FileRemove: 'file_remove';
    readonly ProcessStart: 'process_start';
    readonly ProcessRead: 'process_read';
    readonly ProcessWrite: 'process_write';
    readonly ProcessStop: 'process_stop';
    readonly ProcessRelease: 'process_release';
    readonly TerminalStart: 'terminal_start';
    readonly TerminalRead: 'terminal_read';
    readonly TerminalWrite: 'terminal_write';
    readonly TerminalResize: 'terminal_resize';
    readonly TerminalStop: 'terminal_stop';
    readonly TerminalRelease: 'terminal_release';
    readonly DesktopInfo: 'desktop_info';
    readonly ApplicationOpen: 'application_open';
    readonly DesktopSnapshot: 'desktop_snapshot';
    readonly DesktopScreenshot: 'desktop_screenshot';
    readonly DesktopPointer: 'desktop_pointer';
    readonly DesktopKey: 'desktop_key';
    readonly DesktopText: 'desktop_text';
    readonly NetworkResolve: 'network_resolve';
    readonly HttpOpen: 'http_open';
    readonly HttpRead: 'http_read';
    readonly HttpClose: 'http_close';
    readonly EnvironmentInspect: 'environment_inspect';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostTool = (typeof ConnectorHostTool)[keyof typeof ConnectorHostTool];
/** Native paths and shell syntax belong to the customer computer, not the account API host. */
export declare const ConnectorHostPlatform: {
    readonly Linux: 'linux';
    readonly Windows: 'windows';
    readonly MacOs: 'macos';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostPlatform = (typeof ConnectorHostPlatform)[keyof typeof ConnectorHostPlatform];
/** Durable outcomes never treat uncertain effects as permission to execute a fresh original. */
export declare const ConnectorHostOutcome: {
    readonly Succeeded: 'succeeded';
    readonly Failed: 'failed';
    readonly Indeterminate: 'indeterminate';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostOutcome = (typeof ConnectorHostOutcome)[keyof typeof ConnectorHostOutcome];
/** Public failure codes preserve useful OS semantics without disclosing private native diagnostics. */
export declare const ConnectorHostErrorCode: {
    readonly InvalidRequest: 'invalid-request';
    readonly NotFound: 'not-found';
    readonly AlreadyExists: 'already-exists';
    readonly NotDirectory: 'not-directory';
    readonly IsDirectory: 'is-directory';
    readonly PermissionDenied: 'permission-denied';
    readonly Unsupported: 'unsupported';
    readonly SnapshotChanged: 'snapshot-changed';
    readonly Canceled: 'canceled';
    readonly ResourceLimit: 'resource-limit';
    readonly OperationFailed: 'operation-failed';
    readonly Interrupted: 'interrupted';
    readonly AdmissionDenied: 'admission-denied';
    readonly CrossDevice: 'cross-device';
    /** No device started the original within {@link ConnectorHostLimits.startMs} of its submission, so it never ran. */
    readonly Expired: 'expired';
};
/** Finite public code values are independent from whether prior effects are known. */
export type ConnectorHostErrorCode = (typeof ConnectorHostErrorCode)[keyof typeof ConnectorHostErrorCode];
/** A queued original retains its identity across reconnects and account replicas. */
export declare const ConnectorHostJobPhase: {
    readonly Queued: 'queued';
    readonly Dispatched: 'dispatched';
    readonly Completed: 'completed';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostJobPhase = (typeof ConnectorHostJobPhase)[keyof typeof ConnectorHostJobPhase];
/** Local consent and default task directory are signed under the enrolled device identity. */
export interface ConnectorHostProfile {
    readonly grantId: string;
    readonly grantRevision: bigint;
    readonly enabled: boolean;
    readonly platform: ConnectorHostPlatform;
    readonly directory: string;
    readonly tools: readonly ConnectorHostTool[];
}
/** Only exact bounded JSON text crosses the transport; the tool runtime validates its operation shape again. */
export interface ConnectorHostRequest {
    readonly grantId: string;
    readonly grantRevision: bigint;
    readonly toolName: ConnectorHostTool;
    readonly argumentsJson: string;
}
/** The account retains this complete first body before making an effectful network request. */
export interface ConnectorHostSubmission {
    readonly previousSequence: bigint;
    readonly request: ConnectorHostRequest;
}
/** Successful JSON text contains exact decimal quantities; failed outcomes expose only a finite code. */
export interface ConnectorHostResponse {
    readonly outcome: ConnectorHostOutcome;
    readonly resultJson: string | null;
    readonly errorCode: ConnectorHostErrorCode | null;
}
/** Sequence counters remain permanent after bounded result compaction. */
export interface ConnectorHostStatus {
    readonly environmentId: string;
    readonly sequence: bigint;
    readonly acknowledgedSequence: bigint;
    readonly online: boolean;
    readonly profile: ConnectorHostProfile | null;
}
/** An account can poll only its original job in its own environment. */
export interface ConnectorHostJobView {
    readonly id: string;
    readonly environmentId: string;
    readonly sequence: bigint;
    readonly phase: ConnectorHostJobPhase;
    readonly request: ConnectorHostRequest;
    readonly response: ConnectorHostResponse | null;
}
/** A live publication binds the persistent host journal and complete consent to the current device lease. */
export interface ConnectorHostPublication {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly journalId: string;
    readonly profile: ConnectorHostProfile;
    /** Absence grants no observation capability and retains the unchanged ordinary publication transcript. */
    readonly observationProtocol?: typeof ConnectorHostObservedStart.Protocol;
    readonly signature: string;
}
/** Private account authority signs the exact admitted original and current device delivery lease. */
export interface ConnectorHostPermit {
    readonly authorityId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly journalId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly request: ConnectorHostRequest;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    /** The original's start deadline, fixed at submission and repeated unchanged by every delivery. */
    readonly startByMs: bigint;
    readonly signature: string;
}
/** Device proof prevents a public tunnel edge from replacing the original host result. */
export interface ConnectorHostCompletion {
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly journalId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly responseHash: string;
    readonly response: ConnectorHostResponse;
    readonly signature: string;
}
/** Acknowledgment follows durable cloud completion; only then may the device compact that original. */
export interface ConnectorHostAcknowledgment {
    readonly authorityId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
    readonly journalId: string;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly responseHash: string;
    readonly signature: string;
}
/** The device confirms persisted acknowledgment before the backend admits the next sequence. */
export interface ConnectorHostAcknowledged extends Omit<ConnectorHostAcknowledgment, 'authorityId'> {
}
/** A mailbox contains at most one original operation or its exact acknowledgment. */
export interface ConnectorHostWork {
    readonly permit: ConnectorHostPermit | null;
    readonly acknowledgment: ConnectorHostAcknowledgment | null;
}
/** Exact independent host routes never borrow confined-policy scopes. */
export declare const ConnectorHostEndpoint: {
    readonly Publish: '/v1/connector/device/host/publish';
    readonly Poll: '/v1/connector/device/host/poll';
    readonly Complete: '/v1/connector/device/host/complete';
    readonly Acknowledged: '/v1/connector/device/host/acknowledged';
};
/** Only declared host route paths cross the private edge boundary. */
export type ConnectorHostEndpoint = (typeof ConnectorHostEndpoint)[keyof typeof ConnectorHostEndpoint];
/** Host application data remains bounded independently from ordinary control and file frames. */
export declare class ConnectorHostLimits {
    /** JSON arguments may contain commands and file chunks, but never an unbounded program upload. */
    static readonly argumentsBytes: number;
    /** Paired chunks are smaller than local stdio chunks so complete signed envelopes fit their own bound. */
    static readonly chunkBytes: number;
    /** Directory pages can always be continued rather than silently dropping names. */
    static readonly directoryEntries: number;
    /** Returned JSON is bounded before signing or journal persistence. */
    static readonly resultBytes: number;
    /** Double-encoded JSON and composite signatures fit this explicit authenticated host envelope. */
    static readonly frameBytes: number;
    /** No delayed permit may extend its original connection's authority. */
    static readonly permitMs: bigint;
    /**
     * An original no device has started this long after its submission is answered as expired and never runs.
     *
     * @remarks
     * Without it a request outlived its conversation: a computer that was offline or refusing permits for days ran
     * every waiting request when it came back, ahead of the one just asked for.
     */
    static readonly startMs: bigint;
    /** Permanent counters remain after this finite cloud result history is compacted. */
    static readonly retained: bigint;
}

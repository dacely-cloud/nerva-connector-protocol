// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostObservedStart } from './ConnectorHostObservationProtocol.js';

/** A full-host grant is separate from confined file/program policies and never inferred from pairing. */
export const ConnectorHostTool = {
    ComputerInfo: 'computer_info',
    FileRead: 'file_read',
    FileDigest: 'file_digest',
    FileWrite: 'file_write',
    FileStat: 'file_stat',
    FileRename: 'file_rename',
    FilePublish: 'file_publish',
    FileChmod: 'file_chmod',
    DirectoryList: 'directory_list',
    DirectoryCreate: 'directory_create',
    FileRemove: 'file_remove',
    ProcessStart: 'process_start',
    ProcessRead: 'process_read',
    ProcessWrite: 'process_write',
    ProcessStop: 'process_stop',
    ProcessRelease: 'process_release',
    TerminalStart: 'terminal_start',
    TerminalRead: 'terminal_read',
    TerminalWrite: 'terminal_write',
    TerminalResize: 'terminal_resize',
    TerminalStop: 'terminal_stop',
    TerminalRelease: 'terminal_release',
    DesktopInfo: 'desktop_info',
    ApplicationOpen: 'application_open',
    DesktopSnapshot: 'desktop_snapshot',
    DesktopScreenshot: 'desktop_screenshot',
    DesktopPointer: 'desktop_pointer',
    DesktopKey: 'desktop_key',
    DesktopText: 'desktop_text',
    NetworkResolve: 'network_resolve',
    HttpOpen: 'http_open',
    HttpRead: 'http_read',
    HttpClose: 'http_close',
    EnvironmentInspect: 'environment_inspect',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostTool = (typeof ConnectorHostTool)[keyof typeof ConnectorHostTool];

/** Native paths and shell syntax belong to the customer computer, not the account API host. */
export const ConnectorHostPlatform = {
    Linux: 'linux',
    Windows: 'windows',
    MacOs: 'macos',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostPlatform =
    (typeof ConnectorHostPlatform)[keyof typeof ConnectorHostPlatform];

/** Durable outcomes never treat uncertain effects as permission to execute a fresh original. */
export const ConnectorHostOutcome = {
    Succeeded: 'succeeded',
    Failed: 'failed',
    Indeterminate: 'indeterminate',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostOutcome = (typeof ConnectorHostOutcome)[keyof typeof ConnectorHostOutcome];

/** Public failure codes preserve useful OS semantics without disclosing private native diagnostics. */
export const ConnectorHostErrorCode = {
    InvalidRequest: 'invalid-request',
    NotFound: 'not-found',
    AlreadyExists: 'already-exists',
    NotDirectory: 'not-directory',
    IsDirectory: 'is-directory',
    PermissionDenied: 'permission-denied',
    Unsupported: 'unsupported',
    SnapshotChanged: 'snapshot-changed',
    Canceled: 'canceled',
    ResourceLimit: 'resource-limit',
    OperationFailed: 'operation-failed',
    Interrupted: 'interrupted',
    AdmissionDenied: 'admission-denied',
    CrossDevice: 'cross-device',
    /** No device started the original within {@link ConnectorHostLimits.startMs} of its submission, so it never ran. */
    Expired: 'expired',
} as const;

/** Finite public code values are independent from whether prior effects are known. */
export type ConnectorHostErrorCode =
    (typeof ConnectorHostErrorCode)[keyof typeof ConnectorHostErrorCode];

/** A queued original retains its identity across reconnects and account replicas. */
export const ConnectorHostJobPhase = {
    Queued: 'queued',
    Dispatched: 'dispatched',
    Completed: 'completed',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostJobPhase =
    (typeof ConnectorHostJobPhase)[keyof typeof ConnectorHostJobPhase];

/** Local consent and default task directory are signed under the enrolled device identity. */
export interface ConnectorHostProfile<Integer extends bigint | string = bigint> {
    readonly grantId: string;
    readonly grantRevision: Integer;
    readonly enabled: boolean;
    readonly platform: ConnectorHostPlatform;
    readonly directory: string;
    readonly tools: readonly ConnectorHostTool[];
}

/** Only exact bounded JSON text crosses the transport; the tool runtime validates its operation shape again. */
export interface ConnectorHostRequest<Integer extends bigint | string = bigint> {
    readonly grantId: string;
    readonly grantRevision: Integer;
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
export interface ConnectorHostStatus<Integer extends bigint | string = bigint> {
    readonly environmentId: string;
    readonly sequence: Integer;
    readonly acknowledgedSequence: Integer;
    readonly online: boolean;
    readonly profile: ConnectorHostProfile<Integer> | null;
}

/** An account can poll only its original job in its own environment. */
export interface ConnectorHostJobView<Integer extends bigint | string = bigint> {
    readonly id: string;
    readonly environmentId: string;
    readonly sequence: Integer;
    readonly phase: ConnectorHostJobPhase;
    readonly request: ConnectorHostRequest<Integer>;
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
export interface ConnectorHostAcknowledged extends Omit<
    ConnectorHostAcknowledgment,
    'authorityId'
> {}

/** A mailbox contains at most one original operation or its exact acknowledgment. */
export interface ConnectorHostWork {
    readonly permit: ConnectorHostPermit | null;
    readonly acknowledgment: ConnectorHostAcknowledgment | null;
}

/** Exact independent host routes never borrow confined-policy scopes. */
export const ConnectorHostEndpoint = {
    Publish: '/v1/connector/device/host/publish',
    Poll: '/v1/connector/device/host/poll',
    Complete: '/v1/connector/device/host/complete',
    Acknowledged: '/v1/connector/device/host/acknowledged',
} as const;

/** Only declared host route paths cross the private edge boundary. */
export type ConnectorHostEndpoint =
    (typeof ConnectorHostEndpoint)[keyof typeof ConnectorHostEndpoint];

/** Host application data remains bounded independently from ordinary control and file frames. */
export class ConnectorHostLimits {
    /** JSON arguments may contain commands and file chunks, but never an unbounded program upload. */
    public static readonly argumentsBytes: number = 65536;
    /** Paired chunks are smaller than local stdio chunks so complete signed envelopes fit their own bound. */
    public static readonly chunkBytes: number = 32768;
    /** Directory pages can always be continued rather than silently dropping names. */
    public static readonly directoryEntries: number = 64;
    /** Returned JSON is bounded before signing or journal persistence. */
    public static readonly resultBytes: number = 1048576;
    /** Double-encoded JSON and composite signatures fit this explicit authenticated host envelope. */
    public static readonly frameBytes: number = 3145728;
    /** No delayed permit may extend its original connection's authority. */
    public static readonly permitMs: bigint = 10000n;
    /**
     * An original no device has started this long after its submission is answered as expired and never runs.
     *
     * @remarks
     * Without it a request outlived its conversation: a computer that was offline or refusing permits for days ran
     * every waiting request when it came back, ahead of the one just asked for.
     */
    public static readonly startMs: bigint = 30000n;
    /** Permanent counters remain after this finite cloud result history is compacted. */
    public static readonly retained: bigint = 64n;
}

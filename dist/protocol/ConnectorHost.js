// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
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
};
/** Native paths and shell syntax belong to the customer computer, not the account API host. */
export const ConnectorHostPlatform = {
    Linux: 'linux',
    Windows: 'windows',
    MacOs: 'macos',
};
/** Durable outcomes never treat uncertain effects as permission to execute a fresh original. */
export const ConnectorHostOutcome = {
    Succeeded: 'succeeded',
    Failed: 'failed',
    Indeterminate: 'indeterminate',
};
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
};
/** A queued original retains its identity across reconnects and account replicas. */
export const ConnectorHostJobPhase = {
    Queued: 'queued',
    Dispatched: 'dispatched',
    Completed: 'completed',
};
/** Exact independent host routes never borrow confined-policy scopes. */
export const ConnectorHostEndpoint = {
    Publish: '/v1/connector/device/host/publish',
    Poll: '/v1/connector/device/host/poll',
    Complete: '/v1/connector/device/host/complete',
    Acknowledged: '/v1/connector/device/host/acknowledged',
};
/** Host application data remains bounded independently from ordinary control and file frames. */
export class ConnectorHostLimits {
    /** JSON arguments may contain commands and file chunks, but never an unbounded program upload. */
    static argumentsBytes = 65536;
    /** Paired chunks are smaller than local stdio chunks so complete signed envelopes fit their own bound. */
    static chunkBytes = 32768;
    /** Directory pages can always be continued rather than silently dropping names. */
    static directoryEntries = 64;
    /** Returned JSON is bounded before signing or journal persistence. */
    static resultBytes = 1048576;
    /** Double-encoded JSON and composite signatures fit this explicit authenticated host envelope. */
    static frameBytes = 3145728;
    /** No delayed permit may extend its original connection's authority. */
    static permitMs = 10000n;
    /**
     * An original no device has started this long after its submission is answered as expired and never runs.
     *
     * @remarks
     * Without it a request outlived its conversation: a computer that was offline or refusing permits for days ran
     * every waiting request when it came back, ahead of the one just asked for.
     */
    static startMs = 30000n;
    /** Permanent counters remain after this finite cloud result history is compacted. */
    static retained = 64n;
}

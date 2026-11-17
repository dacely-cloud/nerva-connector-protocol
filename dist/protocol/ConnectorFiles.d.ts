import type { ConnectorFileKind } from './ConnectorFileTypes.js';
import type { ConnectorFileAction, ConnectorFileTarget, ConnectorFileMetadata, ConnectorWriteMode } from './ConnectorFileTypes.js';
import type { ConnectorUploadRequest, ConnectorUploadOutput } from './ConnectorUpload.js';
/** Explicit local permission profiles have no implied broader mode or default. */
export declare enum ConnectorFileMode {
    ReadOnly = "read-only",
    ReadWrite = "read-write"
}
/** Stable safe failures omit host paths, native errors and file content. */
export declare enum ConnectorFileFailure {
    Invalid = "invalid",
    Denied = "denied",
    Unavailable = "unavailable",
    Changed = "changed",
    Indeterminate = "indeterminate"
}
/** Permission changes can only select private regular-file access; no group/world or special bits are granted. */
export declare enum ConnectorFilePermissionMode {
    Private = 384,
    Executable = 448
}
/** Limits bound native input, allocations, result pages and owned child processes. */
export declare class ConnectorFileLimits {
    /** File reads are bounded before allocating the data buffer. */
    static readonly readBytes: number;
    /** Inline publications fit one message; larger files use staged uploads. */
    static readonly writeBytes: number;
    /** Directory enumeration has a finite page and scan budget. */
    static readonly entries: number;
    /** No filesystem request can accumulate an unbounded queue of native children. */
    static readonly children: number;
    /** Recursive removal cannot consume unbounded traversal work or directory descriptors. */
    static readonly removalEntries: number;
    /** Depth includes the selected target; deeper trees fail without traversing further. */
    static readonly removalDepth: number;
}
/** Public profile contains aliases and commitments; local absolute paths remain private. */
export interface ConnectorFileProfile {
    readonly mode: ConnectorFileMode;
    readonly revision: bigint;
    readonly policySha256: string;
    readonly roots: readonly string[];
    readonly maximumReadBytes: number;
    readonly maximumWriteBytes: number;
}
/** Directory names are untrusted display/path components and are never followed during listing. */
export interface ConnectorFileEntry {
    readonly name: string;
    readonly kind: ConnectorFileKind;
}
/** Local profile inspection does not grant access to a path. */
export interface ConnectorFileDescribe {
    readonly action: ConnectorFileAction.Describe;
    readonly requestId: string;
}
/** Offset remains exact until the native boundary. */
export interface ConnectorFileRead extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Read;
    readonly offset: bigint;
    readonly limit: number;
}
/** Metadata never follows symlinks or opens devices. */
export interface ConnectorFileStat extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Stat;
}
/** Directory cookies are opaque exact filesystem offsets, not stable snapshot promises. */
export interface ConnectorFileList extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.List;
    readonly cursor: bigint;
}
/** Writes publish a complete bounded private regular file; no append, shell or mode escalation is implied. */
export interface ConnectorFileWrite extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Write;
    readonly mode: ConnectorWriteMode;
    readonly dataBase64: string;
}
/** Removal never follows links, crosses mounts or removes the granted root itself. */
export interface ConnectorFileRemove extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Remove;
    readonly recursive: boolean;
}
/** Create exactly one private directory; existing entries and missing parents are refused. */
export interface ConnectorFileMkdir extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Mkdir;
}
/** Change only the captured regular file's permissions under an explicit read-write root grant. */
export interface ConnectorFileChmod extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Chmod;
    readonly mode: ConnectorFilePermissionMode;
}
/** Move a regular file within one captured root; destination authority cannot select another root. */
export interface ConnectorFileRename extends ConnectorFileTarget {
    readonly action: ConnectorFileAction.Rename;
    readonly destination: string;
    readonly mode: ConnectorWriteMode;
}
/** Only named locally granted filesystem operations are supported. */
export type ConnectorFileRequest = ConnectorFileDescribe | ConnectorFileRead | ConnectorFileStat | ConnectorFileList | ConnectorFileWrite | ConnectorFileRemove | ConnectorFileMkdir | ConnectorFileChmod | ConnectorFileRename | ConnectorUploadRequest;
/** Profile replies expose no local paths or secrets. */
export interface ConnectorFileDescription extends ConnectorFileDescribe {
    readonly profile: ConnectorFileProfile;
}
/** A chunk is correlated to the original offset and bounded request. */
export interface ConnectorFileReadResult {
    readonly action: ConnectorFileAction.Read;
    readonly requestId: string;
    readonly offset: bigint;
    readonly dataBase64: string;
    readonly metadata: ConnectorFileMetadata;
}
/** Metadata has one current strict contract. */
export interface ConnectorFileStatResult {
    readonly action: ConnectorFileAction.Stat;
    readonly requestId: string;
    readonly metadata: ConnectorFileMetadata;
}
/** A page's cursor can be reused only as an explicit new request. */
export interface ConnectorFileListResult {
    readonly action: ConnectorFileAction.List;
    readonly requestId: string;
    readonly entries: readonly ConnectorFileEntry[];
    readonly nextCursor: bigint | null;
    readonly metadata: ConnectorFileMetadata;
}
/** A successful publication reports the exact request's byte count and the published file's metadata. */
export interface ConnectorFileWriteResult {
    readonly action: ConnectorFileAction.Write;
    readonly requestId: string;
    readonly bytesWritten: bigint;
    readonly metadata: ConnectorFileMetadata;
}
/** Success confirms complete removal within the finite entry budget, including the selected target. */
export interface ConnectorFileRemoveResult {
    readonly action: ConnectorFileAction.Remove;
    readonly requestId: string;
    readonly entriesRemoved: bigint;
}
/** Success confirms directory creation and parent synchronization; later path mutations remain possible. */
export interface ConnectorFileMkdirResult {
    readonly action: ConnectorFileAction.Mkdir;
    readonly requestId: string;
}
/** The regular-file metadata must confirm the exact requested private permission mode. */
export interface ConnectorFileChmodResult {
    readonly action: ConnectorFileAction.Chmod;
    readonly requestId: string;
    readonly metadata: ConnectorFileMetadata;
}
/** Destination metadata belongs to the moved regular file; identity races remain indeterminate rather than replayable. */
export interface ConnectorFileRenameResult {
    readonly action: ConnectorFileAction.Rename;
    readonly requestId: string;
    readonly metadata: ConnectorFileMetadata;
}
/** Successful results share the original request identity. */
export type ConnectorFileOutput = ConnectorFileDescription | ConnectorFileReadResult | ConnectorFileStatResult | ConnectorFileListResult | ConnectorFileWriteResult | ConnectorFileRemoveResult | ConnectorFileMkdirResult | ConnectorFileChmodResult | ConnectorFileRenameResult | ConnectorUploadOutput;
/** Result envelopes do not serialize raw native errors. */
export interface ConnectorFileSuccess {
    readonly ok: true;
    readonly result: ConnectorFileOutput;
}
/** A denied request cannot include an accidental content payload. */
export interface ConnectorFileError {
    readonly ok: false;
    readonly error: ConnectorFileFailure;
}
/** Public safe local response contract. */
export type ConnectorFileResponse = ConnectorFileSuccess | ConnectorFileError;

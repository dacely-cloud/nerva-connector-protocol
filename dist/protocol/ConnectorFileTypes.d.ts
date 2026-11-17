/** Named file operations require explicit local grants and do not imply shell execution or forwarding. */
export declare enum ConnectorFileAction {
    Describe = "describe",
    Read = "read",
    Stat = "stat",
    List = "list",
    Write = "write",
    Remove = "remove",
    Mkdir = "mkdir",
    Chmod = "chmod",
    Rename = "rename",
    UploadBegin = "upload-begin",
    UploadChunk = "upload-chunk",
    UploadStatus = "upload-status",
    UploadCommit = "upload-commit",
    UploadAbort = "upload-abort"
}
/** Atomic create never replaces an existing entry; replace deliberately publishes over an existing regular file. */
export declare enum ConnectorWriteMode {
    Create = "create",
    Replace = "replace"
}
/** Metadata preserves exact size and modification time without host inode/owner identifiers. */
export interface ConnectorFileMetadata {
    readonly kind: ConnectorFileKind.File | ConnectorFileKind.Directory;
    readonly sizeBytes: bigint;
    readonly modifiedAtNs: bigint;
    readonly mode: number;
}
/** Every access binds the exact current local policy and a configured opaque root identifier. */
export interface ConnectorFileTarget {
    readonly requestId: string;
    readonly policySha256: string;
    readonly rootId: string;
    readonly path: string;
}
/** Entry types are metadata, never executable authority. */
export declare enum ConnectorFileKind {
    File = "file",
    Directory = "directory",
    SymbolicLink = "symbolic-link",
    Other = "other"
}

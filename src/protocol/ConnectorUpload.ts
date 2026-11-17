// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ConnectorFileAction,
    type ConnectorFileTarget,
    type ConnectorFileMetadata,
    type ConnectorWriteMode,
} from './ConnectorFileTypes.js';

/** One staging slot per captured root uses exact declared lengths; chunking never grants arbitrary append access. */
export class ConnectorUploadLimits {
    /** Each signed contiguous write decodes at most this many bytes. */
    public static readonly chunkBytes: number = 65536;
    /** One native or authenticated file request has a fixed finite envelope budget. */
    public static readonly requestBytes: number = 131072;
}
/** Every step repeats the immutable upload commitment and current policy binding. */
export interface ConnectorUploadTarget extends ConnectorFileTarget {
    readonly uploadId: string;
    readonly mode: ConnectorWriteMode;
    readonly sizeBytes: bigint;
    readonly sha256: string;
}
/** Begin retains one private bounded staging slot without publishing its target. */
export interface ConnectorUploadBegin extends ConnectorUploadTarget {
    readonly action: ConnectorFileAction.UploadBegin;
}
/** An exact offset and nonempty bounded chunk prohibit implicit replay or sparse writes. */
export interface ConnectorUploadChunk extends ConnectorUploadTarget {
    readonly action: ConnectorFileAction.UploadChunk;
    readonly offset: bigint;
    readonly dataBase64: string;
}
/** Explicit inspection reports the retained prefix after an uncertain prior operation. */
export interface ConnectorUploadStatus extends ConnectorUploadTarget {
    readonly action: ConnectorFileAction.UploadStatus;
}
/** Commit checks complete length and digest before atomic private-file publication. */
export interface ConnectorUploadCommit extends ConnectorUploadTarget {
    readonly action: ConnectorFileAction.UploadCommit;
}
/** Abort removes only the exact bound private slot. */
export interface ConnectorUploadAbort extends ConnectorUploadTarget {
    readonly action: ConnectorFileAction.UploadAbort;
}
/** All staging operations require both cloud write and local read-write authority. */
export type ConnectorUploadRequest =
    | ConnectorUploadBegin
    | ConnectorUploadChunk
    | ConnectorUploadStatus
    | ConnectorUploadCommit
    | ConnectorUploadAbort;
/** Accepted progress is correlated with the exact upload and bounded declared length. */
export interface ConnectorUploadProgress {
    readonly action: ConnectorFileAction.UploadBegin | ConnectorFileAction.UploadChunk;
    readonly requestId: string;
    readonly uploadId: string;
    readonly receivedBytes: bigint;
}
/** Prefix hashes let an explicit caller verify state before choosing its next chunk. */
export interface ConnectorUploadStatusResult {
    readonly action: ConnectorFileAction.UploadStatus;
    readonly requestId: string;
    readonly uploadId: string;
    readonly receivedBytes: bigint;
    readonly sha256: string;
}
/** Publication confirms the complete requested digest and private regular-file metadata. */
export interface ConnectorUploadCommitResult {
    readonly action: ConnectorFileAction.UploadCommit;
    readonly requestId: string;
    readonly uploadId: string;
    readonly bytesWritten: bigint;
    readonly sha256: string;
    readonly metadata: ConnectorFileMetadata;
}
/** False means the exact bound upload no longer had retained staging data. */
export interface ConnectorUploadAbortResult {
    readonly action: ConnectorFileAction.UploadAbort;
    readonly requestId: string;
    readonly uploadId: string;
    readonly removed: boolean;
}
/** Upload results never expose host paths or private staging identities. */
export type ConnectorUploadOutput =
    | ConnectorUploadProgress
    | ConnectorUploadStatusResult
    | ConnectorUploadCommitResult
    | ConnectorUploadAbortResult;

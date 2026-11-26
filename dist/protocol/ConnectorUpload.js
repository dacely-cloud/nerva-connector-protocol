// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** One staging slot per captured root uses exact declared lengths; chunking never grants arbitrary append access. */
export class ConnectorUploadLimits {
    /** Each signed contiguous write decodes at most this many bytes. */
    static chunkBytes = 65536;
    /** One native or authenticated file request has a fixed finite envelope budget. */
    static requestBytes = 131072;
}

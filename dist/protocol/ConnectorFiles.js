// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Explicit local permission profiles have no implied broader mode or default. */
export var ConnectorFileMode;
(function (ConnectorFileMode) {
    ConnectorFileMode["ReadOnly"] = "read-only";
    ConnectorFileMode["ReadWrite"] = "read-write";
})(ConnectorFileMode || (ConnectorFileMode = {}));
/** Stable safe failures omit host paths, native errors and file content. */
export var ConnectorFileFailure;
(function (ConnectorFileFailure) {
    ConnectorFileFailure["Invalid"] = "invalid";
    ConnectorFileFailure["Denied"] = "denied";
    ConnectorFileFailure["Unavailable"] = "unavailable";
    ConnectorFileFailure["Changed"] = "changed";
    ConnectorFileFailure["Indeterminate"] = "indeterminate";
})(ConnectorFileFailure || (ConnectorFileFailure = {}));
/** Permission changes can only select private regular-file access; no group/world or special bits are granted. */
export var ConnectorFilePermissionMode;
(function (ConnectorFilePermissionMode) {
    ConnectorFilePermissionMode[ConnectorFilePermissionMode["Private"] = 384] = "Private";
    ConnectorFilePermissionMode[ConnectorFilePermissionMode["Executable"] = 448] = "Executable";
})(ConnectorFilePermissionMode || (ConnectorFilePermissionMode = {}));
/** Limits bound native input, allocations, result pages and owned child processes. */
export class ConnectorFileLimits {
    /** File reads are bounded before allocating the data buffer. */
    static readBytes = 32768;
    /** Inline publications fit one message; larger files use staged uploads. */
    static writeBytes = 16384;
    /** Directory enumeration has a finite page and scan budget. */
    static entries = 128;
    /** No filesystem request can accumulate an unbounded queue of native children. */
    static children = 4;
    /** Recursive removal cannot consume unbounded traversal work or directory descriptors. */
    static removalEntries = 4096;
    /** Depth includes the selected target; deeper trees fail without traversing further. */
    static removalDepth = 32;
}

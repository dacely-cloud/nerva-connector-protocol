// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Named file operations require explicit local grants and do not imply shell execution or forwarding. */
export var ConnectorFileAction;
(function (ConnectorFileAction) {
    ConnectorFileAction["Describe"] = "describe";
    ConnectorFileAction["Read"] = "read";
    ConnectorFileAction["Stat"] = "stat";
    ConnectorFileAction["List"] = "list";
    ConnectorFileAction["Write"] = "write";
    ConnectorFileAction["Remove"] = "remove";
    ConnectorFileAction["Mkdir"] = "mkdir";
    ConnectorFileAction["Chmod"] = "chmod";
    ConnectorFileAction["Rename"] = "rename";
    ConnectorFileAction["UploadBegin"] = "upload-begin";
    ConnectorFileAction["UploadChunk"] = "upload-chunk";
    ConnectorFileAction["UploadStatus"] = "upload-status";
    ConnectorFileAction["UploadCommit"] = "upload-commit";
    ConnectorFileAction["UploadAbort"] = "upload-abort";
})(ConnectorFileAction || (ConnectorFileAction = {}));
/** Atomic create never replaces an existing entry; replace deliberately publishes over an existing regular file. */
export var ConnectorWriteMode;
(function (ConnectorWriteMode) {
    ConnectorWriteMode["Create"] = "create";
    ConnectorWriteMode["Replace"] = "replace";
})(ConnectorWriteMode || (ConnectorWriteMode = {}));
/** Entry types are metadata, never executable authority. */
export var ConnectorFileKind;
(function (ConnectorFileKind) {
    ConnectorFileKind["File"] = "file";
    ConnectorFileKind["Directory"] = "directory";
    ConnectorFileKind["SymbolicLink"] = "symbolic-link";
    ConnectorFileKind["Other"] = "other";
})(ConnectorFileKind || (ConnectorFileKind = {}));

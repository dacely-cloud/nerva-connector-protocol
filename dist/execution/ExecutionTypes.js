// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Execution authority is distinct from a file-read grant; this controls persistent workspace mutation. */
export var ExecutionWorkspaceAccess;
(function (ExecutionWorkspaceAccess) {
    ExecutionWorkspaceAccess["ReadOnly"] = "read-only";
    ExecutionWorkspaceAccess["ReadWrite"] = "read-write";
})(ExecutionWorkspaceAccess || (ExecutionWorkspaceAccess = {}));
/** A closed connection or interrupted process is never treated as a successful completed command. */
export var ExecutionTermination;
(function (ExecutionTermination) {
    ExecutionTermination["Exited"] = "exited";
    ExecutionTermination["Indeterminate"] = "indeterminate";
})(ExecutionTermination || (ExecutionTermination = {}));
/** Causes describe local observation only; an indeterminate command may already have changed its granted workspace. */
export var ExecutionFailure;
(function (ExecutionFailure) {
    ExecutionFailure["Sandbox"] = "sandbox";
    ExecutionFailure["Cancelled"] = "cancelled";
    ExecutionFailure["Timeout"] = "timeout";
    ExecutionFailure["OutputLimit"] = "output-limit";
    ExecutionFailure["Signal"] = "signal";
    ExecutionFailure["AmbiguousExit"] = "ambiguous-exit";
    ExecutionFailure["Interrupted"] = "interrupted";
    ExecutionFailure["Expired"] = "expired";
})(ExecutionFailure || (ExecutionFailure = {}));
/** Native pre-execution stages expose no OS message, host path or credential. */
export var ExecutionSetupFailure;
(function (ExecutionSetupFailure) {
    ExecutionSetupFailure["Bootstrap"] = "bootstrap";
    ExecutionSetupFailure["Configuration"] = "configuration";
    ExecutionSetupFailure["Namespaces"] = "namespaces";
    ExecutionSetupFailure["Cgroup"] = "cgroup";
    ExecutionSetupFailure["Mounts"] = "mounts";
    ExecutionSetupFailure["AppArmor"] = "apparmor";
    ExecutionSetupFailure["Confinement"] = "confinement";
    ExecutionSetupFailure["Execute"] = "execute";
})(ExecutionSetupFailure || (ExecutionSetupFailure = {}));

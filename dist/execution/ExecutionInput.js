// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Control intent is explicit and is never inferred from an empty write or a shell name. */
export var ExecutionInputKind;
(function (ExecutionInputKind) {
    ExecutionInputKind["Data"] = "data";
    ExecutionInputKind["End"] = "end";
    ExecutionInputKind["Resize"] = "resize";
})(ExecutionInputKind || (ExecutionInputKind = {}));
/** Receipt disposition does not assert application consumption or successful command completion. */
export var ExecutionInputDisposition;
(function (ExecutionInputDisposition) {
    ExecutionInputDisposition["Applied"] = "applied";
    ExecutionInputDisposition["Rejected"] = "rejected";
    ExecutionInputDisposition["Indeterminate"] = "indeterminate";
})(ExecutionInputDisposition || (ExecutionInputDisposition = {}));

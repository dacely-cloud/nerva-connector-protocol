// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Only verified transient publication conditions can request another attempt. */
export var JointWorkspaceRetryReason;
(function (JointWorkspaceRetryReason) {
    JointWorkspaceRetryReason["ProfilesPending"] = "profiles-pending";
    JointWorkspaceRetryReason["OriginalPending"] = "original-pending";
})(JointWorkspaceRetryReason || (JointWorkspaceRetryReason = {}));
/** Finite publication retries do not change any original operation or grant head. */
export class JointWorkspaceRetryLimits {
    static retryAfterMs = 250;
    static envelopeBytes = 8192;
}

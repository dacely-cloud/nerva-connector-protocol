// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** The receiver selects one of the three permanent journals; neither requests nor peers select a free-form channel. */
export var ConnectorMigrationLane;
(function (ConnectorMigrationLane) {
    ConnectorMigrationLane["Files"] = "files";
    ConnectorMigrationLane["ExecutionFirst"] = "execution-first";
    ConnectorMigrationLane["ExecutionSecond"] = "execution-second";
})(ConnectorMigrationLane || (ConnectorMigrationLane = {}));
/** Separate finite budgets preserve all three source headers and up to six full joint-authority envelopes. */
export class ConnectorMigrationLimits {
    static planBytes = 12288;
    static approvalBytes = 98304;
    static appliedBytes = 8192;
}

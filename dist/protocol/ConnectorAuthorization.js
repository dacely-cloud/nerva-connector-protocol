// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { JointWorkspaceLimits } from '../workspace/JointWorkspaceBinding.js';
/** Independent authority is explicit; missing joint metadata never implies this choice. */
export var ConnectorAuthorizationKind;
(function (ConnectorAuthorizationKind) {
    ConnectorAuthorizationKind["Independent"] = "independent";
    ConnectorAuthorizationKind["Joint"] = "joint";
})(ConnectorAuthorizationKind || (ConnectorAuthorizationKind = {}));
/** The receiver selects its actual operation channel before computing an admission commitment. */
export var ConnectorAdmissionChannel;
(function (ConnectorAdmissionChannel) {
    ConnectorAdmissionChannel["File"] = "files";
    ConnectorAdmissionChannel["Execution"] = "execution";
})(ConnectorAdmissionChannel || (ConnectorAdmissionChannel = {}));
/** Complete authorization has a separate finite envelope budget without reducing the original request limits. */
export class ConnectorAuthorizationLimits {
    static envelopeBytes = JointWorkspaceLimits.descriptorBytes + 64;
}

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Enrollment binds a customer device; it does not grant execution or report a tunnel as online. */
export var ConnectorEnrollmentPhase;
(function (ConnectorEnrollmentPhase) {
    ConnectorEnrollmentPhase["Pending"] = "pending";
    ConnectorEnrollmentPhase["EnrolledOffline"] = "enrolled-offline";
    ConnectorEnrollmentPhase["Revoked"] = "revoked";
})(ConnectorEnrollmentPhase || (ConnectorEnrollmentPhase = {}));

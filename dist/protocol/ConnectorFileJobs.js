// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** One original dispatch persists through transport replacement; no timeout silently reruns it. */
export var ConnectorFileJobPhase;
(function (ConnectorFileJobPhase) {
    ConnectorFileJobPhase["Queued"] = "queued";
    ConnectorFileJobPhase["Dispatched"] = "dispatched";
    ConnectorFileJobPhase["Completed"] = "completed";
})(ConnectorFileJobPhase || (ConnectorFileJobPhase = {}));
/** Every signature is purpose-bound and has one exact canonical payload. */
export var ConnectorFileProofPurpose;
(function (ConnectorFileProofPurpose) {
    ConnectorFileProofPurpose["Profile"] = "nerva-compute:connector-files:profile";
    ConnectorFileProofPurpose["Permit"] = "nerva-compute:operation-files:permit";
    ConnectorFileProofPurpose["Result"] = "nerva-compute:operation-files:result";
    ConnectorFileProofPurpose["Acknowledgment"] = "nerva-compute:operation-files:acknowledgment";
    ConnectorFileProofPurpose["Acknowledged"] = "nerva-compute:operation-files:acknowledged";
})(ConnectorFileProofPurpose || (ConnectorFileProofPurpose = {}));
/** Shared mailbox bounds are independent of the number of Nexa/edge processes. */
export class ConnectorFileJobLimits {
    /** Retained account responses have a fixed per-device bound; the permanent sequence prevents forgotten-request replay. */
    static retained = 64n;
    /** A permit must be refreshed after delay or transport replacement. */
    static permitMs = 10000n;
}

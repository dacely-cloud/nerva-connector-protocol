// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Private edge operations never accept browser/account authentication or caller-selected account ownership. */
export var ConnectorLinkEndpoint;
(function (ConnectorLinkEndpoint) {
    ConnectorLinkEndpoint["Start"] = "/v1/connector-links/device/starts";
    ConnectorLinkEndpoint["Poll"] = "/v1/connector-links/device/polls";
})(ConnectorLinkEndpoint || (ConnectorLinkEndpoint = {}));
/** Account operations are reached through authenticated Nexa, never directly from the browser. */
export var ConnectorLinkAccountEndpoint;
(function (ConnectorLinkAccountEndpoint) {
    ConnectorLinkAccountEndpoint["Review"] = "/v1/connector-links/reviews";
    ConnectorLinkAccountEndpoint["Approve"] = "/v1/connector-links/approvals";
})(ConnectorLinkAccountEndpoint || (ConnectorLinkAccountEndpoint = {}));
/** Approval is an account binding, not an online session or execution grant. */
export var ConnectorLinkPhase;
(function (ConnectorLinkPhase) {
    ConnectorLinkPhase["Unregistered"] = "unregistered";
    ConnectorLinkPhase["Pending"] = "pending";
    ConnectorLinkPhase["Approved"] = "approved";
    ConnectorLinkPhase["Expired"] = "expired";
    ConnectorLinkPhase["Revoked"] = "revoked";
    ConnectorLinkPhase["Denied"] = "denied";
})(ConnectorLinkPhase || (ConnectorLinkPhase = {}));
/** Public linking errors expose fixed categories, never private backend responses or credentials. */
export var ConnectorLinkFailure;
(function (ConnectorLinkFailure) {
    ConnectorLinkFailure["Denied"] = "denied";
    ConnectorLinkFailure["Expired"] = "expired";
    ConnectorLinkFailure["Conflict"] = "conflict";
    ConnectorLinkFailure["RateLimited"] = "rate-limited";
    ConnectorLinkFailure["Unavailable"] = "unavailable";
})(ConnectorLinkFailure || (ConnectorLinkFailure = {}));
/** Finite initial deployment limits are enforced with shared database time and counters. */
export class ConnectorLinkLimits {
    /** Human codes expire after ten minutes independently of cleanup. */
    static lifetimeMs = 600000;
    /** Device polling does not hold an HTTP connection open. */
    static pollMs = 5000;
    /** New signed requests and polls require a current clock; replay cannot recreate expired requests after cleanup. */
    static proofAgeMs = 60000;
    /** Small clock lead is tolerated without trusting device timestamps as authority. */
    static clockLeadMs = 5000;
    /** The deployment retains at most this many finite pending/terminal linking requests. */
    static pending = 256;
    /** A request removes at most this many expired temporary entries. */
    static cleanup = 64;
    /** Human-readable alphabet has exactly 32 unambiguous characters. */
    static alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
}

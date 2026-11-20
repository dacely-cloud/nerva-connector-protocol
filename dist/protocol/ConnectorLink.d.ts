import type { ConnectorEnrollmentView } from './ConnectorEnrollment.js';
/** Private edge operations never accept browser/account authentication or caller-selected account ownership. */
export declare enum ConnectorLinkEndpoint {
    Start = "/v1/connector-links/device/starts",
    Poll = "/v1/connector-links/device/polls"
}
/** Account operations are reached through authenticated Nexa, never directly from the browser. */
export declare enum ConnectorLinkAccountEndpoint {
    Review = "/v1/connector-links/reviews",
    Approve = "/v1/connector-links/approvals"
}
/** Approval is an account binding, not an online session or execution grant. */
export declare enum ConnectorLinkPhase {
    Unregistered = "unregistered",
    Pending = "pending",
    Approved = "approved",
    Expired = "expired",
    Revoked = "revoked",
    Denied = "denied"
}
/** Public linking errors expose fixed categories, never private backend responses or credentials. */
export declare enum ConnectorLinkFailure {
    Denied = "denied",
    Expired = "expired",
    Conflict = "conflict",
    RateLimited = "rate-limited",
    Unavailable = "unavailable"
}
/** Finite initial deployment limits are enforced with shared database time and counters. */
export declare class ConnectorLinkLimits {
    /** Human codes expire after ten minutes independently of cleanup. */
    static readonly lifetimeMs: number;
    /** Device polling does not hold an HTTP connection open. */
    static readonly pollMs: number;
    /** New signed requests and polls require a current clock; replay cannot recreate expired requests after cleanup. */
    static readonly proofAgeMs: number;
    /** Small clock lead is tolerated without trusting device timestamps as authority. */
    static readonly clockLeadMs: number;
    /** The deployment retains at most this many finite pending/terminal linking requests. */
    static readonly pending: number;
    /** A request removes at most this many expired temporary entries. */
    static readonly cleanup: number;
    /** Human-readable alphabet has exactly 32 unambiguous characters. */
    static readonly alphabet: string;
}
/** The random request ID is private polling authorization; its commitment alone is exposed during UI review. */
export interface ConnectorLinkProof {
    readonly authorityId: string;
    readonly proofNonce: string;
    readonly requestId: string;
    readonly publicKey: string;
    readonly issuedAtMs: bigint;
    readonly signature: string;
}
/** The device name is signed display data and conveys no privileges or trusted host address. */
export interface ConnectorLinkStart extends ConnectorLinkProof {
    readonly deviceName: string;
}
/** Only these finite fields are printed or displayed with the trusted verification URI. */
export interface ConnectorLinkIssued {
    readonly linkId: string;
    readonly code: string;
    readonly expiresAtMs: bigint;
    readonly pollIntervalMs: number;
}
/** Code entry requires fresh authenticated account authority before disclosing this pending request. */
export interface ConnectorLinkReviewRequest {
    readonly code: string;
}
/** Explicit approval captures exactly the machine shown during review. */
export interface ConnectorLinkReview<Integer extends bigint | string = bigint> extends ConnectorLinkReviewRequest {
    readonly linkId: string;
    readonly publicKey: string;
    readonly deviceName: string;
    readonly expiresAtMs: Integer;
}
/** Approval responses echo the captured reviewed identity for strict trusted-controller correlation. */
export interface ConnectorLinkApproved<Integer extends bigint | string = bigint> {
    readonly linkId: string;
    readonly publicKey: string;
    readonly enrollment: ConnectorEnrollmentView<Integer>;
}
/** A stale code or changed device cannot replace the identity the user reviewed. */
export interface ConnectorLinkApproval extends ConnectorLinkReviewRequest {
    readonly linkId: string;
    readonly publicKey: string;
    readonly name: string;
}
/** Fresh device proof can recover an approved original binding after its temporary code has expired. */
export interface ConnectorLinkStatus {
    readonly linkId: string;
    readonly publicKey: string;
    readonly phase: ConnectorLinkPhase;
    readonly enrollment: ConnectorEnrollmentView | null;
    readonly expiresAtMs: bigint;
    readonly pollIntervalMs: number;
}
/** A finite authority proof binds one fresh device request to its exact response; it grants no session or tool access. */
export interface ConnectorLinkReceipt {
    readonly authorityId: string;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly signature: string;
}
/** Stable code metadata and a fresh request-bound authority receipt have separate lifetimes. */
export interface ConnectorLinkIssuance {
    readonly issued: ConnectorLinkIssued;
    readonly receipt: ConnectorLinkReceipt;
}
/** Account binding is accepted only under a receipt for the exact current signed poll. */
export interface ConnectorLinkPolling {
    readonly status: ConnectorLinkStatus;
    readonly receipt: ConnectorLinkReceipt;
}

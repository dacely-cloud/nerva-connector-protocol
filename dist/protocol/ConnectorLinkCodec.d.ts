import { type ConnectorLinkProof, type ConnectorLinkStart, type ConnectorLinkApproval, type ConnectorLinkReviewRequest, type ConnectorLinkReview, type ConnectorLinkIssued, type ConnectorLinkStatus, type ConnectorLinkApproved, type ConnectorLinkReceipt, type ConnectorLinkIssuance, type ConnectorLinkPolling } from './ConnectorLink.js';
/** Browser-compatible exact link contracts keep polling authorization separate from human code entry. */
export declare class ConnectorLinkCodec {
    #private;
    /** Eight uniformly random base-32 symbols carry forty bits; presentation has one fixed separator. */
    static code(raw: unknown): string;
    /** Start requests are fully signed before temporary state can be created. */
    static start(raw: unknown): ConnectorLinkStart;
    /** Polls cannot supply a code, account, enrollment override or reusable bearer credential. */
    static proof(raw: unknown): ConnectorLinkProof;
    /** Review is a protected account lookup, not a device poll. */
    static reviewRequest(raw: unknown): ConnectorLinkReviewRequest;
    /** Account assignment is derived from authenticated delegation, never request fields. */
    static approval(raw: unknown): ConnectorLinkApproval;
    /** The UI receives only the original device identity and display data. */
    static review(raw: unknown): ConnectorLinkReview;
    /** A confirmed approval is bound to one reviewed public key and cannot return a pending invitation. */
    static approved(raw: unknown): ConnectorLinkApproved;
    /** Server-generated code responses have one fixed finite polling interval. */
    static issued(raw: unknown): ConnectorLinkIssued;
    /** A returned enrollment must agree with the current linking phase; no pending response grants device access. */
    static status(raw: unknown): ConnectorLinkStatus;
    /** Receipts carry only the configured authority ID and bounded proof, never a caller-selected trusted key. */
    static receipt(raw: unknown): ConnectorLinkReceipt;
    /** Issuance responses cannot omit the private authority's request-bound signature. */
    static issuance(raw: unknown): ConnectorLinkIssuance;
    /** Poll results require a complete authority receipt even for unregistered or terminal state. */
    static polling(raw: unknown): ConnectorLinkPolling;
    /** Both algorithms bind the exact signed request, response, authority and finite server time; the receiver chooses the purpose. */
    static receiptPayload(input: ConnectorLinkStart | ConnectorLinkProof, result: ConnectorLinkIssued | ConnectorLinkStatus, receipt: Omit<ConnectorLinkReceipt, 'signature'>): string;
    /** One purpose binds the complete original device initiation. */
    static startPayload(input: Omit<ConnectorLinkStart, 'signature'>): string;
    /** A short code cannot produce this purpose-separated current proof. */
    static pollPayload(input: Omit<ConnectorLinkProof, 'signature'>): string;
    /** All exact wire counters and times remain decimal strings. */
    static encode(value: ConnectorLinkStart | ConnectorLinkProof | ConnectorLinkIssued | ConnectorLinkReview | ConnectorLinkApproval | ConnectorLinkStatus | ConnectorLinkApproved | ConnectorLinkIssuance | ConnectorLinkPolling): string;
}

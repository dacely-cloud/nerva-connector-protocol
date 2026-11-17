import { SignaturePurpose } from '../identity/IdentityFormat.js';
/** Each frame has exactly one receiver-selected signing purpose and sender role. */
export declare enum ExchangeKind {
    Challenge = "challenge",
    Authentication = "authentication",
    Confirmation = "confirmation",
    Request = "request",
    Result = "result",
    Chunk = "chunk",
    SystemInfo = "system-info"
}
/** Every signature binds both endpoint identities, original operation, runtime ownership and authenticated gateway. */
export interface ExchangeContext {
    readonly authorityId: string;
    readonly edgeId: string;
    readonly edgeWorkloadThumbprint: string;
    readonly environmentId: string;
    readonly runtimeId: string;
    readonly generation: bigint;
    readonly requestId: string;
    readonly sessionId: string;
    readonly recipientPublicKey: string;
}
/** Exact bounded application bytes remain uninterpreted until the operation-specific authorization boundary validates them. */
export interface UnsignedExchange {
    readonly kind: ExchangeKind;
    readonly context: ExchangeContext;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly payload: string;
}
/** Peers never select a replacement trusted signer through this envelope. */
export interface SignedExchange extends UnsignedExchange {
    readonly signature: string;
}
/** Frame and time bounds apply before cryptographic work or payload interpretation. */
export declare class ExchangeLimits {
    static readonly frameBytes: number;
    static readonly payloadBytes: number;
    static readonly lifetimeMs: bigint;
    static readonly clockLeadMs: bigint;
    /** Mutual authentication has a shorter finite lifetime than general operation envelopes. */
    static readonly authenticationLifetimeMs: bigint;
    /** Purpose comes from the receiver's expected kind, never an arbitrary wire string. */
    static purpose(kind: ExchangeKind): SignaturePurpose;
}

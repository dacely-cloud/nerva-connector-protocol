// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { SignaturePurpose } from '../identity/IdentityFormat.js';

/** Each frame has exactly one receiver-selected signing purpose and sender role. */
export enum ExchangeKind {
    Challenge = 'challenge',
    Authentication = 'authentication',
    Confirmation = 'confirmation',
    Request = 'request',
    Result = 'result',
    Chunk = 'chunk',
    SystemInfo = 'system-info',
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
export class ExchangeLimits {
    public static readonly frameBytes: number = 196608;
    public static readonly payloadBytes: number = 131072;
    public static readonly lifetimeMs: bigint = 120000n;
    public static readonly clockLeadMs: bigint = 5000n;
    /** Mutual authentication has a shorter finite lifetime than general operation envelopes. */
    public static readonly authenticationLifetimeMs: bigint = 30000n;

    /** Purpose comes from the receiver's expected kind, never an arbitrary wire string. */
    public static purpose(kind: ExchangeKind): SignaturePurpose {
        switch (kind) {
            case ExchangeKind.Challenge:
                return SignaturePurpose.ServerChallenge;
            case ExchangeKind.Authentication:
                return SignaturePurpose.ClientAuthentication;
            case ExchangeKind.Confirmation:
                return SignaturePurpose.ServerConfirmation;
            case ExchangeKind.Request:
                return SignaturePurpose.RemoteRequest;
            case ExchangeKind.Result:
                return SignaturePurpose.RemoteResult;
            case ExchangeKind.Chunk:
                return SignaturePurpose.RemoteChunk;
            case ExchangeKind.SystemInfo:
                return SignaturePurpose.SystemInfo;
        }
    }
}

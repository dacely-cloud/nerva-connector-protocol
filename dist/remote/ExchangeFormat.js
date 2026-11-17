// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { SignaturePurpose } from '../identity/IdentityFormat.js';
/** Each frame has exactly one receiver-selected signing purpose and sender role. */
export var ExchangeKind;
(function (ExchangeKind) {
    ExchangeKind["Challenge"] = "challenge";
    ExchangeKind["Authentication"] = "authentication";
    ExchangeKind["Confirmation"] = "confirmation";
    ExchangeKind["Request"] = "request";
    ExchangeKind["Result"] = "result";
    ExchangeKind["Chunk"] = "chunk";
    ExchangeKind["SystemInfo"] = "system-info";
})(ExchangeKind || (ExchangeKind = {}));
/** Frame and time bounds apply before cryptographic work or payload interpretation. */
export class ExchangeLimits {
    static frameBytes = 196608;
    static payloadBytes = 131072;
    static lifetimeMs = 120000n;
    static clockLeadMs = 5000n;
    /** Mutual authentication has a shorter finite lifetime than general operation envelopes. */
    static authenticationLifetimeMs = 30000n;
    /** Purpose comes from the receiver's expected kind, never an arbitrary wire string. */
    static purpose(kind) {
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

import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { type ExchangeKind, type ExchangeContext, type SignedExchange, type UnsignedExchange } from './ExchangeFormat.js';
/** Application proofs add exact operation correlation to the mandatory composite identity transcript. */
export declare class ExchangeProof {
    /** Only validated finite envelopes can consume signing work. */
    static sign(key: PurposeSigner, input: UnsignedExchange): SignedExchange;
    /** Callers receive payload bytes only after both proofs and the independently supplied operation context have passed. */
    static verify(verifier: PurposeVerifier, bytes: Uint8Array, kind: ExchangeKind, context: ExchangeContext, trustedPublicKey: string, nowMs: bigint): SignedExchange;
}

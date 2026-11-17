import { ExchangeKind, type ExchangeContext, type SignedExchange, type UnsignedExchange } from './ExchangeFormat.js';
/** Bounded exact wire validation is separate from identity proof and operation authorization. */
export declare class ExchangeCodec {
    #private;
    /** Complete expected context is captured by the receiver from its authorized operation, not learned from the frame. */
    static context(raw: unknown): ExchangeContext;
    /** A single finite frame must be strict UTF-8 JSON with no extra authority fields. */
    static decode(bytes: Uint8Array): SignedExchange;
    /** Canonical proof bytes have fixed field order and exact decimal quantities. */
    static payload(value: UnsignedExchange): Buffer;
    /** Hashes commit the exact accepted frame, including its composite proof, for operation and stream correlation. */
    static digest(value: SignedExchange): string;
    /** Encoding is bounded too; escaped JSON cannot inflate beyond the transport limit. */
    static encode(value: SignedExchange): Buffer;
    /** Expected role, exact authorized context and freshness must pass before signature verification or any effect. */
    static require(value: SignedExchange, kind: ExchangeKind, context: ExchangeContext, nowMs: bigint): void;
}

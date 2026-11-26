// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ExchangeCodec } from './ExchangeCodec.js';
import {
    ExchangeLimits,
    type ExchangeKind,
    type ExchangeContext,
    type SignedExchange,
    type UnsignedExchange,
} from './ExchangeFormat.js';

/** Application proofs add exact operation correlation to the mandatory composite identity transcript. */
export class ExchangeProof {
    /** Only validated finite envelopes can consume signing work. */
    public static sign(key: PurposeSigner, input: UnsignedExchange): SignedExchange {
        const value: SignedExchange = ExchangeCodec.decode(
            ExchangeCodec.encode({
                ...input,
                signature: Buffer.alloc(IdentityLengths.signature).toString('base64url'),
            }),
        );
        return Object.freeze({
            ...value,
            signature: key.sign(ExchangeLimits.purpose(value.kind), ExchangeCodec.payload(value)),
        });
    }

    /** Callers receive payload bytes only after both proofs and the independently supplied operation context have passed. */
    public static verify(
        verifier: PurposeVerifier,
        bytes: Uint8Array,
        kind: ExchangeKind,
        context: ExchangeContext,
        trustedPublicKey: string,
        nowMs: bigint,
    ): SignedExchange {
        const value: SignedExchange = ExchangeCodec.decode(bytes);
        ExchangeCodec.require(value, kind, context, nowMs);
        if (
            !verifier.verify(
                ExchangeLimits.purpose(kind),
                trustedPublicKey,
                ExchangeCodec.payload(value),
                value.signature,
            )
        ) {
            throw new Error('Signed exchange proof rejected');
        }
        return value;
    }
}

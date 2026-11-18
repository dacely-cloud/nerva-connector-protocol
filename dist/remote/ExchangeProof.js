// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ExchangeCodec } from './ExchangeCodec.js';
import { ExchangeLimits, } from './ExchangeFormat.js';
/** Application proofs add exact operation correlation to the mandatory composite identity transcript. */
export class ExchangeProof {
    /** Only validated finite envelopes can consume signing work. */
    static sign(key, input) {
        const value = ExchangeCodec.decode(ExchangeCodec.encode({
            ...input,
            signature: Buffer.alloc(IdentityLengths.signature).toString('base64url'),
        }));
        return Object.freeze({
            ...value,
            signature: key.sign(ExchangeLimits.purpose(value.kind), ExchangeCodec.payload(value)),
        });
    }
    /** Callers receive payload bytes only after both proofs and the independently supplied operation context have passed. */
    static verify(verifier, bytes, kind, context, trustedPublicKey, nowMs) {
        const value = ExchangeCodec.decode(bytes);
        ExchangeCodec.require(value, kind, context, nowMs);
        if (!verifier.verify(ExchangeLimits.purpose(kind), trustedPublicKey, ExchangeCodec.payload(value), value.signature)) {
            throw new Error('Signed exchange proof rejected');
        }
        return value;
    }
}

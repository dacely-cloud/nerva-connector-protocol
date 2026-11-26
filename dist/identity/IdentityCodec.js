// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { IdentityLengths, SignaturePurpose, SignatureSuite } from './IdentityFormat.js';
/** Node-only connector and authority codecs validate fixed composite bytes before crypto or allocation. */
export class IdentityCodec {
    static #purposes = new Set(Object.values(SignaturePurpose));
    /** The public identity is ML-DSA-44's raw public key followed by Ed25519's raw public key. */
    static publicKey(raw) {
        return this.binary(raw, IdentityLengths.publicKey);
    }
    /** Both signatures are mandatory and occupy fixed distinct slices. */
    static signature(raw) {
        return this.binary(raw, IdentityLengths.signature);
    }
    /** Canonical base64url rejects padding, alternate encodings and oversized values before decoding. */
    static binary(raw, bytes) {
        if (!Number.isSafeInteger(bytes) ||
            bytes < 1 ||
            bytes > IdentityLengths.signature ||
            typeof raw !== 'string' ||
            raw.length !== Math.ceil((bytes * 4) / 3) ||
            !/^[A-Za-z0-9_-]+$/u.test(raw)) {
            throw new Error('Invalid connector identity encoding');
        }
        const decoded = Buffer.from(raw, 'base64url');
        if (decoded.byteLength !== bytes || decoded.toString('base64url') !== raw) {
            throw new Error('Noncanonical connector identity encoding');
        }
        return decoded;
    }
    static transcript(purpose, publicKey, payload, purposes = IdentityCodec.#purposes) {
        if (!purposes.has(purpose) ||
            publicKey.byteLength !== IdentityLengths.publicKey ||
            !(payload instanceof Uint8Array) ||
            payload.byteLength > IdentityLengths.payload) {
            throw new Error('Invalid connector signature transcript');
        }
        const fields = [
            Buffer.from('nerva-connector:dual-signature'),
            Buffer.from(SignatureSuite.MlDsa44Ed25519),
            Buffer.from(purpose),
            publicKey,
            payload,
        ];
        const length = fields.reduce((total, field) => total + 4 + field.byteLength, 0);
        const result = Buffer.alloc(length);
        let offset = 0;
        for (const field of fields) {
            result.writeUInt32BE(field.byteLength, offset);
            offset += 4;
            result.set(field, offset);
            offset += field.byteLength;
        }
        return result;
    }
}

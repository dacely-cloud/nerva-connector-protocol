// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { IdentityLengths, SignaturePurpose, SignatureSuite } from './IdentityFormat.js';

/** Node-only connector and authority codecs validate fixed composite bytes before crypto or allocation. */
export class IdentityCodec {
    static readonly #purposes: ReadonlySet<string> = new Set<string>(Object.values(SignaturePurpose));

    /** The public identity is ML-DSA-44's raw public key followed by Ed25519's raw public key. */
    public static publicKey(raw: unknown): Buffer {
        return this.binary(raw, IdentityLengths.publicKey);
    }

    /** Both signatures are mandatory and occupy fixed distinct slices. */
    public static signature(raw: unknown): Buffer {
        return this.binary(raw, IdentityLengths.signature);
    }

    /** Canonical base64url rejects padding, alternate encodings and oversized values before decoding. */
    public static binary(raw: unknown, bytes: number): Buffer {
        if (
            !Number.isSafeInteger(bytes) ||
            bytes < 1 ||
            bytes > IdentityLengths.signature ||
            typeof raw !== 'string' ||
            raw.length !== Math.ceil((bytes * 4) / 3) ||
            !/^[A-Za-z0-9_-]+$/u.test(raw)
        ) {
            throw new Error('Invalid connector identity encoding');
        }
        const decoded: Buffer = Buffer.from(raw, 'base64url');
        if (decoded.byteLength !== bytes || decoded.toString('base64url') !== raw) {
            throw new Error('Noncanonical connector identity encoding');
        }
        return decoded;
    }

    /** Both algorithms sign the same length-framed suite, receiver-selected purpose, complete identity and payload. */
    public static transcript(purpose: SignaturePurpose, publicKey: Buffer, payload: Uint8Array): Buffer;
    /**
     * The same transcript for a service that also signs purposes of its own.
     *
     * @param purposes - Every purpose this signer or receiver accepts; a purpose outside it is refused
     */
    public static transcript(
        purpose: string,
        publicKey: Buffer,
        payload: Uint8Array,
        purposes: ReadonlySet<string>,
    ): Buffer;
    public static transcript(
        purpose: string,
        publicKey: Buffer,
        payload: Uint8Array,
        purposes: ReadonlySet<string> = IdentityCodec.#purposes,
    ): Buffer {
        if (
            !purposes.has(purpose) ||
            publicKey.byteLength !== IdentityLengths.publicKey ||
            !(payload instanceof Uint8Array) ||
            payload.byteLength > IdentityLengths.payload
        ) {
            throw new Error('Invalid connector signature transcript');
        }
        const fields: readonly Uint8Array[] = [
            Buffer.from('nerva-connector:dual-signature'),
            Buffer.from(SignatureSuite.MlDsa44Ed25519),
            Buffer.from(purpose),
            publicKey,
            payload,
        ];
        const length: number = fields.reduce(
            (total: number, field: Uint8Array): number => total + 4 + field.byteLength,
            0,
        );
        const result: Buffer = Buffer.alloc(length);
        let offset: number = 0;
        for (const field of fields) {
            result.writeUInt32BE(field.byteLength, offset);
            offset += 4;
            result.set(field, offset);
            offset += field.byteLength;
        }
        return result;
    }
}

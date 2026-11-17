import { SignaturePurpose } from './IdentityFormat.js';
/** Node-only connector and authority codecs validate fixed composite bytes before crypto or allocation. */
export declare class IdentityCodec {
    #private;
    /** The public identity is ML-DSA-44's raw public key followed by Ed25519's raw public key. */
    static publicKey(raw: unknown): Buffer;
    /** Both signatures are mandatory and occupy fixed distinct slices. */
    static signature(raw: unknown): Buffer;
    /** Canonical base64url rejects padding, alternate encodings and oversized values before decoding. */
    static binary(raw: unknown, bytes: number): Buffer;
    /** Both algorithms sign the same length-framed suite, receiver-selected purpose, complete identity and payload. */
    static transcript(purpose: SignaturePurpose, publicKey: Buffer, payload: Uint8Array): Buffer;
    /**
     * The same transcript for a service that also signs purposes of its own.
     *
     * @param purposes - Every purpose this signer or receiver accepts; a purpose outside it is refused
     */
    static transcript(purpose: string, publicKey: Buffer, payload: Uint8Array, purposes: ReadonlySet<string>): Buffer;
}

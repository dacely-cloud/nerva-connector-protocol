// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { SignaturePurpose } from './IdentityFormat.js';

/**
 * A composite private key signs one purpose-bound payload.
 *
 * @remarks
 * Each side supplies its own key implementation; the shared proofs only choose the purpose and the exact payload bytes.
 */
export interface PurposeSigner {
    /** The composite public identity whose private components produce every signature. */
    readonly publicKey: string;
    /** Returns the base64url composite signature over the purpose-bound transcript of `payload`. */
    sign(purpose: SignaturePurpose, payload: Uint8Array): string;
}

/**
 * Receiver-pinned composite verification never adopts a key from the signature.
 *
 * @remarks
 * Each side supplies its own verifier; the shared proofs only choose the expected purpose, public key and payload bytes.
 */
export interface PurposeVerifier {
    /** True only when both signature components verify `payload` under `purpose` and the expected `publicKey`. */
    verify(
        purpose: SignaturePurpose,
        publicKey: string,
        payload: Uint8Array,
        signature: string,
    ): boolean;
}

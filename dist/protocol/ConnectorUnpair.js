// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
/** Request and acknowledgment use independent composite-signature purposes over the same immutable target. */
export class ConnectorUnpairCodec {
    /** Strict decoding bounds anonymous input before signature verification. */
    static read(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'publicKey',
            'signature',
        ]);
        return {
            authorityId: Boundary.id(value['authorityId']),
            publicKey: ConnectorEnrollmentCodec.binary(value['publicKey'], IdentityLengths.publicKey),
            signature: ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature),
        };
    }
    /** Replaying a signed retirement can only revoke the same key; it never grants or renews authority. */
    static payload(value) {
        return JSON.stringify([value.authorityId, value.publicKey]);
    }
}

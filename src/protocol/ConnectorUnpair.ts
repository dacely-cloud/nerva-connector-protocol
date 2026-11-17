// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';

/** A device can revoke only its own permanent public identity; no account or machine selector is accepted. */
export interface ConnectorUnpair {
    readonly authorityId: string;
    readonly publicKey: string;
    readonly signature: string;
}

/** Request and acknowledgment use independent composite-signature purposes over the same immutable target. */
export class ConnectorUnpairCodec {
    /** Strict decoding bounds anonymous input before signature verification. */
    public static read(raw: unknown): ConnectorUnpair {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'authorityId',
            'publicKey',
            'signature',
        ]);
        return {
            authorityId: Boundary.id(value['authorityId']),
            publicKey: ConnectorEnrollmentCodec.binary(
                value['publicKey'],
                IdentityLengths.publicKey,
            ),
            signature: ConnectorEnrollmentCodec.binary(
                value['signature'],
                IdentityLengths.signature,
            ),
        };
    }
    /** Replaying a signed retirement can only revoke the same key; it never grants or renews authority. */
    public static payload(value: Pick<ConnectorUnpair, 'authorityId' | 'publicKey'>): string {
        return JSON.stringify([value.authorityId, value.publicKey]);
    }
}

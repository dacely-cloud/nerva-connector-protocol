/** A device can revoke only its own permanent public identity; no account or machine selector is accepted. */
export interface ConnectorUnpair {
    readonly authorityId: string;
    readonly publicKey: string;
    readonly signature: string;
}
/** Request and acknowledgment use independent composite-signature purposes over the same immutable target. */
export declare class ConnectorUnpairCodec {
    /** Strict decoding bounds anonymous input before signature verification. */
    static read(raw: unknown): ConnectorUnpair;
    /** Replaying a signed retirement can only revoke the same key; it never grants or renews authority. */
    static payload(value: Pick<ConnectorUnpair, 'authorityId' | 'publicKey'>): string;
}

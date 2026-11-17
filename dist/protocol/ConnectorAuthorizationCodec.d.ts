import { type ConnectorAuthorization } from './ConnectorAuthorization.js';
/** Browser-safe closed decoding preserves the complete descriptor without inventing missing authorization. */
export declare class ConnectorAuthorizationCodec {
    /** Exact independent and joint alternatives reject downgrade fields, unexpected choices and partial descriptors. */
    static read(raw: unknown): ConnectorAuthorization;
    /** Transport text is bounded before parsing; decoding never verifies a descriptor signature. */
    static decode(json: string): ConnectorAuthorization;
    /** Already typed callers still validate and detach their complete envelope before hashing or serialization. */
    static value(value: ConnectorAuthorization): ConnectorAuthorization;
    /** Typed fields are validated before JSON allocation; exact revisions remain decimal and descriptor order is canonical. */
    static encode(value: ConnectorAuthorization): string;
}

import { type ConnectorMigrationApplied, type ConnectorMigrationAppliedBody } from './ConnectorAdmissionMigration.js';
/** A bounded device attestation records only conversion commitments, never operation acknowledgements or effects. */
export declare class ConnectorMigrationAppliedCodec {
    #private;
    /** Applied contains no wire bigint quantities. */
    static read(raw: unknown): ConnectorMigrationApplied;
    /** Local typed values receive the same runtime checks as network data. */
    static value(value: ConnectorMigrationApplied): ConnectorMigrationApplied;
    /** Both original complete signed envelopes are committed by this unsigned body. */
    static body(value: ConnectorMigrationAppliedBody): ConnectorMigrationAppliedBody;
    /** Canonical field order is fixed before signing or persistence. */
    static encode(value: ConnectorMigrationApplied): string;
    /** The whole text limit applies before parsing. */
    static decode(json: string): ConnectorMigrationApplied;
}

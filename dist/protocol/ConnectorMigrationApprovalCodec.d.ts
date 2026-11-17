import { type ConnectorMigrationApproval, type ConnectorMigrationApprovalBody } from './ConnectorAdmissionMigration.js';
/** Structural authority approval validation never invents a missing historical authorization or cryptographic proof. */
export declare class ConnectorMigrationApprovalCodec {
    #private;
    /** Full original device proof and every explicit historical authority remain on the wire. */
    static read(raw: unknown): ConnectorMigrationApproval;
    /** Caller-owned objects are validated and detached before any canonical hashing. */
    static value(value: ConnectorMigrationApproval): ConnectorMigrationApproval;
    /** Signing accepts only the same exact shape as verification. */
    static body(value: ConnectorMigrationApprovalBody): ConnectorMigrationApprovalBody;
    /** The complete original plan signature participates in canonical authority-signed bytes. */
    static encode(value: ConnectorMigrationApproval): string;
    /** Input text is bounded before JSON parsing. */
    static decode(json: string): ConnectorMigrationApproval;
}

import { type ConnectorMigrationPlanBody, type ConnectorMigrationApprovalBody, type ConnectorMigrationAppliedBody } from './ConnectorAdmissionMigration.js';
/** Browser-safe canonical transcript construction is shared independently of the device/server cryptographic implementation. */
export declare class ConnectorAdmissionMigrationPayload {
    #private;
    /** Exact source ciphertexts and the enrolled key authenticate the stopped migration plan. */
    static plan(value: ConnectorMigrationPlanBody): Uint8Array;
    /** The original complete device proof and explicit authority are both signed by the protected authority. */
    static approval(value: ConnectorMigrationApprovalBody): Uint8Array;
    /** The exact signed plan and approval hashes are inseparable from the new durable target commitments. */
    static applied(value: ConnectorMigrationAppliedBody): Uint8Array;
}

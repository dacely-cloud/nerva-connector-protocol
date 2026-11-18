import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { type ConnectorMigrationExpected, type ConnectorMigrationPlan, type ConnectorMigrationPlanBody, type ConnectorMigrationApproval, type ConnectorMigrationApprovalBody, type ConnectorMigrationApplied, type ConnectorMigrationAppliedBody } from './ConnectorAdmissionMigration.js';
/** Hybrid proofs certify only the exact stopped conversion; runtime admission and operation acknowledgements remain separate. */
export declare class ConnectorAdmissionMigrationProof {
    #private;
    /** Complete original randomized device proof bytes are included in this immutable plan identity. */
    static planSha256(plan: ConnectorMigrationPlan): string;
    /** The full authority proof and original complete plan participate in the exact durable approval identity. */
    static approvalSha256(approval: ConnectorMigrationApproval): string;
    /** Browser-safe canonical body transcript, excluding only the outer device signature. */
    static planPayload(value: ConnectorMigrationPlanBody): Uint8Array;
    /** Canonical authority transcript retains the complete original device-signed plan. */
    static approvalPayload(value: ConnectorMigrationApprovalBody): Uint8Array;
    /** Canonical device attestation signs only exact converted snapshot commitments. */
    static appliedPayload(value: ConnectorMigrationAppliedBody): Uint8Array;
    /** Device signing cannot claim a different enrolled key, malformed scope or contradictory source watermark. */
    static signPlan(key: PurposeSigner, value: ConnectorMigrationPlanBody): ConnectorMigrationPlan;
    /** Trusted pins are receiver-owned, independent of every signed reply field. */
    static verifyPlan(verifier: PurposeVerifier, expected: ConnectorMigrationExpected, value: ConnectorMigrationPlan): boolean;
    /** Issuers validate device proof, exact scope and every semantic admission before signing the fenced candidate. */
    static signApproval(verifier: PurposeVerifier, key: PurposeSigner, expected: ConnectorMigrationExpected, value: ConnectorMigrationApprovalBody): ConnectorMigrationApproval;
    /** Both hybrid signatures and every explicit historical authorization are mandatory; no lease or default authority is inferred. */
    static verifyApproval(verifier: PurposeVerifier, expected: ConnectorMigrationExpected, originalPlan: ConnectorMigrationPlan, value: ConnectorMigrationApproval): boolean;
    /** A device attests applied targets only for the fully verified exact authority approval. */
    static signApplied(verifier: PurposeVerifier, key: PurposeSigner, expected: ConnectorMigrationExpected, approval: ConnectorMigrationApproval, value: ConnectorMigrationAppliedBody): ConnectorMigrationApplied;
    /** No operation is acknowledged by this attestation; all exact source lanes and complete approval bytes must match. */
    static verifyApplied(verifier: PurposeVerifier, expected: ConnectorMigrationExpected, approval: ConnectorMigrationApproval, value: ConnectorMigrationApplied): boolean;
}

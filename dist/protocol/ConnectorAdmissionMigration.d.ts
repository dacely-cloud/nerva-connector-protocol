import type { ConnectorAuthorization } from './ConnectorAuthorization.js';
import type { ConnectorOperationSchema } from './ConnectorOperationSchema.js';
/** The receiver selects one of the three permanent journals; neither requests nor peers select a free-form channel. */
export declare enum ConnectorMigrationLane {
    Files = "files",
    ExecutionFirst = "execution-first",
    ExecutionSecond = "execution-second"
}
/** Trusted local pins are supplied independently of the signed migration exchange. */
export interface ConnectorMigrationScope {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly devicePublicKey: string;
}
/** The authority pin must come from the protected current installation, never from an approval. */
export interface ConnectorMigrationExpected extends ConnectorMigrationScope {
    readonly authorityPublicKey: string;
}
/** Public correlation metadata excludes all original command arguments, file paths, contents and results. */
export interface ConnectorMigrationOriginal {
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
}
/** Acknowledged history retains its original result commitment without fabricating a new acknowledgement. */
export interface ConnectorMigrationReceipt extends ConnectorMigrationOriginal {
    readonly responseHash: string;
}
/** The exact complete encrypted snapshot is committed before a stopped converter requests authorization. */
export interface ConnectorMigrationSource {
    readonly lane: ConnectorMigrationLane;
    readonly sourceSha256: string;
    readonly journalId: string;
    readonly acknowledgedSequence: bigint;
    readonly receipt: ConnectorMigrationReceipt | null;
    readonly pending: ConnectorMigrationOriginal | null;
}
/** This plan requests conversion of specific stopped history; signing it grants no execution or acknowledgement. */
export interface ConnectorMigrationPlanBody extends ConnectorMigrationScope {
    readonly planId: string;
    readonly targetOperationSchema: ConnectorOperationSchema.ExplicitAdmission;
    readonly sources: readonly ConnectorMigrationSource[];
}
/** The device authenticates all encrypted source commitments and permanent journal identities. */
export interface ConnectorMigrationPlan extends ConnectorMigrationPlanBody {
    readonly signature: string;
}
/** Every historical operation receives explicit receiver-verified authority; absence never means Independent. */
export interface ConnectorMigrationAdmission {
    readonly authorization: ConnectorAuthorization;
    readonly admissionHash: string;
}
/** Authority records its opaque retained original backend snapshot and resolves both nullable correlations explicitly. */
export interface ConnectorMigrationAuthorization {
    readonly lane: ConnectorMigrationLane;
    readonly backendSourceSha256: string;
    readonly receipt: ConnectorMigrationAdmission | null;
    readonly pending: ConnectorMigrationAdmission | null;
}
/** The complete device proof is retained inside the fenced authority approval, including randomized signature bytes. */
export interface ConnectorMigrationApprovalBody {
    readonly plan: ConnectorMigrationPlan;
    readonly fenceId: string;
    readonly authorizations: readonly ConnectorMigrationAuthorization[];
}
/** Only the trusted authority may approve the exact retained stopped-history conversion. */
export interface ConnectorMigrationApproval extends ConnectorMigrationApprovalBody {
    readonly signature: string;
}
/** Conversion records both exact new plaintext and encrypted snapshot bytes for every original source. */
export interface ConnectorMigrationTarget {
    readonly lane: ConnectorMigrationLane;
    readonly plainSha256: string;
    readonly cipherSha256: string;
}
/** Applied is a conversion attestation, never a newly signed operation result or acknowledgement. */
export interface ConnectorMigrationAppliedBody {
    readonly planSha256: string;
    readonly approvalSha256: string;
    readonly targets: readonly ConnectorMigrationTarget[];
}
/** The device binds the actual durable conversion to the complete original approval and plan proofs. */
export interface ConnectorMigrationApplied extends ConnectorMigrationAppliedBody {
    readonly signature: string;
}
/** Separate finite budgets preserve all three source headers and up to six full joint-authority envelopes. */
export declare class ConnectorMigrationLimits {
    static readonly planBytes: number;
    static readonly approvalBytes: number;
    static readonly appliedBytes: number;
}

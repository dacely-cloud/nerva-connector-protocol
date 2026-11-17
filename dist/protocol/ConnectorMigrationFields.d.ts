import { ConnectorMigrationLane, type ConnectorMigrationScope, type ConnectorMigrationExpected, type ConnectorMigrationOriginal, type ConnectorMigrationReceipt, type ConnectorMigrationPlanBody, type ConnectorMigrationPlan, type ConnectorMigrationApprovalBody, type ConnectorMigrationApproval, type ConnectorMigrationAppliedBody, type ConnectorMigrationApplied } from './ConnectorAdmissionMigration.js';
/** Shared exact primitive validation is browser-safe; cryptographic verification lives outside this codec graph. */
export declare class ConnectorMigrationFields {
    /** Typed integers are validated before any JSON allocation; wire integers must remain canonical decimal strings. */
    static integer(value: unknown, wire: boolean): bigint;
    /** Only fixed receiver-selected permanent journal purposes are supported. */
    static lane(value: unknown): ConnectorMigrationLane;
    /** Canonical order permits paired-only empty sets; the coordinator independently proves every backend lane is unused. */
    static ordered(lanes: readonly ConnectorMigrationLane[]): void;
    /** Expected scope is closed, bounded and detached before proof work. */
    static scope(raw: unknown): ConnectorMigrationScope;
    /** A reply cannot replace either enrolled device identity or the protected authority pin. */
    static expected(raw: unknown): ConnectorMigrationExpected;
    /** No plaintext request/result fields are permitted in migration headers. */
    static original(raw: unknown, wire: boolean): ConnectorMigrationOriginal;
    /** Compact history commits its actual acknowledged response without returning it. */
    static receipt(raw: unknown, wire: boolean): ConnectorMigrationReceipt;
    /** Untrusted transport/storage text is bounded before the JSON allocation. */
    static decode(json: string, maximum: number): unknown;
    /** Whole-envelope byte limits apply to validated typed values before emission. */
    static encode(value: ConnectorMigrationPlanBody | ConnectorMigrationPlan | ConnectorMigrationApprovalBody | ConnectorMigrationApproval | ConnectorMigrationAppliedBody | ConnectorMigrationApplied, maximum: number): string;
}

import { type ConnectorMigrationPlan, type ConnectorMigrationPlanBody } from './ConnectorAdmissionMigration.js';
/** Exact browser-safe plan parsing accepts no plaintext operation data or implicit migration authority. */
export declare class ConnectorMigrationPlanCodec {
    #private;
    /** Network quantities are exact canonical decimal strings. */
    static read(raw: unknown): ConnectorMigrationPlan;
    /** Deserialized local state still receives exact bigint validation before it becomes a typed plan. */
    static local(raw: unknown): ConnectorMigrationPlan;
    /** Local objects are normalized, deeply detached and bounded before signing or persistence. */
    static value(value: ConnectorMigrationPlan): ConnectorMigrationPlan;
    /** Only the fixed unsigned plan body enters the device transcript. */
    static body(value: ConnectorMigrationPlanBody): ConnectorMigrationPlanBody;
    /** Complete signed plan bytes use one fixed field order and exact decimals. */
    static encode(value: ConnectorMigrationPlan): string;
    /** Text is bounded before parsing, including malicious whitespace and nested extra fields. */
    static decode(json: string): ConnectorMigrationPlan;
}

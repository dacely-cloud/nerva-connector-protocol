import type { ConnectorHostTool } from './ConnectorHost.js';
import { type ConnectorHostArgumentBounds } from './ConnectorHostArgumentContract.js';
/** A JSON value inside a rendered schema. */
export type ConnectorHostSchemaValue = null | boolean | number | string | ConnectorHostSchemaObject | readonly ConnectorHostSchemaValue[];
/** A rendered JSON Schema object. */
export interface ConnectorHostSchemaObject {
    readonly [name: string]: ConnectorHostSchemaValue;
}
/**
 * Renders argument contracts as JSON Schema for MCP tool discovery.
 *
 * @remarks
 * Mode groups have no schema form here: every field of every alternative is listed and only the fields required in
 * all cases are marked required, so a schema-only client sees the same flat object it always has. The contract,
 * not the schema, decides what is accepted. Text lengths are advisory, because JSON Schema counts code points where
 * the contract counts UTF-16 code units, and map key rules are left to the contract.
 */
export declare class ConnectorHostArgumentSchema {
    #private;
    /** The input schema of one tool; `descriptions` attaches text to named top-level fields. */
    static of(tool: ConnectorHostTool, bounds: ConnectorHostArgumentBounds, descriptions?: Readonly<Record<string, string>>): ConnectorHostSchemaObject;
}

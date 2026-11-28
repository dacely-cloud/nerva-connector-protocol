import type { ConnectorHostTool } from './ConnectorHost.js';
import { ConnectorHostArguments } from './ConnectorHostArguments.js';
import { type ConnectorHostArgumentBounds } from './ConnectorHostArgumentContract.js';
/** Arguments that satisfy their tool's contract. */
export interface ConnectorHostArgumentAccepted {
    readonly valid: true;
    readonly arguments: ConnectorHostArguments;
}
/** The first contract violation found, phrased for the caller that has to correct it. */
export interface ConnectorHostArgumentRejected {
    readonly valid: false;
    /** Dotted path of the offending field, or null when the violation concerns the whole object or a field name that is not shown. */
    readonly field: string | null;
    /** One sentence without a final period that names the field and what it accepts; supplied values are never quoted. */
    readonly message: string;
}
/** The outcome of checking one argument object. */
export type ConnectorHostArgumentCheck = ConnectorHostArgumentAccepted | ConnectorHostArgumentRejected;
/**
 * Checks native host tool arguments against {@link ConnectorHostArgumentContracts}.
 *
 * @remarks
 * Fields are checked in contract order, then mode groups, then cross-field rules; the first violation is returned.
 * Messages name fields and accepted forms but never repeat a supplied value, because arguments can carry commands,
 * paths and file contents that diagnostics must not copy. A field name the contract does not know is named only when
 * it is a short plain identifier.
 */
export declare class ConnectorHostArgumentValidation {
    #private;
    /** Check one argument object for a tool under the given transport bounds. */
    static check(tool: ConnectorHostTool, raw: unknown, bounds: ConnectorHostArgumentBounds): ConnectorHostArgumentCheck;
}

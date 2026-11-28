import { ConnectorHostTool } from './ConnectorHost.js';
import { type ConnectorHostArgumentFields } from './ConnectorHostArgumentField.js';
/** One way of satisfying a mode group: the fields that select it and those it then requires. */
export interface ConnectorHostArgumentAlternative {
    /** Setting any of these fields selects this alternative. */
    readonly fields: readonly string[];
    /** Fields a selected alternative must set. */
    readonly required: readonly string[];
}
/**
 * Mutually exclusive field groups, such as executable with arguments versus shell with command.
 *
 * @remarks
 * A field is set when it is present and neither `null` nor an empty list. At most one alternative may be selected;
 * when `required` is true, exactly one must be.
 */
export interface ConnectorHostArgumentModes {
    readonly required: boolean;
    readonly alternatives: readonly ConnectorHostArgumentAlternative[];
}
/** Checks that relate several fields and do not fit a single field's kind. */
export declare const ConnectorHostArgumentRule: {
    /** `data` holds UTF-8 text or canonical base64 per `encoding`, and fits one transport chunk. */
    readonly Bytes: 'bytes';
    /** `key` is one key, or a modifier chord when `action` is press. */
    readonly KeyChord: 'key-chord';
    /** An `offset` other than `"0"` is accepted only with mode `update`. */
    readonly WriteOffset: 'write-offset';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostArgumentRule = (typeof ConnectorHostArgumentRule)[keyof typeof ConnectorHostArgumentRule];
/** The complete argument object of one native host tool. Unknown fields are always refused. */
export interface ConnectorHostArgumentContract {
    readonly tool: ConnectorHostTool;
    readonly fields: ConnectorHostArgumentFields;
    readonly required: readonly string[];
    readonly modes: ConnectorHostArgumentModes | null;
    readonly rules: readonly ConnectorHostArgumentRule[];
}
/** Transport bounds that size chunk and directory-page arguments. */
export interface ConnectorHostArgumentBounds {
    /** Largest `maximumBytes` and largest decoded `data` payload. */
    readonly chunkBytes: number;
    /** Largest `maximumEntries` of one directory page. */
    readonly directoryEntries: number;
}
/**
 * The argument contract of every native host tool, shared by the connector that executes them and every client that
 * submits them.
 *
 * @remarks
 * A client checks arguments with these contracts before submitting, so a malformed call fails at once with the field
 * named instead of after a round trip to the computer. The connector checks the same contracts again, because a
 * client is never trusted to have done so.
 */
export declare class ConnectorHostArgumentContracts {
    #private;
    /** Bounds of the paired account relay, which every remote client submits through. */
    static readonly paired: ConnectorHostArgumentBounds;
    /** Longest text a native argument carries; process limits bound launch text further. */
    static readonly textLength: number;
    /** Longest program, argument, environment value or working directory a launch accepts. */
    static readonly nativeTextLength: number;
    /** The contract of one tool under the given transport bounds. */
    static of(tool: ConnectorHostTool, bounds: ConnectorHostArgumentBounds): ConnectorHostArgumentContract;
}

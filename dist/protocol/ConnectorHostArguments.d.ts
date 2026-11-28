/**
 * Arguments that already satisfy their tool's contract, read as typed values.
 *
 * @remarks
 * {@link ConnectorHostArgumentValidation.check} returns these after every field has passed its contract, so each
 * reader only narrows a value whose form is already known. A reader throws when the caller asks for a field as a
 * different kind than its contract declares, or asks a required reader for a field that is absent, which is a
 * programming error rather than bad input. An optional reader returns its fallback for a field that is absent or
 * `null`.
 */
export declare class ConnectorHostArguments {
    #private;
    /** Wrap a record whose fields already passed one contract; nothing here validates them again. */
    constructor(values: Readonly<Record<string, unknown>>);
    /** Whether the field is present at all, `null` included. */
    present(name: string): boolean;
    /** Whether the field is present and not `null`. */
    has(name: string): boolean;
    /** A text or data field. */
    text(name: string): string;
    /** An optional text or data field, or the fallback when it is absent. */
    optionalText<Fallback extends string | null | undefined>(name: string, fallback: Fallback): string | Fallback;
    /** One value of a choice field, narrowed to the caller's value set. */
    choice<Value extends string>(name: string, values: readonly Value[]): Value;
    /** An optional choice field, or the fallback when it is absent. */
    optionalChoice<Value extends string, Fallback extends string | null | undefined>(name: string, values: readonly Value[], fallback: Fallback): Value | Fallback;
    /** A decimal or signed decimal string field as an exact integer. */
    decimal(name: string): bigint;
    /** An optional decimal string field, or the fallback when it is absent. */
    optionalDecimal(name: string, fallback: bigint): bigint;
    /** A JSON integer field. */
    integer(name: string): number;
    /** An optional JSON integer field, or the fallback when it is absent. */
    optionalInteger<Fallback extends number | undefined>(name: string, fallback: Fallback): number | Fallback;
    /** A boolean field. */
    boolean(name: string): boolean;
    /** An optional boolean field, or the fallback when it is absent. */
    optionalBoolean(name: string, fallback: boolean): boolean;
    /** A string list field, empty when it is absent. */
    list(name: string): readonly string[];
    /** A string dictionary field as a fresh copy, empty when it is absent. */
    map(name: string): Readonly<Record<string, string>>;
    /** A nested record field. */
    record(name: string): ConnectorHostArguments;
    /** An optional nested record field, or null when it is absent. */
    optionalRecord(name: string): ConnectorHostArguments | null;
}

/** Closed finite data readers reject accessors and hidden fields before policy or input values are used. */
export declare class ExecutionMachineBoundary {
    #private;
    /**
     * Canonical launch envelopes include every nested UTF-8 byte in their unchanged argument ceiling.
     *
     * @remarks
     * The count uses TextEncoder, so it is the same in Node and in a browser bundle.
     */
    static bytes(value: string): number;
    /** All declared fields must be own enumerable data; missing, extra or inherited authority is rejected. */
    static record(raw: unknown, fields: readonly string[]): Readonly<Record<string, unknown>>;
    /** Only dense bounded arrays with no additional own fields are copied. */
    static array(raw: unknown, maximum: number): readonly unknown[];
    /** Small controlled byte ceilings, indexes and durations never accept fractions or lossy integers. */
    static count(raw: unknown, minimum: number, maximum: number): number;
    /** Finite UTF-8 input data can contain NUL because it is delivered through an owned descriptor. */
    static data(raw: unknown, maximum: number): string;
    /** Values consumed by execve or path APIs cannot contain embedded C-string terminators. */
    static text(raw: unknown, maximum: number): string;
    /** The platform's native bootstrap namespace cannot be granted as application environment input. */
    static name(raw: unknown): string;
    /** The native owner must still resolve this canonical relative path beneath its opened root. */
    static cwd(raw: unknown, maximum: number): string;
}

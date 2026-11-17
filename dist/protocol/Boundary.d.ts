/** Primitive validation at JSON/storage boundaries; never accepts inherited request fields. */
export declare class Boundary {
    /** Only plain serialized records are supported at service boundaries. */
    static record(value: unknown, fields: readonly string[]): Readonly<Record<string, unknown>>;
    /** Bounded opaque identifiers cannot become paths, commands, or arbitrary endpoints. */
    static id(value: unknown): string;
    /** Bounded display text remains data, never executable configuration. */
    static text(value: unknown): string;
    /** Small controlled counters use numbers; external quantities use exact integers. */
    static count(value: unknown, maximum: number): number;
    /** Nonnegative signed-64-bit values are exact in JSON and BSON. */
    static integer(value: unknown): bigint;
    /** Missing booleans do not silently enable a capability. */
    static boolean(value: unknown): boolean;
    /** Collections have an explicit allocation bound before element validation. */
    static array(value: unknown, maximum: number): readonly unknown[];
    /** Feature/identity collections reject duplicates instead of creating ambiguous ownership. */
    static ids(value: unknown, maximum: number): readonly string[];
}

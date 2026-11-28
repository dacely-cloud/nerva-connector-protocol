// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

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
export class ConnectorHostArguments {
    readonly #values: Readonly<Record<string, unknown>>;

    /** Wrap a record whose fields already passed one contract; nothing here validates them again. */
    public constructor(values: Readonly<Record<string, unknown>>) {
        this.#values = values;
    }

    /** Whether the field is present at all, `null` included. */
    public present(name: string): boolean {
        return Object.hasOwn(this.#values, name);
    }

    /** Whether the field is present and not `null`. */
    public has(name: string): boolean {
        return this.#value(name) !== undefined;
    }

    /** A text or data field. */
    public text(name: string): string {
        return this.#read(name, ConnectorHostArguments.#string);
    }

    /** An optional text or data field, or the fallback when it is absent. */
    public optionalText<Fallback extends string | null | undefined>(
        name: string,
        fallback: Fallback,
    ): string | Fallback {
        return this.has(name) ? this.text(name) : fallback;
    }

    /** One value of a choice field, narrowed to the caller's value set or value object. */
    public choice<Value extends string>(
        name: string,
        values: Readonly<Record<string, Value>> | readonly Value[],
    ): Value {
        return this.#read(name, (value: unknown): value is Value =>
            Object.values(values).some((candidate: Value): boolean => candidate === value),
        );
    }

    /** An optional choice field, or the fallback when it is absent. */
    public optionalChoice<Value extends string, Fallback extends string | null | undefined>(
        name: string,
        values: Readonly<Record<string, Value>> | readonly Value[],
        fallback: Fallback,
    ): Value | Fallback {
        return this.has(name) ? this.choice(name, values) : fallback;
    }

    /** A decimal or signed decimal string field as an exact integer. */
    public decimal(name: string): bigint {
        return BigInt(this.text(name));
    }

    /** An optional decimal string field, or the fallback when it is absent. */
    public optionalDecimal(name: string, fallback: bigint): bigint {
        return this.has(name) ? this.decimal(name) : fallback;
    }

    /** A JSON integer field. */
    public integer(name: string): number {
        return this.#read(name, (value: unknown): value is number => typeof value === 'number');
    }

    /** An optional JSON integer field, or the fallback when it is absent. */
    public optionalInteger<Fallback extends number | undefined>(
        name: string,
        fallback: Fallback,
    ): number | Fallback {
        return this.has(name) ? this.integer(name) : fallback;
    }

    /** A boolean field. */
    public boolean(name: string): boolean {
        return this.#read(name, (value: unknown): value is boolean => typeof value === 'boolean');
    }

    /** An optional boolean field, or the fallback when it is absent. */
    public optionalBoolean(name: string, fallback: boolean): boolean {
        return this.has(name) ? this.boolean(name) : fallback;
    }

    /** A string list field, empty when it is absent. */
    public list(name: string): readonly string[] {
        return this.has(name)
            ? this.#read(
                  name,
                  (value: unknown): value is readonly string[] =>
                      Array.isArray(value) && value.every(ConnectorHostArguments.#string),
              )
            : [];
    }

    /** A string dictionary field as a fresh copy, empty when it is absent. */
    public map(name: string): Readonly<Record<string, string>> {
        return this.has(name)
            ? Object.fromEntries(
                  Object.entries(this.#record(name)).map(
                      ([key, item]: [string, unknown]): [string, string] => [
                          key,
                          this.#read(key, ConnectorHostArguments.#string, item),
                      ],
                  ),
              )
            : {};
    }

    /** A nested record field. */
    public record(name: string): ConnectorHostArguments {
        return new ConnectorHostArguments(Object.fromEntries(Object.entries(this.#record(name))));
    }

    /** An optional nested record field, or null when it is absent. */
    public optionalRecord(name: string): ConnectorHostArguments | null {
        return this.has(name) ? this.record(name) : null;
    }

    static #string(value: unknown): value is string {
        return typeof value === 'string';
    }

    #record(name: string): object {
        return this.#read(
            name,
            (value: unknown): value is object =>
                typeof value === 'object' && value !== null && !Array.isArray(value),
        );
    }

    /** Narrow one field, or a value read from it, to the kind the caller expects. */
    #read<Value>(
        name: string,
        guard: (value: unknown) => value is Value,
        value: unknown = this.#value(name),
    ): Value {
        if (!guard(value)) {
            throw new Error(`Host argument ${name} is not the kind its contract declares`);
        }
        return value;
    }

    #value(name: string): unknown {
        if (!Object.hasOwn(this.#values, name)) {
            return undefined;
        }
        const value: unknown = this.#values[name];
        return value === null ? undefined : value;
    }
}

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
    #values;
    /** Wrap a record whose fields already passed one contract; nothing here validates them again. */
    constructor(values) {
        this.#values = values;
    }
    /** Whether the field is present at all, `null` included. */
    present(name) {
        return Object.hasOwn(this.#values, name);
    }
    /** Whether the field is present and not `null`. */
    has(name) {
        return this.#value(name) !== undefined;
    }
    /** A text or data field. */
    text(name) {
        return this.#read(name, ConnectorHostArguments.#string);
    }
    /** An optional text or data field, or the fallback when it is absent. */
    optionalText(name, fallback) {
        return this.has(name) ? this.text(name) : fallback;
    }
    /** One value of a choice field, narrowed to the caller's value set or value object. */
    choice(name, values) {
        return this.#read(name, (value) => Object.values(values).some((candidate) => candidate === value));
    }
    /** An optional choice field, or the fallback when it is absent. */
    optionalChoice(name, values, fallback) {
        return this.has(name) ? this.choice(name, values) : fallback;
    }
    /** A decimal or signed decimal string field as an exact integer. */
    decimal(name) {
        return BigInt(this.text(name));
    }
    /** An optional decimal string field, or the fallback when it is absent. */
    optionalDecimal(name, fallback) {
        return this.has(name) ? this.decimal(name) : fallback;
    }
    /** A JSON integer field. */
    integer(name) {
        return this.#read(name, (value) => typeof value === 'number');
    }
    /** An optional JSON integer field, or the fallback when it is absent. */
    optionalInteger(name, fallback) {
        return this.has(name) ? this.integer(name) : fallback;
    }
    /** A boolean field. */
    boolean(name) {
        return this.#read(name, (value) => typeof value === 'boolean');
    }
    /** An optional boolean field, or the fallback when it is absent. */
    optionalBoolean(name, fallback) {
        return this.has(name) ? this.boolean(name) : fallback;
    }
    /** A string list field, empty when it is absent. */
    list(name) {
        return this.has(name)
            ? this.#read(name, (value) => Array.isArray(value) && value.every(ConnectorHostArguments.#string))
            : [];
    }
    /** A string dictionary field as a fresh copy, empty when it is absent. */
    map(name) {
        return this.has(name)
            ? Object.fromEntries(Object.entries(this.#record(name)).map(([key, item]) => [
                key,
                this.#read(key, ConnectorHostArguments.#string, item),
            ]))
            : {};
    }
    /** A nested record field. */
    record(name) {
        return new ConnectorHostArguments(Object.fromEntries(Object.entries(this.#record(name))));
    }
    /** An optional nested record field, or null when it is absent. */
    optionalRecord(name) {
        return this.has(name) ? this.record(name) : null;
    }
    static #string(value) {
        return typeof value === 'string';
    }
    #record(name) {
        return this.#read(name, (value) => typeof value === 'object' && value !== null && !Array.isArray(value));
    }
    /** Narrow one field, or a value read from it, to the kind the caller expects. */
    #read(name, guard, value = this.#value(name)) {
        if (!guard(value)) {
            throw new Error(`Host argument ${name} is not the kind its contract declares`);
        }
        return value;
    }
    #value(name) {
        if (!Object.hasOwn(this.#values, name)) {
            return undefined;
        }
        const value = this.#values[name];
        return value === null ? undefined : value;
    }
}

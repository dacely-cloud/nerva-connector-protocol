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
        const value = this.#value(name);
        if (typeof value !== 'string') {
            throw new Error(`Host argument ${name} is not text`);
        }
        return value;
    }
    /** An optional text or data field, or the fallback when it is absent. */
    optionalText(name, fallback) {
        return this.has(name) ? this.text(name) : fallback;
    }
    /** One value of a choice field, narrowed to the caller's value set. */
    choice(name, values) {
        const value = this.#value(name);
        const match = values.find((candidate) => candidate === value);
        if (match === undefined) {
            throw new Error(`Host argument ${name} is not one of the expected values`);
        }
        return match;
    }
    /** An optional choice field, or the fallback when it is absent. */
    optionalChoice(name, values, fallback) {
        return this.has(name) ? this.choice(name, values) : fallback;
    }
    /** A decimal or signed decimal string field as an exact integer. */
    decimal(name) {
        const value = this.#value(name);
        if (typeof value !== 'string') {
            throw new Error(`Host argument ${name} is not a decimal string`);
        }
        return BigInt(value);
    }
    /** An optional decimal string field, or the fallback when it is absent. */
    optionalDecimal(name, fallback) {
        return this.has(name) ? this.decimal(name) : fallback;
    }
    /** A JSON integer field. */
    integer(name) {
        const value = this.#value(name);
        if (typeof value !== 'number') {
            throw new Error(`Host argument ${name} is not an integer`);
        }
        return value;
    }
    /** An optional JSON integer field, or the fallback when it is absent. */
    optionalInteger(name, fallback) {
        return this.has(name) ? this.integer(name) : fallback;
    }
    /** A boolean field. */
    boolean(name) {
        const value = this.#value(name);
        if (typeof value !== 'boolean') {
            throw new Error(`Host argument ${name} is not a boolean`);
        }
        return value;
    }
    /** An optional boolean field, or the fallback when it is absent. */
    optionalBoolean(name, fallback) {
        return this.has(name) ? this.boolean(name) : fallback;
    }
    /** A string list field, empty when it is absent. */
    list(name) {
        const value = this.#value(name);
        if (value === undefined) {
            return [];
        }
        if (!Array.isArray(value)) {
            throw new Error(`Host argument ${name} is not a list`);
        }
        return value.map((item) => {
            if (typeof item !== 'string') {
                throw new Error(`Host argument ${name} holds a value that is not text`);
            }
            return item;
        });
    }
    /** A string dictionary field as a fresh copy, empty when it is absent. */
    map(name) {
        const value = this.#value(name);
        if (value === undefined) {
            return {};
        }
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`Host argument ${name} is not a map`);
        }
        return Object.fromEntries(Object.entries(value).map(([key, item]) => {
            if (typeof item !== 'string') {
                throw new Error(`Host argument ${name} holds a value that is not text`);
            }
            return [key, item];
        }));
    }
    /** A nested record field. */
    record(name) {
        const value = this.#value(name);
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new Error(`Host argument ${name} is not a record`);
        }
        return new ConnectorHostArguments(Object.fromEntries(Object.entries(value)));
    }
    /** An optional nested record field, or null when it is absent. */
    optionalRecord(name) {
        return this.has(name) ? this.record(name) : null;
    }
    #value(name) {
        if (!Object.hasOwn(this.#values, name)) {
            return undefined;
        }
        const value = this.#values[name];
        return value === null ? undefined : value;
    }
}

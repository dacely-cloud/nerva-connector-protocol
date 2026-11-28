// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostTool } from './ConnectorHost.js';
import { ConnectorHostArguments } from './ConnectorHostArguments.js';
import {
    ConnectorHostByteEncoding,
    ConnectorHostKeyAction,
    ConnectorHostWriteMode,
} from './ConnectorHostArgumentChoices.js';
import {
    ConnectorHostArgumentContracts,
    ConnectorHostArgumentRule,
    type ConnectorHostArgumentAlternative,
    type ConnectorHostArgumentBounds,
    type ConnectorHostArgumentContract,
    type ConnectorHostArgumentModes,
} from './ConnectorHostArgumentContract.js';
import {
    ConnectorHostArgumentKind as Kind,
    type ConnectorHostArgumentField,
    type ConnectorHostArgumentFields,
    type ConnectorHostTextArgument,
} from './ConnectorHostArgumentField.js';
import { ConnectorHostKeyChord } from './ConnectorHostKeyChord.js';

/** Arguments that satisfy their tool's contract. */
export interface ConnectorHostArgumentAccepted {
    readonly valid: true;
    readonly arguments: ConnectorHostArguments;
}

/** The first contract violation found, phrased for the caller that has to correct it. */
export interface ConnectorHostArgumentRejected {
    readonly valid: false;
    /** One sentence without a final period that names the field and what it accepts; supplied values are never quoted. */
    readonly message: string;
}

/** The outcome of checking one argument object. */
export type ConnectorHostArgumentCheck =
    ConnectorHostArgumentAccepted | ConnectorHostArgumentRejected;

/**
 * Checks native host tool arguments against {@link ConnectorHostArgumentContracts}.
 *
 * @remarks
 * Fields are checked in contract order, then mode groups, then cross-field rules; the first violation is returned.
 * Messages name fields and accepted forms but never repeat a supplied value, because arguments can carry commands,
 * paths and file contents that diagnostics must not copy. A field name the contract does not know is named only when
 * it is a short plain identifier.
 */
export class ConnectorHostArgumentValidation {
    static readonly #maximumDecimal: bigint = 9223372036854775807n;
    static readonly #chunks: string = '; send larger content in several chunks';
    static readonly #types: Readonly<Record<string, string>> = {
        null: 'null',
        array: 'an array',
        number: 'a JSON number',
        string: 'a string',
        boolean: 'true or false',
    };
    /** Canonical padded base64: the last character before padding carries no stray bits, as a strict decoder reencodes. */
    static readonly #base64: RegExp =
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/][AQgw]==|[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=)?$/u;
    /**
     * UTF-8 sizes come from the native encoder, which writes an unpaired surrogate as three bytes exactly as the
     * connector's own encoder does; it measured five to ten times faster than counting code units in script.
     */
    static readonly #encoder: TextEncoder = new TextEncoder();

    /** Check one argument object for a tool under the given transport bounds. */
    public static check(
        tool: ConnectorHostTool,
        raw: unknown,
        bounds: ConnectorHostArgumentBounds,
    ): ConnectorHostArgumentCheck {
        const contract: ConnectorHostArgumentContract = ConnectorHostArgumentContracts.of(
            tool,
            bounds,
        );
        const shape: ConnectorHostArgumentRejected | null = this.#object(
            raw,
            contract.fields,
            contract.required,
            tool,
            '',
        );
        if (shape !== null) {
            return shape;
        }
        const values: Readonly<Record<string, unknown>> = this.#plain(raw)
            ? Object.fromEntries(Object.entries(raw))
            : {};
        const rejection: ConnectorHostArgumentRejected | null =
            (contract.modes === null ? null : this.#modes(tool, contract.modes, values)) ??
            this.#rules(contract.rules, values, bounds);
        return rejection ?? { valid: true, arguments: new ConnectorHostArguments(values) };
    }

    static #object(
        raw: unknown,
        fields: ConnectorHostArgumentFields,
        required: readonly string[],
        owner: string,
        prefix: string,
    ): ConnectorHostArgumentRejected | null {
        if (!this.#plain(raw)) {
            return this.#reject(
                `${prefix === '' ? `${owner} arguments` : owner} must be a JSON object${this.#got(raw, 'object')}`,
            );
        }
        for (const key of Object.keys(raw)) {
            if (!Object.hasOwn(fields, key)) {
                const name: string | null = this.#name(key);
                return this.#reject(
                    name === null
                        ? `${owner} does not take one of the supplied fields`
                        : `${owner} does not take ${name}`,
                );
            }
        }
        for (const [name, field] of Object.entries(fields)) {
            const path: string = prefix + name;
            const value: unknown = Object.hasOwn(raw, name) ? Reflect.get(raw, name) : undefined;
            if (value === undefined || (value === null && field.nullable)) {
                if (required.includes(name)) {
                    return this.#reject(`${owner} requires ${name}`);
                }
                continue;
            }
            const message: string | null =
                field.kind === Kind.Record ? null : this.#field(path, field, value);
            if (message !== null) {
                return this.#reject(message);
            }
            if (field.kind === Kind.Record) {
                const nested: ConnectorHostArgumentRejected | null = this.#object(
                    value,
                    field.fields,
                    field.required,
                    path,
                    path + '.',
                );
                if (nested !== null) {
                    return nested;
                }
            }
        }
        return null;
    }

    static #field(path: string, field: ConnectorHostArgumentField, value: unknown): string | null {
        switch (field.kind) {
            case Kind.Text:
                return this.#text(path, field, value);
            case Kind.Data:
                return typeof value === 'string' && value.length <= field.maxLength
                    ? null
                    : this.#must(
                          path,
                          `a string of at most ${field.maxLength} characters`,
                          value,
                          'string',
                      );
            case Kind.Decimal:
                if (typeof value === 'string' && /^(0|[1-9][0-9]{0,18})$/u.test(value)) {
                    return BigInt(value) <= this.#maximumDecimal
                        ? null
                        : `${path} must be at most "${this.#maximumDecimal}"`;
                }
                return this.#must(path, 'a decimal integer string such as "0"', value, 'string');
            case Kind.SignedDecimal:
                return typeof value === 'string' &&
                    value.length <= field.maxLength &&
                    /^(0|-?[1-9][0-9]*)$/u.test(value)
                    ? null
                    : this.#must(
                          path,
                          `a decimal integer string of at most ${field.maxLength} characters such as "0" or "-1"`,
                          value,
                          'string',
                      );
            case Kind.Integer:
                return typeof value === 'number' &&
                    Number.isSafeInteger(value) &&
                    value >= field.minimum &&
                    value <= field.maximum
                    ? null
                    : this.#must(
                          path,
                          `a JSON integer from ${field.minimum} to ${field.maximum}`,
                          value,
                          'number',
                      );
            case Kind.Boolean:
                return typeof value === 'boolean'
                    ? null
                    : this.#must(path, 'true or false', value, 'boolean');
            case Kind.True:
                return value === true ? null : this.#must(path, 'true', value, 'boolean');
            case Kind.Choice:
                return field.values.some((candidate: string): boolean => candidate === value)
                    ? null
                    : this.#must(path, `one of ${field.values.join(', ')}`, value, 'string');
            case Kind.TextList:
                return this.#list(path, field.item, field.maxItems, field.unique, value);
            case Kind.TextMap:
                return this.#map(path, field.key, field.value, field.maxEntries, value);
            case Kind.Record:
                return null;
        }
    }

    static #text(path: string, field: ConnectorHostTextArgument, value: unknown): string | null {
        if (typeof value !== 'string') {
            return this.#must(
                path,
                `a ${field.minLength === 0 ? '' : 'non-empty '}string`,
                value,
                'string',
            );
        }
        if (value.length < field.minLength) {
            return field.minLength === 1
                ? `${path} must not be empty`
                : `${path} must be at least ${field.minLength} characters`;
        }
        if (value.length > field.maxLength) {
            return `${path} must be at most ${field.maxLength} characters`;
        }
        if (value.includes('\0')) {
            return `${path} must not contain NUL characters`;
        }
        if (
            Array.from(field.excludes).some((character: string): boolean =>
                value.includes(character),
            )
        ) {
            return `${path} must not contain ${Array.from(field.excludes)
                .map((character: string): string => this.#character(character))
                .join(' or ')}`;
        }
        if (field.maxCodePoints !== null) {
            if (!value.isWellFormed()) {
                return `${path} must be well-formed Unicode`;
            }
            if (Array.from(value).length > field.maxCodePoints) {
                return `${path} must be at most ${field.maxCodePoints} characters`;
            }
        }
        if (field.reserved.includes(value)) {
            return `${path} must not be ${field.reserved
                .map((reserved: string): string => JSON.stringify(reserved))
                .join(' or ')}`;
        }
        return null;
    }

    static #list(
        path: string,
        item: ConnectorHostTextArgument,
        maxItems: number,
        unique: boolean,
        value: unknown,
    ): string | null {
        if (!Array.isArray(value)) {
            return this.#must(path, 'an array of strings', value, 'array');
        }
        if (value.length > maxItems) {
            return `${path} must hold at most ${maxItems} items`;
        }
        const seen: Set<string> = new Set();
        for (const [index, entry] of value.entries()) {
            const message: string | null = this.#text(`${path}[${index}]`, item, entry);
            if (message !== null) {
                return message;
            }
            const text: string = String(entry);
            if (unique && seen.has(text)) {
                return `${path}[${index}] repeats an earlier item`;
            }
            seen.add(text);
        }
        return null;
    }

    static #map(
        path: string,
        key: ConnectorHostTextArgument,
        item: ConnectorHostTextArgument,
        maxEntries: number,
        value: unknown,
    ): string | null {
        if (!this.#plain(value)) {
            return this.#must(path, 'a JSON object of string values', value, 'object');
        }
        const entries: readonly [string, unknown][] = Object.entries(value);
        if (entries.length > maxEntries) {
            return `${path} must hold at most ${maxEntries} entries`;
        }
        for (const [name, entry] of entries) {
            const label: string | null = this.#name(name);
            const message: string | null =
                this.#text(`each ${path} name`, key, name) ??
                this.#text(label === null ? `each ${path} value` : `${path}.${label}`, item, entry);
            if (message !== null) {
                return message;
            }
        }
        return null;
    }

    static #modes(
        tool: ConnectorHostTool,
        modes: ConnectorHostArgumentModes,
        values: Readonly<Record<string, unknown>>,
    ): ConnectorHostArgumentRejected | null {
        const set: (name: string) => boolean = (name: string): boolean => {
            const value: unknown = values[name];
            return (
                value !== undefined &&
                value !== null &&
                !(Array.isArray(value) && value.length === 0)
            );
        };
        const selected: readonly ConnectorHostArgumentAlternative[] = modes.alternatives.filter(
            (alternative: ConnectorHostArgumentAlternative): boolean =>
                alternative.fields.some(set),
        );
        const phrases: string = modes.alternatives
            .map((alternative: ConnectorHostArgumentAlternative): string =>
                this.#phrase(alternative),
            )
            .join(' or ');
        if (selected.length > 1) {
            return this.#reject(`${tool} takes ${phrases}, not both`);
        }
        const alternative: ConnectorHostArgumentAlternative | undefined = selected.at(0);
        if (alternative === undefined) {
            return modes.required ? this.#reject(`${tool} needs ${phrases}`) : null;
        }
        const missing: readonly string[] = alternative.required.filter(
            (name: string): boolean => !set(name),
        );
        return missing.length === 0
            ? null
            : this.#reject(
                  `${tool} requires ${missing.join(' and ')} with ${alternative.fields.filter(set).join(' and ')}`,
              );
    }

    static #rules(
        rules: readonly ConnectorHostArgumentRule[],
        values: Readonly<Record<string, unknown>>,
        bounds: ConnectorHostArgumentBounds,
    ): ConnectorHostArgumentRejected | null {
        for (const rule of rules) {
            const rejection: ConnectorHostArgumentRejected | null =
                rule === ConnectorHostArgumentRule.Bytes
                    ? this.#bytes(values, bounds)
                    : rule === ConnectorHostArgumentRule.KeyChord
                      ? this.#key(values)
                      : this.#writeOffset(values);
            if (rejection !== null) {
                return rejection;
            }
        }
        return null;
    }

    static #bytes(
        values: Readonly<Record<string, unknown>>,
        bounds: ConnectorHostArgumentBounds,
    ): ConnectorHostArgumentRejected | null {
        const data: string = String(values['data']);
        if (values['encoding'] === ConnectorHostByteEncoding.Utf8) {
            return this.#encoder.encode(data).byteLength <= bounds.chunkBytes
                ? null
                : this.#reject(
                      `data must be at most ${bounds.chunkBytes} UTF-8 bytes${this.#chunks}`,
                  );
        }
        if (!this.#base64.test(data)) {
            return this.#reject('data must be canonical padded base64 when encoding is base64');
        }
        const padding: number = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
        return (data.length / 4) * 3 - padding <= bounds.chunkBytes
            ? null
            : this.#reject(`data must decode to at most ${bounds.chunkBytes} bytes${this.#chunks}`);
    }

    static #key(values: Readonly<Record<string, unknown>>): ConnectorHostArgumentRejected | null {
        const key: unknown = values['key'];
        const action: unknown = values['action'];
        if (ConnectorHostKeyChord.accepts(key, action)) {
            return null;
        }
        if (
            typeof key === 'string' &&
            key.includes('+') &&
            action !== ConnectorHostKeyAction.Press &&
            ConnectorHostKeyChord.accepts(key, ConnectorHostKeyAction.Press)
        ) {
            return this.#reject(
                'a key chord needs action press; down and up hold or release one key',
            );
        }
        return this.#reject(
            `key must be a letter, a digit, F1 to F12 or one of ${[...ConnectorHostKeyChord.named, ...ConnectorHostKeyChord.modifiers].join(', ')}; for action press, distinct ${ConnectorHostKeyChord.modifiers.join(', ')} modifiers may precede it joined by +, such as Control+l`,
        );
    }

    static #writeOffset(
        values: Readonly<Record<string, unknown>>,
    ): ConnectorHostArgumentRejected | null {
        const offset: unknown = values['offset'];
        return offset === undefined ||
            offset === '0' ||
            values['mode'] === ConnectorHostWriteMode.Update
            ? null
            : this.#reject('an offset other than "0" needs mode update');
    }

    static #phrase(alternative: ConnectorHostArgumentAlternative): string {
        const optional: readonly string[] = alternative.fields.filter(
            (name: string): boolean => !alternative.required.includes(name),
        );
        return (
            alternative.required.join(' with ') +
            (optional.length === 0 ? '' : ` with optional ${optional.join(' and ')}`)
        );
    }

    /** A refused character as a reader sees it: line breaks by name, anything else quoted as itself. */
    static #character(character: string): string {
        switch (character) {
            case '\r':
                return 'carriage returns';
            case '\n':
                return 'line feeds';
            default:
                return `"${character}"`;
        }
    }

    /** Only plain JSON objects are argument records; inherited fields are never read. */
    static #plain(value: unknown): value is object {
        return (
            typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.getPrototypeOf(value) === Object.prototype
        );
    }

    /** A supplied field name is shown only when it is a short plain identifier. */
    static #name(name: string): string | null {
        return /^[A-Za-z_][A-Za-z0-9_]{0,63}$/u.test(name) ? name : null;
    }

    /** `path must be requirement`, naming the supplied JSON type when it differs from the expected one. */
    static #must(path: string, requirement: string, value: unknown, expected: string): string {
        return `${path} must be ${requirement}${this.#got(value, expected)}`;
    }

    /** Name the JSON type that was supplied when it differs from the expected one. */
    static #got(value: unknown, expected: string): string {
        const actual: string =
            value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
        return actual === expected ? '' : `, not ${this.#types[actual] ?? 'an object'}`;
    }

    static #reject(message: string): ConnectorHostArgumentRejected {
        return { valid: false, message };
    }
}

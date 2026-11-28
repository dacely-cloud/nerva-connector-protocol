// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorHostArguments } from './ConnectorHostArguments.js';
import { ConnectorHostByteEncoding, ConnectorHostKeyAction, ConnectorHostWriteMode, } from './ConnectorHostArgumentChoices.js';
import { ConnectorHostArgumentContracts, ConnectorHostArgumentRule, } from './ConnectorHostArgumentContract.js';
import { ConnectorHostArgumentKind as Kind, } from './ConnectorHostArgumentField.js';
import { ConnectorHostKeyChord } from './ConnectorHostKeyChord.js';
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
    static #maximumDecimal = 9223372036854775807n;
    static #base64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
    /**
     * UTF-8 sizes come from the native encoder, which writes an unpaired surrogate as three bytes exactly as the
     * connector's own encoder does; it measured five to ten times faster than counting code units in script.
     */
    static #encoder = new TextEncoder();
    static #alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    /** Check one argument object for a tool under the given transport bounds. */
    static check(tool, raw, bounds) {
        const contract = ConnectorHostArgumentContracts.of(tool, bounds);
        const shape = this.#object(raw, contract.fields, contract.required, tool, '');
        if (shape !== null) {
            return shape;
        }
        const values = this.#plain(raw)
            ? Object.fromEntries(Object.entries(raw))
            : {};
        const rejection = (contract.modes === null ? null : this.#modes(tool, contract.modes, values)) ??
            this.#rules(contract.rules, values, bounds);
        return rejection ?? { valid: true, arguments: new ConnectorHostArguments(values) };
    }
    static #object(raw, fields, required, owner, prefix) {
        if (!this.#plain(raw)) {
            return this.#reject(prefix === '' ? null : owner, `${prefix === '' ? `${owner} arguments` : owner} must be a JSON object${this.#got(raw, 'object')}`);
        }
        for (const key of Object.keys(raw)) {
            if (!Object.hasOwn(fields, key)) {
                const name = this.#name(key);
                return this.#reject(name === null ? null : prefix + name, name === null
                    ? `${owner} does not take one of the supplied fields`
                    : `${owner} does not take ${name}`);
            }
        }
        for (const [name, field] of Object.entries(fields)) {
            const path = prefix + name;
            const value = Object.hasOwn(raw, name) ? Reflect.get(raw, name) : undefined;
            if (value === undefined || (value === null && field.nullable)) {
                if (required.includes(name)) {
                    return this.#reject(path, `${owner} requires ${name}`);
                }
                continue;
            }
            const message = field.kind === Kind.Record ? null : this.#field(path, field, value);
            if (message !== null) {
                return this.#reject(path, message);
            }
            if (field.kind === Kind.Record) {
                const nested = this.#object(value, field.fields, field.required, path, path + '.');
                if (nested !== null) {
                    return nested;
                }
            }
        }
        return null;
    }
    static #field(path, field, value) {
        switch (field.kind) {
            case Kind.Text:
                return this.#text(path, field, value);
            case Kind.Data:
                return typeof value === 'string' && value.length <= field.maxLength
                    ? null
                    : `${path} must be a string of at most ${field.maxLength} characters${this.#got(value, 'string')}`;
            case Kind.Decimal:
                if (typeof value === 'string' && /^(0|[1-9][0-9]{0,18})$/u.test(value)) {
                    return BigInt(value) <= this.#maximumDecimal
                        ? null
                        : `${path} must be at most "${this.#maximumDecimal}"`;
                }
                return `${path} must be a decimal integer string such as "0"${this.#got(value, 'string')}`;
            case Kind.SignedDecimal:
                return typeof value === 'string' &&
                    value.length <= field.maxLength &&
                    /^(0|-?[1-9][0-9]*)$/u.test(value)
                    ? null
                    : `${path} must be a decimal integer string of at most ${field.maxLength} characters such as "0" or "-1"${this.#got(value, 'string')}`;
            case Kind.Integer:
                return typeof value === 'number' &&
                    Number.isSafeInteger(value) &&
                    value >= field.minimum &&
                    value <= field.maximum
                    ? null
                    : `${path} must be a JSON integer from ${field.minimum} to ${field.maximum}${this.#got(value, 'number')}`;
            case Kind.Boolean:
                return typeof value === 'boolean'
                    ? null
                    : `${path} must be true or false${this.#got(value, 'boolean')}`;
            case Kind.True:
                return value === true ? null : `${path} must be true${this.#got(value, 'boolean')}`;
            case Kind.Choice:
                return field.values.some((candidate) => candidate === value)
                    ? null
                    : `${path} must be one of ${field.values.join(', ')}${this.#got(value, 'string')}`;
            case Kind.TextList:
                return this.#list(path, field.item, field.maxItems, field.unique, value);
            case Kind.TextMap:
                return this.#map(path, field.key, field.value, field.maxEntries, value);
            case Kind.Record:
                return null;
        }
    }
    static #text(path, field, value) {
        if (typeof value !== 'string') {
            return `${path} must be a ${field.minLength === 0 ? '' : 'non-empty '}string${this.#got(value, 'string')}`;
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
        if (Array.from(field.excludes).some((character) => value.includes(character))) {
            return `${path} must not contain ${Array.from(field.excludes)
                .map((character) => this.#character(character))
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
                .map((reserved) => JSON.stringify(reserved))
                .join(' or ')}`;
        }
        return null;
    }
    static #list(path, item, maxItems, unique, value) {
        if (!Array.isArray(value)) {
            return `${path} must be an array of strings${this.#got(value, 'array')}`;
        }
        if (value.length > maxItems) {
            return `${path} must hold at most ${maxItems} items`;
        }
        const seen = new Set();
        for (const [index, entry] of value.entries()) {
            const message = this.#text(`${path}[${index}]`, item, entry);
            if (message !== null) {
                return message;
            }
            const text = String(entry);
            if (unique && seen.has(text)) {
                return `${path}[${index}] repeats an earlier item`;
            }
            seen.add(text);
        }
        return null;
    }
    static #map(path, key, item, maxEntries, value) {
        if (!this.#plain(value)) {
            return `${path} must be a JSON object of string values${this.#got(value, 'object')}`;
        }
        const entries = Object.entries(value);
        if (entries.length > maxEntries) {
            return `${path} must hold at most ${maxEntries} entries`;
        }
        for (const [name, entry] of entries) {
            const label = this.#name(name);
            const message = this.#text(`each ${path} name`, key, name) ??
                this.#text(label === null ? `each ${path} value` : `${path}.${label}`, item, entry);
            if (message !== null) {
                return message;
            }
        }
        return null;
    }
    static #modes(tool, modes, values) {
        const set = (name) => {
            const value = values[name];
            return (value !== undefined &&
                value !== null &&
                !(Array.isArray(value) && value.length === 0));
        };
        const selected = modes.alternatives.filter((alternative) => alternative.fields.some(set));
        const phrases = modes.alternatives
            .map((alternative) => this.#phrase(alternative))
            .join(' or ');
        if (selected.length > 1) {
            return this.#reject(null, `${tool} takes ${phrases}, not both`);
        }
        const alternative = selected.at(0);
        if (alternative === undefined) {
            return modes.required ? this.#reject(null, `${tool} needs ${phrases}`) : null;
        }
        const missing = alternative.required.filter((name) => !set(name));
        return missing.length === 0
            ? null
            : this.#reject(missing[0] ?? null, `${tool} requires ${missing.join(' and ')} with ${alternative.fields.filter(set).join(' and ')}`);
    }
    static #rules(rules, values, bounds) {
        for (const rule of rules) {
            const rejection = rule === ConnectorHostArgumentRule.Bytes
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
    static #bytes(values, bounds) {
        const data = String(values['data']);
        if (values['encoding'] === ConnectorHostByteEncoding.Utf8) {
            return this.#encoder.encode(data).byteLength <= bounds.chunkBytes
                ? null
                : this.#reject('data', `data must be at most ${bounds.chunkBytes} UTF-8 bytes; send larger content in several chunks`);
        }
        if (!this.#canonicalBase64(data)) {
            return this.#reject('data', 'data must be canonical padded base64 when encoding is base64');
        }
        const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
        return (data.length / 4) * 3 - padding <= bounds.chunkBytes
            ? null
            : this.#reject('data', `data must decode to at most ${bounds.chunkBytes} bytes; send larger content in several chunks`);
    }
    static #key(values) {
        const key = values['key'];
        const action = values['action'];
        if (ConnectorHostKeyChord.accepts(key, action)) {
            return null;
        }
        if (typeof key === 'string' &&
            key.includes('+') &&
            action !== ConnectorHostKeyAction.Press &&
            ConnectorHostKeyChord.accepts(key, ConnectorHostKeyAction.Press)) {
            return this.#reject('action', 'a key chord needs action press; down and up hold or release one key');
        }
        return this.#reject('key', `key must be one key: a letter or digit, F1 to F12, ${[...ConnectorHostKeyChord.named, ...ConnectorHostKeyChord.modifiers].join(', ')}; with action press it may be distinct ${ConnectorHostKeyChord.modifiers.join(', ')} modifiers joined by + before one other key, such as Control+l`);
    }
    static #writeOffset(values) {
        const offset = values['offset'];
        return offset === undefined ||
            offset === '0' ||
            values['mode'] === ConnectorHostWriteMode.Update
            ? null
            : this.#reject('offset', 'an offset other than "0" needs mode update');
    }
    static #phrase(alternative) {
        const optional = alternative.fields.filter((name) => !alternative.required.includes(name));
        return (alternative.required.join(' with ') +
            (optional.length === 0 ? '' : ` with optional ${optional.join(' and ')}`));
    }
    static #canonicalBase64(data) {
        if (!this.#base64.test(data)) {
            return false;
        }
        if (data.endsWith('==')) {
            return (this.#alphabet.indexOf(data.charAt(data.length - 3)) & 0x0f) === 0;
        }
        if (data.endsWith('=')) {
            return (this.#alphabet.indexOf(data.charAt(data.length - 2)) & 0x03) === 0;
        }
        return true;
    }
    /** A refused character as a reader sees it: line breaks by name, anything else quoted as itself. */
    static #character(character) {
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
    static #plain(value) {
        return (typeof value === 'object' &&
            value !== null &&
            !Array.isArray(value) &&
            Object.getPrototypeOf(value) === Object.prototype);
    }
    /** A supplied field name is shown only when it is a short plain identifier. */
    static #name(name) {
        return /^[A-Za-z_][A-Za-z0-9_]{0,63}$/u.test(name) ? name : null;
    }
    /** Name the JSON type that was supplied when it differs from the expected one. */
    static #got(value, expected) {
        const actual = value === null
            ? 'null'
            : Array.isArray(value)
                ? 'array'
                : typeof value === 'number'
                    ? 'number'
                    : typeof value;
        if (actual === expected) {
            return '';
        }
        switch (actual) {
            case 'null':
                return ', not null';
            case 'array':
                return ', not an array';
            case 'number':
                return ', not a JSON number';
            case 'string':
                return ', not a string';
            case 'boolean':
                return ', not true or false';
            default:
                return ', not an object';
        }
    }
    static #reject(field, message) {
        return { valid: false, field, message };
    }
}

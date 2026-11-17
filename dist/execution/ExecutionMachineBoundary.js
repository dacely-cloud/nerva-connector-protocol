// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Closed finite data readers reject accessors and hidden fields before policy or input values are used. */
export class ExecutionMachineBoundary {
    static #encoder = new TextEncoder();
    /**
     * Canonical launch envelopes include every nested UTF-8 byte in their unchanged argument ceiling.
     *
     * @remarks
     * The count uses TextEncoder, so it is the same in Node and in a browser bundle.
     */
    static bytes(value) {
        return ExecutionMachineBoundary.#encoder.encode(value).byteLength;
    }
    /** All declared fields must be own enumerable data; missing, extra or inherited authority is rejected. */
    static record(raw, fields) {
        if (typeof raw !== 'object' ||
            raw === null ||
            Object.getPrototypeOf(raw) !== Object.prototype) {
            throw new Error('Invalid Machine invocation record');
        }
        const keys = Reflect.ownKeys(raw);
        if (keys.length !== fields.length ||
            keys.some((key) => typeof key !== 'string' || !fields.includes(key))) {
            throw new Error('Invalid Machine invocation fields');
        }
        const result = {};
        for (const key of fields) {
            const descriptor = Object.getOwnPropertyDescriptor(raw, key);
            if (descriptor === undefined ||
                descriptor.enumerable !== true ||
                !Object.hasOwn(descriptor, 'value')) {
                throw new Error('Machine invocation accessors are forbidden');
            }
            const value = descriptor.value;
            Object.defineProperty(result, key, { value, enumerable: true });
        }
        return result;
    }
    /** Only dense bounded arrays with no additional own fields are copied. */
    static array(raw, maximum) {
        if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype) {
            throw new Error('Invalid Machine invocation collection');
        }
        const descriptor = Object.getOwnPropertyDescriptor(raw, 'length');
        if (descriptor === undefined ||
            descriptor.enumerable !== false ||
            descriptor.configurable !== false ||
            !Object.hasOwn(descriptor, 'value')) {
            throw new Error('Invalid Machine invocation collection length');
        }
        const value = descriptor.value;
        const length = this.count(value, 0, maximum);
        if (Reflect.ownKeys(raw).length !== length + 1) {
            throw new Error('Invalid Machine invocation collection fields');
        }
        const result = [];
        for (let index = 0; index < length; index++) {
            const entry = Object.getOwnPropertyDescriptor(raw, index);
            if (entry === undefined ||
                entry.enumerable !== true ||
                !Object.hasOwn(entry, 'value')) {
                throw new Error('Invalid Machine invocation collection entry');
            }
            const item = entry.value;
            result.push(item);
        }
        return result;
    }
    /** Small controlled byte ceilings, indexes and durations never accept fractions or lossy integers. */
    static count(raw, minimum, maximum) {
        if (typeof raw !== 'number' ||
            !Number.isSafeInteger(raw) ||
            raw < minimum ||
            raw > maximum) {
            throw new Error('Invalid Machine invocation bound');
        }
        return raw;
    }
    /** Finite UTF-8 input data can contain NUL because it is delivered through an owned descriptor. */
    static data(raw, maximum) {
        if (typeof raw !== 'string' || !raw.isWellFormed() || ExecutionMachineBoundary.bytes(raw) > maximum) {
            throw new Error('Invalid Machine invocation UTF-8 data');
        }
        return raw;
    }
    /** Values consumed by execve or path APIs cannot contain embedded C-string terminators. */
    static text(raw, maximum) {
        const value = this.data(raw, maximum);
        if (value.includes('\0')) {
            throw new Error('Machine invocation text cannot contain NUL');
        }
        return value;
    }
    /** The platform's native bootstrap namespace cannot be granted as application environment input. */
    static name(raw) {
        if (typeof raw !== 'string' ||
            !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/u.test(raw) ||
            raw.startsWith('NERVA_')) {
            throw new Error('Invalid Machine invocation environment name');
        }
        return raw;
    }
    /** The native owner must still resolve this canonical relative path beneath its opened root. */
    static cwd(raw, maximum) {
        const value = this.text(raw, maximum);
        if (value === '.') {
            return value;
        }
        if (value.length === 0 ||
            value.includes('\\') ||
            value.includes(':') ||
            /[\p{Cc}]/u.test(value) ||
            value
                .split('/')
                .some((part) => part === '' || part === '.' || part === '..')) {
            throw new Error('Machine invocation cwd must stay beneath its captured root');
        }
        return value;
    }
}

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Primitive validation at JSON/storage boundaries; never accepts inherited request fields. */
export class Boundary {
    /** Only plain serialized records are supported at service boundaries. */
    static record(value, fields) {
        if (typeof value !== 'object' ||
            value === null ||
            Array.isArray(value) ||
            Object.getPrototypeOf(value) !== Object.prototype ||
            Object.keys(value).some((key) => !fields.includes(key))) {
            throw new Error('Invalid record');
        }
        return value;
    }
    /** Bounded opaque identifiers cannot become paths, commands, or arbitrary endpoints. */
    static id(value) {
        if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/u.test(value)) {
            throw new Error('Invalid identifier');
        }
        return value;
    }
    /** Bounded display text remains data, never executable configuration. */
    static text(value) {
        if (typeof value !== 'string' ||
            value.length === 0 ||
            value.length > 256 ||
            !value.isWellFormed() ||
            value.split('').some((character) => character.charCodeAt(0) < 32)) {
            throw new Error('Invalid text');
        }
        return value;
    }
    /** Small controlled counters use numbers; external quantities use exact integers. */
    static count(value, maximum) {
        if (typeof value !== 'number' ||
            !Number.isSafeInteger(value) ||
            value < 0 ||
            value > maximum) {
            throw new Error('Invalid count');
        }
        return value;
    }
    /** Nonnegative signed-64-bit values are exact in JSON and BSON. */
    static integer(value) {
        if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,18})$/u.test(value)) {
            throw new Error('Invalid exact integer');
        }
        const result = BigInt(value);
        if (result > 9223372036854775807n) {
            throw new Error('Exact integer exceeds storage range');
        }
        return result;
    }
    /** Missing booleans do not silently enable a capability. */
    static boolean(value) {
        if (typeof value !== 'boolean') {
            throw new Error('Invalid boolean');
        }
        return value;
    }
    /** Collections have an explicit allocation bound before element validation. */
    static array(value, maximum) {
        if (!Array.isArray(value) || value.length > maximum) {
            throw new Error('Invalid collection');
        }
        return value;
    }
    /** Feature/identity collections reject duplicates instead of creating ambiguous ownership. */
    static ids(value, maximum) {
        const ids = Boundary.array(value, maximum).map((item) => Boundary.id(item));
        if (new Set(ids).size !== ids.length) {
            throw new Error('Duplicate identifiers');
        }
        return ids;
    }
}

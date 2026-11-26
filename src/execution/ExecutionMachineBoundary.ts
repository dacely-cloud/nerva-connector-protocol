// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Closed finite data readers reject accessors and hidden fields before policy or input values are used. */
export class ExecutionMachineBoundary {
    static readonly #encoder: TextEncoder = new TextEncoder();

    /**
     * Canonical launch envelopes include every nested UTF-8 byte in their unchanged argument ceiling.
     *
     * @remarks
     * The count uses TextEncoder, so it is the same in Node and in a browser bundle.
     */
    public static bytes(value: string): number {
        return ExecutionMachineBoundary.#encoder.encode(value).byteLength;
    }

    /** All declared fields must be own enumerable data; missing, extra or inherited authority is rejected. */
    public static record(
        raw: unknown,
        fields: readonly string[],
    ): Readonly<Record<string, unknown>> {
        if (
            typeof raw !== 'object' ||
            raw === null ||
            Object.getPrototypeOf(raw) !== Object.prototype
        ) {
            throw new Error('Invalid Machine invocation record');
        }
        const keys: readonly PropertyKey[] = Reflect.ownKeys(raw);
        if (
            keys.length !== fields.length ||
            keys.some(
                (key: PropertyKey): boolean => typeof key !== 'string' || !fields.includes(key),
            )
        ) {
            throw new Error('Invalid Machine invocation fields');
        }
        const result: Record<string, unknown> = {};
        for (const key of fields) {
            const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                raw,
                key,
            );
            if (
                descriptor === undefined ||
                descriptor.enumerable !== true ||
                !Object.hasOwn(descriptor, 'value')
            ) {
                throw new Error('Machine invocation accessors are forbidden');
            }
            const value: unknown = descriptor.value;
            Object.defineProperty(result, key, { value, enumerable: true });
        }
        return result;
    }

    /** Only dense bounded arrays with no additional own fields are copied. */
    public static array(raw: unknown, maximum: number): readonly unknown[] {
        if (!Array.isArray(raw) || Object.getPrototypeOf(raw) !== Array.prototype) {
            throw new Error('Invalid Machine invocation collection');
        }
        const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
            raw,
            'length',
        );
        if (
            descriptor === undefined ||
            descriptor.enumerable !== false ||
            descriptor.configurable !== false ||
            !Object.hasOwn(descriptor, 'value')
        ) {
            throw new Error('Invalid Machine invocation collection length');
        }
        const value: unknown = descriptor.value;
        const length: number = this.count(value, 0, maximum);
        if (Reflect.ownKeys(raw).length !== length + 1) {
            throw new Error('Invalid Machine invocation collection fields');
        }
        const result: unknown[] = [];
        for (let index: number = 0; index < length; index++) {
            const entry: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
                raw,
                index,
            );
            if (
                entry === undefined ||
                entry.enumerable !== true ||
                !Object.hasOwn(entry, 'value')
            ) {
                throw new Error('Invalid Machine invocation collection entry');
            }
            const item: unknown = entry.value;
            result.push(item);
        }
        return result;
    }

    /** Small controlled byte ceilings, indexes and durations never accept fractions or lossy integers. */
    public static count(raw: unknown, minimum: number, maximum: number): number {
        if (
            typeof raw !== 'number' ||
            !Number.isSafeInteger(raw) ||
            raw < minimum ||
            raw > maximum
        ) {
            throw new Error('Invalid Machine invocation bound');
        }
        return raw;
    }

    /** Finite UTF-8 input data can contain NUL because it is delivered through an owned descriptor. */
    public static data(raw: unknown, maximum: number): string {
        if (typeof raw !== 'string' || !raw.isWellFormed() || ExecutionMachineBoundary.bytes(raw) > maximum) {
            throw new Error('Invalid Machine invocation UTF-8 data');
        }
        return raw;
    }

    /** Values consumed by execve or path APIs cannot contain embedded C-string terminators. */
    public static text(raw: unknown, maximum: number): string {
        const value: string = this.data(raw, maximum);
        if (value.includes('\0')) {
            throw new Error('Machine invocation text cannot contain NUL');
        }
        return value;
    }

    /** The platform's native bootstrap namespace cannot be granted as application environment input. */
    public static name(raw: unknown): string {
        if (
            typeof raw !== 'string' ||
            !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/u.test(raw) ||
            raw.startsWith('NERVA_')
        ) {
            throw new Error('Invalid Machine invocation environment name');
        }
        return raw;
    }

    /** The native owner must still resolve this canonical relative path beneath its opened root. */
    public static cwd(raw: unknown, maximum: number): string {
        const value: string = this.text(raw, maximum);
        if (value === '.') {
            return value;
        }
        if (
            value.length === 0 ||
            value.includes('\\') ||
            value.includes(':') ||
            /[\p{Cc}]/u.test(value) ||
            value
                .split('/')
                .some((part: string): boolean => part === '' || part === '.' || part === '..')
        ) {
            throw new Error('Machine invocation cwd must stay beneath its captured root');
        }
        return value;
    }
}

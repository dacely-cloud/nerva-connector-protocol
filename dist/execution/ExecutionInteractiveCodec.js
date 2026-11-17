// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits, } from './ExecutionInteractive.js';
/** Ready proves a confined native incarnation; it never acknowledges initial application input. */
export class ExecutionInteractiveCodec {
    static #fields = [
        ...Fields.originalFields,
        'initialInputSequence',
        'initialInputBytes',
        'initialInputHash',
        'dimensions',
        'executionDeadlineMs',
    ];
    static read(raw) {
        const value = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }
    /** The bounded raw decoder runs before parsing or composite verification. */
    static decode(json) {
        return this.read(Fields.decode(json, Limits.readyJsonBytes));
    }
    static encode(value) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        const ready = Object.freeze({
            ...this.#body(record, Encoding.Internal),
            signature: Fields.signature(record['signature']),
        });
        return Fields.encode(ready, Limits.readyJsonBytes);
    }
    /** Signers supply an explicit unsigned body; it is not a verification substitute for read(). */
    static body(value) {
        return this.#body(Fields.record(value, this.#fields), Encoding.Internal);
    }
    /** A verified signed proof can expose its exact immutable signing body without its randomized signature. */
    static unsigned(value) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, Encoding.Internal);
    }
    static #body(value, encoding) {
        const original = Fields.original(value, encoding);
        const initialSequence = Fields.counter(value['initialInputSequence'], encoding, 0n, 0n);
        if (initialSequence !== 0n) {
            throw new Error('Initial input must reserve record zero');
        }
        return Object.freeze({
            ...original,
            initialInputSequence: initialSequence,
            initialInputBytes: Fields.counter(value['initialInputBytes'], encoding, 0n, BigInt(Limits.initialBytes)),
            initialInputHash: Fields.digest(value['initialInputHash']),
            dimensions: Fields.dimensions(value['dimensions'], original.transport),
            executionDeadlineMs: Fields.counter(value['executionDeadlineMs'], encoding, 1n),
        });
    }
}

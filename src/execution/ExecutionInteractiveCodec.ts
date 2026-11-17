// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import {
    ExecutionInteractiveLimits as Limits,
    type ExecutionInteractiveReady,
    type ExecutionInteractiveReadyBody,
} from './ExecutionInteractive.js';

/** Ready proves a confined native incarnation; it never acknowledges initial application input. */
export class ExecutionInteractiveCodec {
    static readonly #fields: readonly string[] = [
        ...Fields.originalFields,
        'initialInputSequence',
        'initialInputBytes',
        'initialInputHash',
        'dimensions',
        'executionDeadlineMs',
    ];

    public static read(raw: unknown): ExecutionInteractiveReady {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }

    /** The bounded raw decoder runs before parsing or composite verification. */
    public static decode(json: string): ExecutionInteractiveReady {
        return this.read(Fields.decode(json, Limits.readyJsonBytes));
    }

    public static encode(value: ExecutionInteractiveReady): string {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        const ready: ExecutionInteractiveReady = Object.freeze({
            ...this.#body(record, Encoding.Internal),
            signature: Fields.signature(record['signature']),
        });
        return Fields.encode(ready, Limits.readyJsonBytes);
    }

    /** Signers supply an explicit unsigned body; it is not a verification substitute for read(). */
    public static body(value: ExecutionInteractiveReadyBody): ExecutionInteractiveReadyBody {
        return this.#body(Fields.record(value, this.#fields), Encoding.Internal);
    }

    /** A verified signed proof can expose its exact immutable signing body without its randomized signature. */
    public static unsigned(value: ExecutionInteractiveReady): ExecutionInteractiveReadyBody {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, Encoding.Internal);
    }

    static #body(
        value: Readonly<Record<string, unknown>>,
        encoding: Encoding,
    ): ExecutionInteractiveReadyBody {
        const original: ReturnType<typeof Fields.original> = Fields.original(value, encoding);
        const initialSequence: bigint = Fields.counter(
            value['initialInputSequence'],
            encoding,
            0n,
            0n,
        );
        if (initialSequence !== 0n) {
            throw new Error('Initial input must reserve record zero');
        }
        return Object.freeze({
            ...original,
            initialInputSequence: initialSequence,
            initialInputBytes: Fields.counter(
                value['initialInputBytes'],
                encoding,
                0n,
                BigInt(Limits.initialBytes),
            ),
            initialInputHash: Fields.digest(value['initialInputHash']),
            dimensions: Fields.dimensions(value['dimensions'], original.transport),
            executionDeadlineMs: Fields.counter(value['executionDeadlineMs'], encoding, 1n),
        });
    }
}

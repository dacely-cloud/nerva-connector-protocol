// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import {
    ExecutionInteractiveLimits as Limits,
    ExecutionInteractiveTransport,
} from './ExecutionInteractive.js';
import type { ExecutionInputCursor } from './ExecutionInput.js';

/** No missing cursor can become a fresh input sequence or an implicitly accepted empty range. */
export class ExecutionInputCursorCodec {
    static readonly #fields: readonly string[] = [
        'processedSequence',
        'processedInputHash',
        'initialAccepted',
        'blocked',
        'acceptedOffset',
        'ended',
        'dimensions',
        'resizeCount',
    ];

    public static capture(
        raw: unknown,
        transport: ExecutionInteractiveTransport,
        encoding: Encoding,
    ): ExecutionInputCursor {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, this.#fields);
        const processedSequence: bigint | null =
            value['processedSequence'] === null
                ? null
                : Fields.counter(
                      value['processedSequence'],
                      encoding,
                      0n,
                      Limits.maximumInputSequence,
                  );
        const processedInputHash: string | null =
            value['processedInputHash'] === null
                ? null
                : Fields.digest(value['processedInputHash']);
        const initialAccepted: boolean = Fields.boolean(value['initialAccepted']);
        const acceptedOffset: bigint = Fields.counter(
            value['acceptedOffset'],
            encoding,
            0n,
            Limits.inputBytes,
        );
        const ended: boolean = Fields.boolean(value['ended']);
        const resizeCount: bigint = Fields.counter(
            value['resizeCount'],
            encoding,
            0n,
            Limits.resizes,
        );
        if (
            (processedSequence === null) !== (processedInputHash === null) ||
            (processedSequence === null && (initialAccepted || ended || resizeCount !== 0n)) ||
            (processedSequence !== null && resizeCount > processedSequence) ||
            (processedSequence === 0n && (ended || resizeCount !== 0n)) ||
            (!initialAccepted &&
                ((processedSequence !== null && processedSequence !== 0n) ||
                    ended ||
                    resizeCount !== 0n)) ||
            ((processedSequence === null || processedSequence === 0n) &&
                acceptedOffset > BigInt(Limits.initialBytes)) ||
            (transport === ExecutionInteractiveTransport.Pipe && resizeCount !== 0n) ||
            (transport === ExecutionInteractiveTransport.Pty && ended)
        ) {
            throw new Error('Inconsistent interactive cursor');
        }
        return Object.freeze({
            processedSequence,
            processedInputHash,
            initialAccepted,
            blocked: Fields.boolean(value['blocked']),
            acceptedOffset,
            ended,
            dimensions: Fields.dimensions(value['dimensions'], transport),
            resizeCount,
        });
    }
}

// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits, ExecutionInteractiveTransport, } from './ExecutionInteractive.js';
/** No missing cursor can become a fresh input sequence or an implicitly accepted empty range. */
export class ExecutionInputCursorCodec {
    static #fields = [
        'processedSequence',
        'processedInputHash',
        'initialAccepted',
        'blocked',
        'acceptedOffset',
        'ended',
        'dimensions',
        'resizeCount',
    ];
    static capture(raw, transport, encoding) {
        const value = Fields.record(raw, this.#fields);
        const processedSequence = value['processedSequence'] === null
            ? null
            : Fields.counter(value['processedSequence'], encoding, 0n, Limits.maximumInputSequence);
        const processedInputHash = value['processedInputHash'] === null
            ? null
            : Fields.digest(value['processedInputHash']);
        const initialAccepted = Fields.boolean(value['initialAccepted']);
        const acceptedOffset = Fields.counter(value['acceptedOffset'], encoding, 0n, Limits.inputBytes);
        const ended = Fields.boolean(value['ended']);
        const resizeCount = Fields.counter(value['resizeCount'], encoding, 0n, Limits.resizes);
        if ((processedSequence === null) !== (processedInputHash === null) ||
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
            (transport === ExecutionInteractiveTransport.Pty && ended)) {
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

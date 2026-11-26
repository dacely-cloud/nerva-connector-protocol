// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ExecutionInputKind, ExecutionInputDisposition, } from './ExecutionInput.js';
/** Pure correlation is distinct from signature verification and shared admission/ownership fences. */
export class ExecutionInputCorrelation {
    static #owned = new WeakSet();
    /** Only this validator's exact deep-frozen returned captures can bypass repeated context parsing; raw and cloned records always validate. */
    static context(value) {
        if (this.#owned.has(value)) {
            return value;
        }
        const record = Fields.record(value, [
            'input',
            'inputHash',
            'prior',
        ]);
        const input = ExecutionInputControlCodec.capture(record['input'], Encoding.Internal);
        const prior = ExecutionInputCursorCodec.capture(record['prior'], input.transport, Encoding.Internal);
        if (prior.blocked ||
            prior.ended ||
            (input.inputSequence === 0n
                ? prior.processedSequence !== null ||
                    prior.processedInputHash !== null ||
                    prior.initialAccepted ||
                    prior.acceptedOffset !== 0n
                : !prior.initialAccepted ||
                    prior.processedSequence !== input.inputSequence - 1n ||
                    prior.processedInputHash !== input.previousInputHash) ||
            ((input.control.kind === ExecutionInputKind.Data ||
                input.control.kind === ExecutionInputKind.End) &&
                input.control.offset !== prior.acceptedOffset) ||
            (input.control.kind === ExecutionInputKind.Resize &&
                prior.resizeCount >= Limits.resizes)) {
            throw new Error('Input does not follow its captured prior cursor');
        }
        const context = Object.freeze({
            input,
            inputHash: Fields.digest(record['inputHash']),
            prior,
        });
        this.#owned.add(context);
        return context;
    }
    /** Rejection consumes an actual processed control or blocks; uncertainty never invents native processing. */
    static match(value, context) {
        if (!Object.values(ExecutionInputDisposition).includes(value.disposition)) {
            throw new Error('Explicit input disposition required');
        }
        const { input, inputHash, prior } = this.context(context);
        if (!ExecutionInputIdentityCodec.matches(value, input, inputHash)) {
            throw new Error('Input receipt original changed');
        }
        const cursor = value.cursor;
        const current = cursor.processedSequence === input.inputSequence &&
            cursor.processedInputHash === inputHash;
        const previous = cursor.processedSequence === prior.processedSequence &&
            cursor.processedInputHash === prior.processedInputHash;
        const sameState = cursor.acceptedOffset === prior.acceptedOffset &&
            cursor.ended === prior.ended &&
            cursor.initialAccepted === prior.initialAccepted &&
            cursor.resizeCount === prior.resizeCount &&
            this.#dimensions(cursor, prior);
        if (value.disposition === ExecutionInputDisposition.Rejected) {
            if ((!current && !previous) ||
                (previous && !cursor.blocked) ||
                !sameState ||
                (input.inputSequence === 0n && !cursor.blocked)) {
                throw new Error('Rejected input changed confirmed state or skipped processing');
            }
            return;
        }
        if (value.disposition === ExecutionInputDisposition.Indeterminate) {
            const maximum = input.control.kind === ExecutionInputKind.Data
                ? input.control.offset + input.control.byteLength
                : prior.acceptedOffset;
            if (!previous ||
                !cursor.blocked ||
                cursor.initialAccepted !== prior.initialAccepted ||
                cursor.ended !== prior.ended ||
                cursor.resizeCount !== prior.resizeCount ||
                !this.#dimensions(cursor, prior) ||
                cursor.acceptedOffset < prior.acceptedOffset ||
                cursor.acceptedOffset > maximum) {
                throw new Error('Indeterminate input guessed confirmed state');
            }
            return;
        }
        if (!current || cursor.blocked || !cursor.initialAccepted) {
            throw new Error('Applied input requires the exact processed control');
        }
        const expectedOffset = input.control.kind === ExecutionInputKind.Data
            ? input.control.offset + input.control.byteLength
            : prior.acceptedOffset;
        const expectedEnded = input.control.kind === ExecutionInputKind.End || prior.ended;
        const expectedResizes = prior.resizeCount + (input.control.kind === ExecutionInputKind.Resize ? 1n : 0n);
        const geometry = input.control.kind === ExecutionInputKind.Resize
            ? cursor.dimensions?.cols === input.control.cols &&
                cursor.dimensions.rows === input.control.rows
            : this.#dimensions(cursor, prior);
        if (cursor.acceptedOffset !== expectedOffset ||
            cursor.ended !== expectedEnded ||
            cursor.resizeCount !== expectedResizes ||
            !geometry) {
            throw new Error('Applied input receipt changed its exact effect');
        }
    }
    static #dimensions(left, right) {
        return left.dimensions === null
            ? right.dimensions === null
            : right.dimensions !== null &&
                left.dimensions.cols === right.dimensions.cols &&
                left.dimensions.rows === right.dimensions.rows;
    }
}

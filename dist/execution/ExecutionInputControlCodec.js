// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits, ExecutionInteractiveTransport, } from './ExecutionInteractive.js';
import { ExecutionInputKind, } from './ExecutionInput.js';
import { Boundary } from '../protocol/Boundary.js';
import { ExecutionInteractiveCodec } from './ExecutionInteractiveCodec.js';
/** Live control decoding is separate from the existing positional ExecutionInputCodec. */
export class ExecutionInputControlCodec {
    static fields = [
        ...Fields.originalFields,
        'readySha256',
        'inputId',
        'inputSequence',
        'previousInputHash',
        'control',
    ];
    static read(raw) {
        return this.capture(raw, Encoding.Wire);
    }
    static decode(json) {
        return this.read(Fields.decode(json, Limits.inputJsonBytes));
    }
    static encode(value) {
        return Fields.encode(this.capture(value, Encoding.Internal), Limits.inputJsonBytes);
    }
    /** Capturing internal DTOs also checks closed own data fields before hashing or asynchronous work. */
    static capture(raw, encoding) {
        const value = Fields.record(raw, this.fields);
        const original = Fields.original(value, encoding);
        const inputSequence = Fields.counter(value['inputSequence'], encoding, 0n, Limits.maximumInputSequence);
        const inputId = Boundary.id(value['inputId']);
        const previousInputHash = Fields.digest(value['previousInputHash']);
        if ((inputSequence === 0n) !== (inputId === Limits.initialInputId) ||
            (inputSequence === 0n && previousInputHash !== Limits.genesisHash)) {
            throw new Error('Initial input identity is reserved for record zero');
        }
        const control = this.control(value['control'], encoding);
        if (inputSequence === 0n) {
            if (control.kind !== ExecutionInputKind.Data ||
                control.offset !== 0n ||
                control.byteLength > BigInt(Limits.initialBytes)) {
                throw new Error('Initial input must be the launch-committed Data zero range');
            }
        }
        else if (control.kind === ExecutionInputKind.Data && control.byteLength === 0n) {
            throw new Error('Empty live data is not EOF');
        }
        if ((control.kind === ExecutionInputKind.End &&
            original.transport !== ExecutionInteractiveTransport.Pipe) ||
            (control.kind === ExecutionInputKind.Resize &&
                original.transport !== ExecutionInteractiveTransport.Pty)) {
            throw new Error('Control kind is not valid for the admitted transport');
        }
        return Object.freeze({
            ...original,
            readySha256: Fields.digest(value['readySha256']),
            inputId,
            inputSequence,
            previousInputHash,
            control,
        });
    }
    /** A closed discriminator is inspected without invoking a getter before the exact variant is copied. */
    static control(raw, encoding) {
        if (typeof raw !== 'object' ||
            raw === null ||
            Object.getPrototypeOf(raw) !== Object.prototype) {
            throw new Error('Explicit input control required');
        }
        const descriptor = Object.getOwnPropertyDescriptor(raw, 'kind');
        if (descriptor === undefined ||
            descriptor.enumerable !== true ||
            !Object.hasOwn(descriptor, 'value')) {
            throw new Error('Input kind must be an own data field');
        }
        const kind = descriptor.value;
        if (kind === ExecutionInputKind.Data.valueOf()) {
            return this.#data(Fields.record(raw, ['kind', 'offset', 'byteLength', 'dataBase64', 'dataHash']), encoding);
        }
        if (kind === ExecutionInputKind.End.valueOf()) {
            const value = Fields.record(raw, ['kind', 'offset']);
            return Object.freeze({
                kind: ExecutionInputKind.End,
                offset: Fields.counter(value['offset'], encoding, 0n, Limits.inputBytes),
            });
        }
        if (kind === ExecutionInputKind.Resize.valueOf()) {
            const value = Fields.record(raw, [
                'kind',
                'cols',
                'rows',
            ]);
            return Object.freeze({
                kind: ExecutionInputKind.Resize,
                cols: Fields.cols(value['cols']),
                rows: Fields.rows(value['rows']),
            });
        }
        throw new Error('Explicit input control kind required');
    }
    /** Initial bytes/hash must match the separately captured launch and its first Ready proof before input zero can be released. */
    static initial(value, ready, launch) {
        const captured = this.capture(value, Encoding.Internal);
        const body = ExecutionInteractiveCodec.body(ready);
        if (!Fields.sameOriginal(captured, body) ||
            captured.inputSequence !== 0n ||
            captured.control.kind !== ExecutionInputKind.Data ||
            captured.control.byteLength !== body.initialInputBytes ||
            captured.control.dataHash !== body.initialInputHash ||
            launch.byteLength !== Number(body.initialInputBytes)) {
            throw new Error('Initial input does not match the admitted launch');
        }
        const bytes = this.bytes(captured.control.dataBase64);
        if (bytes.byteLength !== launch.byteLength ||
            bytes.some((byte, index) => byte !== launch[index])) {
            throw new Error('Initial input bytes changed');
        }
    }
    /** Canonical padded binary base64 is bounded before allocation; dataHash verification belongs to the proof helper. */
    static bytes(raw) {
        if (typeof raw !== 'string' ||
            raw.length > Math.ceil(Limits.frameBytes / 3) * 4 ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(raw)) {
            throw new Error('Invalid finite input base64');
        }
        const decoded = atob(raw);
        if (decoded.length > Limits.frameBytes || btoa(decoded) !== raw) {
            throw new Error('Noncanonical input base64');
        }
        return Uint8Array.from(decoded, (byte) => byte.charCodeAt(0));
    }
    static #data(value, encoding) {
        const bytes = this.bytes(value['dataBase64']);
        const offset = Fields.counter(value['offset'], encoding, 0n, Limits.inputBytes);
        const byteLength = Fields.counter(value['byteLength'], encoding, 0n, BigInt(Limits.frameBytes));
        if (BigInt(bytes.byteLength) !== byteLength || offset + byteLength > Limits.inputBytes) {
            throw new Error('Input byte range exceeds its bound');
        }
        const dataBase64 = value['dataBase64'];
        if (typeof dataBase64 !== 'string') {
            throw new Error('Explicit input bytes required');
        }
        return Object.freeze({
            kind: ExecutionInputKind.Data,
            offset,
            byteLength,
            dataBase64,
            dataHash: Fields.digest(value['dataHash']),
        });
    }
}

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputDisposition, } from './ExecutionInput.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ExecutionInputCorrelation } from './ExecutionInputCorrelation.js';
/** Receipt decoding always compares the captured immutable input and pre-control cursor. */
export class ExecutionInputReceiptCodec {
    static #fields = [
        ...Fields.inputIdentityFields,
        'disposition',
        'cursor',
    ];
    static read(raw, context) {
        const value = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, context, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }
    static decode(json, context) {
        return this.read(Fields.decode(json, Limits.receiptJsonBytes), context);
    }
    static encode(value, context) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return Fields.encode(Object.freeze({
            ...this.#body(record, context, Encoding.Internal),
            signature: Fields.signature(record['signature']),
        }), Limits.receiptJsonBytes);
    }
    static body(value, context) {
        return this.#body(Fields.record(value, this.#fields), context, Encoding.Internal);
    }
    static unsigned(value, context) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, context, Encoding.Internal);
    }
    static #body(value, context, encoding) {
        const identity = ExecutionInputIdentityCodec.capture(value, encoding);
        const disposition = Object.values(ExecutionInputDisposition).find((entry) => entry.valueOf() === value['disposition']);
        if (disposition === undefined) {
            throw new Error('Explicit input disposition required');
        }
        const body = Object.freeze({
            ...identity,
            disposition,
            cursor: ExecutionInputCursorCodec.capture(value['cursor'], identity.transport, encoding),
        });
        ExecutionInputCorrelation.match(body, context);
        return body;
    }
}

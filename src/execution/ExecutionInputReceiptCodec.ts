// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import {
    ExecutionInputDisposition,
    type ExecutionInputReceipt,
    type ExecutionInputReceiptBody,
    type ExecutionInputReceiptContext,
} from './ExecutionInput.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ExecutionInputCorrelation } from './ExecutionInputCorrelation.js';

/** Receipt decoding always compares the captured immutable input and pre-control cursor. */
export class ExecutionInputReceiptCodec {
    static readonly #fields: readonly string[] = [
        ...Fields.inputIdentityFields,
        'disposition',
        'cursor',
    ];

    public static read(raw: unknown, context: ExecutionInputReceiptContext): ExecutionInputReceipt {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, context, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }

    public static decode(
        json: string,
        context: ExecutionInputReceiptContext,
    ): ExecutionInputReceipt {
        return this.read(Fields.decode(json, Limits.receiptJsonBytes), context);
    }

    public static encode(
        value: ExecutionInputReceipt,
        context: ExecutionInputReceiptContext,
    ): string {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return Fields.encode(
            Object.freeze({
                ...this.#body(record, context, Encoding.Internal),
                signature: Fields.signature(record['signature']),
            }),
            Limits.receiptJsonBytes,
        );
    }

    public static body(
        value: ExecutionInputReceiptBody,
        context: ExecutionInputReceiptContext,
    ): ExecutionInputReceiptBody {
        return this.#body(Fields.record(value, this.#fields), context, Encoding.Internal);
    }

    public static unsigned(
        value: ExecutionInputReceipt,
        context: ExecutionInputReceiptContext,
    ): ExecutionInputReceiptBody {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, context, Encoding.Internal);
    }

    static #body(
        value: Readonly<Record<string, unknown>>,
        context: ExecutionInputReceiptContext,
        encoding: Encoding,
    ): ExecutionInputReceiptBody {
        const identity: ReturnType<typeof ExecutionInputIdentityCodec.capture> =
            ExecutionInputIdentityCodec.capture(value, encoding);
        const disposition: ExecutionInputDisposition | undefined = Object.values(
            ExecutionInputDisposition,
        ).find(
            (entry: ExecutionInputDisposition): boolean => entry.valueOf() === value['disposition'],
        );
        if (disposition === undefined) {
            throw new Error('Explicit input disposition required');
        }
        const body: ExecutionInputReceiptBody = Object.freeze({
            ...identity,
            disposition,
            cursor: ExecutionInputCursorCodec.capture(
                value['cursor'],
                identity.transport,
                encoding,
            ),
        });
        ExecutionInputCorrelation.match(body, context);
        return body;
    }
}

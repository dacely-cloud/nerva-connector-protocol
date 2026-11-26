// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import {
    ExecutionInputDisposition,
    type ExecutionInputIdentity,
    type ExecutionInputCursor,
    type ExecutionInputReceiptContext,
    type ExecutionInputReceipt,
} from './ExecutionInput.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputReceiptCodec } from './ExecutionInputReceiptCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';

/** A detached candidate is not an admitted receipt; the original context and device proof remain mandatory. */
interface ExecutionInputReceiptCandidate extends ExecutionInputIdentity {
    readonly disposition: ExecutionInputDisposition;
    readonly cursor: ExecutionInputCursor;
    readonly signature: string;
}

/** Allows exact immutable record lookup before correlation without retaining unknown mutable input across an await. */
export class ExecutionInputReceiptCapture {
    readonly #json: string;
    private constructor(
        public readonly leaseId: string,
        public readonly identity: ExecutionInputIdentity,
        json: string,
    ) {
        this.#json = json;
        Object.freeze(this);
    }

    /** All own fields, counters, signatures and cursor dimensions are bounded without claiming effect correlation. */
    public static read(raw: unknown): ExecutionInputReceiptCapture {
        const envelope: Readonly<Record<string, unknown>> = Fields.record(raw, [
            'leaseId',
            'receipt',
        ]);
        const value: Readonly<Record<string, unknown>> = Fields.record(envelope['receipt'], [
            ...Fields.inputIdentityFields,
            'disposition',
            'cursor',
            'signature',
        ]);
        const identity: ExecutionInputIdentity = ExecutionInputIdentityCodec.capture(
            value,
            Encoding.Wire,
        );
        const disposition: ExecutionInputDisposition | undefined = Object.values(
            ExecutionInputDisposition,
        ).find(
            (entry: ExecutionInputDisposition): boolean => entry.valueOf() === value['disposition'],
        );
        if (disposition === undefined) {
            throw new Error('Explicit input disposition required');
        }
        const candidate: ExecutionInputReceiptCandidate = Object.freeze({
            ...identity,
            disposition,
            cursor: ExecutionInputCursorCodec.capture(
                value['cursor'],
                identity.transport,
                Encoding.Wire,
            ),
            signature: Fields.signature(value['signature']),
        });
        return new ExecutionInputReceiptCapture(
            ConnectorDeviceCodec.nonce(envelope['leaseId']),
            identity,
            Fields.encode(candidate, Limits.receiptJsonBytes),
        );
    }

    /** The sender validates its complete receipt against its retained input and pre-effect cursor before wrapping it. */
    public static create(
        leaseId: string,
        receipt: ExecutionInputReceipt,
        context: ExecutionInputReceiptContext,
    ): ExecutionInputReceiptCapture {
        const json: string =
            '{"leaseId":' +
            JSON.stringify(ConnectorDeviceCodec.nonce(leaseId)) +
            ',"receipt":' +
            ExecutionInputReceiptCodec.encode(receipt, context) +
            '}';
        return this.read(Fields.decode(json, 16384));
    }

    /** Forward only the already detached canonical receipt envelope; its backend receiver reloads independent correlation context. */
    public encode(): string {
        return '{"leaseId":' + JSON.stringify(this.leaseId) + ',"receipt":' + this.#json + '}';
    }

    /** Full first-proof hashing excludes the current delivery lease wrapper. */
    public receiptJson(): string {
        return this.#json;
    }

    /** Only this second decoder may produce a receipt DTO after its exact input and pre-effect cursor have been loaded. */
    public receipt(context: ExecutionInputReceiptContext): ExecutionInputReceipt {
        return ExecutionInputReceiptCodec.decode(this.#json, context);
    }
}

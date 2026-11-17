// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputDisposition, } from './ExecutionInput.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputReceiptCodec } from './ExecutionInputReceiptCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
/** Allows exact immutable record lookup before correlation without retaining unknown mutable input across an await. */
export class ExecutionInputReceiptCapture {
    leaseId;
    identity;
    #json;
    constructor(leaseId, identity, json) {
        this.leaseId = leaseId;
        this.identity = identity;
        this.#json = json;
        Object.freeze(this);
    }
    /** All own fields, counters, signatures and cursor dimensions are bounded without claiming effect correlation. */
    static read(raw) {
        const envelope = Fields.record(raw, [
            'leaseId',
            'receipt',
        ]);
        const value = Fields.record(envelope['receipt'], [
            ...Fields.inputIdentityFields,
            'disposition',
            'cursor',
            'signature',
        ]);
        const identity = ExecutionInputIdentityCodec.capture(value, Encoding.Wire);
        const disposition = Object.values(ExecutionInputDisposition).find((entry) => entry.valueOf() === value['disposition']);
        if (disposition === undefined) {
            throw new Error('Explicit input disposition required');
        }
        const candidate = Object.freeze({
            ...identity,
            disposition,
            cursor: ExecutionInputCursorCodec.capture(value['cursor'], identity.transport, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
        return new ExecutionInputReceiptCapture(ConnectorDeviceCodec.nonce(envelope['leaseId']), identity, Fields.encode(candidate, Limits.receiptJsonBytes));
    }
    /** The sender validates its complete receipt against its retained input and pre-effect cursor before wrapping it. */
    static create(leaseId, receipt, context) {
        const json = '{"leaseId":' +
            JSON.stringify(ConnectorDeviceCodec.nonce(leaseId)) +
            ',"receipt":' +
            ExecutionInputReceiptCodec.encode(receipt, context) +
            '}';
        return this.read(Fields.decode(json, 16384));
    }
    /** Forward only the already detached canonical receipt envelope; its backend receiver reloads independent correlation context. */
    encode() {
        return '{"leaseId":' + JSON.stringify(this.leaseId) + ',"receipt":' + this.#json + '}';
    }
    /** Full first-proof hashing excludes the current delivery lease wrapper. */
    receiptJson() {
        return this.#json;
    }
    /** Only this second decoder may produce a receipt DTO after its exact input and pre-effect cursor have been loaded. */
    receipt(context) {
        return ExecutionInputReceiptCodec.decode(this.#json, context);
    }
}

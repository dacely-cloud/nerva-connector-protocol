// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
/** Acknowledgments identify the first retained receipt; its complete proof hash is checked independently before credit release. */
export class ExecutionInputAcknowledgmentCodec {
    static #fields = [
        ...Fields.inputIdentityFields,
        'receiptSha256',
        'leaseId',
        'writerGeneration',
    ];
    static read(raw, receipt) {
        const value = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, receipt, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }
    static decode(json, receipt) {
        return this.read(Fields.decode(json, Limits.acknowledgmentJsonBytes), receipt);
    }
    static encode(value, receipt) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return Fields.encode(Object.freeze({
            ...this.#body(record, receipt, Encoding.Internal),
            signature: Fields.signature(record['signature']),
        }), Limits.acknowledgmentJsonBytes);
    }
    static body(value, receipt) {
        return this.#body(Fields.record(value, this.#fields), receipt, Encoding.Internal);
    }
    static unsigned(value, receipt) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, receipt, Encoding.Internal);
    }
    static #body(value, receipt, encoding) {
        const identity = ExecutionInputIdentityCodec.capture(value, encoding);
        if (!Fields.sameOriginal(identity, receipt) ||
            identity.readySha256 !== receipt.readySha256 ||
            identity.inputId !== receipt.inputId ||
            identity.inputSequence !== receipt.inputSequence ||
            identity.inputHash !== receipt.inputHash) {
            throw new Error('Acknowledgment original receipt changed');
        }
        Fields.signature(receipt.signature);
        return Object.freeze({
            ...identity,
            receiptSha256: Fields.digest(value['receiptSha256']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            writerGeneration: Fields.counter(value['writerGeneration'], encoding, 1n),
        });
    }
}

// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputCorrelation } from './ExecutionInputCorrelation.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import { ExecutionInputTerminalResolutionLimits as Limits, } from './ExecutionInputTerminalResolution.js';
/** A closed no-effect authorization cannot decode as an InputPermit or extend the original execution deadline. */
export class ExecutionInputTerminalResolutionCodec {
    static #fields = [
        'input',
        'inputHash',
        'prior',
        'leaseId',
        'writerGeneration',
        'executionDeadlineMs',
        'responseHash',
        'issuedAtMs',
        'deliveryExpiresAtMs',
    ];
    static read(raw) {
        const value = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }
    static decode(json) {
        return this.read(Fields.decode(json, Limits.jsonBytes));
    }
    static body(value) {
        return this.#body(Fields.record(value, this.#fields), Encoding.Internal);
    }
    static unsigned(value) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, Encoding.Internal);
    }
    static encode(value) {
        const record = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return this.#encode(Object.freeze({
            ...this.#body(record, Encoding.Internal),
            signature: Fields.signature(record['signature']),
        }));
    }
    static payload(value) {
        const body = this.body(value);
        return new TextEncoder().encode(this.#encode(body));
    }
    static #body(value, encoding) {
        const input = ExecutionInputControlCodec.capture(value['input'], encoding);
        const context = ExecutionInputCorrelation.context({
            input,
            inputHash: Fields.digest(value['inputHash']),
            prior: ExecutionInputCursorCodec.capture(value['prior'], input.transport, encoding),
        });
        const issuedAtMs = Fields.counter(value['issuedAtMs'], encoding, 1n);
        const deliveryExpiresAtMs = Fields.counter(value['deliveryExpiresAtMs'], encoding, 1n);
        if (deliveryExpiresAtMs <= issuedAtMs ||
            deliveryExpiresAtMs - issuedAtMs > Limits.deliveryMs) {
            throw new Error('Terminal resolution delivery exceeds its finite lifetime');
        }
        return Object.freeze({
            ...context,
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            writerGeneration: Fields.counter(value['writerGeneration'], encoding, 1n),
            executionDeadlineMs: Fields.counter(value['executionDeadlineMs'], encoding, 1n),
            responseHash: Fields.digest(value['responseHash']),
            issuedAtMs,
            deliveryExpiresAtMs,
        });
    }
    static #encode(value) {
        const json = JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
        if (new TextEncoder().encode(json).byteLength > Limits.jsonBytes) {
            throw new Error('Terminal resolution exceeds its byte budget');
        }
        return json;
    }
}

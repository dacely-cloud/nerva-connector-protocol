// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputCursorCodec } from './ExecutionInputCursorCodec.js';
import { ExecutionInputCorrelation } from './ExecutionInputCorrelation.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import {
    ExecutionInputTerminalResolutionLimits as Limits,
    type ExecutionInputTerminalResolutionBody,
    type ExecutionInputTerminalResolution,
} from './ExecutionInputTerminalResolution.js';
import type { ExecutionInputReceiptContext } from './ExecutionInput.js';

/** A closed no-effect authorization cannot decode as an InputPermit or extend the original execution deadline. */
export class ExecutionInputTerminalResolutionCodec {
    static readonly #fields: readonly string[] = [
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

    public static read(raw: unknown): ExecutionInputTerminalResolution {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }
    public static decode(json: string): ExecutionInputTerminalResolution {
        return this.read(Fields.decode(json, Limits.jsonBytes));
    }
    public static body(
        value: ExecutionInputTerminalResolutionBody,
    ): ExecutionInputTerminalResolutionBody {
        return this.#body(Fields.record(value, this.#fields), Encoding.Internal);
    }
    public static unsigned(
        value: ExecutionInputTerminalResolution,
    ): ExecutionInputTerminalResolutionBody {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, Encoding.Internal);
    }
    public static encode(value: ExecutionInputTerminalResolution): string {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return this.#encode(
            Object.freeze({
                ...this.#body(record, Encoding.Internal),
                signature: Fields.signature(record['signature']),
            }),
        );
    }
    public static payload(value: ExecutionInputTerminalResolutionBody): Uint8Array {
        const body: ExecutionInputTerminalResolutionBody = this.body(value);
        return new TextEncoder().encode(this.#encode(body));
    }
    static #body(
        value: Readonly<Record<string, unknown>>,
        encoding: Encoding,
    ): ExecutionInputTerminalResolutionBody {
        const input: ExecutionInputReceiptContext['input'] = ExecutionInputControlCodec.capture(
            value['input'],
            encoding,
        );
        const context: ExecutionInputReceiptContext = ExecutionInputCorrelation.context({
            input,
            inputHash: Fields.digest(value['inputHash']),
            prior: ExecutionInputCursorCodec.capture(value['prior'], input.transport, encoding),
        });
        const issuedAtMs: bigint = Fields.counter(value['issuedAtMs'], encoding, 1n);
        const deliveryExpiresAtMs: bigint = Fields.counter(
            value['deliveryExpiresAtMs'],
            encoding,
            1n,
        );
        if (
            deliveryExpiresAtMs <= issuedAtMs ||
            deliveryExpiresAtMs - issuedAtMs > Limits.deliveryMs
        ) {
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
    static #encode(
        value: ExecutionInputTerminalResolutionBody | ExecutionInputTerminalResolution,
    ): string {
        const json: string = JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
        if (new TextEncoder().encode(json).byteLength > Limits.jsonBytes) {
            throw new Error('Terminal resolution exceeds its byte budget');
        }
        return json;
    }
}

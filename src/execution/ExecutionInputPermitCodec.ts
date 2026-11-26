// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import type { ExecutionInputPermit, ExecutionInputPermitBody } from './ExecutionInput.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';

/** Fresh lease/writer delivery authority cannot change the immutable control or its original deadline. */
export class ExecutionInputPermitCodec {
    static readonly #fields: readonly string[] = [
        'input',
        'inputHash',
        'leaseId',
        'writerGeneration',
        'issuedAtMs',
        'expiresAtMs',
        'executionDeadlineMs',
    ];

    public static read(raw: unknown): ExecutionInputPermit {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }

    public static decode(json: string): ExecutionInputPermit {
        return this.read(Fields.decode(json, Limits.permitJsonBytes));
    }

    public static encode(value: ExecutionInputPermit): string {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return Fields.encode(
            Object.freeze({
                ...this.#body(record, Encoding.Internal),
                signature: Fields.signature(record['signature']),
            }),
            Limits.permitJsonBytes,
        );
    }

    public static body(value: ExecutionInputPermitBody): ExecutionInputPermitBody {
        return this.#body(Fields.record(value, this.#fields), Encoding.Internal);
    }

    public static unsigned(value: ExecutionInputPermit): ExecutionInputPermitBody {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, Encoding.Internal);
    }

    static #body(
        value: Readonly<Record<string, unknown>>,
        encoding: Encoding,
    ): ExecutionInputPermitBody {
        const issuedAtMs: bigint = Fields.counter(value['issuedAtMs'], encoding, 1n);
        const expiresAtMs: bigint = Fields.counter(value['expiresAtMs'], encoding, 1n);
        const executionDeadlineMs: bigint = Fields.counter(
            value['executionDeadlineMs'],
            encoding,
            1n,
        );
        if (
            expiresAtMs <= issuedAtMs ||
            expiresAtMs > executionDeadlineMs ||
            executionDeadlineMs - issuedAtMs > Limits.executionMs
        ) {
            throw new Error('Input permit cannot extend its finite execution deadline');
        }
        return Object.freeze({
            input: ExecutionInputControlCodec.capture(value['input'], encoding),
            inputHash: Fields.digest(value['inputHash']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            writerGeneration: Fields.counter(value['writerGeneration'], encoding, 1n),
            issuedAtMs,
            expiresAtMs,
            executionDeadlineMs,
        });
    }
}

// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import type {
    ExecutionInputAcknowledgment,
    ExecutionInputAcknowledgmentBody,
    ExecutionInputReceipt,
} from './ExecutionInput.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';

/** Acknowledgments identify the first retained receipt; its complete proof hash is checked independently before credit release. */
export class ExecutionInputAcknowledgmentCodec {
    static readonly #fields: readonly string[] = [
        ...Fields.inputIdentityFields,
        'receiptSha256',
        'leaseId',
        'writerGeneration',
    ];

    public static read(raw: unknown, receipt: ExecutionInputReceipt): ExecutionInputAcknowledgment {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, [
            ...this.#fields,
            'signature',
        ]);
        return Object.freeze({
            ...this.#body(value, receipt, Encoding.Wire),
            signature: Fields.signature(value['signature']),
        });
    }

    public static decode(
        json: string,
        receipt: ExecutionInputReceipt,
    ): ExecutionInputAcknowledgment {
        return this.read(Fields.decode(json, Limits.acknowledgmentJsonBytes), receipt);
    }

    public static encode(
        value: ExecutionInputAcknowledgment,
        receipt: ExecutionInputReceipt,
    ): string {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        return Fields.encode(
            Object.freeze({
                ...this.#body(record, receipt, Encoding.Internal),
                signature: Fields.signature(record['signature']),
            }),
            Limits.acknowledgmentJsonBytes,
        );
    }

    public static body(
        value: ExecutionInputAcknowledgmentBody,
        receipt: ExecutionInputReceipt,
    ): ExecutionInputAcknowledgmentBody {
        return this.#body(Fields.record(value, this.#fields), receipt, Encoding.Internal);
    }

    public static unsigned(
        value: ExecutionInputAcknowledgment,
        receipt: ExecutionInputReceipt,
    ): ExecutionInputAcknowledgmentBody {
        const record: Readonly<Record<string, unknown>> = Fields.record(value, [
            ...this.#fields,
            'signature',
        ]);
        Fields.signature(record['signature']);
        return this.#body(record, receipt, Encoding.Internal);
    }

    static #body(
        value: Readonly<Record<string, unknown>>,
        receipt: ExecutionInputReceipt,
        encoding: Encoding,
    ): ExecutionInputAcknowledgmentBody {
        const identity: ReturnType<typeof ExecutionInputIdentityCodec.capture> =
            ExecutionInputIdentityCodec.capture(value, encoding);
        if (
            !Fields.sameOriginal(identity, receipt) ||
            identity.readySha256 !== receipt.readySha256 ||
            identity.inputId !== receipt.inputId ||
            identity.inputSequence !== receipt.inputSequence ||
            identity.inputHash !== receipt.inputHash
        ) {
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

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import type {
    ExecutionInputAcknowledgment,
    ExecutionInputIdentity,
    ExecutionInputReceipt,
} from './ExecutionInput.js';
import { ExecutionInputAcknowledgmentCodec } from './ExecutionInputAcknowledgmentCodec.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';

interface ExecutionInputAcknowledgmentCandidate extends ExecutionInputIdentity {
    readonly receiptSha256: string;
    readonly leaseId: string;
    readonly writerGeneration: bigint;
    readonly signature: string;
}

/** Detached wire selectors cannot release native credit until the exact retained receipt and full signatures are checked. */
export class ExecutionInputAcknowledgmentCapture {
    readonly #json: string;
    private constructor(
        public readonly identity: ExecutionInputIdentity,
        public readonly leaseId: string,
        public readonly writerGeneration: bigint,
        public readonly receiptSha256: string,
        json: string,
    ) {
        this.#json = json;
        Object.freeze(this);
    }

    public static read(raw: unknown): ExecutionInputAcknowledgmentCapture {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, [
            ...Fields.inputIdentityFields,
            'receiptSha256',
            'leaseId',
            'writerGeneration',
            'signature',
        ]);
        const identity: ExecutionInputIdentity = ExecutionInputIdentityCodec.capture(
            value,
            Encoding.Wire,
        );
        const candidate: ExecutionInputAcknowledgmentCandidate = Object.freeze({
            ...identity,
            receiptSha256: Fields.digest(value['receiptSha256']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            writerGeneration: Fields.counter(value['writerGeneration'], Encoding.Wire, 1n),
            signature: Fields.signature(value['signature']),
        });
        return new ExecutionInputAcknowledgmentCapture(
            identity,
            candidate.leaseId,
            candidate.writerGeneration,
            candidate.receiptSha256,
            Fields.encode(candidate, Limits.acknowledgmentJsonBytes),
        );
    }

    /** Correlation is mandatory before a capture becomes an acknowledgment DTO; the native owner still verifies both signatures and first-proof SHA. */
    public acknowledgment(receipt: ExecutionInputReceipt): ExecutionInputAcknowledgment {
        return ExecutionInputAcknowledgmentCodec.decode(this.#json, receipt);
    }

    /** The exact detached proof is forwarded without changing its field values or inventing receipt authority. */
    public encode(): string {
        return this.#json;
    }
}

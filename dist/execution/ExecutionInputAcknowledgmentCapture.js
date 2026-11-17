// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import { ExecutionInputAcknowledgmentCodec } from './ExecutionInputAcknowledgmentCodec.js';
import { ExecutionInputIdentityCodec } from './ExecutionInputIdentityCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
/** Detached wire selectors cannot release native credit until the exact retained receipt and full signatures are checked. */
export class ExecutionInputAcknowledgmentCapture {
    identity;
    leaseId;
    writerGeneration;
    receiptSha256;
    #json;
    constructor(identity, leaseId, writerGeneration, receiptSha256, json) {
        this.identity = identity;
        this.leaseId = leaseId;
        this.writerGeneration = writerGeneration;
        this.receiptSha256 = receiptSha256;
        this.#json = json;
        Object.freeze(this);
    }
    static read(raw) {
        const value = Fields.record(raw, [
            ...Fields.inputIdentityFields,
            'receiptSha256',
            'leaseId',
            'writerGeneration',
            'signature',
        ]);
        const identity = ExecutionInputIdentityCodec.capture(value, Encoding.Wire);
        const candidate = Object.freeze({
            ...identity,
            receiptSha256: Fields.digest(value['receiptSha256']),
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            writerGeneration: Fields.counter(value['writerGeneration'], Encoding.Wire, 1n),
            signature: Fields.signature(value['signature']),
        });
        return new ExecutionInputAcknowledgmentCapture(identity, candidate.leaseId, candidate.writerGeneration, candidate.receiptSha256, Fields.encode(candidate, Limits.acknowledgmentJsonBytes));
    }
    /** Correlation is mandatory before a capture becomes an acknowledgment DTO; the native owner still verifies both signatures and first-proof SHA. */
    acknowledgment(receipt) {
        return ExecutionInputAcknowledgmentCodec.decode(this.#json, receipt);
    }
    /** The exact detached proof is forwarded without changing its field values or inventing receipt authority. */
    encode() {
        return this.#json;
    }
}

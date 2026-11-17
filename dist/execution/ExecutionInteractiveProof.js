// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInputTerminalResolutionCodec } from './ExecutionInputTerminalResolutionCodec.js';
import { createHash } from 'node:crypto';
import { ExecutionInteractiveFields, ExecutionInteractiveEncoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveCodec } from './ExecutionInteractiveCodec.js';
import { ExecutionInteractiveLimits } from './ExecutionInteractive.js';
import { ExecutionInteractiveTranscript } from './ExecutionInteractiveTranscript.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputPermitCodec } from './ExecutionInputPermitCodec.js';
import { ExecutionInputReceiptCodec } from './ExecutionInputReceiptCodec.js';
import { ExecutionInputAcknowledgmentCodec } from './ExecutionInputAcknowledgmentCodec.js';
import { ExecutionInputKind, } from './ExecutionInput.js';
/** Hashes and purpose-selected payloads grant no effects without independent pins, signatures and shared ownership checks. */
export class ExecutionInteractiveProof {
    /** Terminal resolution authenticates only an exact retained input/Ready and actual response hash; it never grants a native write. */
    static resolution(value, ready) {
        const body = ExecutionInputTerminalResolutionCodec.body(value);
        if (!ExecutionInteractiveFields.sameOriginal(body.input, ready) ||
            body.input.readySha256 !== this.readySha256(ready) ||
            body.inputHash !== this.inputHash(body.input) ||
            body.executionDeadlineMs !== ready.executionDeadlineMs) {
            throw new Error('Terminal resolution changed its captured original or deadline');
        }
        return ExecutionInputTerminalResolutionCodec.payload(body);
    }
    static ready(value) {
        return ExecutionInteractiveTranscript.ready(value);
    }
    /** Full first proofs, including their randomized composite signature, remain immutable commitments. */
    static readySha256(value) {
        return this.#digest(ExecutionInteractiveCodec.encode(value));
    }
    static dataHash(bytes) {
        if (!(bytes instanceof Uint8Array) ||
            bytes.byteLength > ExecutionInteractiveLimits.frameBytes) {
            throw new Error('Input hash byte range exceeds its frame limit');
        }
        return this.#digest(bytes);
    }
    static inputHash(value) {
        const input = ExecutionInputControlCodec.capture(value, ExecutionInteractiveEncoding.Internal);
        if (input.control.kind === ExecutionInputKind.Data &&
            this.dataHash(ExecutionInputControlCodec.bytes(input.control.dataBase64)) !==
                input.control.dataHash) {
            throw new Error('Input data hash does not match its exact bytes');
        }
        return this.#digest(ExecutionInteractiveTranscript.input(input));
    }
    /** The initial range is checked against independently captured launch bytes, not merely against another device assertion. */
    static initial(value, ready, launch) {
        ExecutionInputControlCodec.initial(value, ready, launch);
        if (this.dataHash(launch) !== ready.initialInputHash) {
            throw new Error('Initial launch hash changed');
        }
        this.inputHash(value);
    }
    /** Lease renewal wraps the retained Ready/control; it cannot substitute a first proof or extend that recorded deadline. */
    static permit(value, ready) {
        const body = ExecutionInputPermitCodec.body(value);
        const original = ExecutionInteractiveCodec.unsigned(ready);
        if (!ExecutionInteractiveFields.sameOriginal(body.input, original) ||
            body.input.readySha256 !== this.readySha256(ready) ||
            body.inputHash !== this.inputHash(body.input) ||
            body.executionDeadlineMs !== original.executionDeadlineMs ||
            (body.input.inputSequence === 0n &&
                (body.input.control.kind !== ExecutionInputKind.Data ||
                    body.input.control.byteLength !== original.initialInputBytes ||
                    body.input.control.dataHash !== original.initialInputHash))) {
            throw new Error('Input permit changed its retained Ready or control');
        }
        return ExecutionInteractiveTranscript.permit(body);
    }
    static receipt(value, context) {
        if (context.inputHash !== this.inputHash(context.input)) {
            throw new Error('Receipt context input hash changed');
        }
        return ExecutionInteractiveTranscript.receipt(value, context);
    }
    static receiptSha256(value, context) {
        if (context.inputHash !== this.inputHash(context.input)) {
            throw new Error('Receipt context input hash changed');
        }
        return this.#digest(ExecutionInputReceiptCodec.encode(value, context));
    }
    static acknowledgment(value, receipt, context) {
        const body = ExecutionInputAcknowledgmentCodec.body(value, receipt);
        if (body.receiptSha256 !== this.receiptSha256(receipt, context)) {
            throw new Error('Acknowledgment changed the first retained receipt proof');
        }
        return ExecutionInteractiveTranscript.acknowledgment(body, receipt);
    }
    static #digest(value) {
        return createHash('sha256').update(value).digest('hex');
    }
}

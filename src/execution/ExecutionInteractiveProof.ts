// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ExecutionInputTerminalResolutionCodec } from './ExecutionInputTerminalResolutionCodec.js';
import type { ExecutionInputTerminalResolutionBody } from './ExecutionInputTerminalResolution.js';

import { createHash } from 'node:crypto';
import {
    ExecutionInteractiveFields,
    ExecutionInteractiveEncoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveCodec } from './ExecutionInteractiveCodec.js';
import { ExecutionInteractiveLimits } from './ExecutionInteractive.js';
import { ExecutionInteractiveTranscript } from './ExecutionInteractiveTranscript.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputPermitCodec } from './ExecutionInputPermitCodec.js';
import { ExecutionInputReceiptCodec } from './ExecutionInputReceiptCodec.js';
import { ExecutionInputAcknowledgmentCodec } from './ExecutionInputAcknowledgmentCodec.js';
import type {
    ExecutionInteractiveReady,
    ExecutionInteractiveReadyBody,
} from './ExecutionInteractive.js';
import {
    ExecutionInputKind,
    type ExecutionInputOriginal,
    type ExecutionInputPermitBody,
    type ExecutionInputReceiptBody,
    type ExecutionInputReceiptContext,
    type ExecutionInputReceipt,
    type ExecutionInputAcknowledgmentBody,
} from './ExecutionInput.js';

/** Hashes and purpose-selected payloads grant no effects without independent pins, signatures and shared ownership checks. */
export class ExecutionInteractiveProof {
    /** Terminal resolution authenticates only an exact retained input/Ready and actual response hash; it never grants a native write. */
    public static resolution(
        value: ExecutionInputTerminalResolutionBody,
        ready: ExecutionInteractiveReady,
    ): Uint8Array {
        const body: ExecutionInputTerminalResolutionBody =
            ExecutionInputTerminalResolutionCodec.body(value);
        if (
            !ExecutionInteractiveFields.sameOriginal(body.input, ready) ||
            body.input.readySha256 !== this.readySha256(ready) ||
            body.inputHash !== this.inputHash(body.input) ||
            body.executionDeadlineMs !== ready.executionDeadlineMs
        ) {
            throw new Error('Terminal resolution changed its captured original or deadline');
        }
        return ExecutionInputTerminalResolutionCodec.payload(body);
    }

    public static ready(value: ExecutionInteractiveReadyBody): Uint8Array {
        return ExecutionInteractiveTranscript.ready(value);
    }

    /** Full first proofs, including their randomized composite signature, remain immutable commitments. */
    public static readySha256(value: ExecutionInteractiveReady): string {
        return this.#digest(ExecutionInteractiveCodec.encode(value));
    }

    public static dataHash(bytes: Uint8Array): string {
        if (
            !(bytes instanceof Uint8Array) ||
            bytes.byteLength > ExecutionInteractiveLimits.frameBytes
        ) {
            throw new Error('Input hash byte range exceeds its frame limit');
        }
        return this.#digest(bytes);
    }

    public static inputHash(value: ExecutionInputOriginal): string {
        const input: ExecutionInputOriginal = ExecutionInputControlCodec.capture(
            value,
            ExecutionInteractiveEncoding.Internal,
        );
        if (
            input.control.kind === ExecutionInputKind.Data &&
            this.dataHash(ExecutionInputControlCodec.bytes(input.control.dataBase64)) !==
                input.control.dataHash
        ) {
            throw new Error('Input data hash does not match its exact bytes');
        }
        return this.#digest(ExecutionInteractiveTranscript.input(input));
    }

    /** The initial range is checked against independently captured launch bytes, not merely against another device assertion. */
    public static initial(
        value: ExecutionInputOriginal,
        ready: ExecutionInteractiveReadyBody,
        launch: Uint8Array,
    ): void {
        ExecutionInputControlCodec.initial(value, ready, launch);
        if (this.dataHash(launch) !== ready.initialInputHash) {
            throw new Error('Initial launch hash changed');
        }
        this.inputHash(value);
    }

    /** Lease renewal wraps the retained Ready/control; it cannot substitute a first proof or extend that recorded deadline. */
    public static permit(
        value: ExecutionInputPermitBody,
        ready: ExecutionInteractiveReady,
    ): Uint8Array {
        const body: ExecutionInputPermitBody = ExecutionInputPermitCodec.body(value);
        const original: ExecutionInteractiveReadyBody = ExecutionInteractiveCodec.unsigned(ready);
        if (
            !ExecutionInteractiveFields.sameOriginal(body.input, original) ||
            body.input.readySha256 !== this.readySha256(ready) ||
            body.inputHash !== this.inputHash(body.input) ||
            body.executionDeadlineMs !== original.executionDeadlineMs ||
            (body.input.inputSequence === 0n &&
                (body.input.control.kind !== ExecutionInputKind.Data ||
                    body.input.control.byteLength !== original.initialInputBytes ||
                    body.input.control.dataHash !== original.initialInputHash))
        ) {
            throw new Error('Input permit changed its retained Ready or control');
        }
        return ExecutionInteractiveTranscript.permit(body);
    }

    public static receipt(
        value: ExecutionInputReceiptBody,
        context: ExecutionInputReceiptContext,
    ): Uint8Array {
        if (context.inputHash !== this.inputHash(context.input)) {
            throw new Error('Receipt context input hash changed');
        }
        return ExecutionInteractiveTranscript.receipt(value, context);
    }

    public static receiptSha256(
        value: ExecutionInputReceipt,
        context: ExecutionInputReceiptContext,
    ): string {
        if (context.inputHash !== this.inputHash(context.input)) {
            throw new Error('Receipt context input hash changed');
        }
        return this.#digest(ExecutionInputReceiptCodec.encode(value, context));
    }

    public static acknowledgment(
        value: ExecutionInputAcknowledgmentBody,
        receipt: ExecutionInputReceipt,
        context: ExecutionInputReceiptContext,
    ): Uint8Array {
        const body: ExecutionInputAcknowledgmentBody = ExecutionInputAcknowledgmentCodec.body(
            value,
            receipt,
        );
        if (body.receiptSha256 !== this.receiptSha256(receipt, context)) {
            throw new Error('Acknowledgment changed the first retained receipt proof');
        }
        return ExecutionInteractiveTranscript.acknowledgment(body, receipt);
    }

    static #digest(value: string | Uint8Array): string {
        return createHash('sha256').update(value).digest('hex');
    }
}

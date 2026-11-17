// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ExecutionInteractiveCodec } from './ExecutionInteractiveCodec.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputPermitCodec } from './ExecutionInputPermitCodec.js';
import { ExecutionInputReceiptCodec } from './ExecutionInputReceiptCodec.js';
import { ExecutionInputAcknowledgmentCodec } from './ExecutionInputAcknowledgmentCodec.js';
import { ExecutionInteractiveEncoding } from './ExecutionInteractiveFields.js';
import {
    ExecutionInteractiveLimits as Limits,
    type ExecutionInteractiveOriginal,
    type ExecutionInteractiveReadyBody,
} from './ExecutionInteractive.js';
import {
    ExecutionInputKind,
    type ExecutionInputOriginal,
    type ExecutionInputPermitBody,
    type ExecutionInputReceiptBody,
    type ExecutionInputReceiptContext,
    type ExecutionInputAcknowledgmentBody,
    type ExecutionInputReceipt,
} from './ExecutionInput.js';

/** Canonical arrays contain only bounded scalars and arrays, with no object-key ordering or toJSON ambiguity. */
type TranscriptValue = string | number | boolean | null | readonly TranscriptValue[];

/** Browser-safe signing payloads contain no keys, hashing implementation, authority state or runtime handles. */
export class ExecutionInteractiveTranscript {
    static readonly #encoder: TextEncoder = new TextEncoder();

    public static ready(value: ExecutionInteractiveReadyBody): Uint8Array {
        const body: ExecutionInteractiveReadyBody = ExecutionInteractiveCodec.body(value);
        return this.#bytes(
            [
                'nerva-connector:execution:interactive-ready:1',
                ...this.#original(body),
                body.initialInputSequence.toString(),
                body.initialInputBytes.toString(),
                body.initialInputHash,
                body.dimensions === null ? null : [body.dimensions.cols, body.dimensions.rows],
                body.executionDeadlineMs.toString(),
            ],
            Limits.readyJsonBytes,
        );
    }

    public static input(value: ExecutionInputOriginal): Uint8Array {
        return this.#bytes(
            this.#input(
                ExecutionInputControlCodec.capture(value, ExecutionInteractiveEncoding.Internal),
            ),
            Limits.inputJsonBytes,
        );
    }

    public static permit(value: ExecutionInputPermitBody): Uint8Array {
        const body: ExecutionInputPermitBody = ExecutionInputPermitCodec.body(value);
        return this.#bytes(
            [
                'nerva-connector:execution:input-permit:1',
                this.#input(body.input),
                body.inputHash,
                body.leaseId,
                body.writerGeneration.toString(),
                body.issuedAtMs.toString(),
                body.expiresAtMs.toString(),
                body.executionDeadlineMs.toString(),
            ],
            Limits.permitJsonBytes,
        );
    }

    public static receipt(
        value: ExecutionInputReceiptBody,
        context: ExecutionInputReceiptContext,
    ): Uint8Array {
        const body: ExecutionInputReceiptBody = ExecutionInputReceiptCodec.body(value, context);
        const cursor: ExecutionInputReceiptBody['cursor'] = body.cursor;
        return this.#bytes(
            [
                'nerva-connector:execution:input-receipt:1',
                ...this.#original(body),
                body.readySha256,
                body.inputId,
                body.inputSequence.toString(),
                body.inputHash,
                body.disposition,
                cursor.processedSequence === null ? null : cursor.processedSequence.toString(),
                cursor.processedInputHash,
                cursor.initialAccepted,
                cursor.blocked,
                cursor.acceptedOffset.toString(),
                cursor.ended,
                cursor.dimensions === null
                    ? null
                    : [cursor.dimensions.cols, cursor.dimensions.rows],
                cursor.resizeCount.toString(),
            ],
            Limits.receiptJsonBytes,
        );
    }

    public static acknowledgment(
        value: ExecutionInputAcknowledgmentBody,
        receipt: ExecutionInputReceipt,
    ): Uint8Array {
        const body: ExecutionInputAcknowledgmentBody = ExecutionInputAcknowledgmentCodec.body(
            value,
            receipt,
        );
        return this.#bytes(
            [
                'nerva-connector:execution:input-acknowledgment:1',
                ...this.#original(body),
                body.readySha256,
                body.inputId,
                body.inputSequence.toString(),
                body.inputHash,
                body.receiptSha256,
                body.leaseId,
                body.writerGeneration.toString(),
            ],
            Limits.acknowledgmentJsonBytes,
        );
    }

    static #input(body: ExecutionInputOriginal): readonly TranscriptValue[] {
        let control: readonly TranscriptValue[];
        if (body.control.kind === ExecutionInputKind.Data) {
            control = [
                body.control.kind,
                body.control.offset.toString(),
                body.control.byteLength.toString(),
                body.control.dataBase64,
                body.control.dataHash,
            ];
        } else if (body.control.kind === ExecutionInputKind.End) {
            control = [body.control.kind, body.control.offset.toString()];
        } else {
            control = [body.control.kind, body.control.cols, body.control.rows];
        }
        return [
            'nerva-connector:execution:input-original:1',
            ...this.#original(body),
            body.readySha256,
            body.inputId,
            body.inputSequence.toString(),
            body.previousInputHash,
            control,
        ];
    }

    static #original(body: ExecutionInteractiveOriginal): readonly string[] {
        return [
            body.authorityId,
            body.environmentId,
            body.enrollmentId,
            body.lane,
            body.jobId,
            body.sequence.toString(),
            body.dispatchId,
            body.requestHash,
            body.admissionHash,
            body.transport,
            body.incarnation,
        ];
    }

    static #bytes(values: readonly TranscriptValue[], maximum: number): Uint8Array {
        const bytes: Uint8Array = this.#encoder.encode(JSON.stringify(values));
        if (bytes.byteLength > maximum) {
            throw new Error('Interactive signing payload exceeds its limit');
        }
        return bytes;
    }
}

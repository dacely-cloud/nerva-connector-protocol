// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInteractiveCodec } from './ExecutionInteractiveCodec.js';
import { ExecutionInputControlCodec } from './ExecutionInputControlCodec.js';
import { ExecutionInputPermitCodec } from './ExecutionInputPermitCodec.js';
import { ExecutionInputReceiptCodec } from './ExecutionInputReceiptCodec.js';
import { ExecutionInputAcknowledgmentCodec } from './ExecutionInputAcknowledgmentCodec.js';
import { ExecutionInteractiveEncoding } from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits, } from './ExecutionInteractive.js';
import { ExecutionInputKind, } from './ExecutionInput.js';
/** Browser-safe signing payloads contain no keys, hashing implementation, authority state or runtime handles. */
export class ExecutionInteractiveTranscript {
    static #encoder = new TextEncoder();
    static ready(value) {
        const body = ExecutionInteractiveCodec.body(value);
        return this.#bytes([
            'nerva-connector:execution:interactive-ready:1',
            ...this.#original(body),
            body.initialInputSequence.toString(),
            body.initialInputBytes.toString(),
            body.initialInputHash,
            body.dimensions === null ? null : [body.dimensions.cols, body.dimensions.rows],
            body.executionDeadlineMs.toString(),
        ], Limits.readyJsonBytes);
    }
    static input(value) {
        return this.#bytes(this.#input(ExecutionInputControlCodec.capture(value, ExecutionInteractiveEncoding.Internal)), Limits.inputJsonBytes);
    }
    static permit(value) {
        const body = ExecutionInputPermitCodec.body(value);
        return this.#bytes([
            'nerva-connector:execution:input-permit:1',
            this.#input(body.input),
            body.inputHash,
            body.leaseId,
            body.writerGeneration.toString(),
            body.issuedAtMs.toString(),
            body.expiresAtMs.toString(),
            body.executionDeadlineMs.toString(),
        ], Limits.permitJsonBytes);
    }
    static receipt(value, context) {
        const body = ExecutionInputReceiptCodec.body(value, context);
        const cursor = body.cursor;
        return this.#bytes([
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
        ], Limits.receiptJsonBytes);
    }
    static acknowledgment(value, receipt) {
        const body = ExecutionInputAcknowledgmentCodec.body(value, receipt);
        return this.#bytes([
            'nerva-connector:execution:input-acknowledgment:1',
            ...this.#original(body),
            body.readySha256,
            body.inputId,
            body.inputSequence.toString(),
            body.inputHash,
            body.receiptSha256,
            body.leaseId,
            body.writerGeneration.toString(),
        ], Limits.acknowledgmentJsonBytes);
    }
    static #input(body) {
        let control;
        if (body.control.kind === ExecutionInputKind.Data) {
            control = [
                body.control.kind,
                body.control.offset.toString(),
                body.control.byteLength.toString(),
                body.control.dataBase64,
                body.control.dataHash,
            ];
        }
        else if (body.control.kind === ExecutionInputKind.End) {
            control = [body.control.kind, body.control.offset.toString()];
        }
        else {
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
    static #original(body) {
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
    static #bytes(values, maximum) {
        const bytes = this.#encoder.encode(JSON.stringify(values));
        if (bytes.byteLength > maximum) {
            throw new Error('Interactive signing payload exceeds its limit');
        }
        return bytes;
    }
}

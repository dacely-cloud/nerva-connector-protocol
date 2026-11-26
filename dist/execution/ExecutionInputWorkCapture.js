// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionInputTerminalResolutionCodec } from './ExecutionInputTerminalResolutionCodec.js';
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import { ExecutionInteractiveFields as Fields } from './ExecutionInteractiveFields.js';
import { ExecutionInputPermitCodec } from './ExecutionInputPermitCodec.js';
import { ExecutionInputAcknowledgmentCapture } from './ExecutionInputAcknowledgmentCapture.js';
/** One bounded work observation contains at most one unchanged control and one contextual ACK candidate, consumed ACK first. */
export class ExecutionInputWorkCapture {
    permit;
    acknowledgment;
    resolution;
    static maximumBytes = 32768;
    #json;
    constructor(permit, acknowledgment, resolution) {
        this.permit = permit;
        this.acknowledgment = acknowledgment;
        this.resolution = resolution;
        if (permit !== null && resolution !== null) {
            throw new Error('Terminal resolution cannot grant native input');
        }
        this.#json =
            '{"permit":' +
                (permit === null ? 'null' : ExecutionInputPermitCodec.encode(permit)) +
                ',"acknowledgment":' +
                (acknowledgment === null ? 'null' : acknowledgment.encode()) +
                ',"resolution":' +
                (resolution === null
                    ? 'null'
                    : ExecutionInputTerminalResolutionCodec.encode(resolution)) +
                '}';
        if (Data.bytes(this.#json) > ExecutionInputWorkCapture.maximumBytes) {
            throw new Error('Input work exceeds its wire budget');
        }
        Object.freeze(this);
    }
    static read(raw) {
        const value = Fields.record(raw, [
            'permit',
            'acknowledgment',
            'resolution',
        ]);
        return new ExecutionInputWorkCapture(value['permit'] === null ? null : ExecutionInputPermitCodec.read(value['permit']), value['acknowledgment'] === null
            ? null
            : ExecutionInputAcknowledgmentCapture.read(value['acknowledgment']), value['resolution'] === null
            ? null
            : ExecutionInputTerminalResolutionCodec.read(value['resolution']));
    }
    /** Empty observation can drain a retained outbox; it grants no input or native acceptance. */
    static empty() {
        return new ExecutionInputWorkCapture(null, null, null);
    }
    static acknowledged(acknowledgment) {
        return new ExecutionInputWorkCapture(null, acknowledgment, null);
    }
    encode() {
        return this.#json;
    }
}

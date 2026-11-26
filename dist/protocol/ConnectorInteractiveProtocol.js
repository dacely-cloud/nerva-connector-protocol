// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from '../execution/ExecutionInteractiveFields.js';
import { ExecutionInteractiveCodec } from '../execution/ExecutionInteractiveCodec.js';
/** Closed ready envelopes never imply application bytes were accepted or provide a replacement native grant. */
export class ConnectorInteractiveProtocol {
    static original(raw, work, encoding = Encoding.Wire) {
        const original = Fields.original(Fields.record(raw, Fields.originalFields), encoding);
        if ((work.permit !== null && !Fields.sameOriginal(work.permit.input, original)) ||
            (work.acknowledgment !== null &&
                !Fields.sameOriginal(work.acknowledgment.identity, original)) ||
            (work.resolution !== null && !Fields.sameOriginal(work.resolution.input, original))) {
            throw new Error('Input work changed its explicit routing original');
        }
        return original;
    }
    static encodeOriginal(original, work) {
        return Fields.encode(this.original(original, work, Encoding.Internal), 2048);
    }
    static ready(raw) {
        const value = Fields.record(raw, ['leaseId', 'ready']);
        return Object.freeze({
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            ready: ExecutionInteractiveCodec.read(value['ready']),
        });
    }
    static encodeReady(value) {
        Fields.record(value, ['leaseId', 'ready']);
        return ('{"leaseId":' +
            JSON.stringify(ConnectorDeviceCodec.nonce(value.leaseId)) +
            ',"ready":' +
            ExecutionInteractiveCodec.encode(value.ready) +
            '}');
    }
}

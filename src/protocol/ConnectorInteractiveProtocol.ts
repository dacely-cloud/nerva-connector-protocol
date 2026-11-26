// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionInputWorkCapture } from '../execution/ExecutionInputWorkCapture.js';
import type { ExecutionInteractiveOriginal } from '../execution/ExecutionInteractive.js';

import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from '../execution/ExecutionInteractiveFields.js';
import { ExecutionInteractiveCodec } from '../execution/ExecutionInteractiveCodec.js';
import type { ExecutionInteractiveReady } from '../execution/ExecutionInteractive.js';

/** The current lease wraps one unchanged first Ready proof; stored echoes are flow control only. */
export interface ConnectorInteractiveReadyEnvelope {
    readonly leaseId: string;
    readonly ready: ExecutionInteractiveReady;
}

/** Closed ready envelopes never imply application bytes were accepted or provide a replacement native grant. */
export class ConnectorInteractiveProtocol {
    public static original(
        raw: unknown,
        work: ExecutionInputWorkCapture,
        encoding: Encoding = Encoding.Wire,
    ): ExecutionInteractiveOriginal {
        const original: ExecutionInteractiveOriginal = Fields.original(
            Fields.record(raw, Fields.originalFields),
            encoding,
        );
        if (
            (work.permit !== null && !Fields.sameOriginal(work.permit.input, original)) ||
            (work.acknowledgment !== null &&
                !Fields.sameOriginal(work.acknowledgment.identity, original)) ||
            (work.resolution !== null && !Fields.sameOriginal(work.resolution.input, original))
        ) {
            throw new Error('Input work changed its explicit routing original');
        }
        return original;
    }

    public static encodeOriginal(
        original: ExecutionInteractiveOriginal,
        work: ExecutionInputWorkCapture,
    ): string {
        return Fields.encode(this.original(original, work, Encoding.Internal), 2048);
    }

    public static ready(raw: unknown): ConnectorInteractiveReadyEnvelope {
        const value: Readonly<Record<string, unknown>> = Fields.record(raw, ['leaseId', 'ready']);
        return Object.freeze({
            leaseId: ConnectorDeviceCodec.nonce(value['leaseId']),
            ready: ExecutionInteractiveCodec.read(value['ready']),
        });
    }

    public static encodeReady(value: ConnectorInteractiveReadyEnvelope): string {
        Fields.record(value, ['leaseId', 'ready']);
        return (
            '{"leaseId":' +
            JSON.stringify(ConnectorDeviceCodec.nonce(value.leaseId)) +
            ',"ready":' +
            ExecutionInteractiveCodec.encode(value.ready) +
            '}'
        );
    }
}

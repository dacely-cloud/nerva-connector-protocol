// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorHostTool } from './ConnectorHost.js';
import { ConnectorHostCodec } from './ConnectorHostCodec.js';
import { ConnectorDeviceCodec } from './ConnectorDeviceCodec.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ExecutionMachineBoundary as Boundary } from '../execution/ExecutionMachineBoundary.js';
import { ConnectorHostObservationKind } from './ConnectorHostObservation.js';
import { ConnectorHostObservedStart } from './ConnectorHostObservationProtocol.js';
/** Closed metadata readers preserve the exact effect request and refuse post-hoc or caller-selected attachment. */
export class ConnectorHostObservedStartCodec {
    /** Only one exact protocol and complete namespace commitment can cross private admission. */
    static capture(raw) {
        const value = Boundary.record(raw, [
            'protocol',
            'observationId',
            'ownerSha256',
            'providerSha256',
            'originalId',
        ]);
        if (value['protocol'] !== ConnectorHostObservedStart.Protocol) {
            throw new Error('Unsupported host observation protocol');
        }
        return {
            protocol: ConnectorHostObservedStart.Protocol,
            observationId: ConnectorDeviceCodec.nonce(value['observationId']),
            ownerSha256: ConnectorEnrollmentCodec.digest(value['ownerSha256']),
            providerSha256: ConnectorEnrollmentCodec.digest(value['providerSha256']),
            originalId: ConnectorEnrollmentCodec.digest(value['originalId']),
        };
    }
    /** Ordinary admission refuses the reserved field even when its value would be malformed. */
    static ordinary(request) {
        if (this.#marker(request) !== undefined) {
            throw new Error('Host observation metadata requires private owned admission');
        }
    }
    /** Presence is correlation only; callers still require private admission and a verified current signed permit. */
    static read(request) {
        const raw = this.#marker(request);
        if (raw === undefined) {
            return null;
        }
        this.kind(request.toolName);
        return this.capture(raw);
    }
    /** Strip exactly one closed reserved field after independent authorization, preserving every executable argument value. */
    static strip(request) {
        const capture = this.read(request);
        if (capture === null) {
            throw new Error('Observed start reservation required');
        }
        const raw = JSON.parse(request.argumentsJson);
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            throw new Error('Observed start arguments required');
        }
        const values = {};
        for (const key of Object.keys(raw)) {
            if (key !== ConnectorHostObservedStart.Field) {
                const value = Reflect.get(raw, key);
                Object.defineProperty(values, key, { value, enumerable: true });
            }
        }
        return { capture, argumentsJson: JSON.stringify(values) };
    }
    /** Private source and embedded signed capture must be byte-equivalent after closed canonical validation. */
    static submission(raw) {
        const value = Boundary.record(raw, [
            'submission',
            'capture',
        ]);
        const submission = ConnectorHostCodec.submission(value['submission']);
        this.kind(submission.request.toolName);
        const capture = this.capture(value['capture']);
        const embedded = this.capture(this.#marker(submission.request));
        if (ConnectorHostCodec.encode(capture) !== ConnectorHostCodec.encode(embedded)) {
            throw new Error('Host observation capture differs from its retained source');
        }
        return { submission, capture };
    }
    /** A reservation can refer only to a new native process or terminal, never arbitrary operations. */
    static kind(tool) {
        if (tool === ConnectorHostTool.ProcessStart) {
            return ConnectorHostObservationKind.Process;
        }
        if (tool === ConnectorHostTool.TerminalStart) {
            return ConnectorHostObservationKind.Terminal;
        }
        throw new Error('Host observation metadata requires a native start');
    }
    static #marker(request) {
        let raw;
        try {
            raw = JSON.parse(request.argumentsJson);
        }
        catch {
            return undefined;
        }
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
            return undefined;
        }
        const descriptor = Object.getOwnPropertyDescriptor(raw, ConnectorHostObservedStart.Field);
        if (descriptor === undefined) {
            return undefined;
        }
        if (!Object.hasOwn(descriptor, 'value')) {
            throw new Error('Host observation accessors are forbidden');
        }
        return descriptor.value;
    }
}

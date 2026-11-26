// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ExecutionMachineBoundary } from './ExecutionMachineBoundary.js';
import { Boundary } from '../protocol/Boundary.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import { ExecutionLaneCodec } from './ExecutionLaneCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import {
    ExecutionInteractiveTransport,
    ExecutionInteractiveLimits,
    type ExecutionInteractiveOriginal,
    type ExecutionInteractiveDimensions,
} from './ExecutionInteractive.js';
import type { ExecutionInputPermitBody } from './ExecutionInput.js';

/** Wire readers require decimal strings; typed encoders require exact internal bigint values. */
export enum ExecutionInteractiveEncoding {
    Wire,
    Internal,
}

/** Shared pure readers detach closed data before any signature, native I/O or asynchronous work. */
export class ExecutionInteractiveFields {
    public static readonly originalFields: readonly string[] = [
        'authorityId',
        'environmentId',
        'enrollmentId',
        'lane',
        'jobId',
        'sequence',
        'dispatchId',
        'requestHash',
        'admissionHash',
        'transport',
        'incarnation',
    ];
    public static readonly inputIdentityFields: readonly string[] = [
        ...this.originalFields,
        'readySha256',
        'inputId',
        'inputSequence',
        'inputHash',
    ];
    static readonly #encoder: TextEncoder = new TextEncoder();

    /** Missing fields, accessors, symbols and hidden authority are rejected without invoking their values. */
    public static record(
        raw: unknown,
        fields: readonly string[],
    ): Readonly<Record<string, unknown>> {
        return ExecutionMachineBoundary.record(raw, fields);
    }

    /** The existing enrollment, nonce and lane encodings remain unchanged. */
    public static original(
        value: Readonly<Record<string, unknown>>,
        encoding: ExecutionInteractiveEncoding,
    ): ExecutionInteractiveOriginal {
        const transport: unknown = value['transport'];
        if (
            transport !== ExecutionInteractiveTransport.Pipe.valueOf() &&
            transport !== ExecutionInteractiveTransport.Pty.valueOf()
        ) {
            throw new Error('Explicit interactive transport required');
        }
        return Object.freeze({
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            lane: ExecutionLaneCodec.read(value['lane']),
            jobId: Boundary.id(value['jobId']),
            sequence: this.counter(value['sequence'], encoding, 1n),
            dispatchId: ConnectorDeviceCodec.nonce(value['dispatchId']),
            requestHash: this.digest(value['requestHash']),
            admissionHash: this.digest(value['admissionHash']),
            transport:
                transport === ExecutionInteractiveTransport.Pipe.valueOf()
                    ? ExecutionInteractiveTransport.Pipe
                    : ExecutionInteractiveTransport.Pty,
            incarnation: this.digest(value['incarnation']),
        });
    }

    /** Every external counter is canonical decimal and every internal counter preserves signed-int64 precision. */
    public static counter(
        raw: unknown,
        encoding: ExecutionInteractiveEncoding,
        minimum: bigint,
        maximum: bigint = 9223372036854775807n,
    ): bigint {
        let value: bigint;
        if (
            encoding === ExecutionInteractiveEncoding.Wire &&
            typeof raw === 'string' &&
            /^(?:0|[1-9][0-9]{0,18})$/u.test(raw)
        ) {
            value = BigInt(raw);
        } else if (encoding === ExecutionInteractiveEncoding.Internal && typeof raw === 'bigint') {
            value = raw;
        } else {
            throw new Error('Canonical interactive decimal counter required');
        }
        if (value < minimum || value > maximum) {
            throw new Error('Interactive counter exceeds its bound');
        }
        return value;
    }

    public static digest(raw: unknown): string {
        return ConnectorEnrollmentCodec.digest(raw);
    }

    /** Comparison never substitutes a newer job, transport, dispatch or native incarnation. */
    public static sameOriginal(
        left: ExecutionInteractiveOriginal,
        right: ExecutionInteractiveOriginal,
    ): boolean {
        return (
            left.authorityId === right.authorityId &&
            left.environmentId === right.environmentId &&
            left.enrollmentId === right.enrollmentId &&
            left.lane === right.lane &&
            left.jobId === right.jobId &&
            left.sequence === right.sequence &&
            left.dispatchId === right.dispatchId &&
            left.requestHash === right.requestHash &&
            left.admissionHash === right.admissionHash &&
            left.transport === right.transport &&
            left.incarnation === right.incarnation
        );
    }

    /** A pipe explicitly carries null geometry; PTY dimensions do not come from a process identifier. */
    public static dimensions(
        raw: unknown,
        transport: ExecutionInteractiveTransport,
    ): ExecutionInteractiveDimensions | null {
        if (transport === ExecutionInteractiveTransport.Pipe) {
            if (raw !== null) {
                throw new Error('A pipe has no PTY dimensions');
            }
            return null;
        }
        if (transport !== ExecutionInteractiveTransport.Pty) {
            throw new Error('Explicit interactive transport required');
        }
        const value: Readonly<Record<string, unknown>> = this.record(raw, ['cols', 'rows']);
        return Object.freeze({ cols: this.cols(value['cols']), rows: this.rows(value['rows']) });
    }

    public static cols(raw: unknown): number {
        return ExecutionMachineBoundary.count(
            raw,
            ExecutionInteractiveLimits.minimumCols,
            ExecutionInteractiveLimits.maximumCols,
        );
    }

    public static rows(raw: unknown): number {
        return ExecutionMachineBoundary.count(
            raw,
            ExecutionInteractiveLimits.minimumRows,
            ExecutionInteractiveLimits.maximumRows,
        );
    }

    public static boolean(raw: unknown): boolean {
        if (typeof raw !== 'boolean') {
            throw new Error('Explicit interactive boolean required');
        }
        return raw;
    }

    /** Exactly both fixed signature components are present before cryptographic verification. */
    public static signature(raw: unknown): string {
        return ConnectorEnrollmentCodec.binary(raw, IdentityLengths.signature);
    }

    /** Raw byte ceilings precede JSON parsing and any expensive proof work. */
    public static decode(json: string, maximum: number): unknown {
        if (
            typeof json !== 'string' ||
            json.length > maximum ||
            this.#encoder.encode(json).byteLength > maximum
        ) {
            throw new Error('Interactive JSON exceeds its byte limit');
        }
        const raw: unknown = JSON.parse(json);
        return raw;
    }

    /** Only previously detached DTOs enter this serializer; the decoder owns their closed field sets. */
    public static encode(
        value: ExecutionInteractiveOriginal | ExecutionInputPermitBody,
        maximum: number,
    ): string {
        const json: string = JSON.stringify(value, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
        if (this.#encoder.encode(json).byteLength > maximum) {
            throw new Error('Interactive JSON exceeds its byte limit');
        }
        return json;
    }
}

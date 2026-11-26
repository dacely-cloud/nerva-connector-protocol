// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionMachineBoundary } from './ExecutionMachineBoundary.js';
import { Boundary } from '../protocol/Boundary.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { ConnectorDeviceCodec } from '../protocol/ConnectorDeviceCodec.js';
import { ExecutionLaneCodec } from './ExecutionLaneCodec.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { ExecutionInteractiveTransport, ExecutionInteractiveLimits, } from './ExecutionInteractive.js';
/** Wire readers require decimal strings; typed encoders require exact internal bigint values. */
export var ExecutionInteractiveEncoding;
(function (ExecutionInteractiveEncoding) {
    ExecutionInteractiveEncoding[ExecutionInteractiveEncoding["Wire"] = 0] = "Wire";
    ExecutionInteractiveEncoding[ExecutionInteractiveEncoding["Internal"] = 1] = "Internal";
})(ExecutionInteractiveEncoding || (ExecutionInteractiveEncoding = {}));
/** Shared pure readers detach closed data before any signature, native I/O or asynchronous work. */
export class ExecutionInteractiveFields {
    static originalFields = [
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
    static inputIdentityFields = [
        ...this.originalFields,
        'readySha256',
        'inputId',
        'inputSequence',
        'inputHash',
    ];
    static #encoder = new TextEncoder();
    /** Missing fields, accessors, symbols and hidden authority are rejected without invoking their values. */
    static record(raw, fields) {
        return ExecutionMachineBoundary.record(raw, fields);
    }
    /** The existing enrollment, nonce and lane encodings remain unchanged. */
    static original(value, encoding) {
        const transport = value['transport'];
        if (transport !== ExecutionInteractiveTransport.Pipe.valueOf() &&
            transport !== ExecutionInteractiveTransport.Pty.valueOf()) {
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
            transport: transport === ExecutionInteractiveTransport.Pipe.valueOf()
                ? ExecutionInteractiveTransport.Pipe
                : ExecutionInteractiveTransport.Pty,
            incarnation: this.digest(value['incarnation']),
        });
    }
    /** Every external counter is canonical decimal and every internal counter preserves signed-int64 precision. */
    static counter(raw, encoding, minimum, maximum = 9223372036854775807n) {
        let value;
        if (encoding === ExecutionInteractiveEncoding.Wire &&
            typeof raw === 'string' &&
            /^(?:0|[1-9][0-9]{0,18})$/u.test(raw)) {
            value = BigInt(raw);
        }
        else if (encoding === ExecutionInteractiveEncoding.Internal && typeof raw === 'bigint') {
            value = raw;
        }
        else {
            throw new Error('Canonical interactive decimal counter required');
        }
        if (value < minimum || value > maximum) {
            throw new Error('Interactive counter exceeds its bound');
        }
        return value;
    }
    static digest(raw) {
        return ConnectorEnrollmentCodec.digest(raw);
    }
    /** Comparison never substitutes a newer job, transport, dispatch or native incarnation. */
    static sameOriginal(left, right) {
        return (left.authorityId === right.authorityId &&
            left.environmentId === right.environmentId &&
            left.enrollmentId === right.enrollmentId &&
            left.lane === right.lane &&
            left.jobId === right.jobId &&
            left.sequence === right.sequence &&
            left.dispatchId === right.dispatchId &&
            left.requestHash === right.requestHash &&
            left.admissionHash === right.admissionHash &&
            left.transport === right.transport &&
            left.incarnation === right.incarnation);
    }
    /** A pipe explicitly carries null geometry; PTY dimensions do not come from a process identifier. */
    static dimensions(raw, transport) {
        if (transport === ExecutionInteractiveTransport.Pipe) {
            if (raw !== null) {
                throw new Error('A pipe has no PTY dimensions');
            }
            return null;
        }
        if (transport !== ExecutionInteractiveTransport.Pty) {
            throw new Error('Explicit interactive transport required');
        }
        const value = this.record(raw, ['cols', 'rows']);
        return Object.freeze({ cols: this.cols(value['cols']), rows: this.rows(value['rows']) });
    }
    static cols(raw) {
        return ExecutionMachineBoundary.count(raw, ExecutionInteractiveLimits.minimumCols, ExecutionInteractiveLimits.maximumCols);
    }
    static rows(raw) {
        return ExecutionMachineBoundary.count(raw, ExecutionInteractiveLimits.minimumRows, ExecutionInteractiveLimits.maximumRows);
    }
    static boolean(raw) {
        if (typeof raw !== 'boolean') {
            throw new Error('Explicit interactive boolean required');
        }
        return raw;
    }
    /** Exactly both fixed signature components are present before cryptographic verification. */
    static signature(raw) {
        return ConnectorEnrollmentCodec.binary(raw, IdentityLengths.signature);
    }
    /** Raw byte ceilings precede JSON parsing and any expensive proof work. */
    static decode(json, maximum) {
        if (typeof json !== 'string' ||
            json.length > maximum ||
            this.#encoder.encode(json).byteLength > maximum) {
            throw new Error('Interactive JSON exceeds its byte limit');
        }
        const raw = JSON.parse(json);
        return raw;
    }
    /** Only previously detached DTOs enter this serializer; the decoder owns their closed field sets. */
    static encode(value, maximum) {
        const json = JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
        if (this.#encoder.encode(json).byteLength > maximum) {
            throw new Error('Interactive JSON exceeds its byte limit');
        }
        return json;
    }
}

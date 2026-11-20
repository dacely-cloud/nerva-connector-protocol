// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import { ExecutionMachineInvocationCodec } from './ExecutionMachineInvocationCodec.js';
import { ExecutionMachineLimits } from './ExecutionMachineInvocation.js';
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
/** One canonical argument commits application input, transport, geometry and the immutable execution deadline. */
export class ExecutionInteractiveLaunchCodec {
    /** Byte bounds precede parsing; duplicate keys, alternate escaping and alternate ordering are rejected. */
    static decode(rule, json) {
        const raw = Fields.decode(json, ExecutionMachineLimits.payloadBytes);
        const launch = this.#read(rule, raw, Encoding.Wire);
        if (this.#encode(launch) !== json) {
            throw new Error('Interactive launch must be canonical JSON');
        }
        return launch;
    }
    /** The same closed validators apply before a controller captures its first signed request. */
    static encode(rule, raw) {
        return this.#encode(this.#read(rule, raw, Encoding.Internal));
    }
    /** Admission and first launch use trusted time; recovery only follows the captured deadline. */
    static admit(rule, json, nowMs) {
        Fields.counter(nowMs, Encoding.Internal, 0n);
        const launch = this.decode(rule, json);
        if (launch.executionDeadlineMs <= nowMs ||
            launch.executionDeadlineMs - nowMs > BigInt(launch.invocation.timeoutMs)) {
            throw new Error('Interactive launch deadline exceeds its original finite execution window');
        }
        return launch;
    }
    static #read(rule, raw, encoding) {
        const value = Data.record(raw, [
            'transport',
            'invocation',
            'executionDeadlineMs',
            'dimensions',
        ]);
        const transport = rule.transports.find((entry) => entry === value['transport']);
        if (transport === undefined) {
            throw new Error('Interactive transport was not explicitly granted');
        }
        const invocation = ExecutionMachineInvocationCodec.read(rule.invocation, value['invocation']);
        if (BigInt(Data.bytes(invocation.stdin)) > BigInt(rule.maximumInputBytes)) {
            throw new Error('Initial input exceeds the complete interactive input grant');
        }
        return Object.freeze({
            transport,
            invocation,
            executionDeadlineMs: Fields.counter(value['executionDeadlineMs'], encoding, 1n),
            dimensions: Fields.dimensions(value['dimensions'], transport),
        });
    }
    static #encode(launch) {
        const json = JSON.stringify({
            transport: launch.transport,
            invocation: launch.invocation,
            executionDeadlineMs: launch.executionDeadlineMs.toString(),
            dimensions: launch.dimensions,
        });
        if (Data.bytes(json) > ExecutionMachineLimits.payloadBytes) {
            throw new Error('Interactive launch exceeds its complete argument byte bound');
        }
        return json;
    }
}

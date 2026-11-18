// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import { ExecutionMachineInvocationCodec } from './ExecutionMachineInvocationCodec.js';
import { ExecutionMachineLimits } from './ExecutionMachineInvocation.js';
import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import type {
    ExecutionInteractiveLaunch,
    ExecutionInteractiveInvocationRule,
} from './ExecutionInteractiveInvocation.js';
import type { ExecutionInteractiveTransport } from './ExecutionInteractive.js';

/** One canonical argument commits application input, transport, geometry and the immutable execution deadline. */
export class ExecutionInteractiveLaunchCodec {
    /** Byte bounds precede parsing; duplicate keys, alternate escaping and alternate ordering are rejected. */
    public static decode(
        rule: ExecutionInteractiveInvocationRule,
        json: string,
    ): ExecutionInteractiveLaunch {
        const raw: unknown = Fields.decode(json, ExecutionMachineLimits.payloadBytes);
        const launch: ExecutionInteractiveLaunch = this.#read(rule, raw, Encoding.Wire);
        if (this.#encode(launch) !== json) {
            throw new Error('Interactive launch must be canonical JSON');
        }
        return launch;
    }

    /** The same closed validators apply before a controller captures its first signed request. */
    public static encode(rule: ExecutionInteractiveInvocationRule, raw: unknown): string {
        return this.#encode(this.#read(rule, raw, Encoding.Internal));
    }

    /** Admission and first launch use trusted time; recovery only follows the captured deadline. */
    public static admit(
        rule: ExecutionInteractiveInvocationRule,
        json: string,
        nowMs: bigint,
    ): ExecutionInteractiveLaunch {
        Fields.counter(nowMs, Encoding.Internal, 0n);
        const launch: ExecutionInteractiveLaunch = this.decode(rule, json);
        if (
            launch.executionDeadlineMs <= nowMs ||
            launch.executionDeadlineMs - nowMs > BigInt(launch.invocation.timeoutMs)
        ) {
            throw new Error(
                'Interactive launch deadline exceeds its original finite execution window',
            );
        }
        return launch;
    }

    static #read(
        rule: ExecutionInteractiveInvocationRule,
        raw: unknown,
        encoding: Encoding,
    ): ExecutionInteractiveLaunch {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'transport',
            'invocation',
            'executionDeadlineMs',
            'dimensions',
        ]);
        const transport: ExecutionInteractiveTransport | undefined = rule.transports.find(
            (entry: ExecutionInteractiveTransport): boolean => entry === value['transport'],
        );
        if (transport === undefined) {
            throw new Error('Interactive transport was not explicitly granted');
        }
        const invocation: ReturnType<typeof ExecutionMachineInvocationCodec.read> =
            ExecutionMachineInvocationCodec.read(rule.invocation, value['invocation']);
        if (BigInt(Data.bytes(invocation.stdin)) > rule.maximumInputBytes) {
            throw new Error('Initial input exceeds the complete interactive input grant');
        }
        return Object.freeze({
            transport,
            invocation,
            executionDeadlineMs: Fields.counter(value['executionDeadlineMs'], encoding, 1n),
            dimensions: Fields.dimensions(value['dimensions'], transport),
        });
    }

    static #encode(launch: ExecutionInteractiveLaunch): string {
        const json: string = JSON.stringify({
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

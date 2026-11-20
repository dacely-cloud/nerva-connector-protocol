// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import { ExecutionMachineRuleCodec } from './ExecutionMachineRuleCodec.js';
import { type ExecutionArgumentRule } from './ExecutionPolicyTypes.js';
import { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInputKind } from './ExecutionInput.js';
import {
    ExecutionInteractiveTransport,
    ExecutionInteractiveLimits as Limits,
} from './ExecutionInteractive.js';
import type { ExecutionInteractiveInvocationRule } from './ExecutionInteractiveInvocation.js';

/** Explicit bounded input authority is decoded independently from process launch and native readiness. */
export class ExecutionInteractiveRuleCodec {
    /** Public wire byte counters are canonical decimal strings, never rounded JSON numbers. */
    public static read(raw: unknown): ExecutionInteractiveInvocationRule {
        return this.#read(raw, Encoding.Wire);
    }

    /** Trusted projections still detach every field and validate internal integer precision. */
    public static body(
        value: ExecutionInteractiveInvocationRule,
    ): ExecutionInteractiveInvocationRule {
        return this.#read(value, Encoding.Internal);
    }

    /** A complete interactive grant cannot coexist with foreground or positional arguments. */
    public static placement<Integer extends bigint | string>(
        rules: readonly ExecutionArgumentRule<Integer>[],
    ): ExecutionInteractiveInvocationRule<Integer> | null {
        const selected: ExecutionArgumentRule<Integer> | undefined = rules.find(
            (rule: ExecutionArgumentRule<Integer>): boolean =>
                rule.kind === ExecutionArgumentKind.InteractiveInvocation,
        );
        if (selected === undefined) {
            return null;
        }
        if (rules.length !== 1 || selected.kind !== ExecutionArgumentKind.InteractiveInvocation) {
            throw new Error('Interactive invocation must be the sole argument rule');
        }
        return selected;
    }

    /** A nested Machine grant retains the profile's independent wall-time ceiling. */
    public static profile<Integer extends bigint | string>(
        rules: readonly ExecutionArgumentRule<Integer>[],
        timeoutMs: number,
    ): void {
        const rule: ExecutionInteractiveInvocationRule<Integer> | null = this.placement(rules);
        if (rule !== null && rule.invocation.maximumTimeoutMs > timeoutMs) {
            throw new Error('Interactive timeout exceeds its execution profile');
        }
    }

    static #read(raw: unknown, encoding: Encoding): ExecutionInteractiveInvocationRule {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'kind',
            'invocation',
            'transports',
            'controls',
            'maximumInputBytes',
            'maximumControls',
            'maximumResizes',
        ]);
        if (value['kind'] !== ExecutionArgumentKind.InteractiveInvocation) {
            throw new Error('Explicit interactive invocation grant required');
        }
        const transports: readonly ExecutionInteractiveTransport[] = Object.freeze(
            Data.array(value['transports'], 2).map(
                (entry: unknown): ExecutionInteractiveTransport => {
                    if (entry === ExecutionInteractiveTransport.Pipe.valueOf()) {
                        return ExecutionInteractiveTransport.Pipe;
                    }
                    if (entry === ExecutionInteractiveTransport.Pty.valueOf()) {
                        return ExecutionInteractiveTransport.Pty;
                    }
                    throw new Error('Unsupported interactive transport grant');
                },
            ),
        );
        const controls: readonly ExecutionInputKind[] = Object.freeze(
            Data.array(value['controls'], 3).map((entry: unknown): ExecutionInputKind => {
                if (entry === ExecutionInputKind.Data.valueOf()) {
                    return ExecutionInputKind.Data;
                }
                if (entry === ExecutionInputKind.End.valueOf()) {
                    return ExecutionInputKind.End;
                }
                if (entry === ExecutionInputKind.Resize.valueOf()) {
                    return ExecutionInputKind.Resize;
                }
                throw new Error('Unsupported interactive control grant');
            }),
        );
        const maximumResizes: number = Data.count(
            value['maximumResizes'],
            0,
            Number(Limits.resizes),
        );
        if (
            transports.length === 0 ||
            new Set(transports).size !== transports.length ||
            new Set(controls).size !== controls.length ||
            !controls.includes(ExecutionInputKind.Data) ||
            (controls.includes(ExecutionInputKind.End) &&
                !transports.includes(ExecutionInteractiveTransport.Pipe)) ||
            (controls.includes(ExecutionInputKind.Resize) &&
                !transports.includes(ExecutionInteractiveTransport.Pty)) ||
            controls.includes(ExecutionInputKind.Resize) !== maximumResizes > 0
        ) {
            throw new Error(
                'Interactive controls must be unique and match their explicit transport',
            );
        }
        const maximumControls: number = Data.count(
            value['maximumControls'],
            1,
            Number(Limits.controls),
        );
        if (maximumResizes >= maximumControls) {
            throw new Error('Interactive resize budget must leave initial input record zero');
        }
        return Object.freeze({
            kind: ExecutionArgumentKind.InteractiveInvocation,
            invocation: ExecutionMachineRuleCodec.read(value['invocation']),
            transports,
            controls,
            maximumInputBytes: Fields.counter(
                value['maximumInputBytes'],
                encoding,
                0n,
                Limits.inputBytes,
            ),
            maximumControls,
            maximumResizes,
        });
    }
}

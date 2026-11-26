// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import { type ExecutionArgumentRule, type ExecutionProgramPolicy } from './ExecutionPolicyTypes.js';
import { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
import {
    ExecutionMachineLimits as Limits,
    type ExecutionMachineCommand,
    type ExecutionMachineShell,
    type ExecutionMachineEnvironmentGrant,
    type ExecutionMachineInvocationRule,
} from './ExecutionMachineInvocation.js';
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';

/** Local policy and signed public profiles independently decode the same entire explicit Machine invocation grant. */
export class ExecutionMachineRuleCodec {
    /** Public fields contain finite aliases and table indexes, never private executable paths or digests. */
    public static read(raw: unknown): ExecutionMachineInvocationRule {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'kind',
            'shell',
            'commands',
            'maximumCwdBytes',
            'environment',
            'maximumEnvironmentBytes',
            'maximumStdinBytes',
            'maximumTimeoutMs',
            'maximumArguments',
            'maximumArgumentBytes',
            'maximumArgumentsBytes',
            'maximumScriptBytes',
        ]);
        if (value['kind'] !== ExecutionArgumentKind.MachineInvocation) {
            throw new Error('Explicit Machine invocation rule required');
        }
        const shell: ExecutionMachineShell | null =
            value['shell'] === null ? null : this.#shell(value['shell']);
        const commands: readonly ExecutionMachineCommand[] = Object.freeze(
            Data.array(value['commands'], Limits.executables).map(
                (item: unknown): ExecutionMachineCommand => {
                    const command: Readonly<Record<string, unknown>> = Data.record(item, [
                        'alias',
                        'executableIndex',
                    ]);
                    return Object.freeze({
                        alias: Boundary.id(command['alias']),
                        executableIndex: this.#index(command['executableIndex']),
                    });
                },
            ),
        );
        const environment: readonly ExecutionMachineEnvironmentGrant[] = Object.freeze(
            Data.array(value['environment'], Limits.environmentNames).map(
                (item: unknown): ExecutionMachineEnvironmentGrant => {
                    const grant: Readonly<Record<string, unknown>> = Data.record(item, [
                        'name',
                        'maximumBytes',
                    ]);
                    return Object.freeze({
                        name: Data.name(grant['name']),
                        maximumBytes: Data.count(grant['maximumBytes'], 0, Limits.environmentBytes),
                    });
                },
            ),
        );
        if (
            (shell === null && commands.length === 0) ||
            new Set(commands.map((command: ExecutionMachineCommand): string => command.alias))
                .size !== commands.length ||
            new Set(
                environment.map((grant: ExecutionMachineEnvironmentGrant): string => grant.name),
            ).size !== environment.length
        ) {
            throw new Error('Machine invocation grants must be explicit and unique');
        }
        const maximumScriptBytes: number = Data.count(
            value['maximumScriptBytes'],
            shell === null ? 0 : 1,
            Limits.scriptBytes,
        );
        return Object.freeze({
            kind: ExecutionArgumentKind.MachineInvocation,
            shell,
            commands,
            maximumCwdBytes: Data.count(value['maximumCwdBytes'], 1, Limits.cwdBytes),
            environment,
            maximumEnvironmentBytes: Data.count(
                value['maximumEnvironmentBytes'],
                0,
                Limits.environmentBytes,
            ),
            maximumStdinBytes: Data.count(value['maximumStdinBytes'], 0, Limits.stdinBytes),
            maximumTimeoutMs: Data.count(value['maximumTimeoutMs'], 100, Limits.timeoutMs),
            maximumArguments: Data.count(value['maximumArguments'], 0, Limits.argumentCount),
            maximumArgumentBytes: Data.count(
                value['maximumArgumentBytes'],
                0,
                Limits.argumentBytes,
            ),
            maximumArgumentsBytes: Data.count(
                value['maximumArgumentsBytes'],
                0,
                Limits.argumentsBytes,
            ),
            maximumScriptBytes,
        });
    }

    /** Structured invocation cannot be mixed with positional literals, omitted or interpreted through an old text rule. */
    public static placement<Integer extends bigint | string>(
        rules: readonly ExecutionArgumentRule<Integer>[],
    ): ExecutionMachineInvocationRule | null {
        const selected: ExecutionArgumentRule<Integer> | undefined = rules.find(
            (rule: ExecutionArgumentRule<Integer>): boolean =>
                rule.kind === ExecutionArgumentKind.MachineInvocation,
        );
        if (selected === undefined) {
            return null;
        }
        if (rules.length !== 1 || selected.kind !== ExecutionArgumentKind.MachineInvocation) {
            throw new Error('Machine invocation must be the sole argument rule');
        }
        return selected;
    }

    /** Local policy indexes resolve only existing pinned binaries and cannot exceed its independent wall-time ceiling. */
    public static program(program: ExecutionProgramPolicy, timeoutMs: number): void {
        const rule: ExecutionMachineInvocationRule | null = this.placement(program.arguments);
        if (rule === null) {
            return;
        }
        const count: number = 1 + program.children.length;
        if (
            rule.maximumTimeoutMs > timeoutMs ||
            (rule.shell !== null && rule.shell.executableIndex >= count) ||
            rule.commands.some(
                (command: ExecutionMachineCommand): boolean => command.executableIndex >= count,
            )
        ) {
            throw new Error('Machine invocation exceeds its pinned program authority');
        }
    }

    static #index(raw: unknown): number {
        return Data.count(raw, 0, Limits.executables - 1);
    }

    static #shell(raw: unknown): ExecutionMachineShell {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, [
            'executableIndex',
            'fixedArguments',
        ]);
        const fixedArguments: readonly string[] = Object.freeze(
            Data.array(value['fixedArguments'], Limits.fixedArguments).map((arg: unknown): string =>
                Data.text(arg, Limits.argumentBytes),
            ),
        );
        if (
            fixedArguments.reduce(
                (bytes: number, arg: string): number => bytes + Data.bytes(arg),
                0,
            ) > Limits.argumentsBytes
        ) {
            throw new Error('Fixed Machine shell arguments exceed their bound');
        }
        return Object.freeze({
            executableIndex: this.#index(value['executableIndex']),
            fixedArguments,
        });
    }
}

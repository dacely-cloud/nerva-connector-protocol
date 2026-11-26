// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from '../protocol/Boundary.js';
import { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
import { ExecutionMachineLimits as Limits, } from './ExecutionMachineInvocation.js';
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
/** Local policy and signed public profiles independently decode the same entire explicit Machine invocation grant. */
export class ExecutionMachineRuleCodec {
    /** Public fields contain finite aliases and table indexes, never private executable paths or digests. */
    static read(raw) {
        const value = Data.record(raw, [
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
        const shell = value['shell'] === null ? null : this.#shell(value['shell']);
        const commands = Object.freeze(Data.array(value['commands'], Limits.executables).map((item) => {
            const command = Data.record(item, [
                'alias',
                'executableIndex',
            ]);
            return Object.freeze({
                alias: Boundary.id(command['alias']),
                executableIndex: this.#index(command['executableIndex']),
            });
        }));
        const environment = Object.freeze(Data.array(value['environment'], Limits.environmentNames).map((item) => {
            const grant = Data.record(item, [
                'name',
                'maximumBytes',
            ]);
            return Object.freeze({
                name: Data.name(grant['name']),
                maximumBytes: Data.count(grant['maximumBytes'], 0, Limits.environmentBytes),
            });
        }));
        if ((shell === null && commands.length === 0) ||
            new Set(commands.map((command) => command.alias))
                .size !== commands.length ||
            new Set(environment.map((grant) => grant.name)).size !== environment.length) {
            throw new Error('Machine invocation grants must be explicit and unique');
        }
        const maximumScriptBytes = Data.count(value['maximumScriptBytes'], shell === null ? 0 : 1, Limits.scriptBytes);
        return Object.freeze({
            kind: ExecutionArgumentKind.MachineInvocation,
            shell,
            commands,
            maximumCwdBytes: Data.count(value['maximumCwdBytes'], 1, Limits.cwdBytes),
            environment,
            maximumEnvironmentBytes: Data.count(value['maximumEnvironmentBytes'], 0, Limits.environmentBytes),
            maximumStdinBytes: Data.count(value['maximumStdinBytes'], 0, Limits.stdinBytes),
            maximumTimeoutMs: Data.count(value['maximumTimeoutMs'], 100, Limits.timeoutMs),
            maximumArguments: Data.count(value['maximumArguments'], 0, Limits.argumentCount),
            maximumArgumentBytes: Data.count(value['maximumArgumentBytes'], 0, Limits.argumentBytes),
            maximumArgumentsBytes: Data.count(value['maximumArgumentsBytes'], 0, Limits.argumentsBytes),
            maximumScriptBytes,
        });
    }
    /** Structured invocation cannot be mixed with positional literals, omitted or interpreted through an old text rule. */
    static placement(rules) {
        const selected = rules.find((rule) => rule.kind === ExecutionArgumentKind.MachineInvocation);
        if (selected === undefined) {
            return null;
        }
        if (rules.length !== 1 || selected.kind !== ExecutionArgumentKind.MachineInvocation) {
            throw new Error('Machine invocation must be the sole argument rule');
        }
        return selected;
    }
    /** Local policy indexes resolve only existing pinned binaries and cannot exceed its independent wall-time ceiling. */
    static program(program, timeoutMs) {
        const rule = this.placement(program.arguments);
        if (rule === null) {
            return;
        }
        const count = 1 + program.children.length;
        if (rule.maximumTimeoutMs > timeoutMs ||
            (rule.shell !== null && rule.shell.executableIndex >= count) ||
            rule.commands.some((command) => command.executableIndex >= count)) {
            throw new Error('Machine invocation exceeds its pinned program authority');
        }
    }
    static #index(raw) {
        return Data.count(raw, 0, Limits.executables - 1);
    }
    static #shell(raw) {
        const value = Data.record(raw, [
            'executableIndex',
            'fixedArguments',
        ]);
        const fixedArguments = Object.freeze(Data.array(value['fixedArguments'], Limits.fixedArguments).map((arg) => Data.text(arg, Limits.argumentBytes)));
        if (fixedArguments.reduce((bytes, arg) => bytes + Data.bytes(arg), 0) > Limits.argumentsBytes) {
            throw new Error('Fixed Machine shell arguments exceed their bound');
        }
        return Object.freeze({
            executableIndex: this.#index(value['executableIndex']),
            fixedArguments,
        });
    }
}

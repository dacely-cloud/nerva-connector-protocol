// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import {
    ExecutionMachineLimits as Limits,
    ExecutionMachineMode,
    type ExecutionMachineInvocationRule,
    type ExecutionMachineInvocation,
    type ExecutionMachineInput,
    type ExecutionMachineCommand,
    type ExecutionMachineEnvironmentGrant,
    type ExecutionMachineEnvironmentValue,
    type ExecutionMachinePlan,
} from './ExecutionMachineInvocation.js';

/** One exact signed string carries a closed invocation; this codec never starts processes or interprets arbitrary text as authority. */
export class ExecutionMachineInvocationCodec {
    /** Input is bounded before parsing, and alternate key ordering, duplicate JSON keys or escaping is rejected. */
    public static decode(
        rule: ExecutionMachineInvocationRule,
        json: string,
    ): ExecutionMachineInvocation {
        if (
            typeof json !== 'string' ||
            !json.isWellFormed() ||
            Data.bytes(json) > Limits.payloadBytes
        ) {
            throw new Error('Machine invocation payload exceeds its argument bound');
        }
        const raw: unknown = JSON.parse(json);
        const invocation: ExecutionMachineInvocation = this.read(rule, raw);
        if (JSON.stringify(invocation) !== json) {
            throw new Error('Machine invocation payload must be canonical JSON');
        }
        return invocation;
    }

    /** Trusted adapters construct canonical payloads only after the same local-grant and envelope validation. */
    public static encode(rule: ExecutionMachineInvocationRule, raw: unknown): string {
        const invocation: ExecutionMachineInvocation = this.read(rule, raw);
        return JSON.stringify(invocation);
    }

    /** Complete immutable inputs retain empty stdin/environment explicitly rather than inheriting host state. */
    public static read(
        rule: ExecutionMachineInvocationRule,
        raw: unknown,
    ): ExecutionMachineInvocation {
        const value: Readonly<Record<string, unknown>> = Data.record(raw, this.#fields(raw));
        const base: ExecutionMachineInput = {
            cwd: Data.cwd(value['cwd'], rule.maximumCwdBytes),
            environment: this.#environment(rule, value['environment']),
            stdin: Data.data(value['stdin'], rule.maximumStdinBytes),
            timeoutMs: Data.count(value['timeoutMs'], 100, rule.maximumTimeoutMs),
        };
        if (value['mode'] === ExecutionMachineMode.Shell) {
            if (rule.shell === null) {
                throw new Error('Machine shell execution was not locally granted');
            }
            const invocation: ExecutionMachineInvocation = Object.freeze({
                mode: ExecutionMachineMode.Shell,
                script: Data.text(value['script'], rule.maximumScriptBytes),
                ...base,
            });
            return this.#bounded(invocation);
        }
        if (value['mode'] !== ExecutionMachineMode.Argv) {
            throw new Error('Unsupported Machine invocation mode');
        }
        const command: string = Boundary.id(value['command']);
        if (
            !rule.commands.some(
                (entry: ExecutionMachineCommand): boolean => entry.alias === command,
            )
        ) {
            throw new Error('Machine command alias was not locally granted');
        }
        const argv: readonly string[] = Object.freeze(
            Data.array(value['argv'], rule.maximumArguments).map((arg: unknown): string =>
                Data.text(arg, rule.maximumArgumentBytes),
            ),
        );
        if (
            argv.reduce((bytes: number, arg: string): number => bytes + Data.bytes(arg), 0) >
            rule.maximumArgumentsBytes
        ) {
            throw new Error('Machine argv exceeds its granted aggregate byte bound');
        }
        return this.#bounded(
            Object.freeze({ mode: ExecutionMachineMode.Argv, command, argv, ...base }),
        );
    }

    /** Resolve only the owning program's pinned binary table; the structured JSON is never forwarded as a literal argv entry. */
    public static resolve(
        rule: ExecutionMachineInvocationRule,
        json: string,
    ): ExecutionMachinePlan {
        const invocation: ExecutionMachineInvocation = this.decode(rule, json);
        let executableIndex: number;
        let args: readonly string[];
        if (invocation.mode === ExecutionMachineMode.Shell) {
            if (rule.shell === null) {
                throw new Error('Machine shell grant changed');
            }
            executableIndex = rule.shell.executableIndex;
            args = Object.freeze([...rule.shell.fixedArguments, invocation.script]);
        } else {
            const command: ExecutionMachineCommand | undefined = rule.commands.find(
                (entry: ExecutionMachineCommand): boolean => entry.alias === invocation.command,
            );
            if (command === undefined) {
                throw new Error('Machine argv grant changed');
            }
            executableIndex = command.executableIndex;
            args = invocation.argv;
        }
        if (
            args.length > 32 ||
            args.reduce((bytes: number, arg: string): number => bytes + Data.bytes(arg), 0) > 8192
        ) {
            throw new Error('Resolved Machine argv exceeds the native argument bound');
        }
        return Object.freeze({
            executableIndex,
            arguments: args,
            cwd: invocation.cwd,
            environment: invocation.environment,
            stdin: invocation.stdin,
            timeoutMs: invocation.timeoutMs,
        });
    }

    static #fields(raw: unknown): readonly string[] {
        if (typeof raw !== 'object' || raw === null) {
            throw new Error('Explicit Machine invocation mode required');
        }
        const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(
            raw,
            'mode',
        );
        if (descriptor === undefined || !Object.hasOwn(descriptor, 'value')) {
            throw new Error('Explicit Machine invocation mode required');
        }
        const mode: unknown = descriptor.value;
        const common: readonly string[] = ['cwd', 'environment', 'stdin', 'timeoutMs'];
        if (mode === ExecutionMachineMode.Shell) {
            return ['mode', 'script', ...common];
        }
        if (mode === ExecutionMachineMode.Argv) {
            return ['mode', 'command', 'argv', ...common];
        }
        throw new Error('Unsupported Machine invocation mode');
    }

    static #environment(
        rule: ExecutionMachineInvocationRule,
        raw: unknown,
    ): readonly ExecutionMachineEnvironmentValue[] {
        const environment: ExecutionMachineEnvironmentValue[] = [];
        let previous: string | null = null;
        let bytes: number = 0;
        for (const item of Data.array(raw, Limits.environmentNames)) {
            const entry: Readonly<Record<string, unknown>> = Data.record(item, ['name', 'value']);
            const name: string = Data.name(entry['name']);
            const grant: ExecutionMachineEnvironmentGrant | undefined = rule.environment.find(
                (candidate: ExecutionMachineEnvironmentGrant): boolean => candidate.name === name,
            );
            if (grant === undefined || (previous !== null && previous >= name)) {
                throw new Error('Machine environment must be granted, unique and ordered');
            }
            const value: string = Data.text(entry['value'], grant.maximumBytes);
            bytes += Data.bytes(name) + Data.bytes(value);
            if (bytes > rule.maximumEnvironmentBytes) {
                throw new Error('Machine environment exceeds its granted aggregate byte bound');
            }
            previous = name;
            environment.push(Object.freeze({ name, value }));
        }
        return Object.freeze(environment);
    }

    static #bounded(invocation: ExecutionMachineInvocation): ExecutionMachineInvocation {
        if (Data.bytes(JSON.stringify(invocation)) > Limits.payloadBytes) {
            throw new Error('Encoded Machine invocation exceeds its argument bound');
        }
        return invocation;
    }
}

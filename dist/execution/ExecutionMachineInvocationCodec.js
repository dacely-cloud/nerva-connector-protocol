// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from '../protocol/Boundary.js';
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import { ExecutionMachineLimits as Limits, ExecutionMachineMode, } from './ExecutionMachineInvocation.js';
/** One exact signed string carries a closed invocation; this codec never starts processes or interprets arbitrary text as authority. */
export class ExecutionMachineInvocationCodec {
    /** Input is bounded before parsing, and alternate key ordering, duplicate JSON keys or escaping is rejected. */
    static decode(rule, json) {
        if (typeof json !== 'string' ||
            !json.isWellFormed() ||
            Data.bytes(json) > Limits.payloadBytes) {
            throw new Error('Machine invocation payload exceeds its argument bound');
        }
        const raw = JSON.parse(json);
        const invocation = this.read(rule, raw);
        if (JSON.stringify(invocation) !== json) {
            throw new Error('Machine invocation payload must be canonical JSON');
        }
        return invocation;
    }
    /** Trusted adapters construct canonical payloads only after the same local-grant and envelope validation. */
    static encode(rule, raw) {
        const invocation = this.read(rule, raw);
        return JSON.stringify(invocation);
    }
    /** Complete immutable inputs retain empty stdin/environment explicitly rather than inheriting host state. */
    static read(rule, raw) {
        const value = Data.record(raw, this.#fields(raw));
        const base = {
            cwd: Data.cwd(value['cwd'], rule.maximumCwdBytes),
            environment: this.#environment(rule, value['environment']),
            stdin: Data.data(value['stdin'], rule.maximumStdinBytes),
            timeoutMs: Data.count(value['timeoutMs'], 100, rule.maximumTimeoutMs),
        };
        if (value['mode'] === ExecutionMachineMode.Shell) {
            if (rule.shell === null) {
                throw new Error('Machine shell execution was not locally granted');
            }
            const invocation = Object.freeze({
                mode: ExecutionMachineMode.Shell,
                script: Data.text(value['script'], rule.maximumScriptBytes),
                ...base,
            });
            return this.#bounded(invocation);
        }
        if (value['mode'] !== ExecutionMachineMode.Argv) {
            throw new Error('Unsupported Machine invocation mode');
        }
        const command = Boundary.id(value['command']);
        if (!rule.commands.some((entry) => entry.alias === command)) {
            throw new Error('Machine command alias was not locally granted');
        }
        const argv = Object.freeze(Data.array(value['argv'], rule.maximumArguments).map((arg) => Data.text(arg, rule.maximumArgumentBytes)));
        if (argv.reduce((bytes, arg) => bytes + Data.bytes(arg), 0) >
            rule.maximumArgumentsBytes) {
            throw new Error('Machine argv exceeds its granted aggregate byte bound');
        }
        return this.#bounded(Object.freeze({ mode: ExecutionMachineMode.Argv, command, argv, ...base }));
    }
    /** Resolve only the owning program's pinned binary table; the structured JSON is never forwarded as a literal argv entry. */
    static resolve(rule, json) {
        const invocation = this.decode(rule, json);
        let executableIndex;
        let args;
        if (invocation.mode === ExecutionMachineMode.Shell) {
            if (rule.shell === null) {
                throw new Error('Machine shell grant changed');
            }
            executableIndex = rule.shell.executableIndex;
            args = Object.freeze([...rule.shell.fixedArguments, invocation.script]);
        }
        else {
            const command = rule.commands.find((entry) => entry.alias === invocation.command);
            if (command === undefined) {
                throw new Error('Machine argv grant changed');
            }
            executableIndex = command.executableIndex;
            args = invocation.argv;
        }
        if (args.length > 32 ||
            args.reduce((bytes, arg) => bytes + Data.bytes(arg), 0) > 8192) {
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
    static #fields(raw) {
        if (typeof raw !== 'object' || raw === null) {
            throw new Error('Explicit Machine invocation mode required');
        }
        const descriptor = Object.getOwnPropertyDescriptor(raw, 'mode');
        if (descriptor === undefined || !Object.hasOwn(descriptor, 'value')) {
            throw new Error('Explicit Machine invocation mode required');
        }
        const mode = descriptor.value;
        const common = ['cwd', 'environment', 'stdin', 'timeoutMs'];
        if (mode === ExecutionMachineMode.Shell) {
            return ['mode', 'script', ...common];
        }
        if (mode === ExecutionMachineMode.Argv) {
            return ['mode', 'command', 'argv', ...common];
        }
        throw new Error('Unsupported Machine invocation mode');
    }
    static #environment(rule, raw) {
        const environment = [];
        let previous = null;
        let bytes = 0;
        for (const item of Data.array(raw, Limits.environmentNames)) {
            const entry = Data.record(item, ['name', 'value']);
            const name = Data.name(entry['name']);
            const grant = rule.environment.find((candidate) => candidate.name === name);
            if (grant === undefined || (previous !== null && previous >= name)) {
                throw new Error('Machine environment must be granted, unique and ordered');
            }
            const value = Data.text(entry['value'], grant.maximumBytes);
            bytes += Data.bytes(name) + Data.bytes(value);
            if (bytes > rule.maximumEnvironmentBytes) {
                throw new Error('Machine environment exceeds its granted aggregate byte bound');
            }
            previous = name;
            environment.push(Object.freeze({ name, value }));
        }
        return Object.freeze(environment);
    }
    static #bounded(invocation) {
        if (Data.bytes(JSON.stringify(invocation)) > Limits.payloadBytes) {
            throw new Error('Encoded Machine invocation exceeds its argument bound');
        }
        return invocation;
    }
}

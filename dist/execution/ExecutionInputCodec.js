// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from '../protocol/Boundary.js';
import { ExecutionMachineBoundary } from './ExecutionMachineBoundary.js';
import { ExecutionMachineRuleCodec } from './ExecutionMachineRuleCodec.js';
import { ExecutionInteractiveRuleCodec } from './ExecutionInteractiveRuleCodec.js';
import { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
/** Pure finite input grammar is enforced independently by account admission and the local execution owner. */
export class ExecutionInputCodec {
    /** Variable arguments are validated independently of a program's interpretation and never shell-joined. */
    static invocation(raw) {
        const value = Boundary.record(raw, [
            'policySha256',
            'programId',
            'rootId',
            'arguments',
        ]);
        const args = ExecutionMachineBoundary.array(value['arguments'], 32).map((arg) => this.#argument(arg));
        if (args.reduce((size, arg) => size + ExecutionMachineBoundary.bytes(arg), 0) > 8192) {
            throw new Error('Execution arguments exceed their byte limit');
        }
        return {
            policySha256: this.digest(value['policySha256']),
            programId: Boundary.id(value['programId']),
            rootId: Boundary.id(value['rootId']),
            arguments: args,
        };
    }
    /** Fixed positions are inserted locally; variable input cannot add switches, trailing arguments or environment values. */
    static arguments(program, input) {
        let index = 0;
        const args = program.arguments.map((rule) => {
            if (rule.kind === ExecutionArgumentKind.MachineInvocation ||
                rule.kind === ExecutionArgumentKind.InteractiveInvocation) {
                throw new Error('Structured invocation requires its typed native plan resolver');
            }
            if (rule.kind === ExecutionArgumentKind.Literal) {
                return rule.value;
            }
            const value = input[index++];
            if (value === undefined ||
                (rule.kind === ExecutionArgumentKind.Choice
                    ? !rule.values.includes(value)
                    : ExecutionMachineBoundary.bytes(value) > rule.maximumBytes)) {
                throw new Error('Execution argument denied by local policy');
            }
            if (rule.kind === ExecutionArgumentKind.RelativePath &&
                (value.length === 0 ||
                    value.startsWith('-') ||
                    value.startsWith('/') ||
                    value
                        .split('/')
                        .some((part) => part === '' || part === '.' || part === '..') ||
                    Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127))) {
                throw new Error('Execution relative path denied');
            }
            return value;
        });
        if (index !== input.length ||
            args.reduce((size, arg) => size + ExecutionMachineBoundary.bytes(arg), 0) > 8192) {
            throw new Error('Execution argument shape changed');
        }
        return args;
    }
    /** Digests authenticate locally reviewed bytes only when the policy itself came from trusted installation. */
    static digest(raw) {
        if (typeof raw !== 'string' || !/^[a-f0-9]{64}$/u.test(raw)) {
            throw new Error('Explicit executable digest required');
        }
        return raw;
    }
    static #argument(raw) {
        if (typeof raw !== 'string' ||
            !raw.isWellFormed() ||
            raw.includes('\0') ||
            ExecutionMachineBoundary.bytes(raw) > 4096) {
            throw new Error('Invalid bounded execution argument');
        }
        return raw;
    }
    /** The same strict argument grammar governs local policy and published variable-position grants. */
    static argumentRule(raw) {
        const descriptor = typeof raw === 'object' && raw !== null
            ? Object.getOwnPropertyDescriptor(raw, 'kind')
            : undefined;
        if (descriptor === undefined ||
            descriptor.enumerable !== true ||
            !Object.hasOwn(descriptor, 'value')) {
            throw new Error('Explicit execution argument kind data required');
        }
        const kind = descriptor.value;
        if (kind === ExecutionArgumentKind.MachineInvocation) {
            return ExecutionMachineRuleCodec.read(raw);
        }
        if (kind === ExecutionArgumentKind.InteractiveInvocation) {
            return ExecutionInteractiveRuleCodec.read(raw);
        }
        let fields;
        if (kind === ExecutionArgumentKind.Literal) {
            fields = ['kind', 'value'];
        }
        else if (kind === ExecutionArgumentKind.Choice) {
            fields = ['kind', 'values'];
        }
        else if (kind === ExecutionArgumentKind.Text ||
            kind === ExecutionArgumentKind.RelativePath) {
            fields = ['kind', 'maximumBytes'];
        }
        else {
            throw new Error('Unsupported execution argument rule');
        }
        const value = ExecutionMachineBoundary.record(raw, fields);
        if (value['kind'] === ExecutionArgumentKind.Literal) {
            return { kind: ExecutionArgumentKind.Literal, value: this.#argument(value['value']) };
        }
        if (value['kind'] === ExecutionArgumentKind.Choice) {
            const values = ExecutionMachineBoundary.array(value['values'], 16).map((arg) => this.#argument(arg));
            if (values.length === 0 || new Set(values).size !== values.length) {
                throw new Error('Explicit unique argument choices required');
            }
            return { kind: ExecutionArgumentKind.Choice, values };
        }
        if (value['kind'] === ExecutionArgumentKind.Text ||
            value['kind'] === ExecutionArgumentKind.RelativePath) {
            const maximumBytes = Boundary.count(value['maximumBytes'], 4096);
            if (maximumBytes === 0) {
                throw new Error('Positive argument byte limit required');
            }
            return { kind: value['kind'], maximumBytes };
        }
        throw new Error('Unsupported execution argument rule');
    }
}

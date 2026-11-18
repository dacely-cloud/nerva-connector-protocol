// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionMachineBoundary as Data } from './ExecutionMachineBoundary.js';
import { ExecutionMachineRuleCodec } from './ExecutionMachineRuleCodec.js';
import { ExecutionArgumentKind } from './ExecutionArgumentKind.js';
import { ExecutionInteractiveFields as Fields, ExecutionInteractiveEncoding as Encoding, } from './ExecutionInteractiveFields.js';
import { ExecutionInputKind } from './ExecutionInput.js';
import { ExecutionInteractiveTransport, ExecutionInteractiveLimits as Limits, } from './ExecutionInteractive.js';
/** Explicit bounded input authority is decoded independently from process launch and native readiness. */
export class ExecutionInteractiveRuleCodec {
    /** Public wire byte counters are canonical decimal strings, never rounded JSON numbers. */
    static read(raw) {
        return this.#read(raw, Encoding.Wire);
    }
    /** Trusted projections still detach every field and validate internal integer precision. */
    static body(value) {
        return this.#read(value, Encoding.Internal);
    }
    /** A complete interactive grant cannot coexist with foreground or positional arguments. */
    static placement(rules) {
        const selected = rules.find((rule) => rule.kind === ExecutionArgumentKind.InteractiveInvocation);
        if (selected === undefined) {
            return null;
        }
        if (rules.length !== 1 || selected.kind !== ExecutionArgumentKind.InteractiveInvocation) {
            throw new Error('Interactive invocation must be the sole argument rule');
        }
        return selected;
    }
    /** A nested Machine grant retains the profile's independent wall-time ceiling. */
    static profile(rules, timeoutMs) {
        const rule = this.placement(rules);
        if (rule !== null && rule.invocation.maximumTimeoutMs > timeoutMs) {
            throw new Error('Interactive timeout exceeds its execution profile');
        }
    }
    static #read(raw, encoding) {
        const value = Data.record(raw, [
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
        const transports = Object.freeze(Data.array(value['transports'], 2).map((entry) => {
            if (entry === ExecutionInteractiveTransport.Pipe.valueOf()) {
                return ExecutionInteractiveTransport.Pipe;
            }
            if (entry === ExecutionInteractiveTransport.Pty.valueOf()) {
                return ExecutionInteractiveTransport.Pty;
            }
            throw new Error('Unsupported interactive transport grant');
        }));
        const controls = Object.freeze(Data.array(value['controls'], 3).map((entry) => {
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
        }));
        const maximumResizes = Data.count(value['maximumResizes'], 0, Number(Limits.resizes));
        if (transports.length === 0 ||
            new Set(transports).size !== transports.length ||
            new Set(controls).size !== controls.length ||
            !controls.includes(ExecutionInputKind.Data) ||
            (controls.includes(ExecutionInputKind.End) &&
                !transports.includes(ExecutionInteractiveTransport.Pipe)) ||
            (controls.includes(ExecutionInputKind.Resize) &&
                !transports.includes(ExecutionInteractiveTransport.Pty)) ||
            controls.includes(ExecutionInputKind.Resize) !== maximumResizes > 0) {
            throw new Error('Interactive controls must be unique and match their explicit transport');
        }
        const maximumControls = Data.count(value['maximumControls'], 1, Number(Limits.controls));
        if (maximumResizes >= maximumControls) {
            throw new Error('Interactive resize budget must leave initial input record zero');
        }
        return Object.freeze({
            kind: ExecutionArgumentKind.InteractiveInvocation,
            invocation: ExecutionMachineRuleCodec.read(value['invocation']),
            transports,
            controls,
            maximumInputBytes: Fields.counter(value['maximumInputBytes'], encoding, 0n, Limits.inputBytes),
            maximumControls,
            maximumResizes,
        });
    }
}

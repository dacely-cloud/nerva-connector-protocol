// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import {
    ExecutionInteractiveFields as Fields,
    ExecutionInteractiveEncoding as Encoding,
} from './ExecutionInteractiveFields.js';
import { ExecutionInteractiveLimits as Limits } from './ExecutionInteractive.js';
import type { ExecutionInputIdentity, ExecutionInputOriginal } from './ExecutionInput.js';

/** A receipt cannot adopt whichever job, dispatch, Ready proof or input currently happens to be visible. */
export class ExecutionInputIdentityCodec {
    public static capture(
        value: Readonly<Record<string, unknown>>,
        encoding: Encoding,
    ): ExecutionInputIdentity {
        const inputSequence: bigint = Fields.counter(
            value['inputSequence'],
            encoding,
            0n,
            Limits.maximumInputSequence,
        );
        const inputId: string = Boundary.id(value['inputId']);
        if ((inputSequence === 0n) !== (inputId === Limits.initialInputId)) {
            throw new Error('Reserved initial input identity changed');
        }
        return Object.freeze({
            ...Fields.original(value, encoding),
            readySha256: Fields.digest(value['readySha256']),
            inputId,
            inputSequence,
            inputHash: Fields.digest(value['inputHash']),
        });
    }

    public static matches(
        value: ExecutionInputIdentity,
        input: ExecutionInputOriginal,
        inputHash: string,
    ): boolean {
        return (
            Fields.sameOriginal(value, input) &&
            value.readySha256 === input.readySha256 &&
            value.inputId === input.inputId &&
            value.inputSequence === input.inputSequence &&
            value.inputHash === inputHash
        );
    }
}

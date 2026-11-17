// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ExecutionLane } from './ExecutionLane.js';

/** Lane admission is shared by foreground and interactive codecs without importing job codecs. */
export class ExecutionLaneCodec {
    /** A caller cannot allocate arbitrary replay journals or increase concurrency through new lane names. */
    public static read(raw: unknown): ExecutionLane {
        const lane: ExecutionLane | undefined = Object.values(ExecutionLane).find(
            (entry: ExecutionLane): boolean => entry.valueOf() === raw,
        );
        if (lane === undefined) {
            throw new Error('Explicit bounded execution lane required');
        }
        return lane;
    }
}

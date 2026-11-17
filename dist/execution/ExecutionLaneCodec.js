// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ExecutionLane } from './ExecutionLane.js';
/** Lane admission is shared by foreground and interactive codecs without importing job codecs. */
export class ExecutionLaneCodec {
    /** A caller cannot allocate arbitrary replay journals or increase concurrency through new lane names. */
    static read(raw) {
        const lane = Object.values(ExecutionLane).find((entry) => entry.valueOf() === raw);
        if (lane === undefined) {
            throw new Error('Explicit bounded execution lane required');
        }
        return lane;
    }
}

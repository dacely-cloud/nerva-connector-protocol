// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Read-side hints cannot cross native process and terminal handle families. */
export const ConnectorHostObservationKind = { Process: 'process', Terminal: 'terminal' };
/** Read-side budgets are independent of effect admission and retained binary ring limits. */
export const ConnectorHostObservationLimits = {
    Entries: 32,
    FrameBytes: 65536,
    PermitMs: 30000n,
    WaitMs: 25000,
    BatchesPerSecond: 4,
};

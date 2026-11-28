// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Read-side hints cannot cross native process and terminal handle families. */
export const ConnectorHostObservationKind = { Process: 'process', Terminal: 'terminal' };
/**
 * Read-side wire budgets, independent of effect admission and retained binary ring limits.
 *
 * @remarks
 * `ChangesPerBatch` sizes one signed changed or acknowledgment batch so it fits a frame. It is not
 * a cap on observed sources: a connector with more dirty sources sends them across further batches.
 */
export const ConnectorHostObservationLimits = {
    ChangesPerBatch: 32,
    FrameBytes: 65536,
    PermitMs: 30000n,
    WaitMs: 25000,
    BatchesPerSecond: 4,
};

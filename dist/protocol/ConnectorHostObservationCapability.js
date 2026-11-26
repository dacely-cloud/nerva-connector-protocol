// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Companion resources cannot borrow primary effect-lane queues, authentication slots or shutdown authority. */
export const ConnectorHostObservationCapabilityLimits = {
    protocol: 'nerva-connector-host-observation-v1',
    capabilityBytes: 32768,
    activationBytes: 16384,
    frameBytes: 65536,
    handshakeMs: 10000,
};

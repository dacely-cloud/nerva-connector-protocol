// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** The metadata socket has no execution, native input, file or primary authentication frames. */
export const ConnectorHostObservationFrameKind = {
    Hello: 'hello',
    Challenge: 'challenge',
    Capability: 'capability',
    Activation: 'activation',
    Permit: 'permit',
    Ready: 'ready',
    Changed: 'changed',
    Acknowledgment: 'acknowledgment',
};

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** The reserved field is transport metadata and can never come from an ordinary raw host submission. */
export const ConnectorHostObservedStart = {
    Field: '__nervaHostObservation',
    Protocol: 'host-read-hints-v1',
};

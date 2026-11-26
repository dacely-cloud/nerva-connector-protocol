// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorAuthorization } from './ConnectorAuthorization.js';

/** One finite original dispatch, independent of a reconnect lease, identifies the permitted local effect. */
export interface ConnectorOperationDispatch<TRequest> {
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly authorization: ConnectorAuthorization;
    readonly admissionHash: string;
    readonly request: TRequest;
}

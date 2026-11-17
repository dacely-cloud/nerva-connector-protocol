// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Initial bounded enrollment policy; history is never silently expired, reused or deleted to regain quota. */
export class ConnectorEnrollmentLimits {
    /** Maximum retained invitation records per account, including consumed, expired and revoked history. */
    public static readonly maximumEnrollments: number = 128;
    /** Bootstrap authorization lasts ten minutes according to the database clock. */
    public static readonly lifetimeMs: number = 600000;
}

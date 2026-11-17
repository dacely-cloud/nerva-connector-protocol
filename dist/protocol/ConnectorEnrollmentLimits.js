// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Initial bounded enrollment policy; history is never silently expired, reused or deleted to regain quota. */
export class ConnectorEnrollmentLimits {
    /** Maximum retained invitation records per account, including consumed, expired and revoked history. */
    static maximumEnrollments = 128;
    /** Bootstrap authorization lasts ten minutes according to the database clock. */
    static lifetimeMs = 600000;
}

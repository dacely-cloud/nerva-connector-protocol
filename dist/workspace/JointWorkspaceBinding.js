// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Resource ceilings apply before parsing transport text or allocating cryptographic work. */
export class JointWorkspaceLimits {
    /** The complete body has fixed fields and bounded identifiers. */
    static bodyBytes = 2048;
    /** Composite signatures and the complete body fit a fixed independent envelope budget. */
    static descriptorBytes = 8192;
}

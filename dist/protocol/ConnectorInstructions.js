// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** The instruction bound applies to UTF-8 bytes before persistence or prompt construction. */
export class ConnectorInstructionsLimits {
    /** Sixteen KiB accommodates connector-specific workflows while bounding account responses. */
    static bytes = 16384;
}

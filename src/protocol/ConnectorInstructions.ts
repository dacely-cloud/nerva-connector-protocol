// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Account-owned connector guidance never grants filesystem, execution or device authority. */
export interface ConnectorInstructionsView {
    readonly enrollmentId: string;
    readonly instructions: string;
    readonly revision: bigint;
}

/** An optimistic update preserves the caller's observed settings revision. Empty text clears guidance. */
export interface ConnectorInstructionsUpdate {
    readonly instructions: string;
    readonly expectedRevision: bigint;
}

/** The instruction bound applies to UTF-8 bytes before persistence or prompt construction. */
export class ConnectorInstructionsLimits {
    /** Sixteen KiB accommodates connector-specific workflows while bounding account responses. */
    public static readonly bytes: number = 16384;
}

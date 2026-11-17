// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Platform labels are finite; unsupported platforms cannot masquerade as qualified Linux installations. */
export enum SystemPlatform {
    Linux = 'linux',
    Windows = 'windows',
    MacOs = 'macos',
    Other = 'other',
}

/** Missing driver access is different from a successful empty inventory. */
export enum GpuInventoryState {
    Reported = 'reported',
    Unavailable = 'unavailable',
}

/** Vendor identities remain separate from compute support and memory availability. */
export enum GpuVendor {
    Nvidia = 'nvidia',
    Amd = 'amd',
    Intel = 'intel',
    Other = 'other',
}

/** Device identifiers and available VRAM support explicit selection without model-authored shell probing. */
export interface GpuSpecification {
    readonly id: string;
    readonly vendor: GpuVendor;
    readonly model: string;
    readonly totalVramBytes: string | null;
    readonly availableVramBytes: string | null;
}

/** One GPU's load, taken in the same sample as its computer's usage. */
export interface GpuUsage {
    /** The reported GPU this load belongs to. */
    readonly id: string;
    /** Busy share of the sampling interval, from 0 to 10000 basis points; null when the driver does not say. */
    readonly utilizationBasisPoints: number | null;
    /** Video memory in use at sampling time; null when the driver does not say. */
    readonly usedVramBytes: string | null;
}

/**
 * How busy the computer was over one short sampling interval.
 *
 * @remarks
 * Percentages are integer basis points (0 to 10000) and rates are exact byte integers, so no
 * floating-point value crosses the signed boundary. A null rate means this platform has no
 * reading yet, which is different from an idle link.
 */
export interface SystemUsage {
    readonly sampledAtMs: string;
    /** Length of the interval the CPU share and rates were measured over. */
    readonly intervalMs: number;
    readonly cpuBasisPoints: number;
    readonly networkReceiveBytesPerSecond: string | null;
    readonly networkTransmitBytesPerSecond: string | null;
    readonly gpus: readonly GpuUsage[];
}

/** Account-visible metadata contains no IP address, username, process list, mount paths or credentials. */
export interface SystemSpecification {
    readonly observedAtMs: string;
    readonly platform: SystemPlatform;
    readonly architecture: string;
    readonly osRelease: string;
    readonly cpuModel: string;
    readonly logicalCpuCount: number;
    readonly totalMemoryBytes: string;
    readonly availableMemoryBytes: string;
    readonly gpuState: GpuInventoryState;
    readonly gpus: readonly GpuSpecification[];
    /** Live load from a connector that samples it; absent from older connectors. */
    readonly usage?: SystemUsage;
}

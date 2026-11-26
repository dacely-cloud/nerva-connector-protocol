// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from '../protocol/Boundary.js';
import {
    SystemPlatform,
    GpuInventoryState,
    GpuVendor,
    type SystemSpecification,
    type GpuSpecification,
    type GpuUsage,
    type SystemUsage,
} from './SystemSpecification.js';

/** Signed metadata remains untrusted self-reporting; validate every field before presenting or storing it. */
export class SystemSpecificationCodec {
    /** Unknown or unavailable GPUs never become an asserted empty successful inventory. */
    public static read(raw: unknown): SystemSpecification {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'observedAtMs',
            'platform',
            'architecture',
            'osRelease',
            'cpuModel',
            'logicalCpuCount',
            'totalMemoryBytes',
            'availableMemoryBytes',
            'gpuState',
            'gpus',
            'usage',
        ]);
        const platform: SystemPlatform | undefined = Object.values(SystemPlatform).find(
            (entry: SystemPlatform): boolean => entry.valueOf() === value['platform'],
        );
        const gpuState: GpuInventoryState | undefined = Object.values(GpuInventoryState).find(
            (entry: GpuInventoryState): boolean => entry.valueOf() === value['gpuState'],
        );
        const cpus: number = Boundary.count(value['logicalCpuCount'], 4096);
        const total: bigint = Boundary.integer(value['totalMemoryBytes']);
        const available: bigint = Boundary.integer(value['availableMemoryBytes']);
        const observed: bigint = Boundary.integer(value['observedAtMs']);
        const gpus: readonly GpuSpecification[] = Object.freeze(
            Boundary.array(value['gpus'], 32).map((entry: unknown): GpuSpecification =>
                this.gpu(entry),
            ),
        );
        if (
            platform === undefined ||
            gpuState === undefined ||
            cpus === 0 ||
            available > total ||
            observed > 8640000000000000n ||
            (gpuState === GpuInventoryState.Unavailable && gpus.length !== 0) ||
            new Set(gpus.map((gpu: GpuSpecification): string => gpu.id.toLowerCase())).size !==
                gpus.length
        ) {
            throw new Error('Invalid remote system specification');
        }
        const usage: SystemUsage | undefined =
            value['usage'] === undefined ? undefined : this.usage(value['usage'], observed, gpus);
        return Object.freeze({
            observedAtMs: observed.toString(),
            platform,
            architecture: this.#text(value['architecture']),
            osRelease: this.#text(value['osRelease']),
            cpuModel: this.#text(value['cpuModel']),
            logicalCpuCount: cpus,
            totalMemoryBytes: total.toString(),
            availableMemoryBytes: available.toString(),
            gpuState,
            gpus,
            ...(usage === undefined ? {} : { usage }),
        });
    }

    /**
     * Validates one live usage sample against the computer it was taken on.
     *
     * @remarks
     * The sample cannot postdate its specification, and each GPU load must name a reported GPU at
     * most once and never claim more video memory than that GPU has.
     */
    public static usage(
        raw: unknown,
        observedAtMs: bigint,
        gpus: readonly GpuSpecification[],
    ): SystemUsage {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'sampledAtMs',
            'intervalMs',
            'cpuBasisPoints',
            'networkReceiveBytesPerSecond',
            'networkTransmitBytesPerSecond',
            'gpus',
        ]);
        const sampled: bigint = Boundary.integer(value['sampledAtMs']);
        const interval: number = Boundary.count(value['intervalMs'], 600000);
        const cpu: number = Boundary.count(value['cpuBasisPoints'], 10000);
        const known: ReadonlyMap<string, GpuSpecification> = new Map(
            gpus.map((gpu: GpuSpecification): readonly [string, GpuSpecification] => [gpu.id, gpu]),
        );
        const loads: readonly GpuUsage[] = Object.freeze(
            Boundary.array(value['gpus'], 32).map((entry: unknown): GpuUsage =>
                this.#gpuUsage(entry, known),
            ),
        );
        if (
            sampled > observedAtMs ||
            interval < 100 ||
            new Set(loads.map((load: GpuUsage): string => load.id)).size !== loads.length
        ) {
            throw new Error('Invalid remote system usage');
        }
        return Object.freeze({
            sampledAtMs: sampled.toString(),
            intervalMs: interval,
            cpuBasisPoints: cpu,
            networkReceiveBytesPerSecond: this.#rate(value['networkReceiveBytesPerSecond']),
            networkTransmitBytesPerSecond: this.#rate(value['networkTransmitBytesPerSecond']),
            gpus: loads,
        });
    }

    static #rate(raw: unknown): string | null {
        return raw === null ? null : Boundary.integer(raw).toString();
    }

    static #gpuUsage(raw: unknown, known: ReadonlyMap<string, GpuSpecification>): GpuUsage {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'id',
            'utilizationBasisPoints',
            'usedVramBytes',
        ]);
        const gpu: GpuSpecification | undefined =
            typeof value['id'] === 'string' ? known.get(value['id']) : undefined;
        const utilization: number | null =
            value['utilizationBasisPoints'] === null
                ? null
                : Boundary.count(value['utilizationBasisPoints'], 10000);
        const used: bigint | null =
            value['usedVramBytes'] === null ? null : Boundary.integer(value['usedVramBytes']);
        if (
            gpu === undefined ||
            (used !== null && gpu.totalVramBytes !== null && used > BigInt(gpu.totalVramBytes))
        ) {
            throw new Error('Invalid remote GPU usage');
        }
        return Object.freeze({
            id: gpu.id,
            utilizationBasisPoints: utilization,
            usedVramBytes: used?.toString() ?? null,
        });
    }

    static #text(raw: unknown): string {
        const value: string = Boundary.text(raw);
        if (!value.isWellFormed()) {
            throw new Error('Malformed system metadata text');
        }
        return value;
    }

    /** Native and remote adapter records share exact bounds and vendor validation. */
    public static gpu(raw: unknown): GpuSpecification {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'id',
            'vendor',
            'model',
            'totalVramBytes',
            'availableVramBytes',
        ]);
        const total: bigint | null =
            value['totalVramBytes'] === null ? null : Boundary.integer(value['totalVramBytes']);
        const available: bigint | null =
            value['availableVramBytes'] === null
                ? null
                : Boundary.integer(value['availableVramBytes']);
        const vendor: GpuVendor | undefined = Object.values(GpuVendor).find(
            (entry: GpuVendor): boolean => entry.valueOf() === value['vendor'],
        );
        if (
            typeof value['id'] !== 'string' ||
            !/^(?:GPU-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}|DXGI-[a-f0-9]{8}-[a-f0-9]{8})$/iu.test(
                value['id'],
            ) ||
            vendor === undefined ||
            (/^GPU-/iu.test(value['id']) && vendor !== GpuVendor.Nvidia) ||
            (total !== null && available !== null && available > total)
        ) {
            throw new Error('Invalid remote GPU specification');
        }
        return Object.freeze({
            id: value['id'],
            vendor,
            model: this.#text(value['model']),
            totalVramBytes: total?.toString() ?? null,
            availableVramBytes: available?.toString() ?? null,
        });
    }
}

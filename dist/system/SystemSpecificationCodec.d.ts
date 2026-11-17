import { type SystemSpecification, type GpuSpecification, type SystemUsage } from './SystemSpecification.js';
/** Signed metadata remains untrusted self-reporting; validate every field before presenting or storing it. */
export declare class SystemSpecificationCodec {
    #private;
    /** Unknown or unavailable GPUs never become an asserted empty successful inventory. */
    static read(raw: unknown): SystemSpecification;
    /**
     * Validates one live usage sample against the computer it was taken on.
     *
     * @remarks
     * The sample cannot postdate its specification, and each GPU load must name a reported GPU at
     * most once and never claim more video memory than that GPU has.
     */
    static usage(raw: unknown, observedAtMs: bigint, gpus: readonly GpuSpecification[]): SystemUsage;
    /** Native and remote adapter records share exact bounds and vendor validation. */
    static gpu(raw: unknown): GpuSpecification;
}

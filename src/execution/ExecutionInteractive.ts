// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionLane } from './ExecutionLane.js';

/** Neither application pipes nor PTYs are implied by an existing foreground grant. */
export enum ExecutionInteractiveTransport {
    Pipe = 'pipe',
    Pty = 'pty',
}

/** Readiness and controls preserve the exact dispatched operation and native incarnation. */
export interface ExecutionInteractiveOriginal {
    readonly authorityId: string;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly lane: ExecutionLane;
    readonly jobId: string;
    readonly sequence: bigint;
    readonly dispatchId: string;
    readonly requestHash: string;
    readonly admissionHash: string;
    readonly transport: ExecutionInteractiveTransport;
    readonly incarnation: string;
}

/** PTY geometry is explicit; a pipe has null dimensions and never receives a resize. */
export interface ExecutionInteractiveDimensions {
    readonly cols: number;
    readonly rows: number;
}

/** Native readiness commits the reserved initial range without claiming that it was accepted. */
export interface ExecutionInteractiveReadyBody extends ExecutionInteractiveOriginal {
    readonly initialInputSequence: 0n;
    readonly initialInputBytes: bigint;
    readonly initialInputHash: string;
    readonly dimensions: ExecutionInteractiveDimensions | null;
    readonly executionDeadlineMs: bigint;
}

/** Both device signature components cover one complete immutable Ready body. */
export interface ExecutionInteractiveReady extends ExecutionInteractiveReadyBody {
    readonly signature: string;
}

/** These ceilings bound protocol work; they do not advertise an installed interactive capability. */
export class ExecutionInteractiveLimits {
    public static readonly frameBytes: number = 4096;
    public static readonly initialBytes: number = 1024;
    public static readonly inputBytes: bigint = 65536n;
    /** Initial record zero consumes one of the 256 total controls. */
    public static readonly controls: bigint = 256n;
    public static readonly maximumInputSequence: bigint = 255n;
    public static readonly resizes: bigint = 16n;
    public static readonly minimumCols: number = 2;
    public static readonly maximumCols: number = 500;
    public static readonly minimumRows: number = 1;
    public static readonly maximumRows: number = 200;
    public static readonly executionMs: bigint = 30000n;
    public static readonly outputBytes: number = 65536;
    /** 2484 composite signature bytes become exactly 3312 base64url characters. */
    public static readonly signatureBytes: number = 2484;
    public static readonly signatureCharacters: number = 3312;
    public static readonly readyJsonBytes: number = 8192;
    public static readonly inputJsonBytes: number = 8192;
    public static readonly permitJsonBytes: number = 16384;
    public static readonly receiptJsonBytes: number = 8192;
    public static readonly acknowledgmentJsonBytes: number = 8192;
    /** This is a fixed chain genesis, not a claim that input zero was accepted. */
    public static readonly genesisHash: string = '0'.repeat(64);
    public static readonly initialInputId: string = 'initial';
}

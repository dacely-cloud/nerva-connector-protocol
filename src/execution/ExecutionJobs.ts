// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ExecutionLane } from './ExecutionLane.js';

import type {
    ExecutionInvocation,
    ExecutionArgumentRule,
    ExecutionLiteralArgument,
} from './ExecutionPolicyTypes.js';
import type {
    ExecutionResourceLimits,
    ExecutionResult,
    ExecutionWorkspaceAccess,
} from './ExecutionTypes.js';
import type { ConnectorOperationDispatch } from '../protocol/ConnectorOperationDispatch.js';
import type { ConnectorJournalReceipt } from '../protocol/ConnectorJournalReceipt.js';

/** An explicit application request identity is part of the original payload commitment. */
export interface ExecutionRequest extends ExecutionInvocation {
    readonly requestId: string;
}

/** Fixed argument values are private local configuration and are never a public input grant. */
export type ExecutionInputRule<Integer extends bigint | string = bigint> = Exclude<
    ExecutionArgumentRule<Integer>,
    ExecutionLiteralArgument
>;

/** Public grants expose aliases and input rules, never executable paths, fixed private arguments or local state paths. */
export interface ExecutionProgramGrant<Integer extends bigint | string = bigint> {
    readonly id: string;
    readonly rootIds: readonly string[];
    readonly arguments: readonly ExecutionInputRule<Integer>[];
}

/** Workspace mutation is explicit and cannot be inferred from a file scope or an executable name. */
export interface ExecutionRootGrant {
    readonly id: string;
    readonly access: ExecutionWorkspaceAccess;
}

/** Exact local policy and hard ceilings are independently published under device proof. */
export interface ExecutionProfile<Integer extends bigint | string = bigint> {
    readonly revision: Integer;
    readonly policySha256: string;
    readonly roots: readonly ExecutionRootGrant[];
    readonly programs: readonly ExecutionProgramGrant<Integer>[];
    readonly resources: ExecutionResourceLimits<Integer>;
    readonly timeoutMs: number;
    readonly maximumAddressBytes: Integer;
    readonly maximumFileBytes: Integer;
}

/** Every execution proof binds the locally enrolled environment and current verified device lease. */
export interface ExecutionBinding {
    readonly lane: ExecutionLane;
    readonly environmentId: string;
    readonly enrollmentId: string;
    readonly leaseId: string;
}

/** A device publication binds the permanent journal identity rather than allowing a reconnect to reset counters. */
export interface ExecutionPublication extends ExecutionBinding {
    readonly profile: ExecutionProfile;
    readonly journalId: string;
    readonly signature: string;
}

/** A start deadline and a distinct hard execution deadline are covered by both server signatures. */
export interface ExecutionPermit
    extends ExecutionBinding, ConnectorOperationDispatch<ExecutionRequest> {
    readonly authorityId: string;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly executionDeadlineMs: bigint;
    readonly signature: string;
}

/** A separately signed stop names the exact original dispatch and current lease; it never authorizes starting a program. */
export interface ExecutionCancellation
    extends ExecutionBinding, ConnectorOperationDispatch<ExecutionRequest> {
    readonly authorityId: string;
    readonly issuedAtMs: bigint;
    readonly expiresAtMs: bigint;
    readonly signature: string;
}

/** A result cannot be changed, moved to another command or fabricated by a public transport edge. */
export interface ExecutionCompletion extends ExecutionBinding, ConnectorJournalReceipt {
    readonly response: ExecutionResult;
    readonly signature: string;
}

/** Only the pinned backend can authorize compaction after the exact original result commits. */
export interface ExecutionAcknowledgment extends ExecutionBinding, ConnectorJournalReceipt {
    readonly authorityId: string;
    readonly signature: string;
}

/** The backend may advance its permanent watermark only after this device-signed compaction receipt. */
export interface ExecutionAcknowledged extends ExecutionBinding, ConnectorJournalReceipt {
    readonly signature: string;
}

/** Bounded start authority does not authorize effects beyond the original execution deadline. */
export class ExecutionJobLimits {
    /** Original canonical request bytes are unchanged by separate authorization metadata. */
    public static readonly requestBytes: number = 16384;
    /** Full authorization and its commitment fit beside every valid original request. */
    public static readonly submissionBytes: number = 32768;
    /** A delayed or reconnected start requires a refreshed proof for the same original dispatch. */
    public static readonly permitMs: bigint = 10000n;
    /** The current native boundary has a finite thirty-second ceiling. */
    public static readonly executionMs: bigint = 30000n;
}

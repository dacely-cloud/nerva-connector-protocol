// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { createHash } from 'node:crypto';
import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { ExecutionLane } from '../execution/ExecutionLane.js';
import { JointWorkspaceProof } from '../workspace/JointWorkspaceProof.js';
import { ConnectorAuthorizationKind } from './ConnectorAuthorization.js';
import { ConnectorAuthorizationProof } from './ConnectorAuthorizationProof.js';
import { ConnectorMigrationPlanCodec } from './ConnectorMigrationPlanCodec.js';
import { ConnectorMigrationApprovalCodec } from './ConnectorMigrationApprovalCodec.js';
import { ConnectorMigrationAppliedCodec } from './ConnectorMigrationAppliedCodec.js';
import { ConnectorMigrationFields } from './ConnectorMigrationFields.js';
import { ConnectorAdmissionMigrationPayload } from './ConnectorAdmissionMigrationPayload.js';
import {
    ConnectorMigrationLane,
    type ConnectorMigrationExpected,
    type ConnectorMigrationScope,
    type ConnectorMigrationPlan,
    type ConnectorMigrationPlanBody,
    type ConnectorMigrationApproval,
    type ConnectorMigrationApprovalBody,
    type ConnectorMigrationApplied,
    type ConnectorMigrationAppliedBody,
    type ConnectorMigrationAdmission,
    type ConnectorMigrationSource,
    type ConnectorMigrationAuthorization,
    type ConnectorMigrationOriginal,
    type ConnectorMigrationReceipt,
    type ConnectorMigrationTarget,
} from './ConnectorAdmissionMigration.js';

/** Hybrid proofs certify only the exact stopped conversion; runtime admission and operation acknowledgements remain separate. */
export class ConnectorAdmissionMigrationProof {
    /** Complete original randomized device proof bytes are included in this immutable plan identity. */
    public static planSha256(plan: ConnectorMigrationPlan): string {
        return this.#sha256(ConnectorMigrationPlanCodec.encode(plan));
    }
    /** The full authority proof and original complete plan participate in the exact durable approval identity. */
    public static approvalSha256(approval: ConnectorMigrationApproval): string {
        return this.#sha256(ConnectorMigrationApprovalCodec.encode(approval));
    }
    /** Browser-safe canonical body transcript, excluding only the outer device signature. */
    public static planPayload(value: ConnectorMigrationPlanBody): Uint8Array {
        return ConnectorAdmissionMigrationPayload.plan(value);
    }
    /** Canonical authority transcript retains the complete original device-signed plan. */
    public static approvalPayload(value: ConnectorMigrationApprovalBody): Uint8Array {
        return ConnectorAdmissionMigrationPayload.approval(value);
    }
    /** Canonical device attestation signs only exact converted snapshot commitments. */
    public static appliedPayload(value: ConnectorMigrationAppliedBody): Uint8Array {
        return ConnectorAdmissionMigrationPayload.applied(value);
    }

    /** Device signing cannot claim a different enrolled key, malformed scope or contradictory source watermark. */
    public static signPlan(
        key: PurposeSigner,
        value: ConnectorMigrationPlanBody,
    ): ConnectorMigrationPlan {
        const body: ConnectorMigrationPlanBody = ConnectorMigrationPlanCodec.body(value);
        if (body.devicePublicKey !== key.publicKey) {
            throw new Error('Migration device signer does not match enrolled identity');
        }
        return ConnectorMigrationPlanCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.AdmissionMigrationPlan, this.planPayload(body)),
        });
    }
    /** Trusted pins are receiver-owned, independent of every signed reply field. */
    public static verifyPlan(
        verifier: PurposeVerifier,
        expected: ConnectorMigrationExpected,
        value: ConnectorMigrationPlan,
    ): boolean {
        try {
            const scope: ConnectorMigrationExpected = ConnectorMigrationFields.expected(expected);
            const plan: ConnectorMigrationPlan = ConnectorMigrationPlanCodec.value(value);
            return (
                this.#scope(scope, plan) &&
                verifier.verify(
                    SignaturePurpose.AdmissionMigrationPlan,
                    scope.devicePublicKey,
                    this.planPayload(this.#planBody(plan)),
                    plan.signature,
                )
            );
        } catch {
            return false;
        }
    }
    /** Issuers validate device proof, exact scope and every semantic admission before signing the fenced candidate. */
    public static signApproval(
        verifier: PurposeVerifier,
        key: PurposeSigner,
        expected: ConnectorMigrationExpected,
        value: ConnectorMigrationApprovalBody,
    ): ConnectorMigrationApproval {
        const scope: ConnectorMigrationExpected = ConnectorMigrationFields.expected(expected);
        const body: ConnectorMigrationApprovalBody = ConnectorMigrationApprovalCodec.body(value);
        if (
            key.publicKey !== scope.authorityPublicKey ||
            !this.verifyPlan(verifier, scope, body.plan) ||
            !this.#admissions(verifier, scope, body)
        ) {
            throw new Error('Migration approval authority is not proven');
        }
        return ConnectorMigrationApprovalCodec.value({
            ...body,
            signature: key.sign(
                SignaturePurpose.AdmissionMigrationApproval,
                this.approvalPayload(body),
            ),
        });
    }
    /** Both hybrid signatures and every explicit historical authorization are mandatory; no lease or default authority is inferred. */
    public static verifyApproval(
        verifier: PurposeVerifier,
        expected: ConnectorMigrationExpected,
        originalPlan: ConnectorMigrationPlan,
        value: ConnectorMigrationApproval,
    ): boolean {
        try {
            const scope: ConnectorMigrationExpected = ConnectorMigrationFields.expected(expected);
            const approval: ConnectorMigrationApproval =
                ConnectorMigrationApprovalCodec.value(value);
            const body: ConnectorMigrationApprovalBody = this.#approvalBody(approval);
            return (
                this.planSha256(originalPlan) === this.planSha256(approval.plan) &&
                this.verifyPlan(verifier, scope, approval.plan) &&
                this.#admissions(verifier, scope, body) &&
                verifier.verify(
                    SignaturePurpose.AdmissionMigrationApproval,
                    scope.authorityPublicKey,
                    this.approvalPayload(body),
                    approval.signature,
                )
            );
        } catch {
            return false;
        }
    }
    /** A device attests applied targets only for the fully verified exact authority approval. */
    public static signApplied(
        verifier: PurposeVerifier,
        key: PurposeSigner,
        expected: ConnectorMigrationExpected,
        approval: ConnectorMigrationApproval,
        value: ConnectorMigrationAppliedBody,
    ): ConnectorMigrationApplied {
        const scope: ConnectorMigrationExpected = ConnectorMigrationFields.expected(expected);
        const body: ConnectorMigrationAppliedBody = ConnectorMigrationAppliedCodec.body(value);
        if (
            key.publicKey !== scope.devicePublicKey ||
            !this.verifyApproval(verifier, scope, approval.plan, approval) ||
            !this.#targets(approval, body)
        ) {
            throw new Error('Migration applied original approval is not proven');
        }
        return ConnectorMigrationAppliedCodec.value({
            ...body,
            signature: key.sign(
                SignaturePurpose.AdmissionMigrationApplied,
                this.appliedPayload(body),
            ),
        });
    }
    /** No operation is acknowledged by this attestation; all exact source lanes and complete approval bytes must match. */
    public static verifyApplied(
        verifier: PurposeVerifier,
        expected: ConnectorMigrationExpected,
        approval: ConnectorMigrationApproval,
        value: ConnectorMigrationApplied,
    ): boolean {
        try {
            const scope: ConnectorMigrationExpected = ConnectorMigrationFields.expected(expected);
            const applied: ConnectorMigrationApplied = ConnectorMigrationAppliedCodec.value(value);
            const body: ConnectorMigrationAppliedBody = {
                planSha256: applied.planSha256,
                approvalSha256: applied.approvalSha256,
                targets: applied.targets,
            };
            return (
                this.verifyApproval(verifier, scope, approval.plan, approval) &&
                this.#targets(approval, body) &&
                verifier.verify(
                    SignaturePurpose.AdmissionMigrationApplied,
                    scope.devicePublicKey,
                    this.appliedPayload(body),
                    applied.signature,
                )
            );
        } catch {
            return false;
        }
    }
    static #targets(
        approval: ConnectorMigrationApproval,
        applied: ConnectorMigrationAppliedBody,
    ): boolean {
        return (
            applied.planSha256 === this.planSha256(approval.plan) &&
            applied.approvalSha256 === this.approvalSha256(approval) &&
            applied.targets.length === approval.plan.sources.length &&
            applied.targets.every(
                (target: ConnectorMigrationTarget, index: number): boolean =>
                    target.lane === approval.plan.sources[index]?.lane,
            )
        );
    }
    static #admissions(
        verifier: PurposeVerifier,
        scope: ConnectorMigrationExpected,
        body: ConnectorMigrationApprovalBody,
    ): boolean {
        for (let index: number = 0; index < body.plan.sources.length; index++) {
            const source: ConnectorMigrationSource | undefined = body.plan.sources[index];
            const authorization: ConnectorMigrationAuthorization | undefined =
                body.authorizations[index];
            if (
                source === undefined ||
                authorization === undefined ||
                !this.#admission(verifier, scope, source, source.receipt, authorization.receipt) ||
                !this.#admission(verifier, scope, source, source.pending, authorization.pending)
            ) {
                return false;
            }
        }
        return true;
    }
    static #admission(
        verifier: PurposeVerifier,
        scope: ConnectorMigrationExpected,
        source: ConnectorMigrationSource,
        original: ConnectorMigrationOriginal | ConnectorMigrationReceipt | null,
        admission: ConnectorMigrationAdmission | null,
    ): boolean {
        if (original === null || admission === null) {
            return original === null && admission === null;
        }
        const hash: string =
            source.lane === ConnectorMigrationLane.Files
                ? ConnectorAuthorizationProof.file(original.requestHash, admission.authorization)
                : ConnectorAuthorizationProof.execution(
                      original.requestHash,
                      source.lane === ConnectorMigrationLane.ExecutionFirst
                          ? ExecutionLane.First
                          : ExecutionLane.Second,
                      admission.authorization,
                  );
        if (hash !== admission.admissionHash) {
            return false;
        }
        if (admission.authorization.kind === ConnectorAuthorizationKind.Independent) {
            return true;
        }
        const expected: ConnectorMigrationScope = {
            authorityId: scope.authorityId,
            environmentId: scope.environmentId,
            enrollmentId: scope.enrollmentId,
            devicePublicKey: scope.devicePublicKey,
        };
        const binding: typeof admission.authorization.binding.binding =
            admission.authorization.binding.binding;
        const journalId: string =
            source.lane === ConnectorMigrationLane.Files
                ? binding.fileJournalId
                : source.lane === ConnectorMigrationLane.ExecutionFirst
                  ? binding.executionJournals.first
                  : binding.executionJournals.second;
        return (
            journalId === source.journalId &&
            JointWorkspaceProof.verify(verifier, expected, admission.authorization.binding)
        );
    }
    static #scope(expected: ConnectorMigrationScope, actual: ConnectorMigrationScope): boolean {
        return (
            expected.authorityId === actual.authorityId &&
            expected.environmentId === actual.environmentId &&
            expected.enrollmentId === actual.enrollmentId &&
            expected.devicePublicKey === actual.devicePublicKey
        );
    }
    static #planBody(value: ConnectorMigrationPlan): ConnectorMigrationPlanBody {
        return {
            authorityId: value.authorityId,
            environmentId: value.environmentId,
            enrollmentId: value.enrollmentId,
            devicePublicKey: value.devicePublicKey,
            planId: value.planId,
            targetOperationSchema: value.targetOperationSchema,
            sources: value.sources,
        };
    }
    static #approvalBody(value: ConnectorMigrationApproval): ConnectorMigrationApprovalBody {
        return { plan: value.plan, fenceId: value.fenceId, authorizations: value.authorizations };
    }
    static #sha256(value: string): string {
        return createHash('sha256').update(value).digest('hex');
    }
}

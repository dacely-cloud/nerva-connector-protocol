// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { createHash } from 'node:crypto';
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
import { ConnectorMigrationLane, } from './ConnectorAdmissionMigration.js';
/** Hybrid proofs certify only the exact stopped conversion; runtime admission and operation acknowledgements remain separate. */
export class ConnectorAdmissionMigrationProof {
    /** Complete original randomized device proof bytes are included in this immutable plan identity. */
    static planSha256(plan) {
        return this.#sha256(ConnectorMigrationPlanCodec.encode(plan));
    }
    /** The full authority proof and original complete plan participate in the exact durable approval identity. */
    static approvalSha256(approval) {
        return this.#sha256(ConnectorMigrationApprovalCodec.encode(approval));
    }
    /** Browser-safe canonical body transcript, excluding only the outer device signature. */
    static planPayload(value) {
        return ConnectorAdmissionMigrationPayload.plan(value);
    }
    /** Canonical authority transcript retains the complete original device-signed plan. */
    static approvalPayload(value) {
        return ConnectorAdmissionMigrationPayload.approval(value);
    }
    /** Canonical device attestation signs only exact converted snapshot commitments. */
    static appliedPayload(value) {
        return ConnectorAdmissionMigrationPayload.applied(value);
    }
    /** Device signing cannot claim a different enrolled key, malformed scope or contradictory source watermark. */
    static signPlan(key, value) {
        const body = ConnectorMigrationPlanCodec.body(value);
        if (body.devicePublicKey !== key.publicKey) {
            throw new Error('Migration device signer does not match enrolled identity');
        }
        return ConnectorMigrationPlanCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.AdmissionMigrationPlan, this.planPayload(body)),
        });
    }
    /** Trusted pins are receiver-owned, independent of every signed reply field. */
    static verifyPlan(verifier, expected, value) {
        try {
            const scope = ConnectorMigrationFields.expected(expected);
            const plan = ConnectorMigrationPlanCodec.value(value);
            return (this.#scope(scope, plan) &&
                verifier.verify(SignaturePurpose.AdmissionMigrationPlan, scope.devicePublicKey, this.planPayload(this.#planBody(plan)), plan.signature));
        }
        catch {
            return false;
        }
    }
    /** Issuers validate device proof, exact scope and every semantic admission before signing the fenced candidate. */
    static signApproval(verifier, key, expected, value) {
        const scope = ConnectorMigrationFields.expected(expected);
        const body = ConnectorMigrationApprovalCodec.body(value);
        if (key.publicKey !== scope.authorityPublicKey ||
            !this.verifyPlan(verifier, scope, body.plan) ||
            !this.#admissions(verifier, scope, body)) {
            throw new Error('Migration approval authority is not proven');
        }
        return ConnectorMigrationApprovalCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.AdmissionMigrationApproval, this.approvalPayload(body)),
        });
    }
    /** Both hybrid signatures and every explicit historical authorization are mandatory; no lease or default authority is inferred. */
    static verifyApproval(verifier, expected, originalPlan, value) {
        try {
            const scope = ConnectorMigrationFields.expected(expected);
            const approval = ConnectorMigrationApprovalCodec.value(value);
            const body = this.#approvalBody(approval);
            return (this.planSha256(originalPlan) === this.planSha256(approval.plan) &&
                this.verifyPlan(verifier, scope, approval.plan) &&
                this.#admissions(verifier, scope, body) &&
                verifier.verify(SignaturePurpose.AdmissionMigrationApproval, scope.authorityPublicKey, this.approvalPayload(body), approval.signature));
        }
        catch {
            return false;
        }
    }
    /** A device attests applied targets only for the fully verified exact authority approval. */
    static signApplied(verifier, key, expected, approval, value) {
        const scope = ConnectorMigrationFields.expected(expected);
        const body = ConnectorMigrationAppliedCodec.body(value);
        if (key.publicKey !== scope.devicePublicKey ||
            !this.verifyApproval(verifier, scope, approval.plan, approval) ||
            !this.#targets(approval, body)) {
            throw new Error('Migration applied original approval is not proven');
        }
        return ConnectorMigrationAppliedCodec.value({
            ...body,
            signature: key.sign(SignaturePurpose.AdmissionMigrationApplied, this.appliedPayload(body)),
        });
    }
    /** No operation is acknowledged by this attestation; all exact source lanes and complete approval bytes must match. */
    static verifyApplied(verifier, expected, approval, value) {
        try {
            const scope = ConnectorMigrationFields.expected(expected);
            const applied = ConnectorMigrationAppliedCodec.value(value);
            const body = {
                planSha256: applied.planSha256,
                approvalSha256: applied.approvalSha256,
                targets: applied.targets,
            };
            return (this.verifyApproval(verifier, scope, approval.plan, approval) &&
                this.#targets(approval, body) &&
                verifier.verify(SignaturePurpose.AdmissionMigrationApplied, scope.devicePublicKey, this.appliedPayload(body), applied.signature));
        }
        catch {
            return false;
        }
    }
    static #targets(approval, applied) {
        return (applied.planSha256 === this.planSha256(approval.plan) &&
            applied.approvalSha256 === this.approvalSha256(approval) &&
            applied.targets.length === approval.plan.sources.length &&
            applied.targets.every((target, index) => target.lane === approval.plan.sources[index]?.lane));
    }
    static #admissions(verifier, scope, body) {
        for (let index = 0; index < body.plan.sources.length; index++) {
            const source = body.plan.sources[index];
            const authorization = body.authorizations[index];
            if (source === undefined ||
                authorization === undefined ||
                !this.#admission(verifier, scope, source, source.receipt, authorization.receipt) ||
                !this.#admission(verifier, scope, source, source.pending, authorization.pending)) {
                return false;
            }
        }
        return true;
    }
    static #admission(verifier, scope, source, original, admission) {
        if (original === null || admission === null) {
            return original === null && admission === null;
        }
        const hash = source.lane === ConnectorMigrationLane.Files
            ? ConnectorAuthorizationProof.file(original.requestHash, admission.authorization)
            : ConnectorAuthorizationProof.execution(original.requestHash, source.lane === ConnectorMigrationLane.ExecutionFirst
                ? ExecutionLane.First
                : ExecutionLane.Second, admission.authorization);
        if (hash !== admission.admissionHash) {
            return false;
        }
        if (admission.authorization.kind === ConnectorAuthorizationKind.Independent) {
            return true;
        }
        const expected = {
            authorityId: scope.authorityId,
            environmentId: scope.environmentId,
            enrollmentId: scope.enrollmentId,
            devicePublicKey: scope.devicePublicKey,
        };
        const binding = admission.authorization.binding.binding;
        const journalId = source.lane === ConnectorMigrationLane.Files
            ? binding.fileJournalId
            : source.lane === ConnectorMigrationLane.ExecutionFirst
                ? binding.executionJournals.first
                : binding.executionJournals.second;
        return (journalId === source.journalId &&
            JointWorkspaceProof.verify(verifier, expected, admission.authorization.binding));
    }
    static #scope(expected, actual) {
        return (expected.authorityId === actual.authorityId &&
            expected.environmentId === actual.environmentId &&
            expected.enrollmentId === actual.enrollmentId &&
            expected.devicePublicKey === actual.devicePublicKey);
    }
    static #planBody(value) {
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
    static #approvalBody(value) {
        return { plan: value.plan, fenceId: value.fenceId, authorizations: value.authorizations };
    }
    static #sha256(value) {
        return createHash('sha256').update(value).digest('hex');
    }
}

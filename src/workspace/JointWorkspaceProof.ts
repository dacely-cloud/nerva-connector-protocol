// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { createHash } from 'node:crypto';
import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { JointWorkspaceCodec } from './JointWorkspaceCodec.js';
import type {
    JointWorkspaceBinding,
    JointWorkspaceDescriptor,
    JointWorkspaceScope,
} from './JointWorkspaceBinding.js';

/** Signature and immutable-body commitments are separate domains; neither grants activation by itself. */
export class JointWorkspaceProof {
    /** The full body commits exact scopes, policies, root aliases/access, physical commitment and all permanent journals. */
    public static transcript(value: JointWorkspaceBinding): Buffer {
        const binding: JointWorkspaceBinding = this.#normalized(value);
        return Buffer.from(
            JSON.stringify([
                'nerva-connector:joint-workspace-binding:1',
                binding.authorityId,
                binding.environmentId,
                binding.enrollmentId,
                binding.revision.toString(),
                binding.filePolicySha256,
                binding.executionPolicySha256,
                binding.fileRootId,
                binding.executionRootId,
                binding.access,
                binding.physicalRootCommitment,
                binding.fileJournalId,
                binding.executionJournals.first,
                binding.executionJournals.second,
            ]),
        );
    }

    /** Binding identity covers the canonical complete body, excluding randomized signature bytes. */
    public static bindingSha256(binding: JointWorkspaceBinding): string {
        return createHash('sha256').update(this.transcript(binding)).digest('hex');
    }

    /** Both device signature components authenticate a frozen normalized body under the receiver-selected purpose. */
    public static sign(key: PurposeSigner, value: JointWorkspaceBinding): JointWorkspaceDescriptor {
        const binding: JointWorkspaceBinding = this.#normalized(value);
        return Object.freeze({
            binding,
            signature: key.sign(SignaturePurpose.JointWorkspaceBinding, this.transcript(binding)),
        });
    }

    /** Callers must supply the expected entire authority/environment/enrollment/device-key scope. */
    public static verify(
        verifier: PurposeVerifier,
        expected: JointWorkspaceScope,
        value: JointWorkspaceDescriptor,
    ): boolean {
        try {
            const scope: JointWorkspaceScope = JointWorkspaceCodec.scope(expected);
            const descriptor: JointWorkspaceDescriptor = JointWorkspaceCodec.descriptorValue(value);
            const binding: JointWorkspaceBinding = descriptor.binding;
            return (
                binding.authorityId === scope.authorityId &&
                binding.environmentId === scope.environmentId &&
                binding.enrollmentId === scope.enrollmentId &&
                verifier.verify(
                    SignaturePurpose.JointWorkspaceBinding,
                    scope.devicePublicKey,
                    this.transcript(binding),
                    descriptor.signature,
                )
            );
        } catch {
            return false;
        }
    }

    /** A trusted stored head is required: this stateless check neither persists a watermark nor performs backend compare-and-set. */
    public static supersedes(
        verifier: PurposeVerifier,
        scope: JointWorkspaceScope,
        previous: JointWorkspaceDescriptor,
        next: JointWorkspaceDescriptor,
    ): boolean {
        return (
            this.verify(verifier, scope, previous) &&
            this.verify(verifier, scope, next) &&
            next.binding.revision > previous.binding.revision
        );
    }

    static #normalized(value: JointWorkspaceBinding): JointWorkspaceBinding {
        return JointWorkspaceCodec.bindingValue(value);
    }
}

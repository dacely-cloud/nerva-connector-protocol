// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { createHash } from 'node:crypto';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { JointWorkspaceCodec } from './JointWorkspaceCodec.js';
/** Signature and immutable-body commitments are separate domains; neither grants activation by itself. */
export class JointWorkspaceProof {
    /** The full body commits exact scopes, policies, root aliases/access, physical commitment and all permanent journals. */
    static transcript(value) {
        const binding = this.#normalized(value);
        return Buffer.from(JSON.stringify([
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
        ]));
    }
    /** Binding identity covers the canonical complete body, excluding randomized signature bytes. */
    static bindingSha256(binding) {
        return createHash('sha256').update(this.transcript(binding)).digest('hex');
    }
    /** Both device signature components authenticate a frozen normalized body under the receiver-selected purpose. */
    static sign(key, value) {
        const binding = this.#normalized(value);
        return Object.freeze({
            binding,
            signature: key.sign(SignaturePurpose.JointWorkspaceBinding, this.transcript(binding)),
        });
    }
    /** Callers must supply the expected entire authority/environment/enrollment/device-key scope. */
    static verify(verifier, expected, value) {
        try {
            const scope = JointWorkspaceCodec.scope(expected);
            const descriptor = JointWorkspaceCodec.descriptorValue(value);
            const binding = descriptor.binding;
            return (binding.authorityId === scope.authorityId &&
                binding.environmentId === scope.environmentId &&
                binding.enrollmentId === scope.enrollmentId &&
                verifier.verify(SignaturePurpose.JointWorkspaceBinding, scope.devicePublicKey, this.transcript(binding), descriptor.signature));
        }
        catch {
            return false;
        }
    }
    /** A trusted stored head is required: this stateless check neither persists a watermark nor performs backend compare-and-set. */
    static supersedes(verifier, scope, previous, next) {
        return (this.verify(verifier, scope, previous) &&
            this.verify(verifier, scope, next) &&
            next.binding.revision > previous.binding.revision);
    }
    static #normalized(value) {
        return JointWorkspaceCodec.bindingValue(value);
    }
}

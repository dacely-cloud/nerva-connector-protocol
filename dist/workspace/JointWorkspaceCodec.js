// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from '../protocol/Boundary.js';
import { ConnectorEnrollmentCodec } from '../protocol/ConnectorEnrollmentCodec.js';
import { ConnectorFileMode } from '../protocol/ConnectorFiles.js';
import { IdentityLengths } from '../identity/IdentityFormat.js';
import { JointWorkspaceLimits, } from './JointWorkspaceBinding.js';
/** Closed current shapes never infer access, omit a lane or substitute a local diagnostic digest. */
export class JointWorkspaceCodec {
    /** External revisions are canonical positive signed-int64 decimal strings, never JavaScript numbers. */
    static binding(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'revision',
            'filePolicySha256',
            'executionPolicySha256',
            'fileRootId',
            'executionRootId',
            'access',
            'physicalRootCommitment',
            'fileJournalId',
            'executionJournals',
        ]);
        const revision = Boundary.integer(value['revision']);
        if (revision === 0n) {
            throw new Error('Joint workspace revision must be positive');
        }
        const executionJournals = this.journals(value['executionJournals']);
        const fileJournalId = ConnectorEnrollmentCodec.digest(value['fileJournalId']);
        if (fileJournalId === executionJournals.first ||
            fileJournalId === executionJournals.second) {
            throw new Error('Joint workspace journals must remain independent');
        }
        const binding = Object.freeze({
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            revision,
            filePolicySha256: ConnectorEnrollmentCodec.digest(value['filePolicySha256']),
            executionPolicySha256: ConnectorEnrollmentCodec.digest(value['executionPolicySha256']),
            fileRootId: Boundary.id(value['fileRootId']),
            executionRootId: Boundary.id(value['executionRootId']),
            access: this.access(value['access']),
            physicalRootCommitment: ConnectorEnrollmentCodec.digest(value['physicalRootCommitment']),
            fileJournalId,
            executionJournals,
        });
        if (new TextEncoder().encode(this.#serialize(binding)).byteLength >
            JointWorkspaceLimits.bodyBytes) {
            throw new Error('Joint workspace body exceeds its fixed bound');
        }
        return binding;
    }
    /** Typed local values normalize through the same closed codec before proof work, with no unchecked JSON allocation. */
    static bindingValue(value) {
        const record = Boundary.record(value, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'revision',
            'filePolicySha256',
            'executionPolicySha256',
            'fileRootId',
            'executionRootId',
            'access',
            'physicalRootCommitment',
            'fileJournalId',
            'executionJournals',
        ]);
        const revision = record['revision'];
        if (typeof revision !== 'bigint' || revision < 1n || revision > 9223372036854775807n) {
            throw new Error('Invalid exact joint revision');
        }
        return this.binding({ ...record, revision: revision.toString() });
    }
    /** Only a composite signature and the complete exact body cross this boundary. */
    static descriptor(raw) {
        const value = Boundary.record(raw, [
            'binding',
            'signature',
        ]);
        const signature = ConnectorEnrollmentCodec.binary(value['signature'], IdentityLengths.signature);
        return Object.freeze({ binding: this.binding(value['binding']), signature });
    }
    /** Local immutable descriptors keep the same exact envelope without encoding before validation. */
    static descriptorValue(value) {
        const record = Boundary.record(value, [
            'binding',
            'signature',
        ]);
        return Object.freeze({
            binding: this.bindingValue(value.binding),
            signature: ConnectorEnrollmentCodec.binary(record['signature'], IdentityLengths.signature),
        });
    }
    /** Bounded text is rejected before JSON decoding; objects still undergo closed shape and field validation. */
    static decode(json) {
        if (typeof json !== 'string' ||
            json.length > JointWorkspaceLimits.descriptorBytes ||
            new TextEncoder().encode(json).byteLength > JointWorkspaceLimits.descriptorBytes) {
            throw new Error('Joint workspace envelope exceeds its fixed bound');
        }
        const raw = JSON.parse(json);
        return this.descriptor(raw);
    }
    /** The stored and wire representation retains exact decimal revisions and fixed field order. */
    static encode(value) {
        const normalized = 'binding' in value ? this.descriptorValue(value) : this.bindingValue(value);
        return this.#serialize(normalized);
    }
    static #serialize(value) {
        return JSON.stringify(value, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
    }
    /** Scope comes from authenticated local/backend ownership, never a descriptor-selected verification key. */
    static scope(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
        ]);
        return Object.freeze({
            authorityId: Boundary.id(value['authorityId']),
            environmentId: Boundary.id(value['environmentId']),
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            devicePublicKey: ConnectorEnrollmentCodec.binary(value['devicePublicKey'], IdentityLengths.publicKey),
        });
    }
    /** Full authority pins are private derivation inputs and never become fields of the public binding. */
    static physicalScope(raw) {
        const value = Boundary.record(raw, [
            'authorityId',
            'environmentId',
            'enrollmentId',
            'devicePublicKey',
            'authorityPublicKey',
        ]);
        const scope = this.scope({
            authorityId: value['authorityId'],
            environmentId: value['environmentId'],
            enrollmentId: value['enrollmentId'],
            devicePublicKey: value['devicePublicKey'],
        });
        return Object.freeze({
            ...scope,
            authorityPublicKey: ConnectorEnrollmentCodec.binary(value['authorityPublicKey'], IdentityLengths.publicKey),
        });
    }
    /** Different enum representations must still denote exactly the same explicitly granted mode. */
    static access(raw) {
        if (raw !== ConnectorFileMode.ReadOnly && raw !== ConnectorFileMode.ReadWrite) {
            throw new Error('Explicit joint workspace access is required');
        }
        return raw;
    }
    /** Both lanes are mandatory and cannot share or replace a permanent journal identity. */
    static journals(raw) {
        const value = Boundary.record(raw, ['first', 'second']);
        const first = ConnectorEnrollmentCodec.digest(value['first']);
        const second = ConnectorEnrollmentCodec.digest(value['second']);
        if (first === second) {
            throw new Error('Execution lane journals must remain independent');
        }
        return Object.freeze({ first, second });
    }
}

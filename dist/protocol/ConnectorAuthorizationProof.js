// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { createHash } from 'node:crypto';
import { ExecutionLane } from '../execution/ExecutionLane.js';
import { JointWorkspaceProof } from '../workspace/JointWorkspaceProof.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import { ConnectorAdmissionChannel, ConnectorAuthorizationKind, } from './ConnectorAuthorization.js';
/** Separate admission commitments bind the original payload to explicit authority without changing its existing request hash. */
export class ConnectorAuthorizationProof {
    /** A file receiver cannot adopt an execution lane or an untrusted channel selector. */
    static file(requestHash, authorization) {
        return this.#hash(ConnectorAdmissionChannel.File, null, requestHash, authorization);
    }
    /** The exact receiver-selected command lane is mandatory because it is outside the original execution request hash. */
    static execution(requestHash, lane, authorization) {
        if (lane !== ExecutionLane.First && lane !== ExecutionLane.Second) {
            throw new Error('Explicit current connector execution lane required');
        }
        return this.#hash(ConnectorAdmissionChannel.Execution, lane, requestHash, authorization);
    }
    static #hash(channel, lane, requestHash, authorization) {
        const original = ConnectorEnrollmentCodec.digest(requestHash);
        const captured = ConnectorAuthorizationCodec.value(authorization);
        const binding = captured.kind === ConnectorAuthorizationKind.Joint
            ? JointWorkspaceProof.bindingSha256(captured.binding.binding)
            : null;
        return createHash('sha256')
            .update(JSON.stringify([
            'nerva-connector:operation-admission:1',
            channel,
            lane,
            original,
            [captured.kind, binding],
        ]))
            .digest('hex');
    }
}

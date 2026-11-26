// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { createHash } from 'node:crypto';
import { ExecutionLane } from '../execution/ExecutionLane.js';
import { JointWorkspaceProof } from '../workspace/JointWorkspaceProof.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorAuthorizationCodec } from './ConnectorAuthorizationCodec.js';
import {
    ConnectorAdmissionChannel,
    ConnectorAuthorizationKind,
    type ConnectorAuthorization,
} from './ConnectorAuthorization.js';

/** Separate admission commitments bind the original payload to explicit authority without changing its existing request hash. */
export class ConnectorAuthorizationProof {
    /** A file receiver cannot adopt an execution lane or an untrusted channel selector. */
    public static file(requestHash: string, authorization: ConnectorAuthorization): string {
        return this.#hash(ConnectorAdmissionChannel.File, null, requestHash, authorization);
    }

    /** The exact receiver-selected command lane is mandatory because it is outside the original execution request hash. */
    public static execution(
        requestHash: string,
        lane: ExecutionLane,
        authorization: ConnectorAuthorization,
    ): string {
        if (lane !== ExecutionLane.First && lane !== ExecutionLane.Second) {
            throw new Error('Explicit current connector execution lane required');
        }
        return this.#hash(ConnectorAdmissionChannel.Execution, lane, requestHash, authorization);
    }

    static #hash(
        channel: ConnectorAdmissionChannel,
        lane: ExecutionLane | null,
        requestHash: string,
        authorization: ConnectorAuthorization,
    ): string {
        const original: string = ConnectorEnrollmentCodec.digest(requestHash);
        const captured: ConnectorAuthorization = ConnectorAuthorizationCodec.value(authorization);
        const binding: string | null =
            captured.kind === ConnectorAuthorizationKind.Joint
                ? JointWorkspaceProof.bindingSha256(captured.binding.binding)
                : null;
        return createHash('sha256')
            .update(
                JSON.stringify([
                    'nerva-connector:operation-admission:1',
                    channel,
                    lane,
                    original,
                    [captured.kind, binding],
                ]),
            )
            .digest('hex');
    }
}

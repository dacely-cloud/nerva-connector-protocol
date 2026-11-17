// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorInstructionsLimits, } from './ConnectorInstructions.js';
/** Account guidance is validated independently of customer-reported device inventory. */
export class ConnectorInstructionsCodec {
    /** Preserve user formatting; reject malformed Unicode and controls that cannot be safely displayed. */
    static text(raw) {
        if (typeof raw !== 'string' ||
            raw.length > ConnectorInstructionsLimits.bytes ||
            !raw.isWellFormed() ||
            new TextEncoder().encode(raw).byteLength > ConnectorInstructionsLimits.bytes) {
            throw new Error('Invalid connector instructions');
        }
        for (let index = 0; index < raw.length; index++) {
            const code = raw.charCodeAt(index);
            if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) {
                throw new Error('Invalid connector instructions');
            }
        }
        return raw;
    }
    /** Wire revisions are canonical decimal strings, never floating-point quantities. */
    static view(raw) {
        const value = Boundary.record(raw, [
            'enrollmentId',
            'instructions',
            'revision',
        ]);
        return {
            enrollmentId: ConnectorEnrollmentCodec.id(value['enrollmentId']),
            instructions: this.text(value['instructions']),
            revision: Boundary.integer(value['revision']),
        };
    }
    /** A missing observed revision cannot become an unconditional overwrite. */
    static update(raw) {
        const value = Boundary.record(raw, [
            'instructions',
            'expectedRevision',
        ]);
        return {
            instructions: this.text(value['instructions']),
            expectedRevision: Boundary.integer(value['expectedRevision']),
        };
    }
}

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorHostObservationTranscript as Transcript } from './ConnectorHostObservationTranscript.js';
/** Handshake proof domains cannot be substituted for source permits or native instance readiness. */
export class ConnectorHostObservationCapabilityTranscript {
    /** The publication commitment excludes randomized signature bytes but includes explicit capability presence. */
    static capability(publicationSha256, companionNonce, runtimeId) {
        return Transcript.encode([
            'nerva-connector:host:observation:capability:v1',
            publicationSha256,
            companionNonce,
            runtimeId,
        ]);
    }
    /** The private authority signs every connection, publication and finite lease binding. */
    static activation(value) {
        return Transcript.encode([
            'nerva-connector:host:observation:activation:v1',
            value.authorityId,
            value.enrollmentId,
            value.leaseId,
            value.journalId,
            value.companionNonce,
            value.runtimeId,
            value.publicationSha256,
            value.issuedAtMs,
            value.expiresAtMs,
        ]);
    }
}

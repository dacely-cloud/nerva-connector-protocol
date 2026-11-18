// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostObservationActivation } from './ConnectorHostObservationCapability.js';
import { ConnectorHostObservationTranscript as Transcript } from './ConnectorHostObservationTranscript.js';

/** Handshake proof domains cannot be substituted for source permits or native instance readiness. */
export class ConnectorHostObservationCapabilityTranscript {
    /** The publication commitment excludes randomized signature bytes but includes explicit capability presence. */
    public static capability(
        publicationSha256: string,
        companionNonce: string,
        runtimeId: string,
    ): string {
        return Transcript.encode([
            'nerva-connector:host:observation:capability:v1',
            publicationSha256,
            companionNonce,
            runtimeId,
        ]);
    }
    /** The private authority signs every connection, publication and finite lease binding. */
    public static activation(value: Omit<ConnectorHostObservationActivation, 'signature'>): string {
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

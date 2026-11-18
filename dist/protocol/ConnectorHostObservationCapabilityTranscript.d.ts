import type { ConnectorHostObservationActivation } from './ConnectorHostObservationCapability.js';
/** Handshake proof domains cannot be substituted for source permits or native instance readiness. */
export declare class ConnectorHostObservationCapabilityTranscript {
    /** The publication commitment excludes randomized signature bytes but includes explicit capability presence. */
    static capability(publicationSha256: string, companionNonce: string, runtimeId: string): string;
    /** The private authority signs every connection, publication and finite lease binding. */
    static activation(value: Omit<ConnectorHostObservationActivation, 'signature'>): string;
}

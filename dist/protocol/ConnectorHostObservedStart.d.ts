import type { ConnectorHostObservedStart } from './ConnectorHostObservationProtocol.js';
import type { ConnectorHostSubmission } from './ConnectorHost.js';
/** Private admission derives these namespaces from verified conversation ownership and protected provider state. */
export interface ConnectorHostObservationCapture {
    readonly protocol: typeof ConnectorHostObservedStart.Protocol;
    readonly observationId: string;
    readonly ownerSha256: string;
    readonly providerSha256: string;
    readonly originalId: string;
}
/** This private operation replaces the ordinary submission; it never follows it with another native start. */
export interface ConnectorHostObservedSubmission {
    readonly submission: ConnectorHostSubmission;
    readonly capture: ConnectorHostObservationCapture;
}
/** Execution receives the original tool arguments with only the validated transport reservation removed. */
export interface ConnectorHostObservedArguments {
    readonly capture: ConnectorHostObservationCapture;
    readonly argumentsJson: string;
}

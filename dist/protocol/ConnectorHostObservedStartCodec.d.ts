import { ConnectorHostTool, type ConnectorHostRequest } from './ConnectorHost.js';
import { ConnectorHostObservationKind } from './ConnectorHostObservation.js';
import { type ConnectorHostObservationCapture, type ConnectorHostObservedSubmission, type ConnectorHostObservedArguments } from './ConnectorHostObservedStart.js';
/** Closed metadata readers preserve the exact effect request and refuse post-hoc or caller-selected attachment. */
export declare class ConnectorHostObservedStartCodec {
    #private;
    /** Only one exact protocol and complete namespace commitment can cross private admission. */
    static capture(raw: unknown): ConnectorHostObservationCapture;
    /** Ordinary admission refuses the reserved field even when its value would be malformed. */
    static ordinary(request: ConnectorHostRequest): void;
    /** Presence is correlation only; callers still require private admission and a verified current signed permit. */
    static read(request: ConnectorHostRequest): ConnectorHostObservationCapture | null;
    /** Strip exactly one closed reserved field after independent authorization, preserving every executable argument value. */
    static strip(request: ConnectorHostRequest): ConnectorHostObservedArguments;
    /** Private source and embedded signed capture must be byte-equivalent after closed canonical validation. */
    static submission(raw: unknown): ConnectorHostObservedSubmission;
    /** A reservation can refer only to a new native process or terminal, never arbitrary operations. */
    static kind(tool: ConnectorHostTool): ConnectorHostObservationKind;
}

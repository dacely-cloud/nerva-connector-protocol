import type { ConnectorHostObservationOrigin as Origin, ConnectorHostObservationPermit as Permit, ConnectorHostObservationReady as Ready, ConnectorHostObservationChanged as Changed, ConnectorHostObservationAcknowledgment as Acknowledgment } from './ConnectorHostObservation.js';
/** Canonical ordered tuples are browser-safe and never depend on object insertion order. */
export declare class ConnectorHostObservationTranscript {
    /** Domain-tagged exact JSON keeps every external integer in canonical decimal form. */
    static encode<T>(value: T): string;
    /** The complete verified source, private owner and grant participate in origin identity. */
    static origin(value: Origin): string;
    /** Native instance commitments remain unchanged when the same observation renews its delivery lease. */
    static instance(originSha256: string, runtimeId: string, processId: string, kind: Origin['kind']): string;
    /** The full origin is represented by a receiver-recomputed commitment in the signed permit. */
    static permit(value: Omit<Permit, 'signature'>): string;
    /** Ready commits current transport authority independently from the immutable native instance. */
    static ready(value: Omit<Ready, 'signature'>): string;
    /** Each tuple retains all observation, source and native-process correlation fields. */
    static changed(value: Omit<Changed, 'signature'>): string;
    /** Hash plus exact row set prevents acknowledgment of an omitted, reordered or substituted change. */
    static acknowledgment(value: Omit<Acknowledgment, 'signature'>): string;
}

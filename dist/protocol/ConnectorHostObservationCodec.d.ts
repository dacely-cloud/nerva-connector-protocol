import { ConnectorHostObservationKind as Kind, type ConnectorHostObservationOrigin as Origin, type ConnectorHostObservationPermit as Permit, type ConnectorHostObservationReady as Ready, type ConnectorHostObservationChanged as Changed, type ConnectorHostObservationAcknowledgment as Acknowledgment } from './ConnectorHostObservation.js';
/** Decoding accepts one closed finite representation and never turns correlation data into authorization. */
export declare class ConnectorHostObservationCodec {
    #private;
    /** Raw JSON is byte-bounded before parsing; records still require the corresponding typed reader. */
    static json(json: string): unknown;
    /** Only exact native handle families are supported by observation capabilities. */
    static kind(raw: unknown): Kind;
    /** Positive generations, grant revisions and job identities never accept zero or floating point. */
    static positive(raw: unknown): bigint;
    /** Full immutable private/start/grant commitments survive result compaction without fresh execution authority. */
    static origin(raw: unknown): Origin;
    /** Initial attach requires both instance pins absent; renewal requires both present under a finite signed deadline. */
    static permit(raw: unknown): Permit;
    /** Signed readiness carries no arbitrary snapshot, bytes or false quiescence claim. */
    static ready(raw: unknown): Ready;
    /** Batches are nonempty and strictly ordered by observation identity before any signing or state lookup. */
    static changed(raw: unknown): Changed;
    /** Acknowledgments contain exactly the closed identity/revision rows, never new observer source or native effects. */
    static acknowledgment(raw: unknown): Acknowledgment;
}

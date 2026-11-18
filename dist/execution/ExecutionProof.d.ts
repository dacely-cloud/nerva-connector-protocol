import type { ExecutionOutput, ExecutionOutputOriginal, ExecutionOutputAck } from './ExecutionOutput.js';
import type { ExecutionPublication, ExecutionPermit, ExecutionCancellation, ExecutionCompletion, ExecutionAcknowledgment, ExecutionAcknowledged, ExecutionRequest } from './ExecutionJobs.js';
import type { ExecutionResult } from './ExecutionTypes.js';
/** Purpose-selected composite signatures cover these canonical payloads; hashes never grant execution by themselves. */
export declare class ExecutionProof {
    #private;
    /** Exact ordered wire metadata has an unambiguous SHA256 commitment. */
    static digest(value: string): string;
    /** A request hash binds its application identity and every variable argument. */
    static requestHash(value: ExecutionRequest): string;
    /** A terminal commitment includes exact bounded output bytes and uncertain-outcome classification. */
    static responseHash(value: ExecutionResult): string;
    /** Exact byte commitments are independent of delivery lease and terminal response classification. */
    static outputHash(value: ExecutionOutput): string;
    /** Output cannot be moved between original commands, leases or signature purposes. */
    static output(value: ExecutionOutputOriginal): Buffer;
    /** A backend prefix receipt cannot compact or complete a command. */
    static outputAck(value: Omit<ExecutionOutputAck, 'signature'>): Buffer;
    /** Publication binds private-policy commitment, public grants, journal and current environment/lease. */
    static publication(value: Omit<ExecutionPublication, 'signature'>): Buffer;
    /** Both start and effect deadlines are covered independently of transport metadata. */
    static permit(value: Omit<ExecutionPermit, 'signature'>): Buffer;
    /** Stop authority commits the complete original payload hash, target, lease and finite validity under a distinct signing purpose. */
    static cancellation(value: Omit<ExecutionCancellation, 'signature'>): Buffer;
    /** Device result proof cannot authorize another effect or omit its original response commitment. */
    static completion(value: Omit<ExecutionCompletion, 'signature'>): Buffer;
    /** Only the separately pinned backend authority may permit discarding this retained result. */
    static acknowledgment(value: Omit<ExecutionAcknowledgment, 'signature'>): Buffer;
    /** Device confirmation follows a distinct signing purpose after durable compaction. */
    static acknowledged(value: Omit<ExecutionAcknowledged, 'signature'>): Buffer;
    /** A stable cgroup name is derived only from the original durable operation, never a caller-selected host path. */
    static cgroupId(journalId: string, value: Pick<ExecutionPermit, 'enrollmentId' | 'jobId' | 'sequence' | 'dispatchId' | 'requestHash' | 'lane'>): string;
}

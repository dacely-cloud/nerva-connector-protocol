import { ExecutionLane } from '../execution/ExecutionLane.js';
import { type ConnectorAuthorization } from './ConnectorAuthorization.js';
/** Separate admission commitments bind the original payload to explicit authority without changing its existing request hash. */
export declare class ConnectorAuthorizationProof {
    #private;
    /** A file receiver cannot adopt an execution lane or an untrusted channel selector. */
    static file(requestHash: string, authorization: ConnectorAuthorization): string;
    /** The exact receiver-selected command lane is mandatory because it is outside the original execution request hash. */
    static execution(requestHash: string, lane: ExecutionLane, authorization: ConnectorAuthorization): string;
}

import type { PurposeSigner, PurposeVerifier } from '../identity/PurposeSignature.js';
import { SignaturePurpose } from '../identity/IdentityFormat.js';
import { type ConnectorFilePublication, type ConnectorFilePermit, type ConnectorFileCompletion, type ConnectorFileAcknowledgment, type ConnectorFileAcknowledged } from './ConnectorFileJobs.js';
import type { ConnectorFileResponse } from './ConnectorFiles.js';
/** Shared proof purposes use canonical exact metadata and never transfer a private key. */
export declare class ConnectorFileProof {
    #private;
    /** Hash canonical validated domain values, never an unchecked serialized object. */
    static digest(value: string): string;
    /** Responses have a fixed validated shape with exact decimal quantities. */
    static responseHash(value: ConnectorFileResponse): string;
    /** Profile authorization includes the exact lease and ordered root grant list. */
    static publication(value: Omit<ConnectorFilePublication, 'signature'>): Buffer;
    /** Backend requests bind one original dispatch and a finite current connection. */
    static permit(value: Omit<ConnectorFilePermit, 'signature'>): Buffer;
    /** Device result proofs cannot be repurposed as acknowledgments or operation permits. */
    static completion(value: Omit<ConnectorFileCompletion, 'signature'>): Buffer;
    /** Only private backend authority may instruct durable local compaction. */
    static acknowledgment(value: Omit<ConnectorFileAcknowledgment, 'signature'>): Buffer;
    /** Device compaction confirmation follows its own purpose after the encrypted journal commits. */
    static acknowledged(value: Omit<ConnectorFileAcknowledged, 'signature'>): Buffer;
    /** Both components sign the exact receiver-selected file purpose with the caller-owned composite identity. */
    static sign(key: PurposeSigner, purpose: SignaturePurpose, payload: Buffer): string;
    /** The exact enrolled composite pin and file purpose must verify both proof components. */
    static verify(verifier: PurposeVerifier, publicKey: string, purpose: SignaturePurpose, payload: Buffer, signature: string): boolean;
}

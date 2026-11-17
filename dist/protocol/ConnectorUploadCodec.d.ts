import { type ConnectorFileRequest } from './ConnectorFiles.js';
import { type ConnectorFileTarget, type ConnectorFileMetadata } from './ConnectorFileTypes.js';
import { type ConnectorUploadRequest, type ConnectorUploadOutput } from './ConnectorUpload.js';
/** Strict staging messages repeat their commitment; native-only binding hashes are never accepted from the wire. */
export declare class ConnectorUploadCodec {
    /** Action detection grants no capability until the complete request is validated. */
    static isAction(action: unknown): boolean;
    /** Union narrowing keeps native upload decoding separate from ordinary file operations. */
    static isRequest(request: ConnectorFileRequest): request is ConnectorUploadRequest;
    /** Validate the complete shape before admitting native staging authority. */
    static request(raw: Readonly<Record<string, unknown>>, target: ConnectorFileTarget): ConnectorUploadRequest;
    /** Native progress and publication must match the exact original commitment. */
    static response(raw: unknown, request: ConnectorUploadRequest, metadata: (value: unknown) => ConnectorFileMetadata): ConnectorUploadOutput;
    /** Canonical base64 is bounded before decoding; empty chunks cannot manufacture progress. */
    static chunk(raw: unknown): string;
}

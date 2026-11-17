import { type ConnectorFileRequest, type ConnectorFileDescribe, type ConnectorFileResponse } from './ConnectorFiles.js';
import { ConnectorFileAction } from './ConnectorFileTypes.js';
/** Native and local JSON boundaries are strict; validation precedes path access and payload accumulation. */
export declare class ConnectorFilesCodec {
    #private;
    /** Mutation requires both the cloud write scope and the explicit local read-write grant. */
    static isMutation(action: ConnectorFileAction): boolean;
    /** Paths are literal normalized relative Linux paths; no absolute paths, parent traversal or hidden normalization. */
    static path(raw: unknown): string;
    /** Additional executable, environment or host fields can never become read authority. */
    static request(raw: unknown): ConnectorFileRequest;
    /** Native results must correlate to the original operation before being returned. */
    static response(raw: unknown, request: Exclude<ConnectorFileRequest, ConnectorFileDescribe>): ConnectorFileResponse;
    /** Canonical complete data is bounded before decoding or signature verification. */
    static writeData(raw: unknown): string;
}

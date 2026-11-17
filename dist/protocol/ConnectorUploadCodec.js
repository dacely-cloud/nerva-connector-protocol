// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorFileKind } from './ConnectorFileTypes.js';
import { ConnectorFileAction, ConnectorWriteMode, } from './ConnectorFileTypes.js';
import { ConnectorUploadLimits, } from './ConnectorUpload.js';
/** Strict staging messages repeat their commitment; native-only binding hashes are never accepted from the wire. */
export class ConnectorUploadCodec {
    /** Action detection grants no capability until the complete request is validated. */
    static isAction(action) {
        return (action === ConnectorFileAction.UploadBegin ||
            action === ConnectorFileAction.UploadChunk ||
            action === ConnectorFileAction.UploadStatus ||
            action === ConnectorFileAction.UploadCommit ||
            action === ConnectorFileAction.UploadAbort);
    }
    /** Union narrowing keeps native upload decoding separate from ordinary file operations. */
    static isRequest(request) {
        return this.isAction(request.action);
    }
    /** Validate the complete shape before admitting native staging authority. */
    static request(raw, target) {
        const chunk = raw['action'] === ConnectorFileAction.UploadChunk;
        Boundary.record(raw, [
            'action',
            'requestId',
            'policySha256',
            'rootId',
            'path',
            'uploadId',
            'mode',
            'sizeBytes',
            'sha256',
            ...(chunk ? ['offset', 'dataBase64'] : []),
        ]);
        const mode = Object.values(ConnectorWriteMode).find((entry) => entry === raw['mode']);
        const sizeBytes = Boundary.integer(raw['sizeBytes']);
        if (target.path === '.' || mode === undefined) {
            throw new Error('Invalid connector upload target');
        }
        const common = {
            ...target,
            uploadId: ConnectorEnrollmentCodec.digest(raw['uploadId']),
            mode,
            sizeBytes,
            sha256: ConnectorEnrollmentCodec.digest(raw['sha256']),
        };
        switch (raw['action']) {
            case ConnectorFileAction.UploadBegin:
                return { ...common, action: ConnectorFileAction.UploadBegin };
            case ConnectorFileAction.UploadStatus:
                return { ...common, action: ConnectorFileAction.UploadStatus };
            case ConnectorFileAction.UploadCommit:
                return { ...common, action: ConnectorFileAction.UploadCommit };
            case ConnectorFileAction.UploadAbort:
                return { ...common, action: ConnectorFileAction.UploadAbort };
            case ConnectorFileAction.UploadChunk: {
                const offset = Boundary.integer(raw['offset']);
                const dataBase64 = this.chunk(raw['dataBase64']);
                if (offset + BigInt(atob(dataBase64).length) > sizeBytes) {
                    throw new Error('Connector upload chunk exceeds declared length');
                }
                return { ...common, action: ConnectorFileAction.UploadChunk, offset, dataBase64 };
            }
            default:
                throw new Error('Unsupported connector upload action');
        }
    }
    /** Native progress and publication must match the exact original commitment. */
    static response(raw, request, metadata) {
        const value = Boundary.record(raw, [
            'action',
            'requestId',
            'uploadId',
            'receivedBytes',
            'bytesWritten',
            'sha256',
            'metadata',
            'removed',
        ]);
        if (value['action'] !== request.action ||
            value['requestId'] !== request.requestId ||
            value['uploadId'] !== request.uploadId) {
            throw new Error('Connector upload response correlation changed');
        }
        const common = {
            requestId: request.requestId,
            uploadId: request.uploadId,
        };
        if (request.action === ConnectorFileAction.UploadAbort) {
            Boundary.record(raw, ['action', 'requestId', 'uploadId', 'removed']);
            return {
                ...common,
                action: request.action,
                removed: Boundary.boolean(value['removed']),
            };
        }
        if (request.action === ConnectorFileAction.UploadCommit) {
            Boundary.record(raw, [
                'action',
                'requestId',
                'uploadId',
                'bytesWritten',
                'sha256',
                'metadata',
            ]);
            const bytesWritten = Boundary.integer(value['bytesWritten']);
            const digest = ConnectorEnrollmentCodec.digest(value['sha256']);
            const published = metadata(value['metadata']);
            if (bytesWritten !== request.sizeBytes ||
                digest !== request.sha256 ||
                published.kind !== ConnectorFileKind.File ||
                published.sizeBytes !== bytesWritten ||
                published.mode !== 0o600) {
                throw new Error('Invalid connector upload publication');
            }
            return {
                ...common,
                action: request.action,
                bytesWritten,
                sha256: digest,
                metadata: published,
            };
        }
        const receivedBytes = Boundary.integer(value['receivedBytes']);
        if (receivedBytes > request.sizeBytes ||
            (request.action === ConnectorFileAction.UploadChunk &&
                receivedBytes !== request.offset + BigInt(atob(request.dataBase64).length))) {
            throw new Error('Invalid connector upload progress');
        }
        if (request.action === ConnectorFileAction.UploadStatus) {
            Boundary.record(raw, ['action', 'requestId', 'uploadId', 'receivedBytes', 'sha256']);
            return {
                ...common,
                action: request.action,
                receivedBytes,
                sha256: ConnectorEnrollmentCodec.digest(value['sha256']),
            };
        }
        Boundary.record(raw, ['action', 'requestId', 'uploadId', 'receivedBytes']);
        return { ...common, action: request.action, receivedBytes };
    }
    /** Canonical base64 is bounded before decoding; empty chunks cannot manufacture progress. */
    static chunk(raw) {
        if (typeof raw !== 'string' ||
            raw.length === 0 ||
            raw.length > Math.ceil(ConnectorUploadLimits.chunkBytes / 3) * 4 ||
            !/^[A-Za-z0-9+/]*={0,2}$/u.test(raw)) {
            throw new Error('Invalid connector upload chunk');
        }
        const decoded = atob(raw);
        if (decoded.length === 0 ||
            decoded.length > ConnectorUploadLimits.chunkBytes ||
            btoa(decoded) !== raw) {
            throw new Error('Invalid connector upload encoding');
        }
        return raw;
    }
}

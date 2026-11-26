// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import { ConnectorEnrollmentCodec } from './ConnectorEnrollmentCodec.js';
import { ConnectorUploadCodec } from './ConnectorUploadCodec.js';
import {
    ConnectorFileFailure,
    ConnectorFileLimits,
    ConnectorFilePermissionMode,
    type ConnectorFileRequest,
    type ConnectorFileDescribe,
    type ConnectorFileResponse,
    type ConnectorFileEntry,
    type ConnectorFileOutput,
} from './ConnectorFiles.js';
import { ConnectorFileKind } from './ConnectorFileTypes.js';
import {
    ConnectorFileAction,
    ConnectorWriteMode,
    type ConnectorFileMetadata,
} from './ConnectorFileTypes.js';

/** Native and local JSON boundaries are strict; validation precedes path access and payload accumulation. */
export class ConnectorFilesCodec {
    /** Mutation requires both the cloud write scope and the explicit local read-write grant. */
    public static isMutation(action: ConnectorFileAction): boolean {
        return (
            action === ConnectorFileAction.Write ||
            action === ConnectorFileAction.Remove ||
            action === ConnectorFileAction.Mkdir ||
            action === ConnectorFileAction.Chmod ||
            action === ConnectorFileAction.Rename ||
            ConnectorUploadCodec.isAction(action)
        );
    }
    /** Paths are literal normalized relative Linux paths; no absolute paths, parent traversal or hidden normalization. */
    public static path(raw: unknown): string {
        if (
            typeof raw !== 'string' ||
            raw.length === 0 ||
            new TextEncoder().encode(raw).byteLength > 4096 ||
            Array.from(raw).some((value: string): boolean => value.charCodeAt(0) < 32) ||
            (raw !== '.' &&
                raw
                    .split('/')
                    .some((part: string): boolean => part === '' || part === '.' || part === '..'))
        ) {
            throw new Error('Invalid relative connector file path');
        }
        return raw;
    }
    /** Additional executable, environment or host fields can never become read authority. */
    public static request(raw: unknown): ConnectorFileRequest {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'action',
            'requestId',
            'policySha256',
            'rootId',
            'path',
            'offset',
            'limit',
            'cursor',
            'mode',
            'dataBase64',
            'recursive',
            'destination',
            'uploadId',
            'sizeBytes',
            'sha256',
        ]);
        const requestId: string = Boundary.id(value['requestId']);
        if (value['action'] === ConnectorFileAction.Describe) {
            Boundary.record(raw, ['action', 'requestId']);
            return { action: ConnectorFileAction.Describe, requestId };
        }
        const rootId: string = Boundary.id(value['rootId']);
        const policySha256: string = ConnectorEnrollmentCodec.digest(value['policySha256']);
        const path: string = this.path(value['path']);
        if (ConnectorUploadCodec.isAction(value['action'])) {
            return ConnectorUploadCodec.request(value, { requestId, rootId, policySha256, path });
        }
        if (value['action'] === ConnectorFileAction.Chmod) {
            Boundary.record(raw, ['action', 'requestId', 'policySha256', 'rootId', 'path', 'mode']);
            const mode: unknown = value['mode'];
            if (
                path === '.' ||
                (mode !== ConnectorFilePermissionMode.Private &&
                    mode !== ConnectorFilePermissionMode.Executable)
            ) {
                throw new Error('Invalid private connector permission target');
            }
            return {
                action: ConnectorFileAction.Chmod,
                requestId,
                rootId,
                policySha256,
                path,
                mode,
            };
        }
        if (value['action'] === ConnectorFileAction.Rename) {
            Boundary.record(raw, [
                'action',
                'requestId',
                'policySha256',
                'rootId',
                'path',
                'destination',
                'mode',
            ]);
            const destination: string = this.path(value['destination']);
            const mode: ConnectorWriteMode | undefined = Object.values(ConnectorWriteMode).find(
                (entry: ConnectorWriteMode): boolean => entry === value['mode'],
            );
            if (path === '.' || destination === '.' || path === destination || mode === undefined) {
                throw new Error('Invalid connector rename target');
            }
            return {
                action: ConnectorFileAction.Rename,
                requestId,
                rootId,
                policySha256,
                path,
                destination,
                mode,
            };
        }
        if (value['action'] === ConnectorFileAction.Remove) {
            Boundary.record(raw, [
                'action',
                'requestId',
                'policySha256',
                'rootId',
                'path',
                'recursive',
            ]);
            if (path === '.') {
                throw new Error('Cannot remove a connector root');
            }
            return {
                action: ConnectorFileAction.Remove,
                requestId,
                rootId,
                policySha256,
                path,
                recursive: Boundary.boolean(value['recursive']),
            };
        }
        if (value['action'] === ConnectorFileAction.Read) {
            Boundary.record(raw, [
                'action',
                'requestId',
                'policySha256',
                'rootId',
                'path',
                'offset',
                'limit',
            ]);
            const limit: number = Boundary.count(value['limit'], ConnectorFileLimits.readBytes);
            if (limit === 0) {
                throw new Error('Empty read bounds');
            }
            return {
                action: ConnectorFileAction.Read,
                requestId,
                rootId,
                policySha256,
                path,
                offset: Boundary.integer(value['offset']),
                limit,
            };
        }
        if (value['action'] === ConnectorFileAction.Write) {
            Boundary.record(raw, [
                'action',
                'requestId',
                'policySha256',
                'rootId',
                'path',
                'mode',
                'dataBase64',
            ]);
            const mode: ConnectorWriteMode | undefined = Object.values(ConnectorWriteMode).find(
                (entry: ConnectorWriteMode): boolean => entry === value['mode'],
            );
            if (mode === undefined || path === '.') {
                throw new Error('Invalid connector write target');
            }
            return {
                action: ConnectorFileAction.Write,
                requestId,
                rootId,
                policySha256,
                path,
                mode,
                dataBase64: this.writeData(value['dataBase64']),
            };
        }
        if (
            value['action'] === ConnectorFileAction.Stat ||
            value['action'] === ConnectorFileAction.Mkdir
        ) {
            Boundary.record(raw, ['action', 'requestId', 'policySha256', 'rootId', 'path']);
            const action: ConnectorFileAction.Stat | ConnectorFileAction.Mkdir = value['action'];
            if (action === ConnectorFileAction.Mkdir && path === '.') {
                throw new Error('Cannot create a connector root');
            }
            return { action, requestId, rootId, policySha256, path };
        }
        if (value['action'] === ConnectorFileAction.List) {
            Boundary.record(raw, [
                'action',
                'requestId',
                'policySha256',
                'rootId',
                'path',
                'cursor',
            ]);
            return {
                action: ConnectorFileAction.List,
                requestId,
                rootId,
                policySha256,
                path,
                cursor: Boundary.integer(value['cursor']),
            };
        }
        throw new Error('Unsupported connector file action');
    }
    /** Native results must correlate to the original operation before being returned. */
    public static response(
        raw: unknown,
        request: Exclude<ConnectorFileRequest, ConnectorFileDescribe>,
    ): ConnectorFileResponse {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'ok',
            'result',
            'error',
        ]);
        if (value['ok'] === false) {
            Boundary.record(raw, ['ok', 'error']);
            const error: ConnectorFileFailure | undefined = Object.values(
                ConnectorFileFailure,
            ).find((entry: ConnectorFileFailure): boolean => entry === value['error']);
            if (error === undefined) {
                throw new Error('Unsupported native failure');
            }
            return { ok: false, error };
        }
        if (value['ok'] !== true) {
            throw new Error('Invalid native result');
        }
        Boundary.record(raw, ['ok', 'result']);
        if (ConnectorUploadCodec.isRequest(request)) {
            return {
                ok: true,
                result: ConnectorUploadCodec.response(
                    value['result'],
                    request,
                    (entry: unknown): ConnectorFileMetadata => this.#metadata(entry),
                ),
            };
        }
        const result: Readonly<Record<string, unknown>> = Boundary.record(value['result'], [
            'action',
            'requestId',
            'offset',
            'dataBase64',
            'metadata',
            'entries',
            'nextCursor',
            'bytesWritten',
            'entriesRemoved',
        ]);
        if (result['action'] !== request.action || result['requestId'] !== request.requestId) {
            throw new Error('Native file response correlation changed');
        }
        if (request.action === ConnectorFileAction.Mkdir) {
            Boundary.record(result, ['action', 'requestId']);
            return { ok: true, result: { action: request.action, requestId: request.requestId } };
        }
        if (request.action === ConnectorFileAction.Remove) {
            Boundary.record(result, ['action', 'requestId', 'entriesRemoved']);
            const entriesRemoved: bigint = Boundary.integer(result['entriesRemoved']);
            if (
                entriesRemoved === 0n ||
                entriesRemoved > BigInt(ConnectorFileLimits.removalEntries) ||
                (!request.recursive && entriesRemoved !== 1n)
            ) {
                throw new Error('Invalid connector removal result');
            }
            return {
                ok: true,
                result: { action: request.action, requestId: request.requestId, entriesRemoved },
            };
        }
        const metadata: ConnectorFileMetadata = this.#metadata(result['metadata']);
        let output: ConnectorFileOutput;
        if (request.action === ConnectorFileAction.Read) {
            Boundary.record(result, ['action', 'requestId', 'offset', 'dataBase64', 'metadata']);
            const offset: bigint = Boundary.integer(result['offset']);
            const data: unknown = result['dataBase64'];
            if (
                offset !== request.offset ||
                metadata.kind !== ConnectorFileKind.File ||
                typeof data !== 'string' ||
                data.length > Math.ceil(request.limit / 3) * 4 ||
                !/^[A-Za-z0-9+/]*={0,2}$/u.test(data)
            ) {
                throw new Error('Invalid native read response');
            }
            const decoded: string = atob(data);
            if (
                decoded.length > request.limit ||
                btoa(decoded) !== data ||
                (offset >= metadata.sizeBytes
                    ? decoded.length !== 0
                    : BigInt(decoded.length) > metadata.sizeBytes - offset)
            ) {
                throw new Error('Invalid native read encoding');
            }
            output = {
                action: request.action,
                requestId: request.requestId,
                offset,
                dataBase64: data,
                metadata,
            };
        } else if (request.action === ConnectorFileAction.Write) {
            Boundary.record(result, ['action', 'requestId', 'bytesWritten', 'metadata']);
            const bytesWritten: bigint = Boundary.integer(result['bytesWritten']);
            if (
                metadata.kind !== ConnectorFileKind.File ||
                bytesWritten !== BigInt(atob(request.dataBase64).length) ||
                metadata.sizeBytes !== bytesWritten ||
                metadata.mode !== 0o600
            ) {
                throw new Error('Invalid connector write response');
            }
            output = {
                action: request.action,
                requestId: request.requestId,
                bytesWritten,
                metadata,
            };
        } else if (
            request.action === ConnectorFileAction.Chmod ||
            request.action === ConnectorFileAction.Rename
        ) {
            Boundary.record(result, ['action', 'requestId', 'metadata']);
            if (
                metadata.kind !== ConnectorFileKind.File ||
                (request.action === ConnectorFileAction.Chmod &&
                    metadata.mode !== request.mode.valueOf())
            ) {
                throw new Error('Invalid connector metadata mutation result');
            }
            output = { action: request.action, requestId: request.requestId, metadata };
        } else if (request.action === ConnectorFileAction.Stat) {
            Boundary.record(result, ['action', 'requestId', 'metadata']);
            output = { action: request.action, requestId: request.requestId, metadata };
        } else {
            Boundary.record(result, ['action', 'requestId', 'entries', 'nextCursor', 'metadata']);
            if (metadata.kind !== ConnectorFileKind.Directory) {
                throw new Error('Directory result has wrong type');
            }
            const entries: readonly ConnectorFileEntry[] = Boundary.array(
                result['entries'],
                ConnectorFileLimits.entries,
            ).map((rawEntry: unknown): ConnectorFileEntry => {
                const entry: Readonly<Record<string, unknown>> = Boundary.record(rawEntry, [
                    'name',
                    'kind',
                ]);
                const name: string = this.path(entry['name']);
                const kind: ConnectorFileKind | undefined = Object.values(ConnectorFileKind).find(
                    (value: ConnectorFileKind): boolean => value === entry['kind'],
                );
                if (
                    name === '.' ||
                    name.includes('/') ||
                    new TextEncoder().encode(name).byteLength > 255 ||
                    kind === undefined
                ) {
                    throw new Error('Invalid native directory entry');
                }
                return { name, kind };
            });
            const nextCursor: bigint | null =
                result['nextCursor'] === null ? null : Boundary.integer(result['nextCursor']);
            if (
                new Set(entries.map((entry: ConnectorFileEntry): string => entry.name)).size !==
                    entries.length ||
                nextCursor === request.cursor
            ) {
                throw new Error('Ambiguous native directory page');
            }
            output = {
                action: request.action,
                requestId: request.requestId,
                entries,
                nextCursor,
                metadata,
            };
        }
        return { ok: true, result: output };
    }
    /** Canonical complete data is bounded before decoding or signature verification. */
    public static writeData(raw: unknown): string {
        if (
            typeof raw !== 'string' ||
            raw.length > Math.ceil(ConnectorFileLimits.writeBytes / 3) * 4 ||
            !/^[A-Za-z0-9+/]*={0,2}$/u.test(raw)
        ) {
            throw new Error('Invalid connector write data');
        }
        const decoded: string = atob(raw);
        if (decoded.length > ConnectorFileLimits.writeBytes || btoa(decoded) !== raw) {
            throw new Error('Invalid connector write encoding');
        }
        return raw;
    }
    static #metadata(raw: unknown): ConnectorFileMetadata {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, [
            'kind',
            'sizeBytes',
            'modifiedAtNs',
            'mode',
        ]);
        if (
            value['kind'] !== ConnectorFileKind.File &&
            value['kind'] !== ConnectorFileKind.Directory
        ) {
            throw new Error('Unsupported native file metadata');
        }
        return {
            kind: value['kind'],
            sizeBytes: Boundary.integer(value['sizeBytes']),
            modifiedAtNs: Boundary.integer(value['modifiedAtNs']),
            mode: Boundary.count(value['mode'], 0o777),
        };
    }
}

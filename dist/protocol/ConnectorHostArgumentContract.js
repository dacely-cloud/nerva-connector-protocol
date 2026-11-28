// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorHostLimits, ConnectorHostTool } from './ConnectorHost.js';
import { ConnectorHostByteEncoding, ConnectorHostHttpMethod, ConnectorHostKeyAction, ConnectorHostPointerAction, ConnectorHostPointerButton, ConnectorHostShell, ConnectorHostWriteMode, } from './ConnectorHostArgumentChoices.js';
import { ConnectorHostArgumentKind as Kind, } from './ConnectorHostArgumentField.js';
/** Checks that relate several fields and do not fit a single field's kind. */
export const ConnectorHostArgumentRule = {
    /** `data` holds UTF-8 text or canonical base64 per `encoding`, and fits one transport chunk. */
    Bytes: 'bytes',
    /** `key` is one key, or a modifier chord when `action` is press. */
    KeyChord: 'key-chord',
    /** An `offset` other than `"0"` is accepted only with mode `update`. */
    WriteOffset: 'write-offset',
};
/**
 * The argument contract of every native host tool, shared by the connector that executes them and every client that
 * submits them.
 *
 * @remarks
 * A client checks arguments with these contracts before submitting, so a malformed call fails at once with the field
 * named instead of after a round trip to the computer. The connector checks the same contracts again, because a
 * client is never trusted to have done so.
 */
export class ConnectorHostArgumentContracts {
    /** Bounds of the paired account relay, which every remote client submits through. */
    static paired = Object.freeze({
        chunkBytes: ConnectorHostLimits.chunkBytes,
        directoryEntries: ConnectorHostLimits.directoryEntries,
    });
    /** Longest text a native argument carries; process limits bound launch text further. */
    static textLength = 196608;
    /** Longest program, argument, environment value or working directory a launch accepts. */
    static nativeTextLength = 32767;
    /** The contract of one tool under the given transport bounds. */
    static of(tool, bounds) {
        switch (tool) {
            case ConnectorHostTool.ComputerInfo:
            case ConnectorHostTool.DesktopInfo:
            case ConnectorHostTool.DesktopSnapshot:
                return this.#contract(tool, {}, []);
            case ConnectorHostTool.NetworkResolve:
                return this.#contract(tool, { hostname: this.#text(1, 253) }, ['hostname']);
            case ConnectorHostTool.HttpOpen:
                return this.#contract(tool, {
                    url: this.#text(1, 16384),
                    address: this.#text(1, 64),
                    method: this.#choice(Object.values(ConnectorHostHttpMethod)),
                    headers: {
                        kind: Kind.TextMap,
                        nullable: false,
                        key: this.#text(1, this.textLength),
                        value: this.#text(0, this.textLength),
                        maxEntries: 8,
                    },
                    maximumBytes: { kind: Kind.Decimal, nullable: false },
                    timeoutMs: this.#integer(1000, 900000),
                    idleTimeoutMs: this.#integer(1000, 30000),
                }, [
                    'url',
                    'address',
                    'method',
                    'headers',
                    'maximumBytes',
                    'timeoutMs',
                    'idleTimeoutMs',
                ]);
            case ConnectorHostTool.HttpRead:
                return this.#contract(tool, {
                    transferId: this.#text(1, this.textLength),
                    offset: { kind: Kind.Decimal, nullable: false },
                    maximumBytes: this.#integer(1, bounds.chunkBytes),
                }, ['transferId', 'offset', 'maximumBytes']);
            case ConnectorHostTool.HttpClose:
                return this.#contract(tool, { transferId: this.#text(1, this.textLength) }, [
                    'transferId',
                ]);
            case ConnectorHostTool.EnvironmentInspect:
                return this.#contract(tool, {
                    programs: this.#names('/\\', ['.', '..']),
                    variables: this.#names('=', []),
                }, ['programs', 'variables']);
            case ConnectorHostTool.FilePublish:
            case ConnectorHostTool.FileRename:
                return this.#contract(tool, {
                    source: this.#text(1, this.textLength),
                    destination: this.#text(1, this.textLength),
                }, ['source', 'destination']);
            case ConnectorHostTool.FileChmod:
                return this.#contract(tool, { path: this.#text(1, this.textLength), mode: this.#integer(0, 0o7777) }, ['path', 'mode']);
            case ConnectorHostTool.DesktopScreenshot:
                return this.#contract(tool, {
                    path: this.#text(1, this.textLength),
                    mode: this.#choice([
                        ConnectorHostWriteMode.Create,
                        ConnectorHostWriteMode.Replace,
                    ]),
                    maximumWidth: this.#integer(1, 4096),
                    maximumHeight: this.#integer(1, 4096),
                }, ['path', 'mode']);
            case ConnectorHostTool.ApplicationOpen:
                return this.#contract(tool, {
                    name: { ...this.#text(1, 4096), excludes: '\r\n' },
                    url: this.#text(8, 4096),
                    workspaceFile: this.#text(1, this.textLength),
                }, ['name'], {
                    required: false,
                    alternatives: [
                        { fields: ['url'], required: ['url'] },
                        { fields: ['workspaceFile'], required: ['workspaceFile'] },
                    ],
                });
            case ConnectorHostTool.DesktopPointer:
                return this.#contract(tool, {
                    x: this.#integer(-1000000, 1000000),
                    y: this.#integer(-1000000, 1000000),
                    action: this.#choice(Object.values(ConnectorHostPointerAction)),
                    button: {
                        ...this.#choice(Object.values(ConnectorHostPointerButton)),
                        nullable: true,
                    },
                    image: this.#image(),
                }, ['x', 'y', 'action']);
            case ConnectorHostTool.DesktopKey:
                return this.#contract(tool, {
                    key: this.#text(1, 64),
                    action: this.#choice(Object.values(ConnectorHostKeyAction)),
                    target: this.#text(1, 60),
                }, ['key', 'action'], null, [ConnectorHostArgumentRule.KeyChord]);
            case ConnectorHostTool.DesktopText:
                return this.#contract(tool, {
                    text: this.#text(0, this.textLength),
                    target: this.#text(1, 60),
                    field: this.#text(1, 256),
                    replace: { kind: Kind.True, nullable: false },
                }, ['text'], {
                    required: false,
                    alternatives: [
                        { fields: ['field', 'replace'], required: ['field', 'replace'] },
                    ],
                });
            case ConnectorHostTool.FileRead:
                return this.#contract(tool, {
                    path: this.#text(1, this.textLength),
                    offset: { kind: Kind.Decimal, nullable: false },
                    maximumBytes: this.#integer(1, bounds.chunkBytes),
                    snapshot: this.#snapshot(),
                }, ['path']);
            case ConnectorHostTool.FileDigest:
                return this.#contract(tool, { path: this.#text(1, this.textLength), snapshot: this.#snapshot() }, ['path', 'snapshot']);
            case ConnectorHostTool.FileWrite:
                return this.#contract(tool, {
                    path: this.#text(1, this.textLength),
                    data: { kind: Kind.Data, nullable: false, maxLength: this.textLength },
                    encoding: this.#choice(Object.values(ConnectorHostByteEncoding)),
                    mode: this.#choice(Object.values(ConnectorHostWriteMode)),
                    offset: { kind: Kind.Decimal, nullable: false },
                }, ['path', 'data', 'encoding', 'mode'], null, [ConnectorHostArgumentRule.Bytes, ConnectorHostArgumentRule.WriteOffset]);
            case ConnectorHostTool.FileStat:
                return this.#contract(tool, {
                    path: this.#text(1, this.textLength),
                    follow: { kind: Kind.Boolean, nullable: false },
                }, ['path']);
            case ConnectorHostTool.DirectoryList:
                return this.#contract(tool, {
                    path: this.#text(1, this.textLength),
                    offset: this.#integer(0, 1000000),
                    maximumEntries: this.#integer(1, bounds.directoryEntries),
                }, ['path']);
            case ConnectorHostTool.DirectoryCreate:
            case ConnectorHostTool.FileRemove:
                return this.#contract(tool, {
                    path: this.#text(1, this.textLength),
                    recursive: { kind: Kind.Boolean, nullable: false },
                }, ['path', 'recursive']);
            case ConnectorHostTool.ProcessStart:
                return this.#launch(tool, {});
            case ConnectorHostTool.TerminalStart:
                return this.#launch(tool, {
                    cols: this.#integer(2, 500),
                    rows: this.#integer(1, 200),
                });
            case ConnectorHostTool.ProcessRead:
                return this.#contract(tool, {
                    processId: this.#text(1, this.textLength),
                    stdoutOffset: { kind: Kind.Decimal, nullable: false },
                    stderrOffset: { kind: Kind.Decimal, nullable: false },
                    maximumBytes: this.#integer(1, bounds.chunkBytes),
                }, ['processId']);
            case ConnectorHostTool.ProcessWrite:
                return this.#contract(tool, {
                    processId: this.#text(1, this.textLength),
                    data: { kind: Kind.Data, nullable: false, maxLength: this.textLength },
                    encoding: this.#choice(Object.values(ConnectorHostByteEncoding)),
                    end: { kind: Kind.Boolean, nullable: false },
                }, ['processId', 'data', 'encoding', 'end'], null, [ConnectorHostArgumentRule.Bytes]);
            case ConnectorHostTool.TerminalRead:
                return this.#contract(tool, {
                    processId: this.#text(1, this.textLength),
                    offset: { kind: Kind.Decimal, nullable: false },
                    maximumBytes: this.#integer(1, bounds.chunkBytes),
                }, ['processId']);
            case ConnectorHostTool.TerminalWrite:
                return this.#contract(tool, {
                    processId: this.#text(1, this.textLength),
                    data: { kind: Kind.Data, nullable: false, maxLength: this.textLength },
                    encoding: this.#choice(Object.values(ConnectorHostByteEncoding)),
                }, ['processId', 'data', 'encoding'], null, [ConnectorHostArgumentRule.Bytes]);
            case ConnectorHostTool.TerminalResize:
                return this.#contract(tool, {
                    processId: this.#text(1, this.textLength),
                    cols: this.#integer(2, 500),
                    rows: this.#integer(1, 200),
                }, ['processId', 'cols', 'rows']);
            case ConnectorHostTool.ProcessStop:
            case ConnectorHostTool.ProcessRelease:
            case ConnectorHostTool.TerminalStop:
            case ConnectorHostTool.TerminalRelease:
                return this.#contract(tool, { processId: this.#text(1, this.textLength) }, [
                    'processId',
                ]);
            default:
                throw new Error('Unknown host tool');
        }
    }
    /**
     * Program and terminal launches choose executable with arguments, or shell with command.
     *
     * @remarks
     * `null` means absent for every launch field except the durations, and an empty `arguments` list selects
     * nothing, matching how the computer has always read a launch.
     */
    static #launch(tool, extra) {
        return this.#contract(tool, {
            executable: { ...this.#text(1, this.nativeTextLength), nullable: true },
            arguments: {
                kind: Kind.TextList,
                nullable: true,
                item: this.#text(0, this.nativeTextLength),
                maxItems: 256,
                unique: false,
            },
            shell: { ...this.#choice(Object.values(ConnectorHostShell)), nullable: true },
            command: { ...this.#text(1, this.textLength), nullable: true },
            directory: { ...this.#text(1, this.nativeTextLength), nullable: true },
            environment: {
                kind: Kind.TextMap,
                nullable: true,
                key: { ...this.#text(1, 256), excludes: '=' },
                value: this.#text(0, this.nativeTextLength),
                maxEntries: 256,
            },
            timeoutMs: this.#integer(1, 604800000),
            retentionAfterTimeoutMs: this.#integer(1000, 86400000),
            ...extra,
        }, ['timeoutMs', ...Object.keys(extra)], {
            required: true,
            alternatives: [
                { fields: ['executable', 'arguments'], required: ['executable'] },
                { fields: ['shell', 'command'], required: ['shell', 'command'] },
            ],
        });
    }
    /** Snapshot preconditions name an opened file's identity, exact size and modification time. */
    static #snapshot() {
        return {
            kind: Kind.Record,
            nullable: false,
            fields: {
                identity: this.#text(1, 256),
                size: { kind: Kind.Decimal, nullable: false },
                modifiedAtNs: { kind: Kind.SignedDecimal, nullable: false, maxLength: 40 },
            },
            required: ['identity', 'size', 'modifiedAtNs'],
        };
    }
    /** Screenshot geometry maps image pixels to the physical desktop the image depicts. */
    static #image() {
        return {
            kind: Kind.Record,
            nullable: false,
            fields: {
                width: this.#integer(1, 4096),
                height: this.#integer(1, 4096),
                sourceX: this.#integer(-65535, 65535),
                sourceY: this.#integer(-65535, 65535),
                sourceWidth: this.#integer(1, 65535),
                sourceHeight: this.#integer(1, 65535),
            },
            required: ['width', 'height', 'sourceX', 'sourceY', 'sourceWidth', 'sourceHeight'],
        };
    }
    /** Bare program or variable names: unique, well-formed and at most 255 code points each. */
    static #names(excludes, reserved) {
        return {
            kind: Kind.TextList,
            nullable: false,
            item: { ...this.#text(1, 510), excludes, maxCodePoints: 255, reserved },
            maxItems: 256,
            unique: true,
        };
    }
    static #text(minLength, maxLength) {
        return {
            kind: Kind.Text,
            nullable: false,
            minLength,
            maxLength,
            excludes: '',
            maxCodePoints: null,
            reserved: [],
        };
    }
    static #integer(minimum, maximum) {
        return { kind: Kind.Integer, nullable: false, minimum, maximum };
    }
    static #choice(values) {
        return { kind: Kind.Choice, nullable: false, values };
    }
    static #contract(tool, fields, required, modes = null, rules = []) {
        return { tool, fields, required, modes, rules };
    }
}

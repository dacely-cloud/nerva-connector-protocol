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
    /** Paths, identifiers and other required text; one shared declaration keeps the table small in every bundle. */
    static #nonEmpty = this.#text(1, this.textLength);
    static #anyText = this.#text(0, this.textLength);
    static #nativeText = this.#text(1, this.nativeTextLength);
    static #decimal = {
        kind: Kind.Decimal,
        nullable: false,
    };
    static #boolean = {
        kind: Kind.Boolean,
        nullable: false,
    };
    static #payload = {
        kind: Kind.Data,
        nullable: false,
        maxLength: this.textLength,
    };
    static #encoding = this.#choice(ConnectorHostByteEncoding);
    /** The contract of one tool under the given transport bounds. */
    static of(tool, bounds) {
        const chunk = this.#integer(1, bounds.chunkBytes);
        switch (tool) {
            case ConnectorHostTool.ComputerInfo:
            case ConnectorHostTool.DesktopInfo:
            case ConnectorHostTool.DesktopSnapshot:
                return this.#contract(tool, {});
            case ConnectorHostTool.NetworkResolve:
                return this.#contract(tool, { hostname: this.#text(1, 253) });
            case ConnectorHostTool.HttpOpen:
                return this.#contract(tool, {
                    url: this.#text(1, 16384),
                    address: this.#text(1, 64),
                    method: this.#choice(ConnectorHostHttpMethod),
                    headers: {
                        kind: Kind.TextMap,
                        nullable: false,
                        key: this.#nonEmpty,
                        value: this.#anyText,
                        maxEntries: 8,
                    },
                    maximumBytes: this.#decimal,
                    timeoutMs: this.#integer(1000, 900000),
                    idleTimeoutMs: this.#integer(1000, 30000),
                }, []);
            case ConnectorHostTool.HttpRead:
                return this.#contract(tool, {
                    transferId: this.#nonEmpty,
                    offset: this.#decimal,
                    maximumBytes: chunk,
                }, []);
            case ConnectorHostTool.HttpClose:
                return this.#contract(tool, { transferId: this.#nonEmpty });
            case ConnectorHostTool.EnvironmentInspect:
                return this.#contract(tool, {
                    programs: this.#names('/\\', ['.', '..']),
                    variables: this.#names('=', []),
                }, []);
            case ConnectorHostTool.FilePublish:
            case ConnectorHostTool.FileRename:
                return this.#contract(tool, {
                    source: this.#nonEmpty,
                    destination: this.#nonEmpty,
                }, []);
            case ConnectorHostTool.FileChmod:
                return this.#contract(tool, { path: this.#nonEmpty, mode: this.#integer(0, 0o7777) }, []);
            case ConnectorHostTool.DesktopScreenshot:
                return this.#contract(tool, {
                    path: this.#nonEmpty,
                    mode: this.#choice([
                        ConnectorHostWriteMode.Create,
                        ConnectorHostWriteMode.Replace,
                    ]),
                    maximumWidth: this.#integer(1, 4096),
                    maximumHeight: this.#integer(1, 4096),
                }, ['maximumWidth', 'maximumHeight']);
            case ConnectorHostTool.ApplicationOpen:
                return this.#contract(tool, {
                    name: { ...this.#text(1, 4096), excludes: '\r\n' },
                    url: this.#text(8, 4096),
                    workspaceFile: this.#nonEmpty,
                }, ['url', 'workspaceFile'], {
                    required: false,
                    alternatives: [
                        this.#alternative(['url']),
                        this.#alternative(['workspaceFile']),
                    ],
                });
            case ConnectorHostTool.DesktopPointer:
                return this.#contract(tool, {
                    x: this.#integer(-1000000, 1000000),
                    y: this.#integer(-1000000, 1000000),
                    action: this.#choice(ConnectorHostPointerAction),
                    button: this.#nullable(this.#choice(ConnectorHostPointerButton)),
                    image: this.#image(),
                }, ['button', 'image']);
            case ConnectorHostTool.DesktopKey:
                return this.#contract(tool, {
                    key: this.#text(1, 64),
                    action: this.#choice(ConnectorHostKeyAction),
                    target: this.#text(1, 60),
                }, ['target'], null, [ConnectorHostArgumentRule.KeyChord]);
            case ConnectorHostTool.DesktopText:
                return this.#contract(tool, {
                    text: this.#anyText,
                    target: this.#text(1, 60),
                    field: this.#text(1, 256),
                    replace: { kind: Kind.True, nullable: false },
                }, ['target', 'field', 'replace'], {
                    required: false,
                    alternatives: [this.#alternative(['field', 'replace'])],
                });
            case ConnectorHostTool.FileRead:
                return this.#contract(tool, {
                    path: this.#nonEmpty,
                    offset: this.#decimal,
                    maximumBytes: chunk,
                    snapshot: this.#snapshot(),
                }, ['offset', 'maximumBytes', 'snapshot']);
            case ConnectorHostTool.FileDigest:
                return this.#contract(tool, { path: this.#nonEmpty, snapshot: this.#snapshot() });
            case ConnectorHostTool.FileWrite:
                return this.#contract(tool, {
                    path: this.#nonEmpty,
                    data: this.#payload,
                    encoding: this.#encoding,
                    mode: this.#choice(ConnectorHostWriteMode),
                    offset: this.#decimal,
                }, ['offset'], null, [ConnectorHostArgumentRule.Bytes, ConnectorHostArgumentRule.WriteOffset]);
            case ConnectorHostTool.FileStat:
                return this.#contract(tool, {
                    path: this.#nonEmpty,
                    follow: this.#boolean,
                }, ['follow']);
            case ConnectorHostTool.DirectoryList:
                return this.#contract(tool, {
                    path: this.#nonEmpty,
                    offset: this.#integer(0, 1000000),
                    maximumEntries: this.#integer(1, bounds.directoryEntries),
                }, ['offset', 'maximumEntries']);
            case ConnectorHostTool.DirectoryCreate:
            case ConnectorHostTool.FileRemove:
                return this.#contract(tool, {
                    path: this.#nonEmpty,
                    recursive: this.#boolean,
                }, []);
            case ConnectorHostTool.ProcessStart:
                return this.#launch(tool, {});
            case ConnectorHostTool.TerminalStart:
                return this.#launch(tool, {
                    cols: this.#integer(2, 500),
                    rows: this.#integer(1, 200),
                });
            case ConnectorHostTool.ProcessRead:
                return this.#contract(tool, {
                    processId: this.#nonEmpty,
                    stdoutOffset: this.#decimal,
                    stderrOffset: this.#decimal,
                    maximumBytes: chunk,
                }, ['stdoutOffset', 'stderrOffset', 'maximumBytes']);
            case ConnectorHostTool.ProcessWrite:
                return this.#contract(tool, {
                    processId: this.#nonEmpty,
                    data: this.#payload,
                    encoding: this.#encoding,
                    end: this.#boolean,
                }, [], null, [ConnectorHostArgumentRule.Bytes]);
            case ConnectorHostTool.TerminalRead:
                return this.#contract(tool, {
                    processId: this.#nonEmpty,
                    offset: this.#decimal,
                    maximumBytes: chunk,
                }, ['offset', 'maximumBytes']);
            case ConnectorHostTool.TerminalWrite:
                return this.#contract(tool, {
                    processId: this.#nonEmpty,
                    data: this.#payload,
                    encoding: this.#encoding,
                }, [], null, [ConnectorHostArgumentRule.Bytes]);
            case ConnectorHostTool.TerminalResize:
                return this.#contract(tool, {
                    processId: this.#nonEmpty,
                    cols: this.#integer(2, 500),
                    rows: this.#integer(1, 200),
                }, []);
            case ConnectorHostTool.ProcessStop:
            case ConnectorHostTool.ProcessRelease:
            case ConnectorHostTool.TerminalStop:
            case ConnectorHostTool.TerminalRelease:
                return this.#contract(tool, { processId: this.#nonEmpty });
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
            executable: this.#nullable(this.#nativeText),
            arguments: {
                kind: Kind.TextList,
                nullable: true,
                item: this.#text(0, this.nativeTextLength),
                maxItems: 256,
                unique: false,
            },
            shell: this.#nullable(this.#choice(ConnectorHostShell)),
            command: this.#nullable(this.#nonEmpty),
            directory: this.#nullable(this.#nativeText),
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
        }, [
            'executable',
            'arguments',
            'shell',
            'command',
            'directory',
            'environment',
            'retentionAfterTimeoutMs',
        ], {
            required: true,
            alternatives: [
                this.#alternative(['executable', 'arguments'], ['executable']),
                this.#alternative(['shell', 'command']),
            ],
        });
    }
    /** Snapshot preconditions name an opened file's identity, exact size and modification time. */
    static #snapshot() {
        return this.#record({
            identity: this.#text(1, 256),
            size: this.#decimal,
            modifiedAtNs: { kind: Kind.SignedDecimal, nullable: false, maxLength: 40 },
        });
    }
    /** Screenshot geometry maps image pixels to the physical desktop the image depicts. */
    static #image() {
        return this.#record({
            width: this.#integer(1, 4096),
            height: this.#integer(1, 4096),
            sourceX: this.#integer(-65535, 65535),
            sourceY: this.#integer(-65535, 65535),
            sourceWidth: this.#integer(1, 65535),
            sourceHeight: this.#integer(1, 65535),
        });
    }
    /** A nested object whose fields are all required. */
    static #record(fields) {
        return { kind: Kind.Record, nullable: false, fields, required: Object.keys(fields) };
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
    /** One mode alternative; unless stated otherwise it requires every field that selects it. */
    static #alternative(fields, required = fields) {
        return { fields, required };
    }
    /** The same field with `null` read as absent. */
    static #nullable(field) {
        return { ...field, nullable: true };
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
        return { kind: Kind.Choice, nullable: false, values: Object.values(values) };
    }
    /** Every field is required unless it is named in `optional`. */
    static #contract(tool, fields, optional = [], modes = null, rules = []) {
        return {
            tool,
            fields,
            required: Object.keys(fields).filter((name) => !optional.includes(name)),
            modes,
            rules,
        };
    }
}

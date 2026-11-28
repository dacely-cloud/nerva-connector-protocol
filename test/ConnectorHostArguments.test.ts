// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ConnectorHostTool } from '../dist/protocol/ConnectorHost.js';
import { ConnectorHostArgumentContracts } from '../dist/protocol/ConnectorHostArgumentContract.js';
import { ConnectorHostArgumentSchema } from '../dist/protocol/ConnectorHostArgumentSchema.js';
import { ConnectorHostArgumentShape } from '../dist/protocol/ConnectorHostArgumentShape.js';
import {
    ConnectorHostArgumentValidation,
    type ConnectorHostArgumentCheck,
} from '../dist/protocol/ConnectorHostArgumentValidation.js';
import { ConnectorHostKeyChord } from '../dist/protocol/ConnectorHostKeyChord.js';

/** One argument object and the exact rejection it must produce, or null when it is accepted. */
interface ArgumentCase {
    readonly tool: ConnectorHostTool;
    readonly arguments: unknown;
    readonly rejection: string | null;
}

/** Calls a computer rejected after a full round trip, plus the forms it accepts. */
const cases: readonly ArgumentCase[] = [
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { command: 'dir', timeoutMs: 30000 },
        rejection: 'process_start requires shell with command',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { executable: 'cmd.exe', command: 'dir', timeoutMs: 30000 },
        rejection:
            'process_start takes executable with optional arguments or shell with command, not both',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { timeoutMs: 30000 },
        rejection: 'process_start needs executable with optional arguments or shell with command',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { shell: 'cmd', command: 'dir' },
        rejection: 'process_start requires timeoutMs',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { shell: 'cmd', command: 'dir', timeoutMs: 0 },
        rejection: 'timeoutMs must be a JSON integer from 1 to 604800000',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { shell: 'cmd', command: 'dir', timeoutMs: '30000' },
        rejection: 'timeoutMs must be a JSON integer from 1 to 604800000, not a string',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { cmd: 'dir', timeoutMs: 30000 },
        rejection: 'process_start does not take cmd',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { 'shell command': 'dir', timeoutMs: 30000 },
        rejection: 'process_start does not take one of the supplied fields',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { shell: 'cmd', command: 'dir', arguments: ['/c'], timeoutMs: 30000 },
        rejection:
            'process_start takes executable with optional arguments or shell with command, not both',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { executable: 'calc.exe', environment: { 'A=B': 'value' }, timeoutMs: 1 },
        rejection: 'each environment name must not contain "="',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { executable: 'calc.exe', environment: { KEY: 5 }, timeoutMs: 1 },
        rejection: 'environment.KEY must be a string, not a JSON number',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { executable: 'calc.exe', arguments: ['bad\0argument'], timeoutMs: 1 },
        rejection: 'arguments[0] must not contain NUL characters',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { shell: 'zsh', command: 'echo', timeoutMs: 1 },
        rejection: 'shell must be one of bash, sh, cmd, powershell, pwsh',
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: {
            executable: 'calc.exe',
            arguments: null,
            shell: null,
            command: null,
            directory: null,
            environment: null,
            timeoutMs: 30000,
        },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.ProcessStart,
        arguments: { shell: 'cmd', command: 'dir', arguments: [], executable: null, timeoutMs: 1 },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.TerminalStart,
        arguments: { shell: 'bash', command: 'ls', timeoutMs: 1000 },
        rejection: 'terminal_start requires cols',
    },
    {
        tool: ConnectorHostTool.FileRemove,
        arguments: { path: 'C:\\temp\\x' },
        rejection: 'file_remove requires recursive',
    },
    {
        tool: ConnectorHostTool.DirectoryCreate,
        arguments: { path: 'out', recursive: 'true' },
        rejection: 'recursive must be true or false, not a string',
    },
    {
        tool: ConnectorHostTool.EnvironmentInspect,
        arguments: { programs: ['node'] },
        rejection: 'environment_inspect requires variables',
    },
    {
        tool: ConnectorHostTool.EnvironmentInspect,
        arguments: { programs: ['node', 'node'], variables: [] },
        rejection: 'programs[1] repeats an earlier item',
    },
    {
        tool: ConnectorHostTool.EnvironmentInspect,
        arguments: { programs: ['bin/node'], variables: [] },
        rejection: 'programs[0] must not contain "/" or "\\"',
    },
    {
        tool: ConnectorHostTool.EnvironmentInspect,
        arguments: { programs: ['..'], variables: [] },
        rejection: 'programs[0] must not be "." or ".."',
    },
    {
        tool: ConnectorHostTool.ProcessRead,
        arguments: { processId: 'p1', stdoutOffset: 0 },
        rejection: 'stdoutOffset must be a decimal integer string such as "0", not a JSON number',
    },
    {
        tool: ConnectorHostTool.ProcessRead,
        arguments: { processId: 'p1', stdoutOffset: '0', stderrOffset: '12', maximumBytes: 32768 },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.ProcessRead,
        arguments: { processId: 'p1', maximumBytes: 32769 },
        rejection: 'maximumBytes must be a JSON integer from 1 to 32768',
    },
    {
        tool: ConnectorHostTool.FileRead,
        arguments: { path: 'a', offset: '9223372036854775808' },
        rejection: 'offset must be at most "9223372036854775807"',
    },
    {
        tool: ConnectorHostTool.FileRead,
        arguments: { path: 'a', snapshot: { identity: 'i', size: '1' } },
        rejection: 'snapshot requires modifiedAtNs',
    },
    {
        tool: ConnectorHostTool.FileDigest,
        arguments: { path: 'a', snapshot: { identity: 'i', size: '1', modifiedAtNs: '-5' } },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.FileStat,
        arguments: { path: 'a', follow: true, toolName: 'file_stat' },
        rejection: 'file_stat does not take toolName',
    },
    {
        tool: ConnectorHostTool.FileStat,
        arguments: [],
        rejection: 'file_stat arguments must be a JSON object, not an array',
    },
    {
        tool: ConnectorHostTool.FileWrite,
        arguments: { path: 'a', data: 'QR==', encoding: 'base64', mode: 'create' },
        rejection: 'data must be canonical padded base64 when encoding is base64',
    },
    {
        tool: ConnectorHostTool.FileWrite,
        arguments: { path: 'a', data: 'QQ', encoding: 'base64', mode: 'create' },
        rejection: 'data must be canonical padded base64 when encoding is base64',
    },
    {
        tool: ConnectorHostTool.FileWrite,
        arguments: { path: 'a', data: 'QUI=', encoding: 'base64', mode: 'update', offset: '4' },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.FileWrite,
        arguments: { path: 'a', data: 'x\0y', encoding: 'utf8', mode: 'append', offset: '0' },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.FileWrite,
        arguments: { path: 'a', data: '', encoding: 'utf8', mode: 'append', offset: '4' },
        rejection: 'an offset other than "0" needs mode update',
    },
    {
        tool: ConnectorHostTool.FileWrite,
        arguments: { path: 'a', data: 'é'.repeat(16385), encoding: 'utf8', mode: 'create' },
        rejection: 'data must be at most 32768 UTF-8 bytes; send larger content in several chunks',
    },
    {
        tool: ConnectorHostTool.ProcessWrite,
        arguments: { processId: 'p', data: 'AAAA'.repeat(10923), encoding: 'base64', end: false },
        rejection: 'data must decode to at most 32768 bytes; send larger content in several chunks',
    },
    {
        tool: ConnectorHostTool.DesktopKey,
        arguments: { key: 'ctrl+l', action: 'press' },
        rejection: `key must be one key: a letter or digit, F1 to F12, Enter, Tab, Escape, Backspace, Delete, Insert, Home, End, PageUp, PageDown, Up, Down, Left, Right, Space, Control, Alt, Shift, Meta; with action press it may be distinct Control, Alt, Shift, Meta modifiers joined by + before one other key, such as Control+l`,
    },
    {
        tool: ConnectorHostTool.DesktopKey,
        arguments: { key: 'Control+l', action: 'down' },
        rejection: 'a key chord needs action press; down and up hold or release one key',
    },
    {
        tool: ConnectorHostTool.DesktopKey,
        arguments: { key: 'Control+Shift+F5', action: 'press', target: 'w'.repeat(60) },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.DesktopText,
        arguments: { text: '', field: 'Search' },
        rejection: 'desktop_text requires replace with field',
    },
    {
        tool: ConnectorHostTool.DesktopText,
        arguments: { text: 'hello', field: 'Search', replace: true },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.DesktopPointer,
        arguments: { x: 1, y: 2, action: 'move', button: null },
        rejection: null,
    },
    {
        tool: ConnectorHostTool.DesktopPointer,
        arguments: { x: 1, y: 2, action: 'click', image: { width: 10, height: 10 } },
        rejection: 'image requires sourceX',
    },
    {
        tool: ConnectorHostTool.ApplicationOpen,
        arguments: { name: 'Chrome', url: 'https://example.com', workspaceFile: 'a.html' },
        rejection: 'application_open takes url or workspaceFile, not both',
    },
    {
        tool: ConnectorHostTool.ComputerInfo,
        arguments: {},
        rejection: null,
    },
];

test('host arguments are refused with the field named, and accepted forms pass', (): void => {
    for (const entry of cases) {
        const result: ConnectorHostArgumentCheck = ConnectorHostArgumentValidation.check(
            entry.tool,
            entry.arguments,
            ConnectorHostArgumentContracts.paired,
        );
        assert.equal(result.valid ? null : result.message, entry.rejection, entry.tool);
    }
});

test('rejection messages never repeat supplied values', (): void => {
    const result: ConnectorHostArgumentCheck = ConnectorHostArgumentValidation.check(
        ConnectorHostTool.ProcessStart,
        { executable: 'secret-program', command: 'secret-command', timeoutMs: 1 },
        ConnectorHostArgumentContracts.paired,
    );
    assert.equal(result.valid, false);
    assert.doesNotMatch(result.valid ? '' : result.message, /secret/u);
});

test('validated arguments read back as typed values with absent fields defaulted', (): void => {
    const result: ConnectorHostArgumentCheck = ConnectorHostArgumentValidation.check(
        ConnectorHostTool.ProcessRead,
        { processId: 'p1', stdoutOffset: '9007199254740993' },
        ConnectorHostArgumentContracts.paired,
    );
    assert.ok(result.valid);
    assert.equal(result.arguments.text('processId'), 'p1');
    assert.equal(result.arguments.decimal('stdoutOffset'), 9007199254740993n);
    assert.equal(result.arguments.optionalDecimal('stderrOffset', 0n), 0n);
    assert.equal(result.arguments.optionalInteger('maximumBytes', 64), 64);
    assert.throws((): bigint => result.arguments.decimal('stderrOffset'));
});

test('every tool has a contract, a shape and a closed schema', (): void => {
    for (const tool of Object.values(ConnectorHostTool)) {
        const shape: string = ConnectorHostArgumentShape.of(
            tool,
            ConnectorHostArgumentContracts.paired,
        );
        assert.match(shape, /^\{.*\}$/u, tool);
        assert.equal(
            ConnectorHostArgumentSchema.of(tool, ConnectorHostArgumentContracts.paired)[
                'additionalProperties'
            ],
            false,
        );
    }
    assert.equal(
        ConnectorHostArgumentShape.of(
            ConnectorHostTool.ProcessStart,
            ConnectorHostArgumentContracts.paired,
        ),
        '{(executable,arguments?:[text]) or (shell:bash|sh|cmd|powershell|pwsh,command),directory?,environment?:{text},timeoutMs:n,retentionAfterTimeoutMs?:n}',
    );
    assert.match(
        ConnectorHostArgumentShape.catalog(
            Object.values(ConnectorHostTool),
            ConnectorHostArgumentContracts.paired,
        ),
        /terminal_start \{\.\.\.process_start,cols:n,rows:n\}/u,
    );
});

test('the schema keeps the bounds a schema-only client has always seen', (): void => {
    assert.deepEqual(
        ConnectorHostArgumentSchema.of(
            ConnectorHostTool.EnvironmentInspect,
            ConnectorHostArgumentContracts.paired,
        ),
        {
            type: 'object',
            properties: {
                programs: {
                    type: 'array',
                    items: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                        pattern: '^[^/\\\\\\u0000]*$',
                    },
                    maxItems: 256,
                    uniqueItems: true,
                },
                variables: {
                    type: 'array',
                    items: {
                        type: 'string',
                        minLength: 1,
                        maxLength: 255,
                        pattern: '^[^=\\u0000]*$',
                    },
                    maxItems: 256,
                    uniqueItems: true,
                },
            },
            required: ['programs', 'variables'],
            additionalProperties: false,
        },
    );
});

test('key chords follow the closed grammar', (): void => {
    assert.equal(ConnectorHostKeyChord.read('Control+l', 'press'), 'Control+l');
    assert.equal(ConnectorHostKeyChord.accepts('Control+l', 'down'), false);
    assert.equal(ConnectorHostKeyChord.accepts('Control+Control+l', 'press'), false);
    assert.equal(ConnectorHostKeyChord.accepts('Control+Shift', 'press'), false);
    assert.equal(ConnectorHostKeyChord.accepts('F12', 'down'), true);
    assert.equal(ConnectorHostKeyChord.single('Shift'), true);
    assert.equal(ConnectorHostKeyChord.single('F13'), false);
});

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Shells a host launch may name; each maps to the computer's own installed shell. */
export const ConnectorHostShell = {
    Bash: 'bash',
    Sh: 'sh',
    Cmd: 'cmd',
    PowerShell: 'powershell',
    Pwsh: 'pwsh',
};
/** File writes state creation, truncation, positioned update or append explicitly. */
export const ConnectorHostWriteMode = {
    Create: 'create',
    Replace: 'replace',
    Update: 'update',
    Append: 'append',
};
/** Byte payloads travel as UTF-8 text or canonical base64. */
export const ConnectorHostByteEncoding = {
    Utf8: 'utf8',
    Base64: 'base64',
};
/** Pinned HTTP transfers read only; no method carries a request body. */
export const ConnectorHostHttpMethod = { Get: 'GET', Head: 'HEAD' };
/** A pointer request moves, clicks, presses or releases. */
export const ConnectorHostPointerAction = {
    Move: 'move',
    Click: 'click',
    Down: 'down',
    Up: 'up',
};
/** Button names map to ordinary operating-system pointer buttons. */
export const ConnectorHostPointerButton = {
    Left: 'left',
    Middle: 'middle',
    Right: 'right',
};
/** A key request presses once, or holds and later releases one key. */
export const ConnectorHostKeyAction = { Press: 'press', Down: 'down', Up: 'up' };

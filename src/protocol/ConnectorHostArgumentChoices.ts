// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

/** Shells a host launch may name; each maps to the computer's own installed shell. */
export const ConnectorHostShell = {
    Bash: 'bash',
    Sh: 'sh',
    Cmd: 'cmd',
    PowerShell: 'powershell',
    Pwsh: 'pwsh',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostShell = (typeof ConnectorHostShell)[keyof typeof ConnectorHostShell];

/** File writes state creation, truncation, positioned update or append explicitly. */
export const ConnectorHostWriteMode = {
    Create: 'create',
    Replace: 'replace',
    Update: 'update',
    Append: 'append',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostWriteMode =
    (typeof ConnectorHostWriteMode)[keyof typeof ConnectorHostWriteMode];

/** Byte payloads travel as UTF-8 text or canonical base64. */
export const ConnectorHostByteEncoding = {
    Utf8: 'utf8',
    Base64: 'base64',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostByteEncoding =
    (typeof ConnectorHostByteEncoding)[keyof typeof ConnectorHostByteEncoding];

/** Pinned HTTP transfers read only; no method carries a request body. */
export const ConnectorHostHttpMethod = { Get: 'GET', Head: 'HEAD' } as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostHttpMethod =
    (typeof ConnectorHostHttpMethod)[keyof typeof ConnectorHostHttpMethod];

/** A pointer request moves, clicks, presses or releases. */
export const ConnectorHostPointerAction = {
    Move: 'move',
    Click: 'click',
    Down: 'down',
    Up: 'up',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostPointerAction =
    (typeof ConnectorHostPointerAction)[keyof typeof ConnectorHostPointerAction];

/** Button names map to ordinary operating-system pointer buttons. */
export const ConnectorHostPointerButton = {
    Left: 'left',
    Middle: 'middle',
    Right: 'right',
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostPointerButton =
    (typeof ConnectorHostPointerButton)[keyof typeof ConnectorHostPointerButton];

/** A key request presses once, or holds and later releases one key. */
export const ConnectorHostKeyAction = { Press: 'press', Down: 'down', Up: 'up' } as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostKeyAction =
    (typeof ConnectorHostKeyAction)[keyof typeof ConnectorHostKeyAction];

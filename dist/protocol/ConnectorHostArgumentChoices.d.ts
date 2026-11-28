/** Shells a host launch may name; each maps to the computer's own installed shell. */
export declare const ConnectorHostShell: {
    readonly Bash: 'bash';
    readonly Sh: 'sh';
    readonly Cmd: 'cmd';
    readonly PowerShell: 'powershell';
    readonly Pwsh: 'pwsh';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostShell = (typeof ConnectorHostShell)[keyof typeof ConnectorHostShell];
/** File writes state creation, truncation, positioned update or append explicitly. */
export declare const ConnectorHostWriteMode: {
    readonly Create: 'create';
    readonly Replace: 'replace';
    readonly Update: 'update';
    readonly Append: 'append';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostWriteMode = (typeof ConnectorHostWriteMode)[keyof typeof ConnectorHostWriteMode];
/** Byte payloads travel as UTF-8 text or canonical base64. */
export declare const ConnectorHostByteEncoding: {
    readonly Utf8: 'utf8';
    readonly Base64: 'base64';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostByteEncoding = (typeof ConnectorHostByteEncoding)[keyof typeof ConnectorHostByteEncoding];
/** Pinned HTTP transfers read only; no method carries a request body. */
export declare const ConnectorHostHttpMethod: {
    readonly Get: 'GET';
    readonly Head: 'HEAD';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostHttpMethod = (typeof ConnectorHostHttpMethod)[keyof typeof ConnectorHostHttpMethod];
/** A pointer request moves, clicks, presses or releases. */
export declare const ConnectorHostPointerAction: {
    readonly Move: 'move';
    readonly Click: 'click';
    readonly Down: 'down';
    readonly Up: 'up';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostPointerAction = (typeof ConnectorHostPointerAction)[keyof typeof ConnectorHostPointerAction];
/** Button names map to ordinary operating-system pointer buttons. */
export declare const ConnectorHostPointerButton: {
    readonly Left: 'left';
    readonly Middle: 'middle';
    readonly Right: 'right';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostPointerButton = (typeof ConnectorHostPointerButton)[keyof typeof ConnectorHostPointerButton];
/** A key request presses once, or holds and later releases one key. */
export declare const ConnectorHostKeyAction: {
    readonly Press: 'press';
    readonly Down: 'down';
    readonly Up: 'up';
};
/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostKeyAction = (typeof ConnectorHostKeyAction)[keyof typeof ConnectorHostKeyAction];

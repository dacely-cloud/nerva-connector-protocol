/**
 * Desktop key expressions are a closed bounded chord grammar, never a shell or keyboard macro language.
 *
 * @remarks
 * One key is an ASCII letter or digit, F1 to F12, or one of {@link ConnectorHostKeyChord.named}. Only `press`
 * accepts a chord: distinct {@link ConnectorHostKeyChord.modifiers} joined by `+` before one non-modifier key, such
 * as `Control+l`. Held actions always name one key. A Windows computer accepts the whole grammar; other desktops
 * accept one key per request.
 */
export declare class ConnectorHostKeyChord {
    /** Canonical modifier names match native ownership checks and never include expression aliases. */
    static readonly modifiers: readonly string[];
    /** Named non-character keys besides the modifiers. */
    static readonly named: readonly string[];
    /** Whether the expression is one key or, for `press`, a chord of distinct modifiers before one key. */
    static accepts(key: unknown, action: unknown): boolean;
    /** Whether the text names exactly one key, modifiers included. */
    static single(key: unknown): boolean;
}

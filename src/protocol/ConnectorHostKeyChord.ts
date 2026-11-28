// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import { ConnectorHostKeyAction } from './ConnectorHostArgumentChoices.js';

/**
 * Desktop key expressions are a closed bounded chord grammar, never a shell or keyboard macro language.
 *
 * @remarks
 * One key is an ASCII letter or digit, F1 to F12, or one of {@link ConnectorHostKeyChord.named}. Only `press`
 * accepts a chord: distinct {@link ConnectorHostKeyChord.modifiers} joined by `+` before one non-modifier key, such
 * as `Control+l`. Held actions always name one key. A Windows computer accepts the whole grammar; other desktops
 * accept one key per request.
 */
export class ConnectorHostKeyChord {
    /** Canonical modifier names match native ownership checks and never include expression aliases. */
    public static readonly modifiers: readonly string[] = ['Control', 'Alt', 'Shift', 'Meta'];

    /** Named non-character keys besides the modifiers. */
    public static readonly named: readonly string[] = [
        'Enter',
        'Tab',
        'Escape',
        'Backspace',
        'Delete',
        'Insert',
        'Home',
        'End',
        'PageUp',
        'PageDown',
        'Up',
        'Down',
        'Left',
        'Right',
        'Space',
    ];

    /** Whether the expression is one key or, for `press`, a chord of distinct modifiers before one key. */
    public static accepts(key: unknown, action: unknown): boolean {
        if (
            typeof key !== 'string' ||
            key.length < 1 ||
            key.length > 64 ||
            /[^A-Za-z0-9+]/u.test(key) ||
            !Object.values(ConnectorHostKeyAction).some(
                (candidate: ConnectorHostKeyAction): boolean => candidate === action,
            )
        ) {
            return false;
        }
        const parts: readonly string[] = key.split('+');
        const primary: string | undefined = parts.at(-1);
        const modifiers: readonly string[] = parts.slice(0, -1);
        return !(
            parts.length > 5 ||
            (parts.length > 1 && action !== ConnectorHostKeyAction.Press) ||
            modifiers.some((part: string): boolean => !this.modifiers.includes(part)) ||
            new Set(modifiers).size !== modifiers.length ||
            primary === undefined ||
            (parts.length > 1 && this.modifiers.includes(primary)) ||
            !this.single(primary)
        );
    }

    /** Whether the text names exactly one key, modifiers included. */
    public static single(key: unknown): boolean {
        return (
            typeof key === 'string' &&
            (/^[A-Za-z0-9]$/u.test(key) ||
                /^F([1-9]|1[0-2])$/u.test(key) ||
                this.modifiers.includes(key) ||
                this.named.includes(key))
        );
    }
}

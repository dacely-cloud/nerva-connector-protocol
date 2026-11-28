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
    static modifiers = ['Control', 'Alt', 'Shift', 'Meta'];
    /** Named non-character keys besides the modifiers. */
    static named = [
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
    static accepts(key, action) {
        if (typeof key !== 'string' ||
            key.length < 1 ||
            key.length > 64 ||
            /[^A-Za-z0-9+]/u.test(key) ||
            !Object.values(ConnectorHostKeyAction).some((candidate) => candidate === action)) {
            return false;
        }
        const parts = key.split('+');
        const primary = parts.at(-1);
        const modifiers = parts.slice(0, -1);
        return !(parts.length > 5 ||
            (parts.length > 1 && action !== ConnectorHostKeyAction.Press) ||
            modifiers.some((part) => !this.modifiers.includes(part)) ||
            new Set(modifiers).size !== modifiers.length ||
            primary === undefined ||
            (parts.length > 1 && this.modifiers.includes(primary)) ||
            !this.single(primary));
    }
    /** Return an accepted expression unchanged, or throw without quoting it. */
    static read(key, action) {
        if (!this.accepts(key, action)) {
            throw new Error('Invalid desktop key chord');
        }
        return key;
    }
    /** Whether the text names exactly one key, modifiers included. */
    static single(key) {
        return (typeof key === 'string' &&
            (/^[A-Za-z0-9]$/u.test(key) ||
                /^F([1-9]|1[0-2])$/u.test(key) ||
                this.modifiers.includes(key) ||
                this.named.includes(key)));
    }
}

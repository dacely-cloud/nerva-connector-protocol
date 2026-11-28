// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** The JSON form one native host tool argument takes on the wire. */
export const ConnectorHostArgumentKind = {
    /** A JSON string without NUL characters. */
    Text: 'text',
    /** A byte payload string, read as UTF-8 text or canonical base64 according to the sibling `encoding`. */
    Data: 'data',
    /** A nonnegative signed-64-bit integer written as a decimal string, such as `"0"`. */
    Decimal: 'decimal',
    /** A signed integer written as a decimal string, such as `"-1"`. */
    SignedDecimal: 'signed-decimal',
    /** A JSON number that is a safe integer within a closed range. */
    Integer: 'integer',
    /** `true` or `false`. */
    Boolean: 'boolean',
    /** Exactly `true`; the field only ever opts in. */
    True: 'true',
    /** One string from a closed set. */
    Choice: 'choice',
    /** A JSON array of strings. */
    TextList: 'text-list',
    /** A JSON object whose keys and values are strings. */
    TextMap: 'text-map',
    /** A closed JSON object with its own fields. */
    Record: 'record',
};

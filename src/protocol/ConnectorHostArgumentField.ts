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
} as const;

/** Allowed values derive from the current runtime mapping. */
export type ConnectorHostArgumentKind =
    (typeof ConnectorHostArgumentKind)[keyof typeof ConnectorHostArgumentKind];

/** Every argument states whether JSON `null` is accepted, meaning the same as leaving the field out. */
export interface ConnectorHostArgumentBase {
    readonly nullable: boolean;
}

/** Text lengths count UTF-16 code units, the unit the computer checks. */
export interface ConnectorHostTextArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Text;
    /** 0 admits the empty string. */
    readonly minLength: number;
    readonly maxLength: number;
    /** Characters refused in addition to NUL, which no text contains. */
    readonly excludes: string;
    /** When set, the text is well-formed Unicode of at most this many code points. */
    readonly maxCodePoints: number | null;
    /** Exact values refused, such as `.` and `..` for a bare program name. */
    readonly reserved: readonly string[];
}

/** Payload text may hold any character, NUL included; its byte size is checked against the transport chunk. */
export interface ConnectorHostDataArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Data;
    /** Most UTF-16 code units of the JSON string itself. */
    readonly maxLength: number;
}

/** Exact quantities that may exceed 2^53 cross JSON as decimal strings. */
export interface ConnectorHostDecimalArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Decimal;
}

/** Signed exact quantities, such as historical file timestamps in nanoseconds. */
export interface ConnectorHostSignedDecimalArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.SignedDecimal;
    /** Most characters, including a leading minus sign. */
    readonly maxLength: number;
}

/** Bounded counts, durations and coordinates are JSON numbers. */
export interface ConnectorHostIntegerArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Integer;
    readonly minimum: number;
    readonly maximum: number;
}

/** A switch the caller sets explicitly. */
export interface ConnectorHostBooleanArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Boolean;
}

/** An opt-in flag whose only accepted value is `true`. */
export interface ConnectorHostTrueArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.True;
}

/** One value from a closed set of strings. */
export interface ConnectorHostChoiceArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Choice;
    readonly values: readonly string[];
}

/** An ordered string list with an allocation bound. */
export interface ConnectorHostTextListArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.TextList;
    readonly item: ConnectorHostTextArgument;
    readonly maxItems: number;
    /** Items compare by exact string equality. */
    readonly unique: boolean;
}

/** A string dictionary such as process environment variables or HTTP headers. */
export interface ConnectorHostTextMapArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.TextMap;
    readonly key: ConnectorHostTextArgument;
    readonly value: ConnectorHostTextArgument;
    readonly maxEntries: number;
}

/** A closed nested object; unknown fields are refused like top-level ones. */
export interface ConnectorHostRecordArgument extends ConnectorHostArgumentBase {
    readonly kind: typeof ConnectorHostArgumentKind.Record;
    readonly fields: ConnectorHostArgumentFields;
    readonly required: readonly string[];
}

/** One argument's complete wire contract. */
export type ConnectorHostArgumentField =
    | ConnectorHostTextArgument
    | ConnectorHostDataArgument
    | ConnectorHostDecimalArgument
    | ConnectorHostSignedDecimalArgument
    | ConnectorHostIntegerArgument
    | ConnectorHostBooleanArgument
    | ConnectorHostTrueArgument
    | ConnectorHostChoiceArgument
    | ConnectorHostTextListArgument
    | ConnectorHostTextMapArgument
    | ConnectorHostRecordArgument;

/** Field names in declaration order, which is also the order shapes and schemas present them. */
export interface ConnectorHostArgumentFields {
    readonly [name: string]: ConnectorHostArgumentField;
}

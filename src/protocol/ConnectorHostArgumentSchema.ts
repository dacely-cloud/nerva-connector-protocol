// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostTool } from './ConnectorHost.js';
import {
    ConnectorHostArgumentContracts,
    type ConnectorHostArgumentBounds,
    type ConnectorHostArgumentContract,
} from './ConnectorHostArgumentContract.js';
import {
    ConnectorHostArgumentKind as Kind,
    type ConnectorHostArgumentField,
    type ConnectorHostArgumentFields,
    type ConnectorHostTextArgument,
} from './ConnectorHostArgumentField.js';

/** A JSON value inside a rendered schema. */
export type ConnectorHostSchemaValue =
    | null
    | boolean
    | number
    | string
    | ConnectorHostSchemaObject
    | readonly ConnectorHostSchemaValue[];

/** A rendered JSON Schema object. */
export interface ConnectorHostSchemaObject {
    readonly [name: string]: ConnectorHostSchemaValue;
}

/**
 * Renders argument contracts as JSON Schema for MCP tool discovery.
 *
 * @remarks
 * Mode groups have no schema form here: every field of every alternative is listed and only the fields required in
 * all cases are marked required, so a schema-only client sees the same flat object it always has. The contract,
 * not the schema, decides what is accepted. Text lengths are advisory, because JSON Schema counts code points where
 * the contract counts UTF-16 code units.
 */
export class ConnectorHostArgumentSchema {
    /** The input schema of one tool; `descriptions` attaches text to named top-level fields. */
    public static of(
        tool: ConnectorHostTool,
        bounds: ConnectorHostArgumentBounds,
        descriptions: Readonly<Record<string, string>> = {},
    ): ConnectorHostSchemaObject {
        const contract: ConnectorHostArgumentContract = ConnectorHostArgumentContracts.of(
            tool,
            bounds,
        );
        return this.#object(contract.fields, contract.required, descriptions);
    }

    static #object(
        fields: ConnectorHostArgumentFields,
        required: readonly string[],
        descriptions: Readonly<Record<string, string>>,
    ): ConnectorHostSchemaObject {
        return {
            type: 'object',
            properties: Object.fromEntries(
                Object.entries(fields).map(
                    ([name, field]: [string, ConnectorHostArgumentField]): [
                        string,
                        ConnectorHostSchemaObject,
                    ] => {
                        const description: string | undefined = Object.hasOwn(descriptions, name)
                            ? descriptions[name]
                            : undefined;
                        const schema: ConnectorHostSchemaObject = this.#field(field);
                        return [
                            name,
                            description === undefined ? schema : { ...schema, description },
                        ];
                    },
                ),
            ),
            required,
            additionalProperties: false,
        };
    }

    static #field(field: ConnectorHostArgumentField): ConnectorHostSchemaObject {
        switch (field.kind) {
            case Kind.Text:
                return this.#text(field);
            case Kind.Data:
                return { type: this.#type('string', field.nullable) };
            case Kind.Decimal:
                return {
                    type: this.#type('string', field.nullable),
                    pattern: '^(0|[1-9][0-9]{0,18})$',
                };
            case Kind.SignedDecimal:
                return {
                    type: this.#type('string', field.nullable),
                    pattern: '^(0|-?[1-9][0-9]*)$',
                    maxLength: field.maxLength,
                };
            case Kind.Integer:
                return {
                    type: this.#type('integer', field.nullable),
                    minimum: field.minimum,
                    maximum: field.maximum,
                };
            case Kind.Boolean:
                return { type: this.#type('boolean', field.nullable) };
            case Kind.True:
                return { type: this.#type('boolean', field.nullable), enum: [true] };
            case Kind.Choice:
                return field.nullable
                    ? { type: ['string', 'null'], enum: [null, ...field.values] }
                    : { type: 'string', enum: field.values };
            case Kind.TextList:
                return {
                    type: this.#type('array', field.nullable),
                    items: this.#text(field.item),
                    maxItems: field.maxItems,
                    ...(field.unique ? { uniqueItems: true } : {}),
                };
            case Kind.TextMap: {
                const names: ConnectorHostSchemaObject = this.#text(field.key);
                return {
                    type: this.#type('object', field.nullable),
                    ...(Object.keys(names).length > 1 ? { propertyNames: names } : {}),
                    additionalProperties: this.#text(field.value),
                    maxProperties: field.maxEntries,
                };
            }
            case Kind.Record:
                return this.#object(field.fields, field.required, {});
        }
    }

    static #text(field: ConnectorHostTextArgument): ConnectorHostSchemaObject {
        const maxLength: number | null =
            field.maxCodePoints ??
            (field.maxLength < ConnectorHostArgumentContracts.textLength ? field.maxLength : null);
        return {
            type: this.#type('string', field.nullable),
            ...(field.minLength > 0 ? { minLength: field.minLength } : {}),
            ...(maxLength === null ? {} : { maxLength }),
            ...(field.excludes === ''
                ? {}
                : { pattern: `^[^${this.#characters(field.excludes)}\\u0000]*$` }),
        };
    }

    static #characters(characters: string): string {
        return Array.from(characters)
            .map((character: string): string => {
                switch (character) {
                    case '\\':
                    case ']':
                    case '[':
                    case '^':
                    case '-':
                        return '\\' + character;
                    case '\r':
                        return '\\r';
                    case '\n':
                        return '\\n';
                    default:
                        return character;
                }
            })
            .join('');
    }

    static #type(type: string, nullable: boolean): ConnectorHostSchemaValue {
        return nullable ? [type, 'null'] : type;
    }
}

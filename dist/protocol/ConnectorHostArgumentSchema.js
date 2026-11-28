// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { ConnectorHostArgumentContracts, } from './ConnectorHostArgumentContract.js';
import { ConnectorHostArgumentKind as Kind, } from './ConnectorHostArgumentField.js';
/**
 * Renders argument contracts as JSON Schema for MCP tool discovery.
 *
 * @remarks
 * Mode groups have no schema form here: every field of every alternative is listed and only the fields required in
 * all cases are marked required, so a schema-only client sees the same flat object it always has. The contract,
 * not the schema, decides what is accepted. Text lengths are advisory, because JSON Schema counts code points where
 * the contract counts UTF-16 code units, and map key rules are left to the contract.
 */
export class ConnectorHostArgumentSchema {
    /** The input schema of one tool; `descriptions` attaches text to named top-level fields. */
    static of(tool, bounds, descriptions = {}) {
        const contract = ConnectorHostArgumentContracts.of(tool, bounds);
        return this.#object(contract.fields, contract.required, descriptions);
    }
    static #object(fields, required, descriptions) {
        return {
            type: 'object',
            properties: Object.fromEntries(Object.entries(fields).map(([name, field]) => {
                const description = Object.hasOwn(descriptions, name)
                    ? descriptions[name]
                    : undefined;
                const schema = this.#field(field);
                return [
                    name,
                    description === undefined ? schema : { ...schema, description },
                ];
            })),
            required,
            additionalProperties: false,
        };
    }
    static #field(field) {
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
            case Kind.TextMap:
                return {
                    type: this.#type('object', field.nullable),
                    additionalProperties: this.#text(field.value),
                    maxProperties: field.maxEntries,
                };
            case Kind.Record:
                return this.#object(field.fields, field.required, {});
        }
    }
    static #text(field) {
        const maxLength = field.maxCodePoints ??
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
    /** Escape characters for a regular-expression character class. */
    static #characters(characters) {
        return characters
            .replace(/[\\\]\[^-]/gu, '\\$&')
            .replace(/\r/gu, '\\r')
            .replace(/\n/gu, '\\n');
    }
    static #type(type, nullable) {
        return nullable ? [type, 'null'] : type;
    }
}

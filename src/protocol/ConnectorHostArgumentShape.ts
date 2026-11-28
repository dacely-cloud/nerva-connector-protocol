// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorHostTool } from './ConnectorHost.js';
import {
    ConnectorHostArgumentContracts,
    type ConnectorHostArgumentAlternative,
    type ConnectorHostArgumentBounds,
    type ConnectorHostArgumentContract,
    type ConnectorHostArgumentModes,
} from './ConnectorHostArgumentContract.js';
import {
    ConnectorHostArgumentKind as Kind,
    type ConnectorHostArgumentField,
    type ConnectorHostArgumentFields,
} from './ConnectorHostArgumentField.js';

/**
 * A compact one-line notation for argument contracts, sized for a model's tool description and for error messages.
 *
 * @remarks
 * See {@link ConnectorHostArgumentShape.legend}. A plain field name is text; only fields of another kind carry a
 * suffix. Bounds are left out to keep a whole catalog small enough for every prompt; the validator's rejection
 * message states the exact bounds of the field it refuses. Mode groups render their alternatives joined by ` or `
 * in place of their fields.
 */
export class ConnectorHostArgumentShape {
    /** How to read the notation; a plain field name is text, `[text]` a string list and `{text}` a string map. */
    public static readonly legend: string =
        '? optional, n integer, "n" decimal string, a|b one value, ...x the fields of x';

    /** One tool's arguments, such as `{path,offset?:"n",maximumBytes?:n}`. */
    public static of(tool: ConnectorHostTool, bounds: ConnectorHostArgumentBounds): string {
        const contract: ConnectorHostArgumentContract = ConnectorHostArgumentContracts.of(
            tool,
            bounds,
        );
        return this.#object(contract.fields, contract.required, contract.modes);
    }

    /**
     * Every listed tool's arguments, tools with identical arguments grouped, as `a,b {…}; c {…}`.
     *
     * @remarks
     * A tool whose arguments extend an earlier tool's with further fields is written `{...earlier,further}`, so a
     * terminal launch does not repeat the program launch fields.
     */
    public static catalog(
        tools: readonly ConnectorHostTool[],
        bounds: ConnectorHostArgumentBounds,
    ): string {
        const groups: Map<string, ConnectorHostTool[]> = new Map();
        for (const tool of tools) {
            const shape: string = this.of(tool, bounds);
            const group: ConnectorHostTool[] | undefined = groups.get(shape);
            if (group === undefined) {
                groups.set(shape, [tool]);
            } else {
                group.push(tool);
            }
        }
        const parts: string[] = [];
        const singles: [string, ConnectorHostTool][] = [];
        for (const [shape, members] of groups) {
            const base: [string, ConnectorHostTool] | undefined = singles.find(
                ([earlier]: [string, ConnectorHostTool]): boolean =>
                    earlier !== '{}' && shape.startsWith(earlier.slice(0, -1) + ','),
            );
            parts.push(
                `${members.join(',')} ${
                    base === undefined ? shape : `{...${base[1]},${shape.slice(base[0].length)}`
                }`,
            );
            const only: ConnectorHostTool | undefined = members.at(0);
            if (members.length === 1 && only !== undefined) {
                singles.push([shape, only]);
            }
        }
        return parts.join('; ');
    }

    static #object(
        fields: ConnectorHostArgumentFields,
        required: readonly string[],
        modes: ConnectorHostArgumentModes | null,
    ): string {
        const grouped: ReadonlySet<string> = new Set(
            modes?.alternatives.flatMap(
                (alternative: ConnectorHostArgumentAlternative): readonly string[] =>
                    alternative.fields,
            ) ?? [],
        );
        const parts: string[] = [];
        let groupRendered: boolean = false;
        for (const [name, field] of Object.entries(fields)) {
            if (!grouped.has(name)) {
                parts.push(this.#field(name, field, required.includes(name)));
            } else if (!groupRendered && modes !== null) {
                parts.push(this.#modes(fields, modes));
                groupRendered = true;
            }
        }
        return `{${parts.join(',')}}`;
    }

    static #modes(fields: ConnectorHostArgumentFields, modes: ConnectorHostArgumentModes): string {
        const alternatives: readonly string[] = modes.alternatives.map(
            (alternative: ConnectorHostArgumentAlternative): string => {
                const members: string = alternative.fields
                    .map((name: string): string => {
                        const field: ConnectorHostArgumentField | undefined = fields[name];
                        return field === undefined
                            ? name
                            : this.#field(name, field, alternative.required.includes(name));
                    })
                    .join(',');
                return alternative.fields.length > 1 ? `(${members})` : members;
            },
        );
        const joined: string = alternatives.join(' or ');
        if (modes.required) {
            return joined;
        }
        return alternatives.length === 1 && joined.startsWith('(') ? `${joined}?` : `(${joined})?`;
    }

    static #field(name: string, field: ConnectorHostArgumentField, required: boolean): string {
        const label: string = required ? name : `${name}?`;
        switch (field.kind) {
            case Kind.Text:
            case Kind.Data:
                return label;
            case Kind.Decimal:
            case Kind.SignedDecimal:
                return `${label}:"n"`;
            case Kind.Integer:
                return `${label}:n`;
            case Kind.Boolean:
                return `${label}:bool`;
            case Kind.True:
                return `${label}:true`;
            case Kind.Choice:
                return `${label}:${field.values.join('|')}`;
            case Kind.TextList:
                return `${label}:[text]`;
            case Kind.TextMap:
                return `${label}:{text}`;
            case Kind.Record:
                return `${label}:${this.#object(field.fields, field.required, null)}`;
        }
    }
}

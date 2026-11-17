// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import { Boundary } from './Boundary.js';
import {
    ConnectorAuthorizationKind,
    ConnectorAuthorizationLimits,
    type ConnectorAuthorization,
} from './ConnectorAuthorization.js';
import { JointWorkspaceCodec } from '../workspace/JointWorkspaceCodec.js';

/** Browser-safe closed decoding preserves the complete descriptor without inventing missing authorization. */
export class ConnectorAuthorizationCodec {
    /** Exact independent and joint alternatives reject downgrade fields, unexpected choices and partial descriptors. */
    public static read(raw: unknown): ConnectorAuthorization {
        const value: Readonly<Record<string, unknown>> = Boundary.record(raw, ['kind', 'binding']);
        if (value['kind'] === ConnectorAuthorizationKind.Independent) {
            Boundary.record(raw, ['kind']);
            return Object.freeze({ kind: ConnectorAuthorizationKind.Independent });
        }
        if (value['kind'] === ConnectorAuthorizationKind.Joint) {
            return Object.freeze({
                kind: ConnectorAuthorizationKind.Joint,
                binding: JointWorkspaceCodec.descriptor(value['binding']),
            });
        }
        throw new Error('Explicit current connector authorization required');
    }

    /** Transport text is bounded before parsing; decoding never verifies a descriptor signature. */
    public static decode(json: string): ConnectorAuthorization {
        const maximum: number = ConnectorAuthorizationLimits.envelopeBytes;
        if (
            typeof json !== 'string' ||
            json.length > maximum ||
            new TextEncoder().encode(json).byteLength > maximum
        ) {
            throw new Error('Connector authorization exceeds its fixed envelope bound');
        }
        const raw: unknown = JSON.parse(json);
        return this.read(raw);
    }

    /** Already typed callers still validate and detach their complete envelope before hashing or serialization. */
    public static value(value: ConnectorAuthorization): ConnectorAuthorization {
        Boundary.record(value, ['kind', 'binding']);
        if (value.kind === ConnectorAuthorizationKind.Independent) {
            Boundary.record(value, ['kind']);
            return Object.freeze({ kind: ConnectorAuthorizationKind.Independent });
        }
        if (value.kind === ConnectorAuthorizationKind.Joint) {
            return Object.freeze({
                kind: ConnectorAuthorizationKind.Joint,
                binding: JointWorkspaceCodec.descriptorValue(value.binding),
            });
        }
        throw new Error('Explicit current connector authorization required');
    }

    /** Typed fields are validated before JSON allocation; exact revisions remain decimal and descriptor order is canonical. */
    public static encode(value: ConnectorAuthorization): string {
        const validated: ConnectorAuthorization = this.value(value);
        return JSON.stringify(validated, (_key: string, entry: unknown): unknown =>
            typeof entry === 'bigint' ? entry.toString() : entry,
        );
    }
}

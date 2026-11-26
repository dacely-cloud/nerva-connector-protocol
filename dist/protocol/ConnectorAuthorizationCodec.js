// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
import { Boundary } from './Boundary.js';
import { ConnectorAuthorizationKind, ConnectorAuthorizationLimits, } from './ConnectorAuthorization.js';
import { JointWorkspaceCodec } from '../workspace/JointWorkspaceCodec.js';
/** Browser-safe closed decoding preserves the complete descriptor without inventing missing authorization. */
export class ConnectorAuthorizationCodec {
    /** Exact independent and joint alternatives reject downgrade fields, unexpected choices and partial descriptors. */
    static read(raw) {
        const value = Boundary.record(raw, ['kind', 'binding']);
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
    static decode(json) {
        const maximum = ConnectorAuthorizationLimits.envelopeBytes;
        if (typeof json !== 'string' ||
            json.length > maximum ||
            new TextEncoder().encode(json).byteLength > maximum) {
            throw new Error('Connector authorization exceeds its fixed envelope bound');
        }
        const raw = JSON.parse(json);
        return this.read(raw);
    }
    /** Already typed callers still validate and detach their complete envelope before hashing or serialization. */
    static value(value) {
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
    static encode(value) {
        const validated = this.value(value);
        return JSON.stringify(validated, (_key, entry) => typeof entry === 'bigint' ? entry.toString() : entry);
    }
}

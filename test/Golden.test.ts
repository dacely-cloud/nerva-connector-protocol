// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ExecutionProof } from '../dist/execution/ExecutionProof.js';
import { ExecutionInputCodec } from '../dist/execution/ExecutionInputCodec.js';
import { ExecutionMachineRuleCodec } from '../dist/execution/ExecutionMachineRuleCodec.js';
import { ExecutionMachineInvocationCodec } from '../dist/execution/ExecutionMachineInvocationCodec.js';
import { ExecutionInteractiveRuleCodec } from '../dist/execution/ExecutionInteractiveRuleCodec.js';
import { ExecutionInteractiveLaunchCodec } from '../dist/execution/ExecutionInteractiveLaunchCodec.js';
import { ConnectorFileProof } from '../dist/protocol/ConnectorFileProof.js';
import { ConnectorAuthorizationProof } from '../dist/protocol/ConnectorAuthorizationProof.js';
import { ConnectorAdmissionMigrationProof } from '../dist/protocol/ConnectorAdmissionMigrationProof.js';
import { ConnectorHostCodec } from '../dist/protocol/ConnectorHostCodec.js';
import { ConnectorHostObservationCodec } from '../dist/protocol/ConnectorHostObservationCodec.js';
import { ConnectorHostObservedStartCodec } from '../dist/protocol/ConnectorHostObservedStartCodec.js';
import { ConnectorHostObservationCapabilityTranscript } from '../dist/protocol/ConnectorHostObservationCapabilityTranscript.js';
import { ConnectorInventoryCodec } from '../dist/protocol/ConnectorInventoryCodec.js';
import { JointWorkspaceProof } from '../dist/workspace/JointWorkspaceProof.js';
import { JointWorkspacePublicationProof } from '../dist/workspace/JointWorkspacePublicationProof.js';
import { JointWorkspaceReceiptProof } from '../dist/workspace/JointWorkspaceReceiptProof.js';
import { JointWorkspaceRetryProof } from '../dist/workspace/JointWorkspaceRetryProof.js';

/**
 * One call captured from the Nerva Connector test suite, with the digest of the result that both the Connector and
 * the Nerva backend produced before these modules were shared.
 *
 * @remarks
 * Arguments and results use a tagged JSON form: `{ "$bigint": "<decimal>" }` for exact integers and
 * `{ "$bytes": "<hex>" }` for byte arrays. `sha256` is the digest of the tagged result's `JSON.stringify` text, so
 * field order and every transcript byte are pinned. `throws` marks inputs both implementations rejected.
 */
interface GoldenCase {
    readonly call: string;
    readonly args: readonly unknown[];
    readonly sha256?: string;
    readonly throws?: true;
}

/** Every class whose transcripts or decoders are pinned by the golden cases. */
const owners: Readonly<Record<string, unknown>> = {
    ExecutionProof,
    ExecutionInputCodec,
    ExecutionMachineRuleCodec,
    ExecutionMachineInvocationCodec,
    ExecutionInteractiveRuleCodec,
    ExecutionInteractiveLaunchCodec,
    ConnectorFileProof,
    ConnectorAuthorizationProof,
    ConnectorAdmissionMigrationProof,
    ConnectorHostCodec,
    ConnectorHostObservationCodec,
    ConnectorHostObservedStartCodec,
    ConnectorHostObservationCapabilityTranscript,
    ConnectorInventoryCodec,
    JointWorkspaceProof,
    JointWorkspacePublicationProof,
    JointWorkspaceReceiptProof,
    JointWorkspaceRetryProof,
};

/** Restores exact integers and byte arrays from the tagged fixture form. */
function untag(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(untag);
    }
    if (typeof value === 'object' && value !== null) {
        const integer: unknown = Reflect.get(value, '$bigint');
        if (typeof integer === 'string') {
            return BigInt(integer);
        }
        const bytes: unknown = Reflect.get(value, '$bytes');
        if (typeof bytes === 'string') {
            return Buffer.from(bytes, 'hex');
        }
        const result: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            result[key] = untag(entry);
        }
        return result;
    }
    return value;
}

/** Encodes a result in the same tagged form the fixture digests were computed over. */
function tag(value: unknown): unknown {
    if (typeof value === 'bigint') {
        return { $bigint: value.toString() };
    }
    if (value instanceof Uint8Array) {
        return { $bytes: Buffer.from(value).toString('hex') };
    }
    if (Array.isArray(value)) {
        return value.map(tag);
    }
    if (typeof value === 'object' && value !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, entry] of Object.entries(value)) {
            if (entry !== undefined) {
                result[key] = tag(entry);
            }
        }
        return result;
    }
    if (value === undefined) {
        return { $undefined: true };
    }
    return value;
}

/** Calls one named static method with the decoded fixture arguments. */
function invoke(call: string, args: readonly unknown[]): unknown {
    const [ownerName, method]: readonly string[] = call.split('.');
    const owner: unknown = ownerName === undefined ? undefined : owners[ownerName];
    if (typeof owner !== 'function' || method === undefined) {
        throw new Error(`Unknown golden call ${call}`);
    }
    const target: unknown = Reflect.get(owner, method);
    if (typeof target !== 'function') {
        throw new Error(`Golden call ${call} is not a method`);
    }
    return Reflect.apply(target, owner, args.map(untag));
}

/** Fixture entries name a call, carry its arguments and pin either a result digest or a rejection. */
function isGoldenCase(value: unknown): value is GoldenCase {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }
    const call: unknown = Reflect.get(value, 'call');
    const args: unknown = Reflect.get(value, 'args');
    const sha256: unknown = Reflect.get(value, 'sha256');
    const throws: unknown = Reflect.get(value, 'throws');
    return (
        typeof call === 'string' &&
        Array.isArray(args) &&
        ((typeof sha256 === 'string' && /^[a-f0-9]{64}$/u.test(sha256) && throws === undefined) ||
            (sha256 === undefined && throws === true))
    );
}

const parsed: unknown = JSON.parse(
    readFileSync(new URL('./golden/ConnectorTestCases.json', import.meta.url), 'utf8'),
);
if (!Array.isArray(parsed) || !parsed.every(isGoldenCase)) {
    throw new Error('Golden fixture has an invalid case');
}
const cases: readonly GoldenCase[] = parsed;

test('the shared codecs and proof transcripts reproduce the results both products computed before they were shared', (): void => {
    assert.ok(cases.length > 0);
    for (const [index, entry] of cases.entries()) {
        if (entry.throws === true) {
            assert.throws(
                (): unknown => invoke(entry.call, entry.args),
                `case ${index} ${entry.call}`,
            );
            continue;
        }
        const digest: string = createHash('sha256')
            .update(JSON.stringify(tag(invoke(entry.call, entry.args))))
            .digest('hex');
        assert.equal(digest, entry.sha256, `case ${index} ${entry.call}`);
    }
});

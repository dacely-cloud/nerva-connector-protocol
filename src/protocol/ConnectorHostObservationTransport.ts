// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

import type { ConnectorDeviceLeaseTarget } from './ConnectorDevice.js';
import type {
    ConnectorHostObservationChallenge,
    ConnectorHostObservationCapability,
    ConnectorHostObservationActivation,
} from './ConnectorHostObservationCapability.js';
import type {
    ConnectorHostObservationPermit,
    ConnectorHostObservationReady,
    ConnectorHostObservationChanged,
    ConnectorHostObservationAcknowledgment,
} from './ConnectorHostObservation.js';

/** The metadata socket has no execution, native input, file or primary authentication frames. */
export const ConnectorHostObservationFrameKind = {
    Hello: 'hello',
    Challenge: 'challenge',
    Capability: 'capability',
    Activation: 'activation',
    Permit: 'permit',
    Ready: 'ready',
    Changed: 'changed',
    Acknowledgment: 'acknowledgment',
} as const;
/** Closed metadata frame discriminants retain their published wire values. */
export type ConnectorHostObservationFrameKind =
    (typeof ConnectorHostObservationFrameKind)[keyof typeof ConnectorHostObservationFrameKind];

/** A hello selects an existing primary lease without authenticating or renewing it. */
export interface ConnectorHostObservationHelloFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Hello;
    readonly target: ConnectorDeviceLeaseTarget;
}
/** A fresh server challenge binds only this metadata connection. */
export interface ConnectorHostObservationChallengeFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Challenge;
    readonly challenge: ConnectorHostObservationChallenge;
}
/** Explicit signed support must match the already authenticated primary lease. */
export interface ConnectorHostObservationCapabilityFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Capability;
    readonly capability: ConnectorHostObservationCapability;
}
/** The authority confirms current metadata support independently of the socket protocol. */
export interface ConnectorHostObservationActivationFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Activation;
    readonly activation: ConnectorHostObservationActivation;
}
/** Each observation is admitted separately, with its exact retained native source. */
export interface ConnectorHostObservationPermitFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Permit;
    readonly permit: ConnectorHostObservationPermit;
}
/** Readiness commits the actual native instance without returning its output. */
export interface ConnectorHostObservationReadyFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Ready;
    readonly ready: ConnectorHostObservationReady;
}
/** Coalesced revisions are hints to authorized readers and contain no native bytes. */
export interface ConnectorHostObservationChangedFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Changed;
    readonly changed: ConnectorHostObservationChanged;
}
/** An acknowledgment confirms only the exact signed metadata batch. */
export interface ConnectorHostObservationAcknowledgmentFrame {
    readonly kind: typeof ConnectorHostObservationFrameKind.Acknowledgment;
    readonly acknowledgment: ConnectorHostObservationAcknowledgment;
}
/** Device messages cannot select a server permit or acknowledge an unaccepted batch. */
export type ConnectorHostObservationClientFrame =
    | ConnectorHostObservationHelloFrame
    | ConnectorHostObservationCapabilityFrame
    | ConnectorHostObservationReadyFrame
    | ConnectorHostObservationChangedFrame;
/** Server messages never carry a native operation or primary lease mutation. */
export type ConnectorHostObservationServerFrame =
    | ConnectorHostObservationChallengeFrame
    | ConnectorHostObservationActivationFrame
    | ConnectorHostObservationPermitFrame
    | ConnectorHostObservationAcknowledgmentFrame;

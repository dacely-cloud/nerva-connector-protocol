import { ConnectorOperationSchema } from './ConnectorOperationSchema.js';
import { type ConnectorDeviceTarget, type ConnectorDeviceHello, type ConnectorDeviceProof, type ConnectorDeviceChallenge, type ConnectorDeviceLeaseTarget, type ConnectorDeviceLease } from './ConnectorDevice.js';
/** Strict browser-compatible transport authentication; this scope binds an enrolled device, never a fabricated managed runtime. */
export declare class ConnectorDeviceCodec {
    #private;
    /** Bound slots before indexing retained authority. */
    static slot(raw: unknown): number;
    /** Missing or unsupported operation authority cannot authenticate as the current protocol. */
    static operationSchema(raw: unknown): ConnectorOperationSchema.ExplicitAdmission;
    /** Connection nonces are canonical 256-bit values, never network destinations. */
    static nonce(raw: unknown): string;
    /** Exact target identity is preserved by every private operation. */
    static target(raw: unknown): ConnectorDeviceTarget;
    /** A signed hello cannot select another account, substitute a pinned key or omit its fresh nonce. */
    static hello(raw: unknown): ConnectorDeviceHello;
    /** A device proof addresses the original outstanding challenge, never a latest-slot fallback. */
    static proof(raw: unknown): ConnectorDeviceProof;
    /** Inspection and close require the exact original connection identity. */
    static leaseTarget(raw: unknown): ConnectorDeviceLeaseTarget;
    /** Both signatures and every correlation field are mandatory even before verification. */
    static challenge(raw: unknown): ConnectorDeviceChallenge;
    /** Confirmation covers the admitted challenge and the exact device proof, without extending their original deadline. */
    static lease(raw: unknown): ConnectorDeviceLease;
    /** The hello purpose includes the independently installed authority and reviewed environment. */
    static helloPayload(value: Omit<ConnectorDeviceHello, 'signature'>): string;
    /** The server challenge precommits its lease ID and finite authorization scope. */
    static challengePayload(value: Omit<ConnectorDeviceChallenge, 'signature'>): string;
    /** Device authentication commits to both original server signature components as well as all challenge fields. */
    static proofPayload(value: ConnectorDeviceChallenge): string;
    /** The authority confirms one exact consumed device proof, not merely a successful TLS socket. */
    static leasePayload(value: Omit<ConnectorDeviceLease, 'signature'>): string;
    /** Canonical commitments retain exact signatures independently of object property order. */
    static helloCommitment(value: ConnectorDeviceHello): string;
    /** Exactly the signed server challenge is committed by the final confirmation. */
    static challengeCommitment(value: ConnectorDeviceChallenge): string;
    /** The final confirmation binds the complete original proof envelope and both signature components. */
    static proofCommitment(value: ConnectorDeviceProof): string;
    /** A publication commits to the exact complete confirmation rather than a replaceable lease identifier alone. */
    static leaseCommitment(value: ConnectorDeviceLease): string;
    /** All trust-boundary timestamps remain decimal strings. */
    static encode(value: ConnectorDeviceHello | ConnectorDeviceChallenge | ConnectorDeviceLease | ConnectorDeviceProof): string;
}

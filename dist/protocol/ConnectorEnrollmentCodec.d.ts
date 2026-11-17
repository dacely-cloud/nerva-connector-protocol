import { type ConnectorEnrollmentRequest, type ConnectorEnrollmentClaim, type ConnectorEnrollmentRevocation, type ConnectorEnrollmentView, type ConnectorEnrollmentList } from './ConnectorEnrollment.js';
/** Browser-compatible strict wire decoding never fills missing device authority or accepts arbitrary algorithms. */
export declare class ConnectorEnrollmentCodec {
    /** Complete history is bounded by issuance policy; duplicate IDs cannot become ambiguous management targets. */
    static list(raw: unknown): ConnectorEnrollmentList;
    /** Names are display data; a full SHA-256 commitment is required before invitation creation. */
    static request(raw: unknown): ConnectorEnrollmentRequest;
    /** Only the complete ML-DSA-44 plus Ed25519 public identity and both signatures are supported. */
    static claim(raw: unknown): ConnectorEnrollmentClaim;
    /** Exact revisions stay decimal on the wire. */
    static revocation(raw: unknown): ConnectorEnrollmentRevocation;
    /** Canonical unpadded base64url is length-bounded before decoding or allocation. */
    static binary(raw: unknown, bytes: number): string;
    /** Commitments use one exact hexadecimal SHA-256 representation. */
    static digest(raw: unknown): string;
    /** Display names permit up to 256 Unicode characters, matching JSON Schema length semantics without normalization. */
    static name(raw: unknown): string;
    /** Connector IDs are opaque server-issued 256-bit nonces, never provider paths or network addresses. */
    static id(raw: unknown): string;
    /** Public state is validated independently of the private enrollment journal. */
    static view(raw: unknown): ConnectorEnrollmentView;
    /** Revisions count authenticated ownership changes as well as lifecycle transitions; phase and time invariants remain exact. */
    static state(view: ConnectorEnrollmentView): ConnectorEnrollmentView;
}

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary

/** One current suite; peers cannot negotiate a classical-only or post-quantum-only downgrade. */
export enum SignatureSuite {
    MlDsa44Ed25519 = 'ml-dsa-44+ed25519',
}

/** Expected verification purpose is selected by the receiver, never by an untrusted message. */
export enum SignaturePurpose {
    HostObservationPermit = 'authority:host:observation:permit',
    HostObservationReady = 'device:host:observation:ready',
    HostObservationChanged = 'device:host:observation:changed',
    HostObservationAcknowledgment = 'authority:host:observation:acknowledgment',
    HostGrant = 'device:host:grant',
    HostProfile = 'device:host:profile',
    HostPermit = 'authority:operation:host:permit',
    HostResult = 'device:operation:host:result',
    HostAcknowledgment = 'authority:operation:host:acknowledgment',
    HostAcknowledged = 'device:operation:host:acknowledged',
    DeviceUnpair = 'device:unpair',
    DeviceUnpaired = 'authority:unpaired',
    DeviceLogout = 'device:local:logout',
    Release = 'release:connector:installation',
    DeviceEnrollment = 'device:enroll',
    DeviceHello = 'device:hello',
    LinkStart = 'device:link:start',
    LinkPoll = 'device:link:poll',
    LinkIssued = 'authority:link:issued',
    LinkStatus = 'authority:link:status',
    ServerChallenge = 'authority:challenge',
    ClientAuthentication = 'device:authenticate',
    ServerConfirmation = 'authority:confirm',
    RemoteRequest = 'controller:remote:request',
    RemoteResult = 'device:remote:result',
    RemoteChunk = 'device:remote:chunk',
    FileProfile = 'device:files:profile',
    JointWorkspaceBinding = 'device:workspace:binding',
    JointWorkspacePublication = 'device:workspace:publication',
    JointWorkspaceActivated = 'authority:workspace:activated',
    JointWorkspaceRetry = 'authority:workspace:retry',
    OperationFilePermit = 'authority:operation:files:permit',
    OperationFileResult = 'device:operation:files:result',
    OperationFileAcknowledgment = 'authority:operation:files:acknowledgment',
    OperationFileAcknowledged = 'device:operation:files:acknowledged',
    ExecutionProfile = 'device:execution:profile',
    OperationExecutionPermit = 'authority:operation:execution:permit',
    OperationExecutionCancellation = 'authority:operation:execution:cancel',
    OperationExecutionInteractiveReady = 'device:operation:execution:interactive-ready',
    OperationExecutionInputPermit = 'authority:operation:execution:input:permit',
    OperationExecutionInputReceipt = 'device:operation:execution:input:receipt',
    OperationExecutionInputAcknowledgment = 'authority:operation:execution:input:acknowledgment',
    OperationExecutionInputTerminalResolution = 'authority:operation:execution:input:terminal-resolution',
    OperationExecutionResult = 'device:operation:execution:result',
    OperationExecutionOutput = 'device:operation:execution:output',
    OperationExecutionOutputAck = 'authority:operation:execution:output',
    OperationExecutionAcknowledgment = 'authority:operation:execution:acknowledgment',
    OperationExecutionAcknowledged = 'device:operation:execution:acknowledged',
    AdmissionMigrationPlan = 'device:operation:admission-migration:plan',
    AdmissionMigrationApproval = 'authority:operation:admission-migration:approval',
    AdmissionMigrationApplied = 'device:operation:admission-migration:applied',
    PairingState = 'device:retained:pairing',
    HistoryMigration = 'device:history:migration',
    SystemInfo = 'device:system-info',
    Inventory = 'device:inventory',
}

/** Key derivation is separate from signatures and cannot expose either component secret. */
export enum KeyDerivationPurpose {
    RetainedHost = 'nerva-connector:retained-host',
    RetainedFiles = 'nerva-connector:retained-files',
    RetainedExecution = 'nerva-connector:retained-execution',
    RetainedExecutionInput = 'nerva-connector:retained-execution-input',
    RetainedWorkspaces = 'nerva-connector:retained-workspaces',
    WriteStaging = 'nerva-connector:write-staging',
    WorkspaceIdentity = 'nerva-connector:workspace-identity',
    JointWorkspaceRoot = 'nerva-connector:joint-workspace-root',
}

/** Fixed byte layouts eliminate ambiguous component boundaries and unbounded decoding. */
export class IdentityLengths {
    public static readonly mlDsaPublicKey: number = 1312;
    public static readonly ed25519PublicKey: number = 32;
    public static readonly publicKey: number = 1344;
    public static readonly mlDsaSignature: number = 2420;
    public static readonly ed25519Signature: number = 64;
    public static readonly signature: number = 2484;
    public static readonly seed: number = 32;
    public static readonly ed25519PrivateDer: number = 48;
    public static readonly privateRecord: number = 1024;
    public static readonly payload: number = 196608;
}

/** Only the local identity owner handles the serialized private record. */
export interface PrivateIdentityRecord {
    readonly suite: SignatureSuite.MlDsa44Ed25519;
    readonly mlDsaSeed: string;
    readonly ed25519PrivateKey: string;
}

/** Trusted installation publishes only the one current suite and complete composite public identity. */
export interface PublicIdentityRecord {
    readonly suite: SignatureSuite.MlDsa44Ed25519;
    readonly publicKey: string;
}

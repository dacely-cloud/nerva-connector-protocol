// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** One current suite; peers cannot negotiate a classical-only or post-quantum-only downgrade. */
export var SignatureSuite;
(function (SignatureSuite) {
    SignatureSuite["MlDsa44Ed25519"] = "ml-dsa-44+ed25519";
})(SignatureSuite || (SignatureSuite = {}));
/** Expected verification purpose is selected by the receiver, never by an untrusted message. */
export var SignaturePurpose;
(function (SignaturePurpose) {
    SignaturePurpose["HostObservationPermit"] = "authority:host:observation:permit";
    SignaturePurpose["HostObservationReady"] = "device:host:observation:ready";
    SignaturePurpose["HostObservationChanged"] = "device:host:observation:changed";
    SignaturePurpose["HostObservationAcknowledgment"] = "authority:host:observation:acknowledgment";
    SignaturePurpose["HostGrant"] = "device:host:grant";
    SignaturePurpose["HostProfile"] = "device:host:profile";
    SignaturePurpose["HostPermit"] = "authority:operation:host:permit";
    SignaturePurpose["HostResult"] = "device:operation:host:result";
    SignaturePurpose["HostAcknowledgment"] = "authority:operation:host:acknowledgment";
    SignaturePurpose["HostAcknowledged"] = "device:operation:host:acknowledged";
    SignaturePurpose["DeviceUnpair"] = "device:unpair";
    SignaturePurpose["DeviceUnpaired"] = "authority:unpaired";
    SignaturePurpose["DeviceLogout"] = "device:local:logout";
    SignaturePurpose["Release"] = "release:connector:installation";
    SignaturePurpose["DeviceEnrollment"] = "device:enroll";
    SignaturePurpose["DeviceHello"] = "device:hello";
    SignaturePurpose["LinkStart"] = "device:link:start";
    SignaturePurpose["LinkPoll"] = "device:link:poll";
    SignaturePurpose["LinkIssued"] = "authority:link:issued";
    SignaturePurpose["LinkStatus"] = "authority:link:status";
    SignaturePurpose["ServerChallenge"] = "authority:challenge";
    SignaturePurpose["ClientAuthentication"] = "device:authenticate";
    SignaturePurpose["ServerConfirmation"] = "authority:confirm";
    SignaturePurpose["RemoteRequest"] = "controller:remote:request";
    SignaturePurpose["RemoteResult"] = "device:remote:result";
    SignaturePurpose["RemoteChunk"] = "device:remote:chunk";
    SignaturePurpose["FileProfile"] = "device:files:profile";
    SignaturePurpose["JointWorkspaceBinding"] = "device:workspace:binding";
    SignaturePurpose["JointWorkspacePublication"] = "device:workspace:publication";
    SignaturePurpose["JointWorkspaceActivated"] = "authority:workspace:activated";
    SignaturePurpose["JointWorkspaceRetry"] = "authority:workspace:retry";
    SignaturePurpose["OperationFilePermit"] = "authority:operation:files:permit";
    SignaturePurpose["OperationFileResult"] = "device:operation:files:result";
    SignaturePurpose["OperationFileAcknowledgment"] = "authority:operation:files:acknowledgment";
    SignaturePurpose["OperationFileAcknowledged"] = "device:operation:files:acknowledged";
    SignaturePurpose["ExecutionProfile"] = "device:execution:profile";
    SignaturePurpose["OperationExecutionPermit"] = "authority:operation:execution:permit";
    SignaturePurpose["OperationExecutionCancellation"] = "authority:operation:execution:cancel";
    SignaturePurpose["OperationExecutionInteractiveReady"] = "device:operation:execution:interactive-ready";
    SignaturePurpose["OperationExecutionInputPermit"] = "authority:operation:execution:input:permit";
    SignaturePurpose["OperationExecutionInputReceipt"] = "device:operation:execution:input:receipt";
    SignaturePurpose["OperationExecutionInputAcknowledgment"] = "authority:operation:execution:input:acknowledgment";
    SignaturePurpose["OperationExecutionInputTerminalResolution"] = "authority:operation:execution:input:terminal-resolution";
    SignaturePurpose["OperationExecutionResult"] = "device:operation:execution:result";
    SignaturePurpose["OperationExecutionOutput"] = "device:operation:execution:output";
    SignaturePurpose["OperationExecutionOutputAck"] = "authority:operation:execution:output";
    SignaturePurpose["OperationExecutionAcknowledgment"] = "authority:operation:execution:acknowledgment";
    SignaturePurpose["OperationExecutionAcknowledged"] = "device:operation:execution:acknowledged";
    SignaturePurpose["AdmissionMigrationPlan"] = "device:operation:admission-migration:plan";
    SignaturePurpose["AdmissionMigrationApproval"] = "authority:operation:admission-migration:approval";
    SignaturePurpose["AdmissionMigrationApplied"] = "device:operation:admission-migration:applied";
    SignaturePurpose["PairingState"] = "device:retained:pairing";
    SignaturePurpose["HistoryMigration"] = "device:history:migration";
    SignaturePurpose["SystemInfo"] = "device:system-info";
    SignaturePurpose["Inventory"] = "device:inventory";
})(SignaturePurpose || (SignaturePurpose = {}));
/** Key derivation is separate from signatures and cannot expose either component secret. */
export var KeyDerivationPurpose;
(function (KeyDerivationPurpose) {
    KeyDerivationPurpose["RetainedHost"] = "nerva-connector:retained-host";
    KeyDerivationPurpose["RetainedFiles"] = "nerva-connector:retained-files";
    KeyDerivationPurpose["RetainedExecution"] = "nerva-connector:retained-execution";
    KeyDerivationPurpose["RetainedExecutionInput"] = "nerva-connector:retained-execution-input";
    KeyDerivationPurpose["RetainedWorkspaces"] = "nerva-connector:retained-workspaces";
    KeyDerivationPurpose["WriteStaging"] = "nerva-connector:write-staging";
    KeyDerivationPurpose["WorkspaceIdentity"] = "nerva-connector:workspace-identity";
    KeyDerivationPurpose["JointWorkspaceRoot"] = "nerva-connector:joint-workspace-root";
})(KeyDerivationPurpose || (KeyDerivationPurpose = {}));
/** Fixed byte layouts eliminate ambiguous component boundaries and unbounded decoding. */
export class IdentityLengths {
    static mlDsaPublicKey = 1312;
    static ed25519PublicKey = 32;
    static publicKey = 1344;
    static mlDsaSignature = 2420;
    static ed25519Signature = 64;
    static signature = 2484;
    static seed = 32;
    static ed25519PrivateDer = 48;
    static privateRecord = 1024;
    static payload = 196608;
}

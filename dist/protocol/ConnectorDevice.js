// SPDX-FileCopyrightText: 2026 Nerva contributors
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Private edge RPC authenticates a device but never grants execution or declares a tunnel online. */
export var ConnectorDeviceEndpoint;
(function (ConnectorDeviceEndpoint) {
    ConnectorDeviceEndpoint["Unpair"] = "/v1/connector-device-unpairings";
    ConnectorDeviceEndpoint["Challenge"] = "/v1/connector-device-challenges";
    ConnectorDeviceEndpoint["Authenticate"] = "/v1/connector-device-authentications";
    ConnectorDeviceEndpoint["Inspect"] = "/v1/connector-device-lease-inspections";
    ConnectorDeviceEndpoint["Close"] = "/v1/connector-device-lease-closures";
})(ConnectorDeviceEndpoint || (ConnectorDeviceEndpoint = {}));
/** Fixed slots bound retained challenge/lease state independently of edge/key rotation or reconnect count. */
export class ConnectorDeviceLimits {
    /** A device can authenticate four independent transport connections at once. */
    static slots = 4;
    /** Database time bounds proof submission and forces fresh device proof for continued authority. */
    static lifetimeMs = 30000;
    /** Signed hello/challenge clocks tolerate only this finite lead; old hellos cannot reset replay watermarks. */
    static clockLeadMs = 5000n;
}

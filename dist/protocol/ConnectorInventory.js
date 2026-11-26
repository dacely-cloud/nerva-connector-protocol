// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Inventory is customer-reported metadata, never managed fleet qualification or an execution grant. */
export var ConnectorInventoryTrust;
(function (ConnectorInventoryTrust) {
    ConnectorInventoryTrust["CustomerReported"] = "customer-reported";
})(ConnectorInventoryTrust || (ConnectorInventoryTrust = {}));
/** Status derives from server ownership, current lease lifetime and revocation, never a device-supplied online flag. */
export var ConnectorPresence;
(function (ConnectorPresence) {
    ConnectorPresence["Pending"] = "pending";
    ConnectorPresence["Online"] = "online";
    ConnectorPresence["Offline"] = "offline";
    ConnectorPresence["Revoked"] = "revoked";
})(ConnectorPresence || (ConnectorPresence = {}));
/** Public edges relay only this finite metadata operation to the private authenticated backend. */
export var ConnectorInventoryEndpoint;
(function (ConnectorInventoryEndpoint) {
    ConnectorInventoryEndpoint["Publish"] = "/v1/connector/device/inventory";
    ConnectorInventoryEndpoint["Query"] = "/v1/connector-inventory-queries";
})(ConnectorInventoryEndpoint || (ConnectorInventoryEndpoint = {}));
/** Four fixed session slots retain at most one bounded snapshot each; account responses remain finite. */
export class ConnectorInventoryLimits {
    /** Three full-width snapshots remain within the account gateway's response byte budget. */
    static pageSize = 3;
}

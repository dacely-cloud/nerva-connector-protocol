// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Platform labels are finite; unsupported platforms cannot masquerade as qualified Linux installations. */
export var SystemPlatform;
(function (SystemPlatform) {
    SystemPlatform["Linux"] = "linux";
    SystemPlatform["Windows"] = "windows";
    SystemPlatform["MacOs"] = "macos";
    SystemPlatform["Other"] = "other";
})(SystemPlatform || (SystemPlatform = {}));
/** Missing driver access is different from a successful empty inventory. */
export var GpuInventoryState;
(function (GpuInventoryState) {
    GpuInventoryState["Reported"] = "reported";
    GpuInventoryState["Unavailable"] = "unavailable";
})(GpuInventoryState || (GpuInventoryState = {}));
/** Vendor identities remain separate from compute support and memory availability. */
export var GpuVendor;
(function (GpuVendor) {
    GpuVendor["Nvidia"] = "nvidia";
    GpuVendor["Amd"] = "amd";
    GpuVendor["Intel"] = "intel";
    GpuVendor["Other"] = "other";
})(GpuVendor || (GpuVendor = {}));

// SPDX-FileCopyrightText: 2026 Dacely <business@dacely.com>
// SPDX-License-Identifier: LicenseRef-Proprietary
/** Neither application pipes nor PTYs are implied by an existing foreground grant. */
export var ExecutionInteractiveTransport;
(function (ExecutionInteractiveTransport) {
    ExecutionInteractiveTransport["Pipe"] = "pipe";
    ExecutionInteractiveTransport["Pty"] = "pty";
})(ExecutionInteractiveTransport || (ExecutionInteractiveTransport = {}));
/** These ceilings bound protocol work; they do not advertise an installed interactive capability. */
export class ExecutionInteractiveLimits {
    static frameBytes = 4096;
    static initialBytes = 1024;
    static inputBytes = 65536n;
    /** Initial record zero consumes one of the 256 total controls. */
    static controls = 256n;
    static maximumInputSequence = 255n;
    static resizes = 16n;
    static minimumCols = 2;
    static maximumCols = 500;
    static minimumRows = 1;
    static maximumRows = 200;
    static executionMs = 30000n;
    static outputBytes = 65536;
    /** 2484 composite signature bytes become exactly 3312 base64url characters. */
    static signatureBytes = 2484;
    static signatureCharacters = 3312;
    static readyJsonBytes = 8192;
    static inputJsonBytes = 8192;
    static permitJsonBytes = 16384;
    static receiptJsonBytes = 8192;
    static acknowledgmentJsonBytes = 8192;
    /** This is a fixed chain genesis, not a claim that input zero was accepted. */
    static genesisHash = '0'.repeat(64);
    static initialInputId = 'initial';
}
